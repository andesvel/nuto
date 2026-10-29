import { validateShortCode } from "./validate-short-code";
import type { ErrorCode } from "@/app/i18n/messages/en";

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

// Errors are message keys; the API translates them for the request's locale
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ErrorCode };

export function validateShortCodeInput(raw: string): ValidationResult<string> {
  const shortCode = raw.trim();
  if (!shortCode) return { ok: false, error: "missingFields" };
  if (shortCode.length > MAX_SHORT_CODE_LENGTH) {
    return { ok: false, error: "shortCodeTooLong" };
  }
  const { isValid, hasValidChars, isReserved } = validateShortCode(shortCode);
  if (!isValid) {
    return {
      ok: false,
      error: !hasValidChars
        ? "shortCodeInvalid"
        : isReserved
          ? "shortCodeReserved"
          : "shortCodeInvalid",
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
  if (!trimmed) return { ok: false, error: "missingFields" };
  if (trimmed.length > MAX_LONG_URL_LENGTH) {
    return { ok: false, error: "urlTooLong" };
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `http://${trimmed}`);
  } catch {
    return { ok: false, error: "urlInvalid" };
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol) || !url.hostname) {
    return { ok: false, error: "urlProtocol" };
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
    return { ok: false, error: "expiryInvalid" };
  }
  if (time < now + MIN_EXPIRATION_LEAD_MS) {
    return { ok: false, error: "expiryTooSoon" };
  }
  return { ok: true, value: new Date(time).toISOString() };
}

export function validatePasswordInput(raw: string): ValidationResult<string> {
  if (raw.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: "passwordTooLong" };
  }
  return { ok: true, value: raw };
}
