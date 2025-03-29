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
  console.log("formData", formData);
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
