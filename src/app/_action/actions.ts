"use server";

import { cookiesClient } from "@/utils/amplify-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Shape as ShapeType } from "@/app/contexts/CanvasContextTypes";

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

export async function createShapeDB(shape: ShapeType) {
  try {
    const { data, errors } = await cookiesClient.models.Shape.create(shape, {
      authMode: "apiKey",
    });

    if (errors) {
      console.error("Error creating shape:", errors);
      return { success: false, errors };
    }

    console.log("Shape created:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Server error:", error);
    return { success: false, error };
  }
}

export async function updateShapeDB(shape: ShapeType) {
  try {
    const { data, errors } = await cookiesClient.models.Shape.update(shape, {
      authMode: "apiKey",
    });

    if (errors) {
      console.error("Error creating shape:", errors);
      return { success: false, errors };
    }

    console.log("Shape updated:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Server error:", error);
    return { success: false, error };
  }
}

export async function deleteShapeDB(id: string) {
  try {
    const { data, errors } = await cookiesClient.models.Shape.delete(
      { id },
      { authMode: "apiKey" }
    );

    if (errors) {
      console.error("Error deleting shape:", errors);
      return { success: false, errors };
    }

    console.log("Shape deleted:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Server error:", error);
    return { success: false, error };
  }
}

export async function getShapesDB(currentCanvasId: string) {
  try {
    //using secondary index for faster operation
    const { data, errors } =
      await cookiesClient.models.Shape.listShapeByCanvasId({
        canvasId: currentCanvasId,
      });

    //prev implementation using filter
    // cookiesClient.models.Shape.list({
    //   filter: {
    //     canvasId: {
    //       eq: currentCanvasId,
    //     },
    //   },
    // });

    if (errors) {
      console.error("Error getting shapes:", errors);
      return { success: false, errors };
    }

    console.log(`Shape retrived for canvas ${currentCanvasId}:`, data);
    return { success: true, data };
  } catch (error) {
    console.error("Server error:", error);
    return { success: false, error };
  }
}
