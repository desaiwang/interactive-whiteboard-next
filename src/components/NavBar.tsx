"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button, Divider, Flex } from "@aws-amplify/ui-react";
import { signOut } from "@aws-amplify/auth";
import { useRouter } from "next/navigation";
import { Hub } from "aws-amplify/utils";

export default function NavBar({ isSignedIn }: { isSignedIn: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(isSignedIn);
  console.log("isAuthenticated inside NavBar.tsx", isAuthenticated);

  const router = useRouter();
  useEffect(() => {
    const hubListenerCancel = Hub.listen("auth", (data) => {
      switch (data.payload.event) {
        case "signedIn":
          console.log("signedIn", data.payload.event);
          setIsAuthenticated(true);
          router.push("/");
          break;
        case "signedOut":
          console.log("signedIn", data.payload.event);
          setIsAuthenticated(false);
          router.push("/");
          break;
      }
    });
    return () => hubListenerCancel();
  }, [router]);

  const signOutSignIn = async () => {
    if (isAuthenticated) {
      await signOut();
    } else {
      router.push("/signin");
    }
  };

  const defaultRoutes = [
    { href: "/", label: "Home" },
    { href: "/add", label: "Add Title", loggedIn: true },
  ];

  const routes = defaultRoutes.filter(
    (route) =>
      route.loggedIn === isAuthenticated || route.loggedIn === undefined
  );
  return (
    <div className="flex flex-row justify-between align-center p-16">
      <div className="flex flex-row gap-4">
        {routes.map((route) => (
          <Link key={route.href} href={route.href}>
            {route.label}
          </Link>
        ))}
      </div>

      <Button
        variation="primary"
        borderRadius="2rem"
        className="mr-4"
        onClick={signOutSignIn}
      >
        {isAuthenticated ? "Sign Out" : "Sign In"}
      </Button>
    </div>
  );
}
