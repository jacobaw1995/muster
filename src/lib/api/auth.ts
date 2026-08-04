import { supabase } from "../supabase";

export type OAuthProvider = "google" | "apple";

/**
 * Sends a magic-link sign-in email. If the current session is anonymous,
 * this uses the "convert an anonymous user to a permanent one" flow
 * (`updateUser`) so clicking the link preserves the same auth.uid() —
 * existing RSVPs/itinerary/impact carry over with no migration. Otherwise
 * it's a normal `signInWithOtp`. Both redirect back to the current origin —
 * production in prod, localhost in dev — where the Supabase client's
 * `detectSessionInUrl` (see ../supabase.ts) picks the session up
 * automatically once the browser lands there.
 *
 * TODO(phone): SMS magic links are out of scope until a phone/SMS provider
 * is configured in the Supabase dashboard — email only for now.
 */
export async function requestMagicLink(
  email: string,
  isAnonymous: boolean,
): Promise<void> {
  const emailRedirectTo = window.location.origin;
  const { error } = isAnonymous
    ? await supabase.auth.updateUser({ email }, { emailRedirectTo })
    : await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
  if (error) throw error;
}

/**
 * Anonymous session → `linkIdentity` upgrades it to permanent in place
 * (same auth.uid()). Already-permanent session → plain OAuth sign-in.
 * Both redirect the browser away; nothing else runs synchronously after a
 * successful call except when the provider rejects immediately (e.g. not
 * enabled in the dashboard yet), which throws and never redirects.
 */
export async function linkOrSignInWithOAuth(
  provider: OAuthProvider,
  isAnonymous: boolean,
): Promise<void> {
  const options = { redirectTo: window.location.origin };
  const { error } = isAnonymous
    ? await supabase.auth.linkIdentity({ provider, options })
    : await supabase.auth.signInWithOAuth({ provider, options });
  if (error) throw error;
}

/**
 * True when a failed auth-redirect's error indicates the OAuth identity
 * (e.g. a Google account) already belongs to a DIFFERENT existing user —
 * the collision `linkIdentity()` hits when someone who originally signed
 * up via magic-link email later tries "Continue with Google" using that
 * same address. Matches primarily on GoTrue's own stable `error_code`
 * value for this ("identity_already_exists" — see the special-casing of
 * this exact code in @supabase/auth-js's own URL-based session detection,
 * GoTrueClient.js `_initialize()`, and its `linkIdentity()` JSDoc: "If the
 * candidate identity is already linked to the existing user or another
 * user, linkIdentity() will fail"). The description-based check is a
 * defensive fallback for any GoTrue response that omits the code,
 * deliberately narrow (requires "already" AND one of exist/registered/
 * linked) so it doesn't swallow unrelated failures.
 */
export function isIdentityCollisionError(
  errorCode: string | null,
  errorDescription: string | null,
): boolean {
  if (errorCode === "identity_already_exists") return true;
  if (!errorDescription) return false;
  const text = errorDescription.toLowerCase();
  return (
    text.includes("already") &&
    (text.includes("exist") ||
      text.includes("registered") ||
      text.includes("linked"))
  );
}

/**
 * True when an error thrown by an auth call means the LOCAL session's user
 * no longer exists server-side (e.g. an anonymous account cleaned up via
 * the Supabase dashboard/SQL — see SETUP.md's moderation workflow). The
 * JWT itself is still validly signed and unexpired, so nothing catches
 * this until an operation like linkIdentity actually tries to use it —
 * confirmed live: "AuthApiError: User from sub claim in JWT does not
 * exist" on a Google-link attempt from a browser holding a session for an
 * anonymous user that had since been deleted. Recovering means discarding
 * the stale session and starting a fresh one (see SessionContext.signOut),
 * not just showing a generic error — otherwise every retry fails the same
 * way forever.
 */
export function isStaleSessionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === "AuthApiError" &&
    /sub claim in jwt does not exist|user_not_found/i.test(err.message)
  );
}
