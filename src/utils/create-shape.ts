import { Shape, Rectangle, Circle, Line } from "@/app/contexts/CanvasContext";

/**
 * Helper function to create shapes from JSON-like data.
 *
 * This function takes in shape data and returns a shape object
 * with properties based on the provided data. It supports creating
 * different types of shapes such as rectangles, circles, and lines.
 *
 * @param shapeData - The JSON-like data containing properties to define the shape.
 * @returns A shape object corresponding to the specified tool in the input data.
 */
export function createShape(shapeData: any) {
  //common properties
  const baseShape: Shape = {
    id: shapeData.id,
    canvasId: shapeData.canvasId,
    tool: shapeData.tool,
    x: shapeData.x,
    y: shapeData.y,
    points: shapeData.points || [],
    stroke: shapeData.stroke,
    strokeWidth: shapeData.strokeWidth,
    draggable: shapeData.draggable ?? true,
    deleted: shapeData.deleted ?? false,
  };

  switch (shapeData.tool) {
    case "rectangle":
      return {
        ...baseShape,
        tool: "rectangle",
        width: shapeData.width,
        height: shapeData.height,
      } as Rectangle;

    case "circle":
      return {
        ...baseShape,
        tool: "circle",
        radius: shapeData.radius,
      } as Circle;

    case "line":
      return {
        ...baseShape,
        tool: "line",
      } as Line;
  }

  return baseShape;
}
