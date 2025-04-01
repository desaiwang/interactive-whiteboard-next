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
import { useCanvas, Shape, Point } from "@/app/contexts/CanvasContext";
import { v4 as uuidv4 } from "uuid";

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
  } = useCanvas();

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });

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

  useEffect(() => {
    console.log("shapes chaged", shapes);
  }, [shapes]);

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

  const handleMouseDown = (e: any) => {
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

    const newShape: Shape = {
      id: uuidv4(),
      tool: selectedTool,
      points: [pos.x, pos.y],
      stroke: selectedTool === "eraser" ? "#ffffff" : selectedColor,
      strokeWidth,
      draggable: false, // Set to false while drawing, will be true when done for select tool
    };

    // Add the new shape to the shapes array
    setShapes((prevShapes) => [...prevShapes, newShape]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Make a shallow copy of the shapes array
    const shapesCopy = [...shapes];
    const lastShape = shapesCopy[shapesCopy.length - 1];

    if (lastShape) {
      if (selectedTool === "pen" || selectedTool === "eraser") {
        // For pen and eraser, add points for a free-form line
        const newPoints = [...lastShape.points, point.x, point.y];
        const updatedShape = { ...lastShape, points: newPoints };

        shapesCopy[shapesCopy.length - 1] = updatedShape;
        setShapes(shapesCopy);
      } else if (selectedTool === "line") {
        // For line, keep start point and update end point
        const newPoints = [
          lastShape.points[0],
          lastShape.points[1],
          point.x,
          point.y,
        ];
        const updatedShape = { ...lastShape, points: newPoints };

        shapesCopy[shapesCopy.length - 1] = updatedShape;
        setShapes(shapesCopy);
      } else if (selectedTool === "rectangle") {
        // For rectangle, calculate width and height
        const x = lastShape.points[0];
        const y = lastShape.points[1];
        const width = point.x - x;
        const height = point.y - y;

        const updatedShape = {
          ...lastShape,
          width,
          height,
        };

        shapesCopy[shapesCopy.length - 1] = updatedShape;
        setShapes(shapesCopy);
      } else if (selectedTool === "circle") {
        // For circle, calculate radius
        const x = lastShape.points[0];
        const y = lastShape.points[1];
        const dx = point.x - x;
        const dy = point.y - y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        const updatedShape = {
          ...lastShape,
          radius,
        };

        shapesCopy[shapesCopy.length - 1] = updatedShape;
        setShapes(shapesCopy);
      }
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    // Set the shape to be draggable for selection after it's drawn
    if (shapes.length > 0) {
      const shapesCopy = [...shapes];
      const lastShape = shapesCopy[shapesCopy.length - 1];
      const updatedShape = { ...lastShape, draggable: true };
      shapesCopy[shapesCopy.length - 1] = updatedShape;
      setShapes(shapesCopy);
    }

    // In a real implementation, we would emit the shape to other users
    // socket.emit('shape_added', { roomId, shape: shapes[shapes.length - 1] });
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
  };

  const renderShape = (shape: Shape, i: number) => {
    if (
      shape.tool === "pen" ||
      shape.tool === "eraser" ||
      shape.tool === "line"
    ) {
      return (
        <Line
          key={shape.id || i}
          id={shape.id}
          points={shape.points}
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
          x={shape.points[0]}
          y={shape.points[1]}
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
          x={shape.points[0]}
          y={shape.points[1]}
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
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
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
