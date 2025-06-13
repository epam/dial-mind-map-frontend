import { EdgeSingular } from 'cytoscape';

// Function to find the intersection point of a line with a rectangle
function getIntersectionPoint(
  rectPos: { x: number; y: number },
  rectWidth: number,
  rectHeight: number,
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
) {
  const rectLeft = rectPos.x - rectWidth / 2;
  const rectRight = rectPos.x + rectWidth / 2;
  const rectTop = rectPos.y - rectHeight / 2;
  const rectBottom = rectPos.y + rectHeight / 2;

  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const t1 = (rectLeft - lineStart.x) / dx;
  const t2 = (rectRight - lineStart.x) / dx;
  const t3 = (rectTop - lineStart.y) / dy;
  const t4 = (rectBottom - lineStart.y) / dy;

  const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
  const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

  const t = tMin < 0 ? tMax : tMin;

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

export function getClickPosition(event: any, edge: EdgeSingular): 'body' | 'head' {
  const clickPos = event.position;
  const targetNode = edge.target();
  const sourceNode = edge.source();
  const targetPos = targetNode.position();
  const sourcePos = sourceNode.position();

  // Get the sizes of the source and target nodes
  const targetWidth = targetNode.width();
  const targetHeight = targetNode.height();

  // Calculate the intersection points
  const targetIntersection = getIntersectionPoint(targetPos, targetWidth, targetHeight, sourcePos, targetPos);

  // Calculate the distance from the click position to the target intersection point
  const distanceToTarget = Math.sqrt(
    Math.pow(clickPos.x - targetIntersection.x, 2) + Math.pow(clickPos.y - targetIntersection.y, 2),
  );

  // Determine the click position category
  if (distanceToTarget <= 25) {
    return 'head';
  } else {
    return 'body';
  }
}
