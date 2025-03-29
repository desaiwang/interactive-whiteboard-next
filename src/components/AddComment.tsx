"use client";
import React, { useState } from "react";
import { Schema } from "@/../amplify/data/resource";

export default function AddComment({
  addComment,
  postId,
}: {
  addComment: (comment: string, postId: string) => void;
  postId: string;
}) {
  const [comment, setComment] = useState<string>("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setComment("");
    addComment(comment, postId);
  };

  return (
    <form onSubmit={onSubmit} className="p-4 flex flex-col items-center gap-4">
      <input
        className="border border-gray-200 text-gray-900 block p-2 rounded-lg"
        type="text"
        value={comment}
        id="comment"
        name="comment"
        placeholder="Add a comment..."
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit" className="text-white bg-teal-600 rounded p-4">
        Submit
      </button>
    </form>
  );
}
{
}
