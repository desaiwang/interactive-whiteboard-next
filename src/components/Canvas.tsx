"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Transformer,
  Group,
} from "react-konva";
import { debounce } from "lodash";
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
import {
  createShapeDB,
  updateShapeDB,
  deleteShapeDB,
} from "@/app/_action/actions";

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

  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    console.log("clicked", e.target);

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
        publishEvent("make-invisible", id, new Date().toISOString()); // Publish the deleted shape to websocket

        const updatedShapes = shapes.map((shape) =>
          shape.id === id ? { ...shape, deleted: true } : shape
        );

        setShapes(updatedShapes); // Update state

        console.log("deleted shape", id);
        updateHistory({
          type: "delete",
          shapeId: id,
        }); //store action in history

        // delete shape from database
        deleteShapeDB(id);
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
    publishEvent("create", shapeJson, new Date().toISOString()); //TODO: add canvasID? Publish the new shape to the channel

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

  // Define this outside your handler, at component level
  const debouncedPublishMouseMove = debounce((updatedShape: Shape) => {
    console.log("debounced mouse move called");
    publishEvent(
      "update",
      JSON.stringify(updatedShape),
      new Date().toISOString()
    );
  }, 100);

  //updating the shape's points or dimensions while drawing
  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || !lastShape || selectedTool === "select") return;
    console.log("mousemove", e.target.x(), e.target.y());

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
    debouncedPublishMouseMove(updatedShape); // Publish the updated shape to the channel
  };

  //finish drawing the shape
  const handleMouseUp = () => {
    if (selectedTool === "select") return; // Do nothing if using selection tool
    isDrawing.current = false;

    // Set the shape to be draggable for selection after it's drawn
    if (lastShape) {
      const shapesCopy = shapes.map((shape) =>
        shape.id !== lastShape.id ? shape : { ...shape, draggable: true }
      );
      setShapes(shapesCopy);

      const newShape = { ...lastShape, draggable: true };
      console.log("websocket update shape upon mouseUp", newShape);
      publishEvent(
        "update",
        JSON.stringify(newShape),
        new Date().toISOString()
      ); //TODO: add canvasID? Publish the new shape to the channel

      // Send shape to server
      createShapeDB(newShape);

      //clear shape related data
      setSelectedShapeId(null);
      setLastShape(null);
    }
  };

  const handleDragStart = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (selectedTool !== "select") return; // Only allow dragging with selection tool
    console.log("drag begin", e.target.x(), e.target.y());
    const id = e.target.id();

    // Find the shape in the array
    const shapeIndex = shapes.findIndex((s) => s.id === id);
    if (shapeIndex === -1) return;

    const shape = shapes[shapeIndex];

    //prevent other users from dragging this shape
    // publishEvent("make-not-draggable", shape.id, new Date().toISOString());

    setSelectedShapeId(id); // Set the selected shape ID for transformer
    setLastShape(shape); // Store the shape being dragged
  };

  // Define this outside your handler, at component level
  const debouncedPublishMove = debounce((id: string, x: number, y: number) => {
    console.log("debounced drag move called");
    publishEvent(
      "move",
      JSON.stringify({ id, x, y }),
      new Date().toISOString()
    );
  }, 100);

  const handleDragMove = async (
    e: KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    if (!lastShape || selectedTool !== "select") return; //return if there's no shape to update or if not using select tool
    console.log("!lastShape", !lastShape);
    console.log("selectedTool", selectedTool);
    console.log("drag move", e.target.x(), e.target.y());
    const updatedShape = {
      ...lastShape,
      x: e.target.x(),
      y: e.target.y(),
    };

    debouncedPublishMove(lastShape.id, updatedShape.x, updatedShape.y);

    setShapes(
      shapes.map((shape) => (shape.id !== lastShape?.id ? shape : updatedShape))
    );
  };

  const handleDragEnd = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!lastShape || selectedTool !== "select") return; //return if there's no shape to update or if not using select tool
    console.log("drag end", e.target.x(), e.target.y());

    const updatedShape = {
      ...lastShape,
      x: e.target.x(),
      y: e.target.y(),
      draggable: true, // Set to true after dragging
    };
    console.log("publish update object", updatedShape);
    publishEvent(
      "update",
      JSON.stringify(updatedShape),
      new Date().toISOString()
    ); //TODO: add canvasID? Publish the new shape to the channel

    setShapes(
      shapes.map((shape) => (shape.id !== lastShape?.id ? shape : updatedShape))
    );

    const newAction: ActionType = {
      type: "move",
      shapeId: lastShape.id,
      from: { x: lastShape.x, y: lastShape.y },
      to: { x: updatedShape.x, y: updatedShape.x },
    };

    //TODO: updateDatabase

    updateHistory(newAction);

    // Send shape to server
    updateShapeDB(updatedShape);

    //clear shape related data
    setSelectedShapeId(null);
    setLastShape(null);
  };

  const renderShape = (shape: Shape, i: number) => {
    if (shape.deleted)
      return null; // Skip deleted shapes
    else if (shape.tool === "pen" || shape.tool === "line") {
      console.log("rendering rec", shape);
      console.log(
        "shape.draggable && selectedTool === 'select'",
        shape.draggable,
        selectedTool,
        shape.draggable && selectedTool === "select"
      );

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
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      );
    } else if (shape.tool === "rectangle") {
      const rect = shape as RectType;
      console.log("rendering rec", rect);
      console.log(
        "shape.draggable && selectedTool === 'select'",
        shape.draggable,
        selectedTool,
        shape.draggable && selectedTool === "select"
      );
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
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
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
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
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
