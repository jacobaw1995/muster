import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

export type OAuthProvider = "google" | "apple";

/**
 * Requests a one-time code for the given contact (email or phone).
 *
 * If the current session is anonymous, this uses the documented
 * "convert an anonymous user to a permanent one" flow (`updateUser`) so
 * verifying the code later preserves the same auth.uid() — existing
 * RSVPs/itinerary/impact carry over with no migration. If the session is
 * already permanent (or there's no session), this falls back to a normal
 * `signInWithOtp`.
 */
export async function requestOtp(
  contact: string,
  isAnonymous: boolean,
): Promise<void> {
  const isEmail = contact.includes("@");
  if (isAnonymous) {
    const { error } = isEmail
      ? await supabase.auth.updateUser({ email: contact })
      : await supabase.auth.updateUser({ phone: contact });
    if (error) throw error;
    return;
  }

  const { error } = isEmail
    ? await supabase.auth.signInWithOtp({ email: contact })
    : await supabase.auth.signInWithOtp({ phone: contact });
  if (error) throw error;
}

/** Verifies the code requested via `requestOtp`, using the matching OTP type for anonymous-upgrade vs fresh sign-in. */
export async function verifyOtp(
  contact: string,
  token: string,
  isAnonymous: boolean,
): Promise<Session | null> {
  const isEmail = contact.includes("@");

  const { data, error } = isEmail
    ? await supabase.auth.verifyOtp({
        email: contact,
        token,
        type: isAnonymous ? "email_change" : "email",
      })
    : await supabase.auth.verifyOtp({
        phone: contact,
        token,
        type: isAnonymous ? "phone_change" : "sms",
      });
  if (error) throw error;
  return data.session;
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
