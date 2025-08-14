import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("webhooks/clerk", "routes/webhooks.clerk.tsx"),
  route("api/links", "routes/api.links.tsx"),
] satisfies RouteConfig;
