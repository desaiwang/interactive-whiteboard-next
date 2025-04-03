"use server";

import { cookiesClient } from "@/utils/amplify-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Shape as ShapeType } from "@/app/contexts/CanvasContextTypes";
import { v4 as uuidv4 } from "uuid";

export async function deleteCanvas(id: string) {
  const { data, errors } = await cookiesClient.models.Canvas.delete(
    { id },
    { authMode: "userPool" }
  );

  console.log("delete canvas", data, errors);
  revalidatePath("/");
}

export async function createCanvas(formData: FormData) {
  console.log("post formData", formData);
  const newId = uuidv4();
  const { data, errors } = await cookiesClient.models.Canvas.create(
    {
      id: newId,
      name: formData.get("name")?.toString() || "unnamed",
    },
    { authMode: "userPool" }
  );
  console.log("create canvas", data);
  if (errors) {
    console.error("Error creating post", errors);
  }

  redirect(`/canvas/${newId}`);
}

export async function getCanvasesDB(ownerId: string) {
  try {
    //using secondary index for faster operation
    const { data, errors } = await cookiesClient.models.Canvas.list();

    //cookiesClient.models.Canvas.listCanvasByOwner({
    //   owner: ownerId,
    // });

    if (errors) {
      console.error("Error getting canvases:", errors);
      return { success: false, errors };
    }
    console.log("Canvas retrieved in getCanvasesDB:", data);
    const filteredData = data.filter((item) => item.owner === ownerId);
    console.log("Filtered canvases:", filteredData);

    return {
      success: true,
      data: filteredData,
    };
  } catch (error) {
    console.error("Server error:", error);
    return { success: false, error };
  }
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
