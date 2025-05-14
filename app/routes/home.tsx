import type { Route } from "./+types/home";
import Header from "@components/header";
import Hero from "@components/hero";
import Footer from "@/components/footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nuto: Open source URL shortener" },
    {
      name: "description",
      content: "A simple and efficient URL shortening service.",
    },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-between antialiased">
      <Header />
      <main className="center-root">
        <Hero />
      </main>
      <Footer />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
    </div>
  );
}
