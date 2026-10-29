import * as React from "react";

// The request's CSP nonce, provided by entry.server around the app. Only
// the server render needs it; in the browser it's undefined, and the
// attribute is ignored on hydration (browsers hide nonces from the DOM).
export const NonceContext = React.createContext<string | undefined>(undefined);

export function useNonce(): string | undefined {
  return React.useContext(NonceContext);
}
