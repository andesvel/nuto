/// <reference types="@cloudflare/vitest-plugin/types" />
/// <reference types="vite/client" />

declare module "cloudflare:test" {
  export const env: Env;
  export function createExecutionContext(): ExecutionContext;
  export function waitOnExecutionContext(ctx: ExecutionContext): Promise<void>;
}
