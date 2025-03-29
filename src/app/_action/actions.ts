"use server";

import { cookiesClient } from "@/utils/amplify-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function onDeletePost(id: string) {
  const { data, errors } = await cookiesClient.models.Post.delete(
    { id },
    { authMode: "userPool" }
  );

  console.log("delete post", data, errors);
  revalidatePath("/");
}

export async function createPost(formData: FormData) {
  console.log("post formData", formData);
  const { data, errors } = await cookiesClient.models.Post.create(
    {
      content: formData.get("content")?.toString() || "",
    },
    { authMode: "userPool" }
  );
  console.log("create post", data);
  if (errors) {
    console.error("Error creating post", errors);
  }

  redirect("/");
}

export async function createComment(content: string, postId: string) {
  // Validation of data coming in
  if (content.trim().length === 0) return;

  const { data, errors } = await cookiesClient.models.Comment.create(
    {
      content,
      postId,
    },
    { authMode: "userPool" }
  );

  console.log("create comment", data);
  if (errors) {
    console.error("Error creating comment", errors);
  }

  revalidatePath(`/posts/${postId}`);
}

export async function deleteComment(id: string) {
  const { data, errors } = await cookiesClient.models.Comment.delete(
    { id },
    { authMode: "userPool" }
  );

  console.log("delete comment", data, errors);
}
