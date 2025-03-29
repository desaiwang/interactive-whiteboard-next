import React from "react";
import { createPost } from "@/app/_action/actions";
import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";

export default async function AddPost() {
  const user = await AuthGetCurrentUserServer();

  return (
    <div>
      <form
        action={createPost}
        className="p-4 flex flex-col items-center gap-4"
      >
        <input
          type="text"
          name="content"
          id="content"
          placeholder="Title"
          className="border border-gray-200 text-gray-900 block p-2 rounded-lg"
        ></input>
        <input type="hidden" name="owner" id="owner" value={user?.username} />
        <button type="submit" className="text-white bg-teal-600 rounded p-4">
          Submit
        </button>
      </form>
    </div>
  );
}
