import React from "react";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
// import RoomControls from "@/app/components/RoomControls";
import { CanvasProvider } from "@/app/contexts/CanvasContext";
import { Toaster } from "sonner";

const Index = () => {
  return (
    <CanvasProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        <Toolbar />
        {/* <RoomControls /> */}
        <Canvas />
        <Toaster position="bottom-right" />
      </div>
    </CanvasProvider>
  );
};

export default Index;
