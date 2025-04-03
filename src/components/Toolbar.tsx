"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCanvas } from "@/app/contexts/CanvasContext";
import { ToolType } from "@/app/contexts/CanvasContextTypes";
import {
  Pencil,
  MousePointer,
  Square,
  Circle as CircleIcon,
  Minus,
  Eraser,
  Undo2,
  Redo2,
  //Save,
  Trash2,
} from "lucide-react";

const colorOptions = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  //{ name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  // { name: "Purple", value: "#8b5cf6" },
];

export const Toolbar: React.FC = () => {
  const {
    selectedTool,
    setSelectedTool,
    selectedColor,
    setSelectedColor,
    strokeWidth,
    setStrokeWidth,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    saveCanvas,
  } = useCanvas();

  const tools = [
    { name: "Select", value: "select", icon: <MousePointer size={20} /> },
    { name: "Pen", value: "pen", icon: <Pencil size={20} /> },
    { name: "Line", value: "line", icon: <Minus size={20} /> },
    { name: "Rectangle", value: "rectangle", icon: <Square size={20} /> },
    { name: "Circle", value: "circle", icon: <CircleIcon size={20} /> },
    { name: "Eraser", value: "eraser", icon: <Eraser size={20} /> },
  ];

  return (
    <div className="p-2 bg-white shadow-md rounded-lg flex flex-col gap-4 w-[70px] fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
      <div className="flex flex-col gap-1">
        {tools.map((tool) => (
          <TooltipProvider key={tool.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === tool.value ? "default" : "outline"}
                  size="icon"
                  className={`w-10 h-10 ${
                    selectedTool === tool.value
                      ? "bg-[#047d95] hover:bg-[#005566] text-white"
                      : ""
                  }`}
                  onClick={() => setSelectedTool(tool.value as ToolType)}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-2">
        <div className="flex flex-col justify-center gap-1 mb-2">
          {colorOptions.map((color) => (
            <TooltipProvider key={color.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`w-5 h-5 rounded-full ${
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-whiteboard-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{color.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="px-2 mt-2">
                <Slider
                  value={[strokeWidth]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                  className="w-full"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Stroke Width: {strokeWidth}px</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="border-t border-gray-200 pt-2 flex flex-col gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10"
                onClick={undo}
                disabled={!canUndo}
              >
                <Undo2 size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10"
                onClick={redo}
                disabled={!canRedo}
              >
                <Redo2 size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10"
                onClick={saveCanvas}
              >
                <Save size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Save Canvas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider> */}

        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={20} />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Clear Canvas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Canvas</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clear this canvas? This action cannot
                be undone and will remove all drawings for all users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearCanvas}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Clear Canvas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Toolbar;
