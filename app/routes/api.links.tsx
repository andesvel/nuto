import { messagesFor, resolveLocale, type ErrorCode } from "@/app/i18n";
import { type ActionFunctionArgs, type AppLoadContext } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { encryptPassword } from "@/utils/crypto";
import { isSelfReferential } from "@utils/is-self-referential";
import { createsCycle } from "@utils/cycle-detection";
import {
  existsById,
  getLongUrlById,
  findOwnedById,
  insertLink,
  renameLink,
  updateLinkById,
  deleteLinkById,
  getLinkUsageForUser,
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
    return jsonError(request, "crossOrigin", 403);
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

// D1 is the source of truth; KV catches a code whose cache entry is still
// alive after its row was removed.
async function shortCodeTaken(
  context: AppLoadContext,
  shortCode: string,
): Promise<boolean> {
  const [inDb, inKv] = await Promise.all([
    existsById(context.cloudflare.env.DB, shortCode),
    getRedirectEntry(context.cloudflare.env.URL_STORE, shortCode),
  ]);
  return inDb || inKv !== null;
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

function jsonError(request: Request, code: ErrorCode, status: number) {
  const error = messagesFor(resolveLocale(request)).errors[code];
  return Response.json({ success: false, error }, { status });
}

function linkLimitError(request: Request, limit: number | null) {
  const error = messagesFor(resolveLocale(request)).errors.linkLimit(limit);
  return Response.json({ success: false, error }, { status: 429 });
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
): { ok: true; value: LinkFormInput } | { ok: false; error: ErrorCode } {
  const rawLongUrl = readTextField(formData, "longUrl");
  if (!rawLongUrl.trim()) {
    return { ok: false, error: "missingFields" };
  }

  const longUrl = normalizeLongUrl(rawLongUrl);
  if (!longUrl.ok) return longUrl;

  const expiresAt = validateExpiresAt(readTextField(formData, "expiresAt"));
  if (!expiresAt.ok) return expiresAt;

  const password = validatePasswordInput(readTextField(formData, "password"));
  if (!password.ok) return password;

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
  context: AppLoadContext,
  request: Request,
  shortCode: string,
  longUrl: string,
): Promise<Response | null> {
  const host = request.headers.get("host");
  if (isSelfReferential(longUrl, shortCode, host)) {
    return jsonError(request, "selfReference", 400);
  }
  if (
    await createsCycle(shortCode, longUrl, host, (slug) =>
      getLongUrlById(context.cloudflare.env.DB, slug),
    )
  ) {
    return jsonError(request, "redirectLoop", 400);
  }
  return null;
}

async function protectPassword(context: AppLoadContext, password: string) {
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
async function handleCreate(request: Request, context: AppLoadContext, userId: string) {
  const formData = await request.formData();

  const rawShortCode = readTextField(formData, "shortCode");
  if (!rawShortCode.trim()) return jsonError(request, "missingFields", 400);
  const shortCode = validateShortCodeInput(rawShortCode);
  if (!shortCode.ok) return jsonError(request, shortCode.error, 400);

  const parsed = parseLinkForm(formData);
  if (!parsed.ok) return jsonError(request, parsed.error, 400);
  const { longUrl, expiresAt, password } = parsed.value;

  // Independent lookups run together; errors keep their priority order
  const [taken, targetError, { used, limit }] = await Promise.all([
    shortCodeTaken(context, shortCode.value),
    checkRedirectTarget(context, request, shortCode.value, longUrl),
    getLinkUsageForUser(context.cloudflare.env.DB, userId),
  ]);
  if (taken) {
    return jsonError(request, "shortCodeTaken", 409);
  }
  if (targetError) return targetError;
  if (limit !== null && used >= limit) return linkLimitError(request, limit);

  try {
    const { passwordHash, passwordEnc } = await protectPassword(
      context,
      password,
    );

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
    // The prevent_excess_urls trigger catches concurrent creates that both
    // passed the check above
    if (String(error).includes("url limit reached")) {
      return linkLimitError(request, limit);
    }
    console.error("Error creating link:", error);
    return jsonError(request, "createFailed", 500);
  }
}

// Function to update an existing link
async function handleUpdate(request: Request, context: AppLoadContext, userId: string) {
  const formData = await request.formData();

  const rawShortCode = readTextField(formData, "shortCode").trim();
  const originalShortCode =
    readTextField(formData, "originalShortCode").trim() || rawShortCode;
  if (!originalShortCode || !rawShortCode) {
    return jsonError(request, "missingFields", 400);
  }

  // Only a new code is validated, so legacy codes stay editable
  const renaming = rawShortCode !== originalShortCode;
  let shortCode = rawShortCode;
  if (renaming) {
    const validated = validateShortCodeInput(rawShortCode);
    if (!validated.ok) return jsonError(request, validated.error, 400);
    shortCode = validated.value;
  }

  const parsed = parseLinkForm(formData);
  if (!parsed.ok) return jsonError(request, parsed.error, 400);
  const { longUrl, expiresAt, password } = parsed.value;

  try {
    // Independent lookups run together; errors keep their priority order
    const [targetError, link, taken] = await Promise.all([
      checkRedirectTarget(context, request, shortCode, longUrl),
      findOwnedById(context.cloudflare.env.DB, originalShortCode, userId),
      renaming ? shortCodeTaken(context, shortCode) : false,
    ]);
    if (targetError) return targetError;

    if (!link) {
      return jsonError(request, "notFoundOrForbidden", 404);
    }

    if (taken) {
      return jsonError(request, "shortCodeTaken", 409);
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
    return jsonError(request, "updateFailed", 500);
  }
}

// Function to delete a link
async function handleDelete(request: Request, context: AppLoadContext, userId: string) {
  const url = new URL(request.url);
  const shortCode = url.searchParams.get("shortCode");

  if (!shortCode) {
    return jsonError(request, "missingShortCode", 400);
  }

  try {
    // Verify that the link belongs to the user
    const link = await findOwnedById(
      context.cloudflare.env.DB,
      shortCode,
      userId,
    );

    if (!link) {
      return jsonError(request, "notFoundOrForbidden", 404);
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
    return jsonError(request, "deleteFailed", 500);
  }
}
