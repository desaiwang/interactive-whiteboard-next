import React from "react";
import { createCanvas } from "@/app/_action/actions";
import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";

export default async function AddCanvas() {
  const user = await AuthGetCurrentUserServer();

  return (
    <div>
      <form
        action={createCanvas}
        className="p-4 flex flex-row justify-center gap-4"
      >
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Canvas Name"
          className="border border-gray-200 text-gray-900 block p-2 rounded-lg"
        ></input>
        <input type="hidden" name="owner" id="owner" value={user?.userId} />
        <button
          type="submit"
          className="text-white bg-[#047d95] rounded-full py-2 px-4"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
