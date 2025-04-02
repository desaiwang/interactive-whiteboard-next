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
import {
  useCanvas,
  Shape,
  Point,
  Rectangle as RectType,
  Circle as CircleType,
  ActionType,
} from "@/app/contexts/CanvasContext";
import { v4 as uuidv4 } from "uuid";
import { Amplify } from "aws-amplify";
import { events, type EventsChannel } from "aws-amplify/data";
import { Schema } from "@/../amplify/data/resource";
import { useWebSocket } from "@/hooks/useWebSocket";

import outputs from "../../amplify_outputs.json";
Amplify.configure(outputs);

const Canvas: React.FC = () => {
  const stageRef = useRef<any>(null);
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
  } = useCanvas();

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });
  const [lastShape, setLastShape] = useState<Shape | null>(null);
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
  }, []);
  const { publishEvent } = useWebSocket(clientId);

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
  //   console.log("shapes chaged", shapes);
  // }, [shapes]);

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

  const handleMouseDown = async (e: any) => {
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
          e.target.getParent().className === "Transformer";
        if (!clickedOnTransformer) {
          const id = e.target.id();
          setSelectedShapeId(id);
        }
      }
      return;
    }

    // If not using selection tool, start drawing
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const id = uuidv4(); // Generate a unique ID for the new shape
    const newShape: Shape =
      selectedTool === "rectangle" || selectedTool === "circle"
        ? {
            id: id,
            tool: selectedTool,
            x: pos.x,
            y: pos.y,
            points: [], // Initialize points for rectangle and circle
            stroke: selectedColor,
            strokeWidth,
            draggable: false, // Set to false while drawing, will be true when done for select tool
            deleted: false,
          }
        : {
            id: id,
            tool: selectedTool,
            points: [pos.x, pos.y],
            x: 0,
            y: 0,
            stroke: selectedTool === "eraser" ? "#ffffff" : selectedColor,
            strokeWidth,
            draggable: false, // Set to false while drawing, will be true when done for select tool
            deleted: false,
          };

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
  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Make a shallow copy of the shapes array
    if (lastShape) {
      const selectedToolType = lastShape.tool;
      if (selectedToolType === "pen" || selectedToolType === "eraser") {
        // For pen and eraser, add points for a free-form line
        const newPoints = [...lastShape.points, point.x, point.y];
        const updatedShape = { ...lastShape, points: newPoints };

        const shapesCopy = shapes.map((shape) =>
          shape.id !== lastShape.id ? shape : updatedShape
        );
        setLastShape(updatedShape);
        setShapes(shapesCopy);
      } else if (selectedToolType === "line") {
        // For line, keep start point and update end point
        const newPoints = [
          lastShape.points[0],
          lastShape.points[1],
          point.x,
          point.y,
        ];
        const updatedShape = { ...lastShape, points: newPoints };

        const shapesCopy = shapes.map((shape) =>
          shape.id !== lastShape.id ? shape : updatedShape
        );
        setLastShape(updatedShape);
        setShapes(shapesCopy);
      } else if (selectedToolType === "rectangle") {
        // For rectangle, calculate width and height
        const width = point.x - lastShape.x;
        const height = point.y - lastShape.y;

        const updatedShape: RectType = {
          ...lastShape,
          width,
          height,
        };
        console.log("drawing rectangle", updatedShape);
        const shapesCopy = shapes.map((shape) =>
          shape.id !== lastShape.id ? shape : updatedShape
        );
        setLastShape(updatedShape);
        setShapes(shapesCopy);
      } else if (selectedToolType === "circle") {
        // For circle, calculate radius
        const dx = point.x - lastShape.x;
        const dy = point.y - lastShape.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        const updatedShape = {
          ...lastShape,
          radius,
        };
        const shapesCopy = shapes.map((shape) =>
          shape.id !== lastShape.id ? shape : updatedShape
        );

        setLastShape(updatedShape);
        setShapes(shapesCopy);
      }
    }
  };

  //finish drawing the shape
  const handleMouseUp = async () => {
    isDrawing.current = false;

    // Set the shape to be draggable for selection after it's drawn
    if (lastShape) {
      console.log("shapes", shapes);
      const shapesCopy = shapes.map((shape) =>
        shape.id !== lastShape.id ? shape : { ...shape, draggable: true }
      );
      console.log("shapesCopy", shapesCopy);
      setShapes(shapesCopy);

      if (lastShape?.tool === "rectangle") {
        const rectShape = lastShape as RectType;
        console.log("rectShape.width", rectShape.width);
        console.log("rectShape", rectShape);
      }
      console.log("lastShape", lastShape);
      const shapeJson = JSON.stringify(lastShape);
      console.log("shapeJson", shapeJson);
      await publishEvent("create", shapeJson); // Publish the new shape to the channel

      // emit the shape to other users
      // socket.emit('shape_added', { roomId, shape: shapes[shapes.length - 1] });

      setLastShape(null); // Clear last shape after drawing
    }
  };

  const handleDragEnd = (e: any) => {
    console.log("handleDragEnd e", e);

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
    console.log(
      "x,y -> e.x, e.y",
      `${shape.x}, ${shape.y} -> ${e.target.x()}, ${e.target.y()}`
    );
    console.log("newAction", newAction);
    updateHistory(newAction);
  };

  const renderShape = (shape: Shape, i: number) => {
    if (shape.deleted)
      return null; // Skip deleted shapes
    else if (
      shape.tool === "pen" ||
      shape.tool === "eraser" ||
      shape.tool === "line"
    ) {
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
          onDragEnd={handleDragEnd}
          globalCompositeOperation={
            shape.tool === "eraser" ? "destination-out" : "source-over"
          }
        />
      );
    } else if (shape.tool === "rectangle") {
      const rect = shape as any;
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
          onDragEnd={handleDragEnd}
        />
      );
    } else if (shape.tool === "circle") {
      const circle = shape as any;
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
          onDragEnd={handleDragEnd}
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
        className="cursor-crosshair"
        style={{
          cursor: selectedTool === "select" ? "default" : "crosshair",
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
