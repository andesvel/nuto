import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { decryptPassword } from "@/utils/crypto";
import { findOwnedById } from "../repository/urls";

// Reveals one link's password to its owner when they ask for it, instead of
// shipping every password in the dashboard's loader data. Same-origin only
// in practice: the response carries no CORS headers, so other sites can't
// read it even with the owner's cookies.
export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const shortCode = new URL(args.request.url).searchParams.get("shortCode");
  if (!shortCode) return new Response("Bad Request", { status: 400 });

  const { DB, PASSCODE_ENC_KEY } = args.context.cloudflare.env;
  const link = await findOwnedById(DB, shortCode, userId);
  if (!link?.password_enc || !PASSCODE_ENC_KEY) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const password = await decryptPassword(link.password_enc, PASSCODE_ENC_KEY);
    return Response.json(
      { password },
      { headers: { "Cache-Control": "no-store", Vary: "Cookie" } },
    );
  } catch {
    console.error("Failed to decrypt a link password");
    return new Response("Server Error", { status: 500 });
  }
}
