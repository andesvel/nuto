import * as React from "react";
import { redirect } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in?redirect_url=" + args.request.url);
  }

  return userId;
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  console.log("Dashboard loaderData:", loaderData);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header />
      <main className="c-root grow flex items-center justify-center">
        dashboard
      </main>
      <Footer />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div>
    </div>
  );
}
