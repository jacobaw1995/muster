import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill in your project's values.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Required for magic-link/email-change redirects to sign the user in
    // automatically once the browser lands back here with tokens in the URL.
    detectSessionInUrl: true,
  },
});

/**
 * Detects whether this page load's URL still carries auth-redirect params —
 * magic-link/email-change tokens in the HASH (`#access_token=...`), or an
 * OAuth PKCE `?code=...` (Google/Apple, the client's default flow type) in
 * the QUERY STRING, or an `error`/`error_description` in either location
 * (a denied/failed OAuth consent, an expired magic link, etc.). A hash-only
 * check misses every OAuth return, since PKCE never touches the hash — that
 * gap is what let SessionContext's bootstrap call `signInAnonymously()`
 * while a completed Google sign-in was still being exchanged, clobbering it
 * with a fresh anonymous user. Captured synchronously at import time —
 * before `createClient`'s own async URL-detection can consume and strip
 * either the hash or the query string — so it's a reliable "did we just
 * land here via an auth redirect" signal regardless of when
 * SessionContext's effects get around to subscribing.
 */
function readAuthRedirectSignal(): {
  pending: boolean;
  error: string | null;
} {
  if (typeof window === "undefined") return { pending: false, error: null };

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);

  const errorDescription =
    hash.get("error_description") ?? search.get("error_description");
  const errorCode = hash.get("error") ?? search.get("error");
  if (errorCode) {
    return { pending: true, error: errorDescription ?? errorCode };
  }

  const pending = hash.has("access_token") || search.has("code");
  return { pending, error: null };
}

const authRedirectSignal = readAuthRedirectSignal();

/** True when this page load's URL carries an unprocessed auth-redirect signal — see readAuthRedirectSignal above. */
export const hadAuthRedirect = authRedirectSignal.pending;
/** The `error`/`error_description` from a failed OAuth or magic-link redirect, if any — null on a normal load or a successful one. */
export const authRedirectError = authRedirectSignal.error;

// The SDK's own detectSessionInUrl strips a SUCCESSFUL hash/`?code=` return
// from the URL once it's done exchanging it, but it never touches the URL
// on a FAILED one — auth-js throws before it gets to that step (see
// `_getSessionFromURL` in @supabase/auth-js). Without this, refreshing the
// page after a denied/failed OAuth consent would re-show the same stale
// error forever. Only clears error params — a real `code`/`access_token`
// return is left alone so the SDK can still process it.
if (authRedirectError && typeof window !== "undefined") {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  url.searchParams.delete("error_code");
  window.history.replaceState(window.history.state, "", url.toString());
}
