"use client";
import React, {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
} from "react";
import { toast } from "sonner";

// Define our shape types
export type ToolType =
  | "select"
  | "pen"
  | "line"
  | "rectangle"
  | "circle"
  | "eraser";
export type ColorType = string;

export interface Point {
  x: number;
  y: number;
}

export interface ShapeBase {
  id: string;
  tool: ToolType;
  points: number[];
  strokeWidth: number;
  stroke: ColorType;
  draggable?: boolean;
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

// Create the canvas context
interface CanvasContextType {
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  selectedTool: ToolType;
  setSelectedTool: React.Dispatch<React.SetStateAction<ToolType>>;
  selectedColor: ColorType;
  setSelectedColor: React.Dispatch<React.SetStateAction<ColorType>>;
  strokeWidth: number;
  setStrokeWidth: React.Dispatch<React.SetStateAction<number>>;
  isDrawing: React.MutableRefObject<boolean>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  history: Shape[][];
  setHistory: React.Dispatch<React.SetStateAction<Shape[][]>>;
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
  // socket: Socket | null;
  saveCanvas: () => void;
  loadCanvas: (roomId: string) => void;
  selectedShapeId: string | null;
  setSelectedShapeId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

// Mock server URL - in a real app, this would be your actual server
const SOCKET_SERVER_URL = "http://localhost:3001";

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("pen");
  const [selectedColor, setSelectedColor] = useState<ColorType>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const isDrawing = useRef<boolean>(false);

  // Room and user information
  const [roomId, setRoomId] = useState<string>("default-room");
  const [userName, setUserName] = useState<string>(
    "User-" + Math.floor(Math.random() * 1000)
  );

  // History for undo/redo
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Shape selection for moving and editing
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Socket.io connection
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // Connect to socket server
  useEffect(() => {
    // In a real implementation, we would connect to an actual socket server
    // For demo purposes, we'll just show a toast indicating it would connect
    toast(
      "In a real implementation, we would connect to a WebSocket server here."
    );

    // Mock socket behavior for demonstration
    // const mockSocket = io(SOCKET_SERVER_URL, {
    //   autoConnect: false, // Don't actually try to connect
    // });

    // setSocket(mockSocket);
    setConnected(true);

    return () => {
      //TODO: disconnect socket
      // if (mockSocket) {
      //   mockSocket.disconnect();
      // }
    };
  }, []);

  // Listen for room events (mock implementation)
  useEffect(
    () => {
      // if (!socket) return;

      // Mock receiving shapes from other users
      const handleNewShape = (newShape: Shape) => {
        setShapes((prevShapes) => [...prevShapes, newShape]);
      };

      // In a real implementation, we would set up actual event listeners
      // socket.on('shape_added', handleNewShape);

      return () => {
        // socket.off('shape_added', handleNewShape);
      };
    },
    [
      /* socket */
    ]
  ); // Uncomment when using actual socket

  // Computed properties for undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Record history when shapes change
  useEffect(() => {
    // Skip on initial load
    if (shapes.length === 0 && history[0].length === 0) return;

    // Skip if we're in the middle of an undo/redo operation
    const currentHistoryShapes = history[historyIndex] || [];
    const shapesAreEqual =
      shapes.length === currentHistoryShapes.length &&
      JSON.stringify(shapes) === JSON.stringify(currentHistoryShapes);

    if (shapesAreEqual) return;

    // If we're not at the end of the history array, we need to truncate it
    if (historyIndex < history.length - 1) {
      setHistory((prev) => prev.slice(0, historyIndex + 1).concat([shapes]));
      setHistoryIndex(historyIndex + 1);
    } else {
      // Add new state to history
      setHistory((prev) => [...prev, [...shapes]]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [shapes]);

  // Undo function
  const undo = () => {
    if (!canUndo) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setShapes([...history[newIndex]]);

    // In real implementation, we would broadcast this to all users
    // socket?.emit('canvas_update', { roomId, shapes: history[newIndex] });
  };

  // Redo function
  const redo = () => {
    if (!canRedo) return;

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setShapes([...history[newIndex]]);

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
      setHistory((prev) => [...prev, parsedShapes]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    setShapes([]);

    // Add empty array to history
    setHistory((prev) => [...prev, []]);
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
    //TODO: socket,
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
