"use server";

import { cookiesClient } from "@/utils/amplify-utils";
import { redirect } from "next/navigation";

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
