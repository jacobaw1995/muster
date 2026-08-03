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
