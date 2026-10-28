import { validateShortCode } from "./validate-short-code";

export const MAX_SHORT_CODE_LENGTH = 64;
export const MAX_LONG_URL_LENGTH = 2048;
export const MAX_PASSWORD_LENGTH = 128;
// KV can't hold entries that expire sooner than this
export const MIN_EXPIRATION_LEAD_MS = 60_000;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Reads a text field; File values and missing fields become "". */
export function readTextField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateShortCodeInput(raw: string): ValidationResult<string> {
  const shortCode = raw.trim();
  if (!shortCode) return { ok: false, error: "Missing required fields" };
  if (shortCode.length > MAX_SHORT_CODE_LENGTH) {
    return {
      ok: false,
      error: `Short code must be at most ${MAX_SHORT_CODE_LENGTH} characters.`,
    };
  }
  const { isValid, hasValidChars, isReserved } = validateShortCode(shortCode);
  if (!isValid) {
    return {
      ok: false,
      error: !hasValidChars
        ? "Short code has invalid characters."
        : isReserved
          ? "This short code is reserved. Please choose another one."
          : "Invalid short code.",
    };
  }
  return { ok: true, value: shortCode };
}

/**
 * Normalizes a destination URL (adds http:// when no scheme is given) and
 * only accepts http(s) targets with a host.
 */
export function normalizeLongUrl(raw: string): ValidationResult<string> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Missing required fields" };
  if (trimmed.length > MAX_LONG_URL_LENGTH) {
    return {
      ok: false,
      error: `URL must be at most ${MAX_LONG_URL_LENGTH} characters.`,
    };
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `http://${trimmed}`);
  } catch {
    return { ok: false, error: "Invalid long URL provided." };
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol) || !url.hostname) {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  return { ok: true, value: url.toString() };
}

export function validateExpiresAt(
  raw: string,
  now: number = Date.now(),
): ValidationResult<string | null> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const time = new Date(trimmed).getTime();
  if (Number.isNaN(time)) {
    return { ok: false, error: "Invalid expiration date format provided." };
  }
  if (time < now + MIN_EXPIRATION_LEAD_MS) {
    return {
      ok: false,
      error: "Expiration date must be at least one minute in the future.",
    };
  }
  return { ok: true, value: new Date(time).toISOString() };
}

export function validatePasswordInput(raw: string): ValidationResult<string> {
  if (raw.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }
  return { ok: true, value: raw };
}
