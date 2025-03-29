import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Auth from "@/components/auth/Auth";
import NavBar from "@/components/NavBar";
import { AuthGetCurrentUserServer } from "@/utils/amplify-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whiteboard",
  description: "Interactive Whiteboard for Collaboration",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isSignedIn = await AuthGetCurrentUserServer();
  console.log("isSignedIn", isSignedIn);
  console.log("!!isSignedin", !!isSignedIn);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavBar isSignedIn={!!isSignedIn}></NavBar>
        <Auth>{children}</Auth>
      </body>
    </html>
  );
}
