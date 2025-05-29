import { Dispatch, SetStateAction } from "react";

export type Point = { x: number; y: number };

export type Mode = "select" | "rectangle" | "arrow";

export type Rectangle = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fillColor: string;
  borderColor: string;
  selected: boolean;
};

export type Group = {
  id: string;
  rectangleIds: string[];
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const isPointInRect = (point: Point, rect: Rectangle): boolean => {
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  const dx = point.x - centerX;
  const dy = point.y - centerY;

  const rotatedX = dx * cos - dy * sin + centerX;
  const rotatedY = dx * sin + dy * cos + centerY;

  return (
    rotatedX >= rect.x &&
    rotatedX <= rect.x + rect.width &&
    rotatedY >= rect.y &&
    rotatedY <= rect.y + rect.height
  );
};

export const getSelectedRectangles = (rectangles: Rectangle[]) =>
  rectangles.filter((r) => r.selected);

export const selectRectangle = (
  rect: Rectangle,
  addToSelection: boolean = false,
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>
) => {
  setRectangles((prev) =>
    prev.map((r) => ({
      ...r,
      selected: r.id === rect.id ? true : addToSelection ? r.selected : false,
    }))
  );
};

export const clearRectangleSelection = (
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>
) => {
  setRectangles((prev) => prev.map((r) => ({ ...r, selected: false })));
};

export const clearAllSelection = (
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>,
  setArrows: Dispatch<SetStateAction<any[]>>
) => {
  clearRectangleSelection(setRectangles);
  setArrows((prev) => prev.map((a) => ({ ...a, selected: false })));
};

export const deleteSelectedRectangles = (
  rectangles: Rectangle[],
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>,
  setGroups: Dispatch<SetStateAction<Group[]>>
) => {
  const selectedRects = getSelectedRectangles(rectangles);

  if (selectedRects.length > 0) {
    // Remove selected rectangles from any groups
    selectedRects.forEach((rect) => {
      setGroups((prev) =>
        prev.filter((group) => {
          const newRectIds = group.rectangleIds.filter((id) => id !== rect.id);
          return newRectIds.length > 1; // Keep groups with 2+ rectangles
        })
      );
    });

    // Remove selected rectangles
    setRectangles((prev) => prev.filter((r) => !r.selected));
  }
};

export const deleteAllSelected = (
  rectangles: Rectangle[],
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>,
  setGroups: Dispatch<SetStateAction<Group[]>>,
  setArrows: Dispatch<SetStateAction<any[]>>
) => {
  deleteSelectedRectangles(rectangles, setRectangles, setGroups);
  setArrows((prev) => prev.filter((a) => !a.selected));
};

export const groupSelectedRectangles = (
  rectangles: Rectangle[],
  setGroups: Dispatch<SetStateAction<Group[]>>
) => {
  const selectedRects = getSelectedRectangles(rectangles);
  if (selectedRects.length < 2) return;

  const groupId = generateId();
  const newGroup: Group = {
    id: groupId,
    rectangleIds: selectedRects.map((r) => r.id),
  };

  setGroups((prev) => [...prev, newGroup]);
};

export const ungroupSelectedRectangles = (
  rectangles: Rectangle[],
  groups: Group[],
  setGroups: Dispatch<SetStateAction<Group[]>>
) => {
  const selectedRects = getSelectedRectangles(rectangles);
  if (selectedRects.length === 0) return;

  // Find groups that contain any of the selected rectangles
  const groupsToRemove = groups.filter((group) =>
    group.rectangleIds.some((id) =>
      selectedRects.some((rect) => rect.id === id)
    )
  );

  // Remove those groups
  setGroups((prev) =>
    prev.filter(
      (group) =>
        !groupsToRemove.some((removeGroup) => removeGroup.id === group.id)
    )
  );
};

export const getRectangleGroup = (
  rectId: string,
  groups: Group[]
): Group | undefined => {
  return groups.find((g) => g.rectangleIds.includes(rectId));
};

export const moveGroup = (
  group: Group,
  deltaX: number,
  deltaY: number,
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>
) => {
  setRectangles((prev) =>
    prev.map((rect) => {
      if (group.rectangleIds.includes(rect.id)) {
        return { ...rect, x: rect.x + deltaX, y: rect.y + deltaY };
      }
      return rect;
    })
  );
};

export const rotateGroup = (
  group: Group,
  angle: number,
  centerX: number,
  centerY: number,
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>
) => {
  setRectangles((prev) =>
    prev.map((rect) => {
      if (group.rectangleIds.includes(rect.id)) {
        // Rotate the rectangle's position around the group center
        const rectCenterX = rect.x + rect.width / 2;
        const rectCenterY = rect.y + rect.height / 2;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const dx = rectCenterX - centerX;
        const dy = rectCenterY - centerY;

        const newCenterX = centerX + dx * cos - dy * sin;
        const newCenterY = centerY + dx * sin + dy * cos;

        return {
          ...rect,
          x: newCenterX - rect.width / 2,
          y: newCenterY - rect.height / 2,
          rotation: rect.rotation + angle,
        };
      }
      return rect;
    })
  );
};

export const getGroupCenter = (
  group: Group,
  rectangles: Rectangle[]
): Point => {
  const groupRects = rectangles.filter((r) =>
    group.rectangleIds.includes(r.id)
  );
  if (groupRects.length === 0) return { x: 0, y: 0 };

  const totalX = groupRects.reduce(
    (sum, rect) => sum + rect.x + rect.width / 2,
    0
  );
  const totalY = groupRects.reduce(
    (sum, rect) => sum + rect.y + rect.height / 2,
    0
  );

  return {
    x: totalX / groupRects.length,
    y: totalY / groupRects.length,
  };
};

export const getScaleHandle = (point: Point, rect: Rectangle): string => {
  const handleSize = 8;

  // Transform the point to the rectangle's local coordinate system
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  // Rotate the point in the opposite direction of the rectangle's rotation
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);

  const dx = point.x - centerX;
  const dy = point.y - centerY;

  const localX = dx * cos - dy * sin + centerX;
  const localY = dx * sin + dy * cos + centerY;

  const corners = [
    { name: "nw", x: rect.x, y: rect.y },
    { name: "ne", x: rect.x + rect.width, y: rect.y },
    { name: "sw", x: rect.x, y: rect.y + rect.height },
    { name: "se", x: rect.x + rect.width, y: rect.y + rect.height },
    { name: "n", x: rect.x + rect.width / 2, y: rect.y },
    { name: "s", x: rect.x + rect.width / 2, y: rect.y + rect.height },
    { name: "w", x: rect.x, y: rect.y + rect.height / 2 },
    { name: "e", x: rect.x + rect.width, y: rect.y + rect.height / 2 },
  ];

  for (const corner of corners) {
    if (
      Math.abs(localX - corner.x) < handleSize &&
      Math.abs(localY - corner.y) < handleSize
    ) {
      return corner.name;
    }
  }

  return "";
};

export const scaleRectangle = (
  rect: Rectangle,
  handle: string,
  currentPos: Point,
  startPos: Point,
  originalRect?: Rectangle
): Rectangle => {
  // Use original rectangle if provided, otherwise use current rect
  const baseRect = originalRect || rect;

  const deltaX = currentPos.x - startPos.x;
  const deltaY = currentPos.y - startPos.y;

  let newRect = { ...rect };

  switch (handle) {
    case "se": // Southeast corner
      newRect.width = Math.max(10, baseRect.width + deltaX);
      newRect.height = Math.max(10, baseRect.height + deltaY);
      newRect.x = baseRect.x;
      newRect.y = baseRect.y;
      break;
    case "sw": // Southwest corner
      newRect.width = Math.max(10, baseRect.width - deltaX);
      newRect.height = Math.max(10, baseRect.height + deltaY);
      newRect.x = baseRect.x + baseRect.width - newRect.width;
      newRect.y = baseRect.y;
      break;
    case "ne": // Northeast corner
      newRect.width = Math.max(10, baseRect.width + deltaX);
      newRect.height = Math.max(10, baseRect.height - deltaY);
      newRect.x = baseRect.x;
      newRect.y = baseRect.y + baseRect.height - newRect.height;
      break;
    case "nw": // Northwest corner
      newRect.width = Math.max(10, baseRect.width - deltaX);
      newRect.height = Math.max(10, baseRect.height - deltaY);
      newRect.x = baseRect.x + baseRect.width - newRect.width;
      newRect.y = baseRect.y + baseRect.height - newRect.height;
      break;
    case "n": // North edge
      newRect.height = Math.max(10, baseRect.height - deltaY);
      newRect.x = baseRect.x;
      newRect.y = baseRect.y + baseRect.height - newRect.height;
      break;
    case "s": // South edge
      newRect.height = Math.max(10, baseRect.height + deltaY);
      newRect.x = baseRect.x;
      newRect.y = baseRect.y;
      break;
    case "w": // West edge
      newRect.width = Math.max(10, baseRect.width - deltaX);
      newRect.x = baseRect.x + baseRect.width - newRect.width;
      newRect.y = baseRect.y;
      break;
    case "e": // East edge
      newRect.width = Math.max(10, baseRect.width + deltaX);
      newRect.x = baseRect.x;
      newRect.y = baseRect.y;
      break;
  }

  return newRect;
};

export const updateRectangleColors = (
  selectedColor: string,
  selectedBorderColor: string,
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>
) => {
  setRectangles((prev) =>
    prev.map((rect) => {
      if (rect.selected) {
        return {
          ...rect,
          fillColor: selectedColor,
          borderColor: selectedBorderColor,
        };
      }
      return rect;
    })
  );
};

export const updateAllSelectedColors = (
  selectedColor: string,
  selectedBorderColor: string,
  setRectangles: Dispatch<SetStateAction<Rectangle[]>>,
  setArrows: Dispatch<SetStateAction<any[]>>
) => {
  updateRectangleColors(selectedColor, selectedBorderColor, setRectangles);

  setArrows((prev) =>
    prev.map((arrow) => {
      if (arrow.selected) {
        return {
          ...arrow,
          color: selectedBorderColor, // Use border color for arrow color
        };
      }
      return arrow;
    })
  );
};

export const getRotationHandle = (rect: Rectangle): Point => {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const handleDistance =
    Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2 + 30;

  return {
    x: centerX + Math.cos(rect.rotation) * handleDistance,
    y: centerY + Math.sin(rect.rotation) * handleDistance,
  };
};

export const isPointNearRotationHandle = (
  point: Point,
  rect: Rectangle
): boolean => {
  // Transform the point to the rectangle's local coordinate system
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);

  const dx = point.x - centerX;
  const dy = point.y - centerY;

  const localX = dx * cos - dy * sin + centerX;
  const localY = dx * sin + dy * cos + centerY;

  // Check if point is outside the rectangle bounds (for rotation)
  const isOutsideRect =
    localX < rect.x - 10 ||
    localX > rect.x + rect.width + 10 ||
    localY < rect.y - 10 ||
    localY > rect.y + rect.height + 10;

  if (!isOutsideRect) return false;

  // Check corners for rotation (when hovering near corners but outside the rect)
  const corners = [
    { x: rect.x, y: rect.y }, // top-left
    { x: rect.x + rect.width, y: rect.y }, // top-right
    { x: rect.x, y: rect.y + rect.height }, // bottom-left
    { x: rect.x + rect.width, y: rect.y + rect.height }, // bottom-right
  ];

  const cornerDistance = 25; // Distance threshold for corner detection
  const nearCorner = corners.some((corner) => {
    const distance = Math.sqrt(
      (localX - corner.x) ** 2 + (localY - corner.y) ** 2
    );
    return distance < cornerDistance;
  });

  return nearCorner;
};

export const createRectangle = (
  startPoint: Point,
  currentPoint: Point,
  selectedColor: string,
  selectedBorderColor: string
): Rectangle => {
  const width = currentPoint.x - startPoint.x;
  const height = currentPoint.y - startPoint.y;

  return {
    id: generateId(),
    x: width < 0 ? currentPoint.x : startPoint.x,
    y: height < 0 ? currentPoint.y : startPoint.y,
    width: Math.abs(width),
    height: Math.abs(height),
    rotation: 0,
    fillColor: selectedColor,
    borderColor: selectedBorderColor,
    selected: false,
  };
};

export const drawRectangles = (
  ctx: CanvasRenderingContext2D,
  rectangles: Rectangle[]
) => {
  rectangles.forEach((rect) => {
    ctx.save();

    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(rect.rotation);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = rect.fillColor;
    ctx.strokeStyle = rect.borderColor;
    ctx.lineWidth = 2;

    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    if (rect.selected) {
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(rect.x - 5, rect.y - 5, rect.width + 10, rect.height + 10);
      ctx.setLineDash([]);

      // Draw scale handles
      ctx.fillStyle = "#0066ff";
      const handleSize = 6;
      const handles = [
        { x: rect.x, y: rect.y }, // nw
        { x: rect.x + rect.width, y: rect.y }, // ne
        { x: rect.x, y: rect.y + rect.height }, // sw
        { x: rect.x + rect.width, y: rect.y + rect.height }, // se
        { x: rect.x + rect.width / 2, y: rect.y }, // n
        { x: rect.x + rect.width / 2, y: rect.y + rect.height }, // s
        { x: rect.x, y: rect.y + rect.height / 2 }, // w
        { x: rect.x + rect.width, y: rect.y + rect.height / 2 }, // e
      ];

      handles.forEach((handle) => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });
    }

    ctx.restore();
  });
};

export const drawCurrentRectangle = (
  ctx: CanvasRenderingContext2D,
  currentRect: Rectangle | null
) => {
  if (!currentRect) return;

  ctx.fillStyle = currentRect.fillColor + "80";
  ctx.strokeStyle = currentRect.borderColor;
  ctx.lineWidth = 2;
  ctx.fillRect(
    currentRect.x,
    currentRect.y,
    currentRect.width,
    currentRect.height
  );
  ctx.strokeRect(
    currentRect.x,
    currentRect.y,
    currentRect.width,
    currentRect.height
  );
};
