import React from "react";

import { CanvasProvider } from "@/app/contexts/CanvasContext";
import { Toaster } from "sonner";
import ShapesFetcher from "@/components/ShapesFetcher";
//import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";

const Index = async ({
  params: rawParams,
}: {
  params: Promise<{ id: string }>;
}) => {
  const params = await rawParams;
  if (!params.id) return null;

  //const user = await AuthGetCurrentUserServer();

  return (
    <CanvasProvider canvasId={params.id}>
      <div className="relative h-screen w-screen overflow-hidden">
        <ShapesFetcher
          canvasId={params.id}
          //user={user}
        />
        {/* <Toolbar /> */}
        {/* <RoomControls /> */}
        {/* <Canvas canvasId={params.id} /> */}
        <Toaster position="bottom-right" />
      </div>
    </CanvasProvider>
  );
};

export default Index;
