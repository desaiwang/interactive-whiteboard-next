import { useEffect } from "react";
import { events, type EventsChannel } from "aws-amplify/data";
import {
  Shape,
  Rectangle,
  Circle,
  Line,
  useCanvas,
} from "@/app/contexts/CanvasContext";

function createShape(shapeData: any) {
  //common properties
  const baseShape: Shape = {
    id: shapeData.id,
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

export const useWebSocket = (clientIdRef: React.RefObject<string | null>) => {
  const { shapes, setShapes } = useCanvas();

  //set up for websocket connection using amplify events
  useEffect(() => {
    let channel: EventsChannel;

    const connectAndSubscribe = async () => {
      channel = await events.connect("default/canvas");

      channel.subscribe({
        next: (data) => {
          if (data.event.clientId === clientIdRef.current) return; // Ignore own events
          const parsedData = JSON.parse(data.event.data);
          console.log(parsedData);
          switch (data.event.actionType) {
            case "create":
              const createdShape = createShape(parsedData);
              console.log("createdShape", createdShape);

              const newShapes = [...shapes, createdShape];
              console.log("newShapes");
              setShapes(newShapes);
              break;
            case "update":
              const updatedShape = createShape(parsedData);
              console.log("updatedShape", updatedShape);

              const newShapes2 = shapes.map((shape) =>
                shape.id === updatedShape.id ? updatedShape : shape
              );
              console.log("newShapes", newShapes2);

              setShapes(newShapes2);
              break;
          }
          //add handlers for different event types, mainly will change shapes
        },
        error: (err) => console.error("error", err),
      });
    };

    connectAndSubscribe();

    return () => channel && channel.close();
  }, [clientIdRef, setShapes, shapes]);

  const publishEvent = async (actionType: string, data: string) => {
    //publish events through the WebSocket channel
    const channel = await events.connect("default/canvas");
    await channel.publish({
      actionType,
      clientId: clientIdRef.current || "",
      data,
    });
  };

  return { publishEvent };
};
