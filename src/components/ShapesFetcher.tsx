"use client";
import React, { useEffect, useState } from "react";
import { events } from "aws-amplify/data";
import { getShapesDB } from "@/app/_action/actions";
import Canvas from "@/components/Canvas";
import { useCanvas } from "@/app/contexts/CanvasContext";
import { Shape as ShapeType } from "@/app/contexts/CanvasContextTypes";
import LoadingOverlay from "@/components/LoadingOverlay";
import Toolbar from "@/components/Toolbar";

// import { Amplify } from "aws-amplify";
// Amplify.configure({
//   API: {
//     Events: {
//       endpoint:
//         "https://ll5c243i7rcnbiycgzfil25yqq.appsync-api.us-east-1.amazonaws.com/event",
//       region: "us-east-1",
//       defaultAuthMode: "apiKey",
//       apiKey: "da2-zbsn7rzsq5hxlkqjdvp7pt7tq4",
//     },
//   },
// });

/**
 * `ShapesFetcher` fetches shapes data for the canvas. It displays a loading overlay while data is fetching.
 */
const ShapesFetcher = ({
  canvasId,
  //user,
}: {
  canvasId: string;
  //user: AuthUser | null;
}) => {
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

  //set up connection to websocket channel to listen events
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
        <LoadingOverlay message="Connecting to whiteboard..." />
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
