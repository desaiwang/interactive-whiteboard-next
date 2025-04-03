import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Post: a
    .model({
      id: a.string().required(),
      content: a.string().default("unnamed"),
      owner: a
        .string()
        .authorization((allow) => [
          allow.owner().to(["read", "delete"]),
          allow.publicApiKey().to(["read"]),
        ]),
      comments: a.hasMany("Comment", "postId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.owner(),
    ]),

  Comment: a
    .model({
      id: a.string().required(),
      content: a.string().required(),
      postId: a.string().required(),
      post: a.belongsTo("Post", "postId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.owner(),
    ]),

  Shape: a
    .model({
      id: a.string().required(),
      canvasId: a.string().required(),
      tool: a.string().required(),
      x: a.float().required(),
      y: a.float().required(),
      points: a.float().array().required(),
      stroke: a.string().required(),
      strokeWidth: a.float().required(),
      deleted: a.boolean().default(false),
      draggable: a.boolean().default(true),
      width: a.float(),
      height: a.float(),
      radius: a.float(),
    })
    .authorization((allow) => [
      allow.publicApiKey(), //TODO: prevent database delete or not?
      allow.authenticated(),
    ]),

  // BatchDeleteShape: a.mutation().arguments({ canvasId: a.string().array() })
  //   .returns(a.ref("Shape").array())
  //   .authorization(allow => [allow.publicApiKey(), allow.authenticated()])
  //   .handler(a.handler.custom({
  //     dataSource: a.ref('Post'), entry:'./BatchDeleteShapeHandler.js'
  // }))
});

//TODO: bring back when needed
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
