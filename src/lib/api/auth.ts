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
 *
 * Dormant since the Auth overhaul (email + password is now primary) —
 * Google is hidden behind GOOGLE_SIGNIN_ENABLED in featureFlags.ts, but
 * this function and the OAuth-collision handling around it are kept
 * intact and reversible, not deleted.
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
 * Password-based account creation — now the primary Sign Up path. An
 * anonymous session upgrades in place via `updateUser({email, password})`,
 * same auth.uid(), so the guest's RSVPs/itinerary/impact carry over with
 * no migration — same precedent as the magic-link and OAuth upgrade
 * paths. An already-permanent session (rare in practice: every visitor
 * gets an anonymous session on first load, see SessionContext bootstrap)
 * falls back to a plain `signUp`. With Supabase's "Confirm email" setting
 * OFF (see SETUP.md's director steps), both paths sign the user in
 * immediately — no email round trip required, unlike the magic-link
 * fallback.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  isAnonymous: boolean,
): Promise<void> {
  const { error } = isAnonymous
    ? await supabase.auth.updateUser({ email, password })
    : await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

/**
 * Signs into an existing password account. Deliberately does NOT try to
 * merge the current anonymous guest session's data into the target
 * account — same reasoning that used to apply to the (now-retired) OAuth
 * collision fallback: someone with real credentials wants THAT account,
 * not their browser's throwaway guest session.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}

/**
 * Sends a "reset your password" email. Still depends on email delivery
 * (see requestMagicLink above) — an accepted exception for a rare,
 * one-off flow, unlike day-to-day sign-in which no longer needs an inbox
 * at all now that password is primary.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

/**
 * True when a signUp/updateUser(password) error means the email already
 * belongs to an account — GoTrue's stable `user_already_exists` (plain
 * signUp) or `email_exists` (updateUser on an anonymous session) codes,
 * with a description-based fallback for older/unversioned responses that
 * omit the code, matching the same defensive pattern as
 * isIdentityCollisionError below.
 */
export function isEmailAlreadyRegisteredError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: string }).code;
  if (code === "user_already_exists" || code === "email_exists") return true;
  return /already registered|already exists|already in use/i.test(
    err.message,
  );
}

/**
 * True when a signInWithPassword error is simply wrong email/password (as
 * opposed to a network/server error) — GoTrue's stable
 * `invalid_credentials` code, with a description-based fallback.
 */
export function isInvalidCredentialsError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: string }).code;
  if (code === "invalid_credentials") return true;
  return /invalid login credentials|invalid credentials/i.test(err.message);
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
