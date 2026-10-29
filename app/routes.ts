import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // Spanish versions of the localized (indexable) pages
  route("es", "routes/home.tsx", { id: "es-home" }),
  route("es/privacy", "routes/privacy.tsx", { id: "es-privacy" }),
  route("es/disclaimer", "routes/disclaimer.tsx", { id: "es-disclaimer" }),
  route("dashboard", "routes/dashboard.tsx"),
  route("disclaimer", "routes/disclaimer.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("webhooks/clerk", "routes/webhooks.clerk.tsx"),
  route("api/links", "routes/api.links.tsx"),
  route("p/:slug", "routes/link-gate.tsx"),
  route(":slug", "routes/redirect.ts"),
] satisfies RouteConfig;
