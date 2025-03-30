"use client";
import type { EventsChannel } from "aws-amplify/data";
import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/data";

Amplify.configure({
  API: {
    Events: {
      endpoint:
        "https://ll5c243i7rcnbiycgzfil25yqq.appsync-api.us-east-1.amazonaws.com/event",
      region: "us-east-1",
      defaultAuthMode: "apiKey",
      apiKey: "da2-zbsn7rzsq5hxlkqjdvp7pt7tq4",
    },
  },
});

export default function App() {
  const [myEvents, setMyEvents] = useState<unknown[]>([]);

  useEffect(() => {
    let channel: EventsChannel;

    const connectAndSubscribe = async () => {
      channel = await events.connect("default/channel");

      channel.subscribe({
        next: (data) => {
          console.log("received", data);
          setMyEvents((prev) => [data, ...prev]);
        },
        error: (err) => console.error("error", err),
      });
    };

    connectAndSubscribe();

    return () => channel && channel.close();
  }, []);

  async function publishEvent() {
    // Publish via HTTP POST
    await events.post("default/channel", { some: "data" });

    // Alternatively, publish events through the WebSocket channel
    const channel = await events.connect("default/channel");
    await channel.publish({ some: "data" });
  }

  return (
    <>
      <button onClick={publishEvent}>Publish Event</button>
      <ul>
        {myEvents.map((data) => (
          <li key={crypto.randomUUID()}>{JSON.stringify(data.event)}</li>
        ))}
      </ul>
    </>
  );
}
