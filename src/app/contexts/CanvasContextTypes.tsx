import { type EventsChannel } from "aws-amplify/data";

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
  canvasId: string;
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
  tool: "pen" | "line";
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
export interface CanvasContextType {
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
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  channel: React.RefObject<EventsChannel | null>;
  publishEvent: (
    actionType: string,
    data: string,
    time: string
  ) => Promise<void>;
  saveCanvas: () => void;
  selectedShapeId: string | null;
  setSelectedShapeId: React.Dispatch<React.SetStateAction<string | null>>;
}
