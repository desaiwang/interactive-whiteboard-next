"use client";
import React, { useEffect, useState } from "react";
import { getCanvasesDB } from "@/app/_action/actions";
import LoadingOverlay from "@/components/LoadingOverlay";
import { deleteCanvas } from "@/app/_action/actions";
import CanvasOverview from "@/components/CanvasOverview";

/**
 * `CanvasOverviewsFetcher` fetches canvas associated with current user. It displays a loading overlay while data is fetching.
 */
const CanvasOverviewsFetcher = ({
  userId,
  //user,
}: {
  userId: string;
  //user: AuthUser | null;
}) => {
  const [canvases, setCanvases] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchShapes = async () => {
      setIsLoadingData(true);
      try {
        console.log("trying to fetch canvases from server", userId);
        const { data, error } = await getCanvasesDB(userId);
        console.log("canvases fetched from server", data);
        if (!data) return;
        const cleanedCanvases = data.map(({ name, id }) => ({
          name: name ?? "Untitled Canvas",
          id: id ?? "",
        }));

        if (error) {
          console.log("Error fetching shapes:", error);
        }
        setCanvases(cleanedCanvases);
      } catch (error) {
        console.error("Error fetching shapes:", error);
      }
      setIsLoadingData(false);
    };

    fetchShapes();
  }, [userId]);

  return (
    <>
      {isLoadingData ? (
        <LoadingOverlay message="Fetching canvases from database..." />
      ) : (
        canvases.map((canvas: { id: string; name: string }) => (
          <CanvasOverview
            key={canvas.id}
            canvas={canvas}
            onDelete={() => deleteCanvas(canvas.id)}
          />
        ))
      )}
    </>
  );
};

export default CanvasOverviewsFetcher;
