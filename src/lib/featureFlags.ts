// TODO(Apple): flip once an Apple Developer account is set up and Sign in
// with Apple is configured in the Supabase dashboard — the button gated by
// this flag on SignInScreen/SignUpScreen is hidden, not removed, so
// re-enabling is a one-line change shared by both screens.
export const APPLE_SIGNIN_ENABLED = false;

// Retired as part of the Auth overhaul (email + password is now primary,
// magic-link is the backup) — Google sign-in was unreliable for existing
// magic-link users (see the same-email collision notice in
// SessionContext/SignInScreen) and added an extra dependency for no real
// benefit now that password sign-in doesn't need email delivery at all.
// The underlying OAuth + collision-handling code in lib/api/auth.ts and
// SessionContext is kept intact, not deleted, so this can be flipped back
// on if Google sign-in is ever revisited.
export const GOOGLE_SIGNIN_ENABLED = false;
