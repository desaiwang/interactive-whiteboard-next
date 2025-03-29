import { cookiesClient } from "@/utils/amplify-utils";

export default async function Home() {
  const { data: posts } = await cookiesClient.models.Post.list({
    selectionSet: ["owner", "id", "content"],
    authMode: "apiKey",
  });

  console.log("posts", posts);

  return (
    <main className="items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl pb-10">List of all Titles</h1>
      {posts?.map((post) => (
        <div
          key={post.id}
          className="flex flex-col gap-4 border-2 rounded-lg p-4"
        >
          <h1 className="text-2xl">{post.id}</h1>
          <h1 className="text-xl">{post.content}</h1>
          <p className="text-sm text-gray-500">Owner: {post.owner}</p>
        </div>
      ))}
    </main>
  );
}
