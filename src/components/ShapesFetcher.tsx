"use client";
import React, { useEffect, useState } from "react";
import { events, type EventsChannel } from "aws-amplify/data";
import { getShapesDB } from "@/app/_action/actions";
import Canvas from "@/components/Canvas";
import { useCanvas } from "@/app/contexts/CanvasContext";
import { Shape as ShapeType } from "@/app/contexts/CanvasContextTypes";
import CanvasLoadingOverlay from "@/components/CanvasLoadingOverlay";
import Toolbar from "@/components/Toolbar";

/**
 * `ShapesFetcher` fetches shapes data for the canvas. It displays a loading overlay while data is fetching.
 */
const ShapesFetcher = ({ canvasId }: { canvasId: string }) => {
  const { setShapes, channel } = useCanvas();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isConnectingWebSocket, setIsConnectingWebSocket] = useState(false);

  useEffect(() => {
    const fetchShapes = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await getShapesDB(canvasId);
        console.log("shapes fetched from server", data);
        if (!data) return;
        const cleanedShapes = data.map(
          (shape) =>
            ({
              ...shape,
            }) as ShapeType
        );

        if (error) {
          console.log("Error fetching shapes:", error);
        }
        setShapes(cleanedShapes);
      } catch (error) {
        console.error("Error fetching shapes:", error);
      }
      setIsLoadingData(false);
    };

    fetchShapes();
  }, [canvasId, setShapes]);

  useEffect(() => {
    const setupChannel = async () => {
      if (!channel.current) {
        setIsConnectingWebSocket(true);
        channel.current = await events.connect(`default/${canvasId}`);
        setIsConnectingWebSocket(false);
      }
    };

    setupChannel();

    // Clean up the connection when component unmounts
    return () => {
      if (channel.current) {
        channel.current.close(); // Assuming there's a close method
        channel.current = null;
      }
    };
  }, [canvasId, channel]);

  return (
    <>
      {isLoadingData || isConnectingWebSocket ? (
        <CanvasLoadingOverlay />
      ) : (
        <>
          <Toolbar />
          <Canvas canvasId={canvasId} />
        </>
      )}
    </>
  );
};

export default ShapesFetcher;
