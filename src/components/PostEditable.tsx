"use client";
import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { events, type EventsChannel } from "aws-amplify/data";
import { Schema } from "@/../amplify/data/resource";

import outputs from "../../amplify_outputs.json";
Amplify.configure(outputs);

export default function PostEditable({
  post,
  onDelete,
  isSignedIn,
}: {
  post: Pick<Schema["Post"]["type"], "content" | "id">;
  onDelete: (identifyUser: string) => void;
  isSignedIn: boolean;
}) {
  const [content, setContent] = useState<string>(
    post.content ? post.content : ""
  );

  useEffect(() => {
    let channel: EventsChannel;

    const connectAndSubscribe = async () => {
      channel = await events.connect("default/posts");

      channel.subscribe({
        next: (data) => {
          console.log("received", data);
          //setMyEvents((prev) => [data, ...prev]);
        },
        error: (err) => console.error("error", err),
      });
    };

    connectAndSubscribe();

    return () => channel && channel.close();
  }, []);

  async function publishEvent(data: string) {
    // Publish via HTTP POST
    // await events.post("default/channel", { data });

    // Alternatively, publish events through the WebSocket channel
    const channel = await events.connect("default/posts");
    await channel.publish({ data });
  }

  return (
    <div className="border bg-gray-100 w-full p-4 rounded flex justify-between">
      <button
      // onClick={onDetail}
      //className="cursor-pointer"
      >
        <div className="flex gap-2">
          <div>Content: </div>
          <div
            contentEditable
            //suppressContentEditableWarning
            onDoubleClick={(e) => e.currentTarget.focus()}
            onBlur={(e) => {
              // Handle saving the edited content here
              console.log("Edited content:", e.currentTarget.textContent);
              const newContent = e.currentTarget.textContent || "";
              setContent(newContent);
              publishEvent(JSON.stringify(newContent));
            }}
          >
            {content}
          </div>
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
