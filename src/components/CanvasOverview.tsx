"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function CanvasOverview({
  canvas,
  onDelete,
}: {
  canvas: { id: string; name: string };
  onDelete: (identifyUser: string) => void;
}) {
  const router = useRouter();
  const onDetail = () => {
    router.push(`canvas/${canvas.id}`);
  };

  return (
    <div className="border bg-gray-100 w-full p-4 rounded flex justify-between">
      <button onClick={onDetail} className="cursor-pointer">
        <div>{canvas.name}</div>
      </button>
      <input type="hidden" name="id" id="id" value={canvas.id} />
      <button
        className="text-red-500 cursor-pointer"
        onClick={() => onDelete(canvas.id)}
      >
        X
      </button>
    </div>
  );
}
