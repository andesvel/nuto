import * as React from "react";

// Revealed passwords stay in memory for this page session only, so the
// card and the edit dialog don't fetch the same one twice.
const revealed = new Map<string, string>();

/** Forget a link's revealed password (after it was edited or renamed). */
export function forgetLinkPassword(shortCode: string): void {
  revealed.delete(shortCode);
}

/** Fetches a link's password from /api/links/password on demand. */
export function useLinkPassword(shortCode: string) {
  const [password, setPassword] = React.useState<string | null>(
    () => revealed.get(shortCode) ?? null,
  );
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(async (): Promise<string | null> => {
    const cached = revealed.get(shortCode);
    if (cached !== undefined) {
      setPassword(cached);
      return cached;
    }
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/links/password?shortCode=${encodeURIComponent(shortCode)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(String(response.status));
      const { password: value } = (await response.json()) as { password: string };
      revealed.set(shortCode, value);
      setPassword(value);
      return value;
    } catch {
      setFailed(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [shortCode]);

  return { password, loading, failed, load };
}
