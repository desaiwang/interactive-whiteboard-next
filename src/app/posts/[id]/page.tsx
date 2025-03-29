import { cookiesClient, AuthGetCurrentUserServer } from "@/utils/amplify-utils";
import { revalidatePath } from "next/cache";
import React from "react";
import AddComment from "@/components/AddComment";
import { createComment, deleteComment } from "@/app/_action/actions";

export default async function PostDetail({
  params: rawParams,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await rawParams;
  if (!params.id) return null;

  const isSignedIn = !!(await AuthGetCurrentUserServer());
  const { data: post } = await cookiesClient.models.Post.get(
    {
      id: params.id,
    },
    { authMode: "apiKey", selectionSet: ["owner", "id", "content"] }
  );

  const { data: allComments } = await cookiesClient.models.Comment.list({
    authMode: "apiKey",
    selectionSet: ["id", "content", "post.id"],
  });
  //TODO: how to filter by post id?
  const comments = allComments.filter(
    (comment) => comment.post.id === params.id
  );
  console.log("comments", comments);

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl font-bold">Post Information:</h1>
      <div className="border rounded w-1/2 m-auto bg-gray-200 p-4">
        <h2>Title: {post?.content}</h2>
      </div>

      <AddComment addComment={createComment} postId={params.id} />
      <h1 className="text-xl font-bold">Comments:</h1>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="w-96 p-2 rounded border bg-yellow-100 flex justify-between"
        >
          <h2>{comment.content}</h2>
          <form
            action={async (formData) => {
              "use server";
              const id = formData.get("id")?.toString();
              if (!id) return;

              await deleteComment(id);
              revalidatePath(`/posts/${params.id}`);
            }}
          >
            <input type="hidden" name="id" id="id" value={comment.id} />
            {isSignedIn && (
              <button className="text-red-500 cursor-pointer" type="submit">
                X
              </button>
            )}
          </form>
        </div>
      ))}
    </div>
  );
}
