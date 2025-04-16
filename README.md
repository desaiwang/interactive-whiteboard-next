This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## To host locally

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture
The app is created with Next.js/Typescript and hosted through Amplify. It stores data in a DynamoDB database and communicates between users through AppSync Events (web socket). User authentication is managed with Cognito.

Database

- two managed database, one for canvases and another for shapes
- shapes have a secondary index on canvasId for quick indexing (get all shapes for one canvas)

Web sockets

- Follows architecture outlined in [Amplify documentation](https://docs.amplify.aws/nextjs/build-a-backend/data/connect-event-api/).
- Creates a subchannel `default/<canvasId>`  distribute events by canvas

User Authentication

- Server-based auth module
- main page displays all canvases they’ve created (blank to begin with)
- can add a board using the button on top left

## Actions

There are 3 main types of actions: create, move, delete. Mouse related events are handled in Canvas.tsx, while undo/redo/clear-canvas is handled by CanvasContext.tsx (state manager). There are 4 relevant data storage: local state stores all relevant shapes, history is used to manage state, web socket broadcasts changes to other users, and database is for persistence.

The local history differs from local state in that it only records what’s done by a particular instance of the canvas, so when an user presses undo/redo they are only managing their own actions. For example, if I draw a circle, then my friend draws a rectangle. When I press undo, my circle disappears but my friend’s rectangle remains.

<p align="center">
  <img src="https://github.com/user-attachments/assets/9b331d24-8c8a-417e-a92b-4990acb7aef2" width="50%">
</p>
