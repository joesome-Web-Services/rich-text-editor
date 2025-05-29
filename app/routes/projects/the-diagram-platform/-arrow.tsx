import { Point, generateId } from "./-rectangle";

export type Arrow = {
  id: string;
  start: Point;
  end: Point;
  startRectId?: string;
  endRectId?: string;
  selected: boolean;
  color: string;
};

export const createArrow = (start: Point, end: Point): Arrow => ({
  id: generateId(),
  start,
  end,
  selected: false,
  color: "#000000",
});

export const isPointNearArrowEndpoint = (
  point: Point,
  arrow: Arrow
): "start" | "end" | null => {
  const startDistance = Math.sqrt(
    (point.x - arrow.start.x) ** 2 + (point.y - arrow.start.y) ** 2
  );
  const endDistance = Math.sqrt(
    (point.x - arrow.end.x) ** 2 + (point.y - arrow.end.y) ** 2
  );

  if (startDistance < 10) return "start";
  if (endDistance < 10) return "end";
  return null;
};

export const isPointNearArrow = (point: Point, arrow: Arrow): boolean => {
  // Check if point is near the arrow line
  const A = point.x - arrow.start.x;
  const B = point.y - arrow.start.y;
  const C = arrow.end.x - arrow.start.x;
  const D = arrow.end.y - arrow.start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return false;

  const param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = arrow.start.x;
    yy = arrow.start.y;
  } else if (param > 1) {
    xx = arrow.end.x;
    yy = arrow.end.y;
  } else {
    xx = arrow.start.x + param * C;
    yy = arrow.start.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy) < 5;
};

export const drawArrows = (ctx: CanvasRenderingContext2D, arrows: Arrow[]) => {
  arrows.forEach((arrow) => {
    ctx.strokeStyle = arrow.selected ? "#3b82f6" : arrow.color;
    ctx.lineWidth = arrow.selected ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(arrow.start.x, arrow.start.y);
    ctx.lineTo(arrow.end.x, arrow.end.y);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(
      arrow.end.y - arrow.start.y,
      arrow.end.x - arrow.start.x
    );
    const headLength = 15;

    ctx.beginPath();
    ctx.moveTo(arrow.end.x, arrow.end.y);
    ctx.lineTo(
      arrow.end.x - headLength * Math.cos(angle - Math.PI / 6),
      arrow.end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(arrow.end.x, arrow.end.y);
    ctx.lineTo(
      arrow.end.x - headLength * Math.cos(angle + Math.PI / 6),
      arrow.end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();

    // Draw endpoint handles for selected arrows
    if (arrow.selected) {
      ctx.fillStyle = "#3b82f6";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;

      // Start endpoint handle
      ctx.beginPath();
      ctx.arc(arrow.start.x, arrow.start.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // End endpoint handle
      ctx.beginPath();
      ctx.arc(arrow.end.x, arrow.end.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  });
};

export const drawCurrentArrow = (
  ctx: CanvasRenderingContext2D,
  currentArrow: Arrow | null
) => {
  if (!currentArrow) return;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(currentArrow.start.x, currentArrow.start.y);
  ctx.lineTo(currentArrow.end.x, currentArrow.end.y);
  ctx.stroke();
};
