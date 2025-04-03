import React from "react";
import { cookiesClient } from "@/utils/amplify-utils";
import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";
import CanvasOverviewsFetcher from "@/components/CanvasOverviewsFetcher";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);

export default async function Home() {
  const user = await AuthGetCurrentUserServer();

  return (
    <main className="flex flex-col items-center justify-between p-24 w-1/2 m-auto font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl pb-10">My Canvases</h1>
      {!!user ? (
        <CanvasOverviewsFetcher userId={user.userId} />
      ) : (
        <h1 className="text-2xl">Please sign in to see your canvases</h1>
      )}
    </main>
  );
}
