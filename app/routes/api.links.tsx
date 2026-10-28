/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { encryptPassword } from "@/utils/crypto";
import { enforceUrlLimit } from "@/utils/enforce-link-limit";
import { isSelfReferential } from "@utils/is-self-referencial";
import { createsCycle } from "@utils/cycle-detection";
import {
  existsById,
  getLongUrlById,
  findOwnedById,
  insertLink,
  renameLink,
  updateLinkById,
  deleteLinkById,
} from "../repository/urls";
import {
  getRedirectEntry,
  putRedirectEntry,
  deleteRedirectEntry,
  type RedirectCacheEntry,
} from "../repository/url-cache";
import { passwordFingerprint } from "@/utils/link-access";
import { hashLinkPassword } from "@/utils/password-hash";
import {
  readTextField,
  normalizeLongUrl,
  validateExpiresAt,
  validatePasswordInput,
  validateShortCodeInput,
} from "@/utils/validate-link-input";

export async function action({ request, context, params }: ActionFunctionArgs) {
  const { userId } = await getAuth({ request, context, params });

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin request rejected", 403);
  }

  // Determine the type of operation being performed based on the HTTP method
  if (request.method === "POST") {
    return handleCreate(request, context, userId);
  } else if (request.method === "PUT") {
    return handleUpdate(request, context, userId);
  } else if (request.method === "DELETE") {
    return handleDelete(request, context, userId);
  }

  return new Response("Method not allowed", { status: 405 });
}

// Every KV write carries the password fingerprint, so the redirect loader's
// password wall applies to cache hits after creates and edits alike.
async function redirectCacheEntry(
  longUrl: string,
  passwordHash: string | null,
  expiresAt: string | null,
): Promise<RedirectCacheEntry> {
  return {
    longUrl,
    hasPassword: !!passwordHash,
    passwordFingerprint: passwordHash
      ? await passwordFingerprint(passwordHash)
      : null,
    expiresAt,
  };
}

async function shortCodeTaken(context: any, shortCode: string) {
  if (await existsById(context.cloudflare.env.DB, shortCode)) {
    return { taken: true, source: "db" as const };
  }

  const entry = await getRedirectEntry(
    context.cloudflare.env.URL_STORE,
    shortCode,
  );
  if (entry) return { taken: true, source: "kv" as const };

  return { taken: false, source: null } as const;
}

// CSRF guard: browsers always send Origin on POST/PUT/DELETE, so a mismatch
// means another site submitted the request with the user's session cookie.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function jsonError(error: string, status: number) {
  return Response.json({ success: false, error }, { status });
}

interface LinkFormInput {
  longUrl: string;
  expiresAt: string | null;
  password: string;
}

// Validates the fields shared by create and update before anything is
// hashed or written.
function parseLinkForm(
  formData: FormData,
): { ok: true; value: LinkFormInput } | { ok: false; response: Response } {
  const rawLongUrl = readTextField(formData, "longUrl");
  if (!rawLongUrl.trim()) {
    return { ok: false, response: jsonError("Missing required fields", 400) };
  }

  const longUrl = normalizeLongUrl(rawLongUrl);
  if (!longUrl.ok) return { ok: false, response: jsonError(longUrl.error, 400) };

  const expiresAt = validateExpiresAt(readTextField(formData, "expiresAt"));
  if (!expiresAt.ok) {
    return { ok: false, response: jsonError(expiresAt.error, 400) };
  }

  const password = validatePasswordInput(readTextField(formData, "password"));
  if (!password.ok) {
    return { ok: false, response: jsonError(password.error, 400) };
  }

  return {
    ok: true,
    value: {
      longUrl: longUrl.value,
      expiresAt: expiresAt.value,
      password: password.value,
    },
  };
}

// Rejects targets that point back at this short link or into a loop of
// short links on the same host.
async function checkRedirectTarget(
  context: any,
  request: Request,
  shortCode: string,
  longUrl: string,
): Promise<Response | null> {
  const host = request.headers.get("host");
  if (isSelfReferential(longUrl, shortCode, host)) {
    return jsonError("Short code cannot be the same as the long URL.", 400);
  }
  if (
    await createsCycle(shortCode, longUrl, host, (slug) =>
      getLongUrlById(context.cloudflare.env.DB, slug),
    )
  ) {
    return jsonError(
      "This target would create a redirect loop between short links.",
      400,
    );
  }
  return null;
}

async function protectPassword(context: any, password: string) {
  if (!password) return { passwordHash: null, passwordEnc: null };
  return {
    passwordHash: await hashLinkPassword(password),
    passwordEnc: await encryptPassword(
      password,
      context.cloudflare.env.PASSCODE_ENC_KEY,
    ),
  };
}

// Function to create a new link
async function handleCreate(request: Request, context: any, userId: string) {
  const formData = await request.formData();

  const rawShortCode = readTextField(formData, "shortCode");
  if (!rawShortCode.trim()) return jsonError("Missing required fields", 400);
  const shortCode = validateShortCodeInput(rawShortCode);
  if (!shortCode.ok) return jsonError(shortCode.error, 400);

  const parsed = parseLinkForm(formData);
  if (!parsed.ok) return parsed.response;
  const { longUrl, expiresAt, password } = parsed.value;

  const exists = await shortCodeTaken(context, shortCode.value);
  if (exists.taken) {
    return jsonError(
      "Short code is already in use, please choose another one.",
      409,
    );
  }

  const targetError = await checkRedirectTarget(
    context,
    request,
    shortCode.value,
    longUrl,
  );
  if (targetError) return targetError;

  try {
    const { passwordHash, passwordEnc } = await protectPassword(
      context,
      password,
    );

    // Enforce URL limit per user
    const max = Number(context.cloudflare.env.MAX_LINKS_PER_USER ?? 50);
    await enforceUrlLimit(context.cloudflare.env.DB, userId, max);

    await insertLink(context.cloudflare.env.DB, {
      id: shortCode.value,
      longUrl,
      userId,
      expiresAt,
      password: passwordHash,
      passwordEnc,
    });

    await putRedirectEntry(
      context.cloudflare.env.URL_STORE,
      shortCode.value,
      await redirectCacheEntry(longUrl, passwordHash, expiresAt),
    );

    return Response.json(
      { success: true, shortCode: shortCode.value },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating link:", error);
    return jsonError("Failed to create link", 500);
  }
}

// Function to update an existing link
async function handleUpdate(request: Request, context: any, userId: string) {
  const formData = await request.formData();

  const rawShortCode = readTextField(formData, "shortCode").trim();
  const originalShortCode =
    readTextField(formData, "originalShortCode").trim() || rawShortCode;
  if (!originalShortCode || !rawShortCode) {
    return jsonError("Missing required fields", 400);
  }

  // Only a new code is validated, so legacy codes stay editable
  const renaming = rawShortCode !== originalShortCode;
  let shortCode = rawShortCode;
  if (renaming) {
    const validated = validateShortCodeInput(rawShortCode);
    if (!validated.ok) return jsonError(validated.error, 400);
    shortCode = validated.value;
  }

  const parsed = parseLinkForm(formData);
  if (!parsed.ok) return parsed.response;
  const { longUrl, expiresAt, password } = parsed.value;

  const targetError = await checkRedirectTarget(
    context,
    request,
    shortCode,
    longUrl,
  );
  if (targetError) return targetError;

  try {
    // Verify that the link belongs to the user
    const link = await findOwnedById(
      context.cloudflare.env.DB,
      originalShortCode,
      userId,
    );

    if (!link) {
      return jsonError("Link not found or you don't have permission", 404);
    }

    if (renaming) {
      // Avoid duplicate short codes
      const exists = await shortCodeTaken(context, shortCode);
      if (exists.taken) {
        return jsonError(
          "Short code is already in use, please choose another one.",
          409,
        );
      }
    }

    const { passwordHash, passwordEnc } = await protectPassword(
      context,
      password,
    );
    const now = new Date().toISOString();

    if (renaming) {
      await renameLink(context.cloudflare.env.DB, {
        newId: shortCode,
        longUrl,
        password: passwordHash,
        passwordEnc,
        updatedAt: now,
        expiresAt,
        currentId: originalShortCode,
        userId,
      });

      await deleteRedirectEntry(
        context.cloudflare.env.URL_STORE,
        originalShortCode,
      );
    } else {
      await updateLinkById(context.cloudflare.env.DB, {
        longUrl,
        password: passwordHash,
        passwordEnc,
        updatedAt: now,
        expiresAt,
        id: shortCode,
        userId,
      });
    }

    await putRedirectEntry(
      context.cloudflare.env.URL_STORE,
      shortCode,
      await redirectCacheEntry(longUrl, passwordHash, expiresAt),
    );

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating link:", error);
    return jsonError("Failed to update link", 500);
  }
}

// Function to delete a link
async function handleDelete(request: Request, context: any, userId: string) {
  const url = new URL(request.url);
  const shortCode = url.searchParams.get("shortCode");

  if (!shortCode) {
    return jsonError("Missing shortCode parameter", 400);
  }

  try {
    // Verify that the link belongs to the user
    const link = await findOwnedById(
      context.cloudflare.env.DB,
      shortCode,
      userId,
    );

    if (!link) {
      return jsonError("Link not found or you don't have permission", 404);
    }

    // Delete from database
    await deleteLinkById(context.cloudflare.env.DB, shortCode);

    // Delete from KV
    await deleteRedirectEntry(context.cloudflare.env.URL_STORE, shortCode);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting link:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to delete link" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
