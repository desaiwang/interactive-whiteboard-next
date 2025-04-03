"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Transformer,
  Group,
} from "react-konva";
import { KonvaEventObject, KonvaNodeComponent } from "konva/lib/Node";
import {
  useCanvas,
  Shape,
  Point,
  Rectangle as RectType, //appendedType to avoid conflict with react-konva
  Circle as CircleType,
  Line as LineType,
  ActionType,
} from "@/app/contexts/CanvasContext";
import { v4 as uuidv4 } from "uuid";
import { Amplify } from "aws-amplify";
import { useWebSocket } from "@/hooks/useWebSocket";
import { createShapeDB, updateShapeDB } from "@/app/_action/actions";

import outputs from "../../amplify_outputs.json";
Amplify.configure(outputs);

const Canvas: React.FC<{ canvasId: string }> = ({ canvasId }) => {
  console.log("canvasId", canvasId);
  const stageRef = useRef<KonvaNodeComponent | null>(null);
  const transformerRef = useRef<any>(null);
  const {
    shapes,
    setShapes,
    selectedTool,
    selectedColor,
    strokeWidth,
    isDrawing,
    selectedShapeId,
    setSelectedShapeId,
    updateHistory,
    publishEvent,
  } = useCanvas();

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });
  const [lastShape, setLastShape] = useState<Shape | null>(null);

  useEffect(() => {
    setStageSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // useEffect(() => {
  //   if (!stageRef.current) return;
  //   const stage = stageRef.current.getStage();
  //   const container = stage.container();

  //   // ✅ Cursor logic
  //   if (selectedTool === "eraser") {
  //     container.style.cursor = "url(/eraser2.svg) 5 5, auto";
  //   } else if (selectedTool === "select") {
  //     container.style.cursor = "default";
  //   } else {
  //     container.style.cursor = "crosshair";
  //   }

  //   // Optional cleanup (if needed)
  //   return () => {
  //     container.style.cursor = "default";
  //   };
  // }, [selectedTool]);

  // Handle transformer for selected shape
  useEffect(() => {
    if (selectedShapeId && transformerRef.current) {
      // Find selected node by id
      const stage = stageRef.current;
      const selectedNode = stage.findOne("#" + selectedShapeId);

      // Attach transformer to selected node
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedShapeId, shapes]);

  const handleMouseDown = async (
    e: KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    //console.log("clicked", e.target);

    // Clear selection when clicking on empty canvas
    if (clickedOnEmpty) {
      setSelectedShapeId(null);
    }

    // Handle selection tool
    if (selectedTool === "select") {
      if (!clickedOnEmpty) {
        const clickedOnTransformer =
          e.target.getParent()?.className === "Transformer";
        if (!clickedOnTransformer) {
          const id = e.target.id();
          setSelectedShapeId(id);
        }
      }
      return;
    }

    if (selectedTool === "eraser") {
      // Handle eraser tool
      const id = e.target.id();
      console.log("e.target", e.target);

      if (id) {
        publishEvent("make-invisible", id); // Publish the deleted shape to websocket

        const updatedShapes = shapes.map((shape) =>
          shape.id === id ? { ...shape, deleted: true } : shape
        );

        setShapes(updatedShapes); // Update state

        console.log("deleted shape", id);
        updateHistory({
          type: "delete",
          shapeId: id,
        }); //store action in history
      }
      return;
    }

    // If not using selection tool, start drawing
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return; // if can't get pointer position, do nothing
    const id = uuidv4(); // Generate a unique ID for the new shape

    //create shape, set x,y to be 0 if it's a line-ish shape
    const isLine = !(selectedTool === "rectangle" || selectedTool === "circle");
    const newShape: Shape = {
      id,
      canvasId,
      tool: selectedTool,
      x: isLine ? 0 : pos.x,
      y: isLine ? 0 : pos.y,
      points: isLine ? [pos.x, pos.y] : [], // Initialize points for rectangle and circle
      stroke: selectedColor,
      strokeWidth,
      draggable: false, // Set to false while drawing, will be true when done for select tool
      deleted: false,
    };

    //broadcast change
    const shapeJson = JSON.stringify(newShape);
    await publishEvent("create", shapeJson); //TODO: add canvasID? Publish the new shape to the channel

    // Add the new shape to the shapes array
    setShapes((prevShapes) => [...prevShapes, newShape]);
    setLastShape(newShape); // Store the last shape for later use

    const newAction: ActionType = {
      type: "create",
      shapeId: id,
    };
    console.log("newAction", newAction);

    updateHistory(newAction);
  };

  //updating the shape's points or dimensions while drawing
  // Updating the shape's points or dimensions while drawing
  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || !lastShape) return;

    const point = e.target.getStage()?.getPointerPosition();
    if (!point) return; // if can't get pointer position, do nothing
    let updatedShape;

    // Handle different shape types
    switch (lastShape.tool) {
      case "pen":
        // For pen and eraser, add points for a free-form line
        updatedShape = {
          ...lastShape,
          points: [...lastShape.points, point.x, point.y],
        } as LineType;
        break;

      case "line":
        console.log("line", lastShape.points, point.x, point.y);
        // For line, keep start point and update end point
        updatedShape = {
          ...lastShape,
          points: [lastShape.points[0], lastShape.points[1], point.x, point.y],
        } as LineType;
        break;

      case "rectangle":
        // For rectangle, calculate width and height
        updatedShape = {
          ...lastShape,
          width: point.x - lastShape.x,
          height: point.y - lastShape.y,
        } as RectType;
        break;

      case "circle":
        // For circle, calculate radius
        const dx = point.x - lastShape.x;
        const dy = point.y - lastShape.y;
        updatedShape = {
          ...lastShape,
          radius: Math.sqrt(dx * dx + dy * dy),
        } as CircleType;
        break;

      default:
        return; // Unknown tool type, do nothing
    }

    // Update the shapes array with the modified shape
    setShapes(
      shapes.map((shape) => (shape.id !== lastShape.id ? shape : updatedShape))
    );

    // Update the last shape reference
    setLastShape(updatedShape);
    publishEvent("update", JSON.stringify(updatedShape)); // Publish the updated shape to the channel
  };

  //finish drawing the shape
  const handleMouseUp = async () => {
    isDrawing.current = false;

    // Set the shape to be draggable for selection after it's drawn
    if (lastShape) {
      const shapesCopy = shapes.map((shape) =>
        shape.id !== lastShape.id ? shape : { ...shape, draggable: true }
      );
      setShapes(shapesCopy);
      await publishEvent("make-draggable", lastShape.id); //TODO: add canvasID? Publish the new shape to the channel

      // Send shape to server
      try {
        const response = await createShapeDB({ ...lastShape, draggable: true });

        if (!response.success) {
          console.error(
            "Failed to save shape:",
            response.errors || response.error
          );
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }

      setLastShape(null); // Clear last shape after drawing
    }
  };

  const handleDragEnd = async (
    e: KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    const id = e.target.id();

    // Find the shape in the array
    const shapeIndex = shapes.findIndex((s) => s.id === id);
    if (shapeIndex === -1) return;

    const shape = shapes[shapeIndex];
    const shapesCopy = [...shapes];

    const updatedShape = {
      ...shape,
      x: e.target.x(),
      y: e.target.y(),
    };
    shapesCopy[shapeIndex] = updatedShape;

    setShapes(shapesCopy);

    const newAction: ActionType = {
      type: "move",
      shapeId: id,
      from: { x: shape.x, y: shape.y },
      to: { x: e.target.x(), y: e.target.y() },
    };

    updateHistory(newAction);

    // Send shape to server
    try {
      const response = await updateShapeDB(updatedShape);

      if (!response.success) {
        console.error(
          "Failed to update shape:",
          response.errors || response.error
        );
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const renderShape = (shape: Shape, i: number) => {
    if (shape.deleted)
      return null; // Skip deleted shapes
    else if (shape.tool === "pen" || shape.tool === "line") {
      return (
        <Line
          key={shape.id || i}
          id={shape.id}
          points={shape.points}
          x={shape.x}
          y={shape.y}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          draggable={shape.draggable && selectedTool === "select"}
          // onDragMove={(e) => console.log("x, y", e.target.x(), e.target.y())}
          onDragEnd={async (e) => await handleDragEnd(e)}
        />
      );
    } else if (shape.tool === "rectangle") {
      const rect = shape as RectType;
      return (
        <Rect
          key={shape.id || i}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          width={rect.width || 0}
          height={rect.height || 0}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill="transparent"
          draggable={shape.draggable && selectedTool === "select"}
          onDragEnd={async (e) => await handleDragEnd(e)}
        />
      );
    } else if (shape.tool === "circle") {
      const circle = shape as CircleType;
      return (
        <Circle
          key={shape.id || i}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          radius={circle.radius || 0}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill="transparent"
          draggable={shape.draggable && selectedTool === "select"}
          onDragEnd={async (e) => await handleDragEnd(e)}
        />
      );
    }
    return null;
  };

  return (
    <div className="whiteboard-container h-screen w-screen overflow-hidden bg-gray-50">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={async (e) => await handleMouseDown(e)}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={async (e) => await handleMouseDown(e)}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        ref={stageRef}
        className={selectedTool === "eraser" ? "cursor-eraser" : ""}
        style={{
          cursor:
            selectedTool === "select"
              ? "default"
              : selectedTool !== "eraser"
                ? "crosshair"
                : "",
        }}
      >
        <Layer>
          {shapes.map((shape, i) => renderShape(shape, i))}
          <Group>
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit size
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            >
              {/* {selectedShapeId && (
                <Group
                  x={100}
                  y={100}
                  onClick={() => {
                    console.log("onClick transformer");
                    handleDeleteButtonClick
                  }}
                  onTap={handleDeleteButtonClick}
                >
                  <Rect
                    width={24}
                    height={24}
                    fill="#8E9196"
                    cornerRadius={4}
                  />
                  <Line
                    points={[6, 6, 18, 18, 12, 12, 6, 18, 18, 6]}
                    stroke="white"
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                  />
                </Group>
              )} */}
            </Transformer>
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
