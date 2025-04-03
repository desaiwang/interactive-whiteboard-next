import { useEffect, useCallback, useRef } from "react";
import { Shape } from "@/app/contexts/CanvasContextTypes";
import { useShapeContext } from "@/app/contexts/ShapeContext";

export function useWebSocketConnection({
  clientId,
  events,
  toasts,
  onConnect,
}: {
  clientId: React.MutableRefObject<string>;
  events: { connect: (channel: string) => Promise<any> };
  toast: (message: string) => void;
  onConnected?: (connected: boolean) => void;
}) {
  // Get shape context
  const {
    shapes,
    setShapes,
    shapeVersions,
    setShapeVersions,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    createShape,
  } = useShapeContext();

  type ShapeVersions = Record<string, number>;
  // Use a ref to keep track of the current state values
  // without causing dependency changes
  const stateRef = useRef<{
    shapes: Shape[];
    shapeVersions: ShapeVersions;
  }>({
    shapes,
    shapeVersions,
  });

  // Update the ref whenever the values change
  useEffect(() => {
    stateRef.current = {
      shapes,
      shapeVersions,
    };
  }, [shapes, shapeVersions]);

  // Handler for create and update events
  // Handler for create and update events
  const handleCreateOrUpdate = useCallback(
    (event: any, data: any, eventTime: number) => {
      const parsedData = JSON.parse(data.event.data);
      const shapeId = parsedData.id;
      const { shapes, shapeVersions } = stateRef.current;
      const currentVersion = shapeVersions[shapeId] || 0;

      if (eventTime <= currentVersion) {
        console.log(
          `Ignoring outdated event (${data.event.actionType}) for shape ${shapeId}`
        );
        return;
      }

      setShapeVersions((prev) => ({
        ...prev,
        [shapeId]: eventTime,
      }));

      const newShape = createShape(parsedData);

      if (data.event.actionType === "create") {
        setShapes((prevShapes) => [...prevShapes, newShape]);
      } else if (data.event.actionType === "update") {
        setShapes((prevShapes) =>
          prevShapes.map((shape) =>
            shape.id === newShape.id ? newShape : shape
          )
        );
      }
    },
    [createShape]
  );
}
