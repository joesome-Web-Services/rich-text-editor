import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Point,
  Rectangle,
  Group,
  Mode,
  generateId,
  isPointInRect,
  getSelectedRectangles,
  selectRectangle,
  clearAllSelection,
  deleteAllSelected,
  groupSelectedRectangles,
  ungroupSelectedRectangles,
  getRectangleGroup,
  moveGroup,
  rotateGroup,
  getGroupCenter,
  getScaleHandle,
  scaleRectangle,
  updateAllSelectedColors,
  getRotationHandle,
  isPointNearRotationHandle,
  createRectangle,
  drawRectangles,
  drawCurrentRectangle,
} from "./-rectangle";
import {
  Arrow,
  createArrow,
  isPointNearArrowEndpoint,
  isPointNearArrow,
  drawArrows,
  drawCurrentArrow,
} from "./-arrow";
import { Toolbar } from "./-toolbar";

export const Route = createFileRoute("/projects/the-diagram-platform/")({
  component: RouteComponent,
});

function RouteComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("select");
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState(0);
  const [currentArrow, setCurrentArrow] = useState<Arrow | null>(null);
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedBorderColor, setSelectedBorderColor] = useState("#1e40af");
  const [isScaling, setIsScaling] = useState(false);
  const [scaleHandle, setScaleHandle] = useState<string>("");
  const [scaleStart, setScaleStart] = useState<Point>({ x: 0, y: 0 });
  const [originalScaleRect, setOriginalScaleRect] = useState<Rectangle | null>(
    null
  );
  const [isDraggingArrowEnd, setIsDraggingArrowEnd] = useState(false);
  const [draggedArrowId, setDraggedArrowId] = useState<string>("");
  const [draggedEndpoint, setDraggedEndpoint] = useState<"start" | "end">(
    "start"
  );
  const [cursorStyle, setCursorStyle] = useState<string>("default");

  const getMousePos = useCallback((e: MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const clearSelection = () => {
    clearAllSelection(setRectangles, setArrows);
  };

  const deleteSelected = () => {
    deleteAllSelected(rectangles, setRectangles, setGroups, setArrows);
  };

  const groupSelected = () => {
    groupSelectedRectangles(rectangles, setGroups);
  };

  const ungroupSelected = () => {
    ungroupSelectedRectangles(rectangles, groups, setGroups);
  };

  const updateSelectedColors = () => {
    updateAllSelectedColors(
      selectedColor,
      selectedBorderColor,
      setRectangles,
      setArrows
    );
  };

  const handleMouseDown = (e: MouseEvent) => {
    const pos = getMousePos(e);

    if (mode === "rectangle") {
      setIsDrawing(true);
      setStartPoint(pos);
      const newRect = createRectangle(
        pos,
        pos,
        selectedColor,
        selectedBorderColor
      );
      setCurrentRect(newRect);
    } else if (mode === "select") {
      const clickedRect = rectangles.find((rect) => isPointInRect(pos, rect));
      const clickedArrow = arrows.find((arrow) => isPointNearArrow(pos, arrow));

      if (clickedRect) {
        console.log(
          "Clicked on rectangle:",
          clickedRect.id,
          "at position:",
          pos
        );
        const group = getRectangleGroup(clickedRect.id, groups);

        let willBeSelected = true;

        if (e.shiftKey) {
          selectRectangle(clickedRect, true, setRectangles);
          willBeSelected = true;
        } else {
          if (!clickedRect.selected) {
            selectRectangle(clickedRect, false, setRectangles);
            willBeSelected = true;
          } else {
            willBeSelected = true; // Already selected
          }
        }

        console.log("Rectangle will be selected:", willBeSelected);

        // Check if clicking on rotation handle FIRST (highest priority)
        if (willBeSelected && isPointNearRotationHandle(pos, clickedRect)) {
          console.log("Starting rotation for rect:", clickedRect.id);
          setIsRotating(true);
          if (group) {
            const groupCenter = getGroupCenter(group, rectangles);
            setRotationStart(
              Math.atan2(pos.y - groupCenter.y, pos.x - groupCenter.x)
            );
          } else {
            const centerX = clickedRect.x + clickedRect.width / 2;
            const centerY = clickedRect.y + clickedRect.height / 2;
            setRotationStart(
              Math.atan2(pos.y - centerY, pos.x - centerX) -
                clickedRect.rotation
            );
          }
          return;
        }

        // Check for scale handles second
        const handle = getScaleHandle(pos, clickedRect);
        console.log("Scale handle check result:", handle);
        if (handle && willBeSelected) {
          console.log("Starting scaling with handle:", handle);
          setIsScaling(true);
          setScaleHandle(handle);
          setScaleStart(pos);
          setOriginalScaleRect(clickedRect);
          return;
        }

        // Default to dragging
        console.log("Starting drag operation");
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedRect.x,
          y: pos.y - clickedRect.y,
        });
      } else if (clickedArrow) {
        console.log("Clicked on arrow:", clickedArrow.id);

        // Clear rectangle selection and select arrow
        clearAllSelection(setRectangles, setArrows);
        setArrows((prev) =>
          prev.map((a) => ({
            ...a,
            selected:
              a.id === clickedArrow.id ? true : e.shiftKey ? a.selected : false,
          }))
        );

        // Check if clicking near an endpoint
        const endpoint = isPointNearArrowEndpoint(pos, clickedArrow);
        if (endpoint) {
          console.log("Starting arrow endpoint drag:", endpoint);
          setIsDraggingArrowEnd(true);
          setDraggedArrowId(clickedArrow.id);
          setDraggedEndpoint(endpoint);
          return;
        }

        // Default to dragging entire arrow
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedArrow.start.x,
          y: pos.y - clickedArrow.start.y,
        });
      } else {
        console.log("Clicked on empty space");
        if (!e.shiftKey) {
          clearSelection();
        }
      }
    } else if (mode === "arrow") {
      setIsDrawing(true);
      const newArrow = createArrow(pos, pos);
      setCurrentArrow(newArrow);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    const pos = getMousePos(e);

    // Update cursor based on what's under the mouse
    if (mode === "select") {
      let newCursor = "default";

      if (isDragging) {
        newCursor = "grabbing";
      } else if (isRotating) {
        newCursor = "grabbing";
      } else if (isScaling) {
        newCursor = "grabbing";
      } else if (isDraggingArrowEnd) {
        newCursor = "grabbing";
      } else {
        // Check if hovering over a selected rectangle's corner for rotation
        const selectedRects = getSelectedRectangles(rectangles);
        for (const rect of selectedRects) {
          if (isPointNearRotationHandle(pos, rect)) {
            newCursor = "grab";
            break;
          }

          // Check for scale handles
          const handle = getScaleHandle(pos, rect);
          if (handle) {
            // Set resize cursors based on handle direction
            switch (handle) {
              case "nw":
              case "se":
                newCursor = "nw-resize";
                break;
              case "ne":
              case "sw":
                newCursor = "ne-resize";
                break;
              case "n":
              case "s":
                newCursor = "ns-resize";
                break;
              case "e":
              case "w":
                newCursor = "ew-resize";
                break;
            }
            break;
          }
        }

        // Check if hovering over arrow endpoints
        const selectedArrows = arrows.filter((a) => a.selected);
        for (const arrow of selectedArrows) {
          if (isPointNearArrowEndpoint(pos, arrow)) {
            newCursor = "move";
            break;
          }
        }
      }

      setCursorStyle(newCursor);
    }

    if (mode === "rectangle" && isDrawing && currentRect) {
      const width = pos.x - startPoint.x;
      const height = pos.y - startPoint.y;
      setCurrentRect({
        ...currentRect,
        width: Math.abs(width),
        height: Math.abs(height),
        x: width < 0 ? pos.x : startPoint.x,
        y: height < 0 ? pos.y : startPoint.y,
      });
    } else if (mode === "select" && isScaling) {
      const selectedRects = getSelectedRectangles(rectangles);
      if (selectedRects.length > 0 && originalScaleRect) {
        const rect = selectedRects[0];
        console.log(
          "[SCALING] handle:",
          scaleHandle,
          "rect:",
          rect,
          "pos:",
          pos,
          "scaleStart:",
          scaleStart,
          "originalScaleRect:",
          originalScaleRect
        );
        const scaledRect = scaleRectangle(
          rect,
          scaleHandle,
          pos,
          scaleStart,
          originalScaleRect
        );
        console.log("[SCALING] scaledRect:", scaledRect);
        setRectangles((prev) =>
          prev.map((r) => {
            if (r.id === rect.id) {
              return scaledRect;
            }
            return r;
          })
        );
      }
    } else if (mode === "select" && isDragging) {
      if (rectangles.some((r) => r.selected)) {
        // Drag selected rectangles
        setRectangles((prev) =>
          prev.map((rect) => {
            if (rect.selected) {
              return {
                ...rect,
                x: pos.x - dragOffset.x,
                y: pos.y - dragOffset.y,
              };
            }
            return rect;
          })
        );
      } else if (arrows.some((a) => a.selected)) {
        // Drag selected arrows
        setArrows((prev) =>
          prev.map((arrow) => {
            if (arrow.selected) {
              const deltaX = pos.x - dragOffset.x - arrow.start.x;
              const deltaY = pos.y - dragOffset.y - arrow.start.y;
              return {
                ...arrow,
                start: { x: arrow.start.x + deltaX, y: arrow.start.y + deltaY },
                end: { x: arrow.end.x + deltaX, y: arrow.end.y + deltaY },
              };
            }
            return arrow;
          })
        );
      }
    } else if (mode === "select" && isRotating) {
      console.log("Rotating - isRotating:", isRotating, "mode:", mode);
      const selectedRects = getSelectedRectangles(rectangles);
      if (selectedRects.length > 0) {
        const rect = selectedRects[0];
        const group = getRectangleGroup(rect.id, groups);

        if (group) {
          const groupCenter = getGroupCenter(group, rectangles);
          const angle =
            Math.atan2(pos.y - groupCenter.y, pos.x - groupCenter.x) -
            rotationStart;
          console.log("Group rotation angle:", angle);

          // Initialize lastRotation if it doesn't exist
          if (!(group as any).lastRotation) {
            (group as any).lastRotation = 0;
          }

          const deltaAngle = angle - (group as any).lastRotation;
          console.log("Delta angle:", deltaAngle);

          rotateGroup(
            group,
            deltaAngle,
            groupCenter.x,
            groupCenter.y,
            setRectangles
          );
          (group as any).lastRotation = angle;
        } else {
          const centerX = rect.x + rect.width / 2;
          const centerY = rect.y + rect.height / 2;
          const angle =
            Math.atan2(pos.y - centerY, pos.x - centerX) - rotationStart;
          console.log(
            "Individual rotation angle:",
            angle,
            "for rect:",
            rect.id
          );

          setRectangles((prev) =>
            prev.map((r) => {
              if (r.selected) {
                return { ...r, rotation: angle };
              }
              return r;
            })
          );
        }
      }
    } else if (mode === "arrow" && isDrawing && currentArrow) {
      setCurrentArrow({
        ...currentArrow,
        end: pos,
      });
    } else if (isDraggingArrowEnd) {
      // Drag arrow endpoint
      setArrows((prev) =>
        prev.map((arrow) => {
          if (arrow.id === draggedArrowId) {
            return {
              ...arrow,
              [draggedEndpoint]: pos,
            };
          }
          return arrow;
        })
      );
    }
  };

  const handleMouseUp = () => {
    if (mode === "rectangle" && currentRect) {
      setRectangles((prev) => [...prev, currentRect]);
      setCurrentRect(null);
      setMode("select"); // Auto-switch back to edit mode
    } else if (mode === "arrow" && currentArrow) {
      setArrows((prev) => [...prev, currentArrow]);
      setCurrentArrow(null);
      setMode("select"); // Auto-switch back to edit mode
    }

    setIsDragging(false);
    setIsRotating(false);
    setIsScaling(false);
    setIsDraggingArrowEnd(false);
    setDraggedArrowId("");
    setDraggedEndpoint("start");
    setDragOffset({ x: 0, y: 0 });
    setRotationStart(0);
    setScaleHandle("");
    setScaleStart({ x: 0, y: 0 });
    setOriginalScaleRect(null);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "r":
          setMode("rectangle");
          break;
        case "v":
          setMode("select");
          break;
        case "a":
          setMode("arrow");
          break;
        case "backspace":
        case "delete":
          deleteSelected();
          break;
        case "g":
          if (e.shiftKey || e.metaKey || e.ctrlKey) return;
          const selectedRects = getSelectedRectangles(rectangles);
          if (selectedRects.length > 0) {
            const hasGroup = selectedRects.some((rect) =>
              getRectangleGroup(rect.id, groups)
            );
            if (hasGroup) {
              ungroupSelected();
            } else {
              groupSelected();
            }
          }
          break;
      }
    },
    [rectangles, arrows, groups]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rectangles
    drawRectangles(ctx, rectangles);

    // Draw arrows
    drawArrows(ctx, arrows);

    // Draw current rectangle being drawn
    drawCurrentRectangle(ctx, currentRect);

    // Draw current arrow being drawn
    drawCurrentArrow(ctx, currentArrow);
  }, [rectangles, arrows, currentRect, currentArrow, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDownEvent = (e: MouseEvent) => handleMouseDown(e);
    // Remove mousemove/mouseup listeners from canvas (handled globally for scaling)
    canvas.addEventListener("mousedown", handleMouseDownEvent);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDownEvent);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleKeyDown,
    mode,
    isDrawing,
    isDragging,
    isRotating,
    currentRect,
    currentArrow,
    dragOffset,
    rotationStart,
  ]);

  useEffect(() => {
    const isActive =
      isDrawing || isScaling || isDragging || isRotating || isDraggingArrowEnd;
    if (!isActive) return;

    const handleMove = (e: MouseEvent) => handleMouseMove(e);
    const handleUp = () => handleMouseUp();

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [
    isDrawing,
    isScaling,
    isDragging,
    isRotating,
    isDraggingArrowEnd,
    handleMouseMove,
    handleMouseUp,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      <Toolbar
        mode={mode}
        setMode={setMode}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        selectedBorderColor={selectedBorderColor}
        setSelectedBorderColor={setSelectedBorderColor}
        rectangles={rectangles}
        groups={groups}
        updateSelectedColors={updateSelectedColors}
        groupSelected={groupSelected}
        ungroupSelected={ungroupSelected}
        deleteSelected={deleteSelected}
      />

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="absolute inset-0 cursor-crosshair bg-white"
          style={{
            cursor:
              mode === "select"
                ? cursorStyle
                : mode === "rectangle"
                  ? "crosshair"
                  : "crosshair",
          }}
        />
      </div>

      <div className="bg-white border-t p-2 text-sm text-gray-600">
        <div className="flex gap-4">
          <span>
            <strong>R:</strong> Rectangle mode
          </span>
          <span>
            <strong>V:</strong> Select mode
          </span>
          <span>
            <strong>A:</strong> Arrow mode
          </span>
          <span>
            <strong>G:</strong> Group/Ungroup selected
          </span>
          <span>
            <strong>Backspace:</strong> Delete selected
          </span>
          <span>
            <strong>Shift+Click:</strong> Multi-select
          </span>
          <span>
            <strong>Blue squares:</strong> Scale handles
          </span>
          <span>
            <strong>Corners:</strong> Click near corners to rotate
          </span>
        </div>
      </div>
    </div>
  );
}
