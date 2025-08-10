import * as React from "react";
import Header from "@/components/header";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return { userId };
}

export default function Dashboard() {
  return (
    <>
      <Header />
      <div>Dashboard</div>
    </>
  );
}
