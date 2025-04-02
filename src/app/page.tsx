import React from "react";
import { cookiesClient } from "@/utils/amplify-utils";
// import Post from "@/components/Post";
// import { onDeletePost } from "./_action/actions";
import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";
import PostList from "@/components/PostList";
// import { Schema } from "@/../amplify/data/resource";

export default async function Home() {
  const user = await AuthGetCurrentUserServer();

  const { data: shapes } = await cookiesClient.models.Shape.list({
    // selectionSet: ["id", "canvasId", "tool", "x", "y", "points", "stroke", "createdAt"],
    authMode: "apiKey",
  });

  console.log("shapes fetched from server", shapes);

  return (
    <main className="flex flex-col items-center justify-between p-24 w-1/2 m-auto font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl pb-10">List of all Titles</h1>
      {/* <PostList initialPosts={posts} isSignedIn={!!user} /> */}
      {/* {posts?.map((post) => (
        <Post
          key={post.id}
          onDelete={onDeletePost}
          post={post}
          isSignedIn={!!user}
        ></Post>
      ))} */}
    </main>
  );
}
