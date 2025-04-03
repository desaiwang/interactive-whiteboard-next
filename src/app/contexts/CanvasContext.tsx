"use client";
//CanvasContext.tsx
import React, {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
} from "react";
import { events, type EventsChannel } from "aws-amplify/data";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { createShape } from "@/utils/create-shape";
import {
  createShapeDB,
  updateShapeDB,
  deleteShapeDB,
} from "@/app/_action/actions";
import {
  ToolType,
  Shape,
  ActionType,
  CanvasContextType,
} from "./CanvasContextTypes";

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{
  canvasId: string;
  children: React.ReactNode;
}> = ({ canvasId, children }) => {
  console.log("provider re-rendered");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("pen");
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const isDrawing = useRef<boolean>(false);

  // Channel and user information
  const [userName, setUserName] = useState<string>(
    "User-" + Math.floor(Math.random() * 1000)
  );
  const channel = useRef<EventsChannel | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<ActionType[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Shape selection for moving and editing
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const clientId = useRef<string | null>(null);

  // Computed properties for undo/redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update undo/redo state when history changes
  useEffect(() => {
    setCanUndo(historyIndex >= 0);
    setCanRedo(history.length > 0 && historyIndex < history.length - 1);
  }, [history, historyIndex]);

  //set up a unique client ID for this websocket connection
  useEffect(() => {
    // Check if there's already a UUID in sessionStorage
    const storedClientId = sessionStorage.getItem("clientId");

    if (storedClientId) {
      clientId.current = storedClientId; // Use the existing UUID from the tab session
    } else {
      const newClientId = uuidv4();
      sessionStorage.setItem("clientId", newClientId); // Store the new UUID in sessionStorage
      clientId.current = newClientId; // Set the client ID in state
    }

    console.log("Client ID:", clientId.current);
  }, []);

  const [shapeVersions, setShapeVersions] = useState<Record<string, number>>(
    {}
  );

  //set up connection to websocket channel to post events
  useEffect(() => {
    let channel: EventsChannel;
    const connectAndSubscribe = async () => {
      channel = await events.connect(`default/${canvasId}`);
      channel.subscribe({
        next: (data) => {
          if (data.event.clientId === clientId.current) return; // Ignore own events

          // Get the event timestamp as a number for comparison
          const eventTime = new Date(data.event.time).getTime();
          console.log(
            "received data",
            data.event.actionType,
            data.event.data,
            data.event.time
          );
          console.log("eventTime", eventTime);

          if (
            data.event.actionType === "create" ||
            data.event.actionType === "update"
          ) {
            const parsedData = JSON.parse(data.event.data);
            console.log("parsedData", parsedData);

            // Check if this shape already exists in our version tracking
            const shapeId = parsedData.id;
            const currentVersion = shapeVersions[shapeId] || 0;

            // Only process this update if it's newer than what we have
            if (eventTime > currentVersion) {
              // Update our version tracking
              setShapeVersions((prev) => ({
                ...prev,
                [shapeId]: eventTime,
              }));

              const newShape = createShape(parsedData);
              switch (data.event.actionType) {
                case "create":
                  // const newShapes = [...shapes, newShape];
                  setShapes((prevShapes) => [...prevShapes, newShape]);
                  break;
                case "update":
                  console.log("update shape", newShape);
                  // const updatedShapes = shapes.map((shape) =>
                  //   shape.id === newShape.id ? newShape : shape
                  // );
                  // console.log("shapes", shapes);
                  // console.log("updated shapes", updatedShapes);
                  setShapes((prevShapes) =>
                    prevShapes.map((shape) =>
                      shape.id === newShape.id ? newShape : shape
                    )
                  );
                  break;
              }
            } else {
              console.log(
                `Ignoring outdated event (${data.event.actionType}) for shape ${shapeId}`
              );
            }
          } else if (data.event.actionType === "make-draggable") {
            const shapeId = data.event.data;
            const currentVersion = shapeVersions[shapeId] || 0;

            if (eventTime > currentVersion) {
              setShapeVersions((prev) => ({
                ...prev,
                [shapeId]: eventTime,
              }));

              setShapes((shapes) =>
                shapes.map((shape) =>
                  shape.id === shapeId ? { ...shape, draggable: true } : shape
                )
              );
            }
          } else if (data.event.actionType === "make-not-draggable") {
            //TODO: to prevent other users from moving shapes, we need to set draggable to false
          } else if (data.event.actionType === "make-invisible") {
            const shapeId = data.event.data;
            const currentVersion = shapeVersions[shapeId] || 0;

            if (eventTime > currentVersion) {
              setShapeVersions((prev) => ({
                ...prev,
                [shapeId]: eventTime,
              }));

              setShapes((shapes) =>
                shapes.map((shape) =>
                  shape.id === shapeId ? { ...shape, deleted: true } : shape
                )
              );
            }
          } else if (data.event.actionType === "make-visible") {
            const shapeId = data.event.data;
            const currentVersion = shapeVersions[shapeId] || 0;

            if (eventTime > currentVersion) {
              setShapeVersions((prev) => ({
                ...prev,
                [shapeId]: eventTime,
              }));

              setShapes((shapes) =>
                shapes.map((shape) =>
                  shape.id === shapeId ? { ...shape, deleted: false } : shape
                )
              );
            }
          } else if (data.event.actionType === "move") {
            const { id, x, y } = JSON.parse(data.event.data);
            const currentVersion = shapeVersions[id] || 0;

            if (eventTime > currentVersion) {
              setShapeVersions((prev) => ({
                ...prev,
                [id]: eventTime,
              }));

              setShapes((shapes) =>
                shapes.map((shape) =>
                  shape.id !== id
                    ? shape
                    : {
                        ...shape,
                        x: x || 0,
                        y: y || 0,
                      }
                )
              );
            }
          } else if (data.event.actionType === "clear-canvas") {
            // Clear-canvas is a special case - it affects everything
            const newestVersionTime = Math.max(
              0,
              ...Object.values(shapeVersions)
            );

            if (eventTime > newestVersionTime) {
              // Reset everything
              setShapes([]);
              setHistory([]);
              setHistoryIndex(-1);
              setShapeVersions({}); // Clear version tracking
            }
          }
        },
        error: (err) => console.error("error", err),
      });
    };

    connectAndSubscribe();

    return () => channel && channel.close();
  }, [clientId, setShapes, shapeVersions, canvasId]);

  const publishEvent = async (
    actionType: string,
    data: string,
    time: string
  ) => {
    //publish events through the WebSocket channel
    if (!channel.current) {
      console.log("reconnecting to socket channel in publishEvent");
      await events.connect(`default/${canvasId}`);
    }
    if (!channel.current) return;
    await channel.current.publish({
      actionType,
      clientId: clientId.current || "",
      data,
      time,
    });
  };

  // Record history when shapes change
  const updateHistory = (newAction: ActionType) => {
    if (historyIndex < history.length - 1) {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newAction]);
      setHistoryIndex((prev) => prev + 1);
    } else {
      // Add new state to history
      setHistory((prev) => [...prev, newAction]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const deleteUndoRedo = (shapeId: string) => {
    publishEvent("make-invisible", shapeId, new Date().toISOString());
    const newShapes = shapes.map((shape) =>
      shape.id !== shapeId ? shape : { ...shape, deleted: true }
    );

    setShapes(newShapes);

    //handle Database delete as well
    deleteShapeDB(shapeId);
  };

  const createUndoRedo = (shapeId: string) => {
    publishEvent("make-visible", shapeId, new Date().toISOString());

    const newShapes = shapes.map((shape) =>
      shape.id !== shapeId ? shape : { ...shape, deleted: false }
    );

    setShapes(newShapes);

    //find the first shape with shapeId in shapes
    const shape = shapes.find((shape) => shape.id === shapeId);
    if (!shape) return;
    const newShape = { ...shape, deleted: false };

    //handle Database update as well
    createShapeDB(newShape);
  };

  const moveUndoRedo = (shapeId: string, x: number, y: number) => {
    publishEvent(
      "move-to",
      JSON.stringify({
        id: shapeId,
        x,
        y,
      }),
      new Date().toISOString()
    );

    const newShapes = shapes.map((shape) =>
      shape.id !== shapeId ? shape : { ...shape, x, y }
    );
    setShapes(newShapes);

    //handle Database update as well
    const shape = shapes.find((shape) => shape.id === shapeId);
    if (!shape) return;
    const newShape = { ...shape, x, y };
    updateShapeDB(newShape);
  };

  // Undo function
  const undo = () => {
    if (!canUndo) return;

    const lastAction = history[historyIndex];

    if (lastAction.type === "delete") {
      createUndoRedo(lastAction.shapeId);
    } else if (lastAction.type === "create") {
      deleteUndoRedo(lastAction.shapeId);
    } else if (lastAction.type === "move") {
      moveUndoRedo(
        lastAction.shapeId,
        lastAction.from?.x || 0,
        lastAction.from?.y || 0
      );
    }

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
  };

  // Redo function
  const redo = () => {
    console.log("redo", historyIndex, history.length, canRedo);
    if (!canRedo) return;

    const nextAction = history[historyIndex + 1];
    if (nextAction.type === "delete") {
      deleteUndoRedo(nextAction.shapeId);
    } else if (nextAction.type === "create") {
      createUndoRedo(nextAction.shapeId);
    } else if (nextAction.type === "move") {
      moveUndoRedo(
        nextAction.shapeId,
        nextAction.to?.x || 0,
        nextAction.to?.y || 0
      );
    }

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
  };

  // Save the current state of the canvas
  const saveCanvas = () => {
    //TODO: should save image?
  };

  // Clear the canvas
  const clearCanvas = () => {
    //TODO: add a warning that this will clear canvas for all users
    //toast("Clearing canvas for all users...");

    //deleted these shapes in
    shapes.forEach((shape) => {
      deleteShapeDB(shape.id);
    });
    setShapes([]);
    setHistory([]);
    setHistoryIndex(-1);

    publishEvent("clear-canvas", "", new Date().toISOString());
  };

  const value = {
    shapes,
    setShapes,
    selectedTool,
    setSelectedTool,
    selectedColor,
    setSelectedColor,
    strokeWidth,
    setStrokeWidth,
    isDrawing,
    historyIndex,
    setHistoryIndex,
    history,
    setHistory,
    updateHistory,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    userName,
    setUserName,
    channel,
    publishEvent,
    saveCanvas,
    selectedShapeId,
    setSelectedShapeId,
  };

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
};
