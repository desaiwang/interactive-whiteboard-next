"use client";

import { useState, useEffect, useTransition } from "react";
import { generateClient } from "aws-amplify/data";
import { Schema } from "@/../amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";
import Post from "@/components/Post";
import PostEditable from "@/components/PostEditable";
import { onDeletePost } from "@/app/_action/actions";

Amplify.configure(outputs);

const client = generateClient<Schema>();
type Post = Pick<Schema["Post"]["type"], "content" | "id">;

export default function PostList({
  initialPosts,
  isSignedIn,
}: {
  initialPosts: Post[];
  isSignedIn: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts || []);
  const [, startTransition] = useTransition(); // Prevents UI blocking

  useEffect(() => {
    const sub = client.models.Post.observeQuery().subscribe({
      next: (data) => {
        setPosts([...data.items]); // Update posts in real time
      },
    });

    return () => sub.unsubscribe(); // Cleanup on unmount
  }, []);

  const handleDelete = (id: string) => {
    // Optimistic UI: Remove the post immediately
    setPosts((prev) => prev.filter((post) => post.id !== id));

    // Call the server action inside a transition
    startTransition(async () => {
      await onDeletePost(id); // Calls the server action
    });
  };

  return (
    <div>
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostEditable
            key={post.id}
            post={post}
            isSignedIn={isSignedIn}
            onDelete={handleDelete}
          />
        ))
      ) : (
        <p>No posts found.</p>
      )}
    </div>
  );
}
