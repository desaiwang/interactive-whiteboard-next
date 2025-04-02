import React from "react";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
// import RoomControls from "@/app/components/RoomControls";
import { CanvasProvider } from "@/app/contexts/CanvasContext";
import { Toaster } from "sonner";

const Index = async ({
  params: rawParams,
}: {
  params: Promise<{ id: string }>;
}) => {
  const params = await rawParams;
  if (!params.id) return null;
  return (
    <CanvasProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        <Toolbar />
        {/* <RoomControls /> */}
        <Canvas canvasId={params.id} />
        <Toaster position="bottom-right" />
      </div>
    </CanvasProvider>
  );
};

export default Index;
