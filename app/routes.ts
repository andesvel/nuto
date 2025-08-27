import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("disclaimer", "routes/disclaimer.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("webhooks/clerk", "routes/webhooks.clerk.tsx"),
  route("api/links", "routes/api.links.tsx"),
  route(":slug", "routes/redirect.tsx"),
] satisfies RouteConfig;
