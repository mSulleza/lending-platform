"use client";

import Dashboard from "@/components/Dashboard";
import Login from "@/components/login";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-60">Loading...</div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return <Login />;
  }

  return <Dashboard />;
}
