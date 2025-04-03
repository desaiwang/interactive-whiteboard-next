import React from "react";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
// import RoomControls from "@/app/components/RoomControls";
import { CanvasProvider } from "@/app/contexts/CanvasContext";
import { Shape as ShapeType } from "@/app/contexts/CanvasContextTypes";
import { getShapesDB } from "@/app/_action/actions";
import { Toaster } from "sonner";
import { Shape } from "react-konva";
import ShapesFetcher from "@/components/ShapesFetcher";
import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";

const Index = async ({
  params: rawParams,
}: {
  params: Promise<{ id: string }>;
}) => {
  const params = await rawParams;
  if (!params.id) return null;

  const user = await AuthGetCurrentUserServer();

  return (
    <CanvasProvider canvasId={params.id}>
      <div className="relative h-screen w-screen overflow-hidden">
        <ShapesFetcher canvasId={params.id} user={user} />
        {/* <Toolbar /> */}
        {/* <RoomControls /> */}
        {/* <Canvas canvasId={params.id} /> */}
        <Toaster position="bottom-right" />
      </div>
    </CanvasProvider>
  );
};

export default Index;
