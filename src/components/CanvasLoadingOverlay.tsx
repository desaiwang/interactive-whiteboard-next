"use client";
import React from "react";

const CanvasLoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-800">
          Connecting to whiteboard...
        </p>
      </div>
    </div>
  );
};

export default CanvasLoadingOverlay;
