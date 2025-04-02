"use client";
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

// Define our shape types
export type ToolType =
  | "select"
  | "pen"
  | "line"
  | "rectangle"
  | "circle"
  | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface ShapeBase {
  id: string;
  tool: ToolType;
  points: number[];
  x: number;
  y: number;
  strokeWidth: number;
  stroke: string;
  draggable?: boolean;
  //createdAt?: string;
  deleted: boolean;
  //deletedAt?: string;
}

export interface Line extends ShapeBase {
  tool: "pen" | "line" | "eraser";
}

export interface Rectangle extends ShapeBase {
  tool: "rectangle";
  width?: number;
  height?: number;
}

export interface Circle extends ShapeBase {
  tool: "circle";
  radius?: number;
}

export type Shape = Line | Rectangle | Circle;

//these are actions related to redo/undo (not websockets)
export type Action = "move" | "create" | "delete";
export type ActionType = {
  type: Action;
  shapeId: string;
  from?: Point;
  to?: Point;
  // shape?: Shape;
};

// Create the canvas context
interface CanvasContextType {
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  selectedTool: ToolType;
  setSelectedTool: React.Dispatch<React.SetStateAction<ToolType>>;
  selectedColor: string;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  strokeWidth: number;
  setStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  isDrawing: React.RefObject<boolean>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  history: ActionType[];
  setHistory: React.Dispatch<React.SetStateAction<ActionType[]>>;
  updateHistory: (newAction: ActionType) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  roomId: string;
  setRoomId: React.Dispatch<React.SetStateAction<string>>;
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  connected: boolean;
  publishEvent: (actionType: string, data: string) => Promise<void>;
  saveCanvas: () => void;
  loadCanvas: (roomId: string) => void;
  selectedShapeId: string | null;
  setSelectedShapeId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("pen");
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const isDrawing = useRef<boolean>(false);

  // Room and user information
  const [roomId, setRoomId] = useState<string>("default-room");
  const [userName, setUserName] = useState<string>(
    "User-" + Math.floor(Math.random() * 1000)
  );

  // History for undo/redo
  const [history, setHistory] = useState<ActionType[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Shape selection for moving and editing
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // socket related setup
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const clientId = useRef<string | null>(null);

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

  //set up for websocket connection using amplify events
  useEffect(() => {
    let channel: EventsChannel;

    const connectAndSubscribe = async () => {
      channel = await events.connect("default/canvas");

      channel.subscribe({
        next: (data) => {
          if (data.event.clientId === clientId.current) return; // Ignore own events

          if (
            data.event.actionType === "create" ||
            data.event.actionType === "update"
          ) {
            const parsedData = JSON.parse(data.event.data);
            const newShape = createShape(parsedData);

            switch (data.event.actionType) {
              case "create":
                const newShapes = [...shapes, newShape];
                setShapes(newShapes);
                break;
              case "update":
                const updatedShapes = shapes.map((shape) =>
                  shape.id === newShape.id ? newShape : shape
                );
                setShapes(updatedShapes);
                break;
            }
          } else if (data.event.actionType === "make-draggable") {
            const shapeId = data.event.data;
            const updatedShapes = shapes.map((shape) =>
              shape.id === shapeId ? { ...shape, draggable: true } : shape
            );
            setShapes(updatedShapes);
          } else if (data.event.actionType === "make-invisible") {
            const shapeId = data.event.data;
            const updatedShapes = shapes.map((shape) =>
              shape.id === shapeId ? { ...shape, deleted: true } : shape
            );
            setShapes(updatedShapes);
          } else if (data.event.actionType === "make-visible") {
            const shapeId = data.event.data;
            const updatedShapes = shapes.map((shape) =>
              shape.id === shapeId ? { ...shape, deleted: false } : shape
            );
            setShapes(updatedShapes);
          } else if (data.event.actionType === "move-to") {
            const { id, x, y } = JSON.parse(data.event.data);
            shapes.map((shape) =>
              shape.id !== id
                ? shape
                : {
                    ...shape,
                    x: x || 0,
                    y: y || 0,
                  }
            );
          }
          //add handlers for different event types, mainly will change shapes
        },
        error: (err) => console.error("error", err),
      });

      setConnected(true);
      toast("websocket connected.");
    };

    connectAndSubscribe();

    return () => channel && channel.close();
  }, [clientId, setShapes, shapes]);

  const publishEvent = async (actionType: string, data: string) => {
    //publish events through the WebSocket channel
    const channel = await events.connect("default/canvas");
    await channel.publish({
      actionType,
      clientId: clientId.current || "",
      data,
    });
  };

  // Computed properties for undo/redo
  const canUndo = historyIndex >= 0;
  const canRedo = history.length > 0 && historyIndex < history.length - 1;

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

  //OLD: manage history
  // useEffect(() => {
  //   // Skip on initial load
  //   if (shapes.length === 0 && history.length === 0) return;

  //   // Skip if we're in the middle of an undo/redo operation
  //   // const currentHistoryShapes = history[historyIndex] || [];
  //   // const shapesAreEqual =
  //   //   shapes.length === currentHistoryShapes.length &&
  //   //   JSON.stringify(shapes) === JSON.stringify(currentHistoryShapes);

  //   // if (shapesAreEqual) return;

  //   // If we're not at the end of the history array, we need to truncate it
  //   if (historyIndex < history.length - 1) {
  //     setHistory((prev) => prev.slice(0, historyIndex + 1).concat([shapes]));
  //     setHistoryIndex(historyIndex + 1);
  //   } else {
  //     // Add new state to history
  //     setHistory((prev) => [...prev, [...shapes]]);
  //     setHistoryIndex(historyIndex + 1);
  //   }
  // }, [shapes]);

  // Undo function
  const undo = () => {
    if (!canUndo) return;

    const lastAction = history[historyIndex];

    if (lastAction.type === "delete") {
      publishEvent("make-visible", lastAction.shapeId);
      const newShapes = shapes.map((shape) =>
        shape.id !== lastAction.shapeId ? shape : { ...shape, deleted: false }
      );
      setShapes(newShapes);
    } else if (lastAction.type === "create") {
      publishEvent("make-invisible", lastAction.shapeId);
      const newShapes = shapes.map((shape) =>
        shape.id !== lastAction.shapeId ? shape : { ...shape, deleted: true }
      );
      setShapes(newShapes);
    } else if (lastAction.type === "move") {
      publishEvent(
        "move-to",
        JSON.stringify({
          id: lastAction.shapeId,
          x: lastAction.from?.x || 0,
          y: lastAction.from?.y || 0,
        })
      );

      const newShapes = shapes.map((shape) =>
        shape.id !== lastAction.shapeId
          ? shape
          : { ...shape, x: lastAction.from?.x || 0, y: lastAction.from?.y || 0 }
      );
      setShapes(newShapes);
    }

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    //setShapes([...history[newIndex]]);

    // In real implementation, we would broadcast this to all users
    // socket?.emit('canvas_update', { roomId, shapes: history[newIndex] });
  };

  // Redo function
  const redo = () => {
    if (!canRedo) return;

    const nextAction = history[historyIndex + 1];
    if (nextAction.type === "delete") {
      publishEvent("make-invisible", nextAction.shapeId);
      const newShapes = shapes.map((shape) =>
        shape.id !== nextAction.shapeId ? shape : { ...shape, deleted: true }
      );
      setShapes(newShapes);
    } else if (nextAction.type === "create") {
      publishEvent("make-visible", nextAction.shapeId);
      const newShapes = shapes.map((shape) =>
        shape.id !== nextAction.shapeId ? shape : { ...shape, deleted: false }
      );
      setShapes(newShapes);
    } else if (nextAction.type === "move") {
      publishEvent(
        "move-to",
        JSON.stringify({
          id: nextAction.shapeId,
          x: nextAction.to?.x || 0,
          y: nextAction.to?.y || 0,
        })
      );
      const newShapes = shapes.map((shape) =>
        shape.id !== nextAction.shapeId
          ? shape
          : {
              ...shape,
              x: nextAction.to?.x || 0,
              y: nextAction.to?.y || 0,
            }
      );
      setShapes(newShapes);
    }

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    //setShapes([...history[newIndex]]);

    // In real implementation, we would broadcast this to all users
    // socket?.emit('canvas_update', { roomId, shapes: history[newIndex] });
  };

  // Save the current state of the canvas
  const saveCanvas = () => {
    // In a real implementation, we would save to a database
    toast("In a real implementation, we would save to a database here.");

    // Mock implementation - save to localStorage for demo
    localStorage.setItem(`whiteboard-${roomId}`, JSON.stringify(shapes));
  };

  // Load canvas data by room ID
  const loadCanvas = (loadRoomId: string) => {
    // In a real implementation, we would load from a database
    toast(`Loading canvas for room: ${loadRoomId}`);

    // Mock implementation - load from localStorage for demo
    const savedShapes = localStorage.getItem(`whiteboard-${loadRoomId}`);
    if (savedShapes) {
      const parsedShapes = JSON.parse(savedShapes) as Shape[];
      setShapes(parsedShapes);
      //setHistory((prev) => [...prev, parsedShapes]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    setShapes([]);

    // Add empty array to history
    //TODO: also has the option to persist this state
    //setHistory((prev) => [...prev, []]);
    setHistoryIndex((prev) => prev + 1);

    // In real implementation, we would broadcast this to all users
    // socket?.emit('canvas_clear', { roomId });
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
    roomId,
    setRoomId,
    userName,
    setUserName,
    connected,
    publishEvent,
    saveCanvas,
    loadCanvas,
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
