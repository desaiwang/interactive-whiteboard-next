"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Schema } from "@/../amplify/data/resource";

export default function Post({
  post,
  onDelete,
  isSignedIn,
}: {
  post: Pick<Schema["Post"]["type"], "content" | "id">;
  onDelete: (identifyUser: string) => void;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const onDetail = () => {
    router.push(`posts/${post.id}`);
  };

  return (
    <div className="border bg-gray-100 w-full p-4 rounded flex justify-between">
      <button onClick={onDetail} className="cursor-pointer">
        <div className="flex gap-2">
          <div>Title: </div>
          <div>{post.content}</div>
        </div>
      </button>
      <input type="hidden" name="id" id="id" value={post.id} />
      {isSignedIn && (
        <button
          className="text-red-500 cursor-pointer"
          onClick={() => onDelete(post.id)}
        >
          X
        </button>
      )}
    </div>
  );
}
