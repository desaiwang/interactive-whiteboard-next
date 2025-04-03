import React, { useState, createContext } from "react";
import { Shape, ActionType } from "@/app/contexts/CanvasContextTypes";

type ShapeVersions = Record<string, number>;

// Define the shape context types
type ShapeContextType = {
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  shapeVersions: ShapeVersions;
  setShapeVersions: React.Dispatch<React.SetStateAction<ShapeVersions>>;
  history: ActionType[];
  setHistory: React.Dispatch<React.SetStateAction<ActionType[]>>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  createShape: (data: any) => Shape;
};

const ShapeContext = createContext<ShapeContextType | undefined>(undefined);

export const ShapeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // History for undo/redo
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<ActionType[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const value = {
    shapes,
    setShapes,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
  };

  return (
    <ShapeContext.Provider value={value}>{children}</ShapeContext.Provider>
  );
};

export const useShapeContext = () => {
  const context = React.useContext(ShapeContext);
  if (!context) {
    throw new Error("useShape must be used within a ShapeProvider");
  }
  return context;
};
