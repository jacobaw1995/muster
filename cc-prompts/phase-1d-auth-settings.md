# MUSTER — Phase 1d: Sign In / Sign Up / Settings (mock auth)

Phases 0, 1a, 1b, 1c are complete and approved. This is **Phase 1d** — the final Phase 1 sub-phase. Build **Screen 6 (Sign In)**, **Screen 7 (Create Account)**, and **Screen 8 (Settings)**, pixel-accurate against the spec, wired to a MOCK auth state in the session store. **No real OAuth or backend** — that's Phase 3. Reuse Phase 0–1c tokens, components (PhotoSlot, Switch, Toast, ModalShell), and existing session state — do not restyle or fork.

## Reference

- Spec: `design_handoff_muster_events_app/README.md` — read **Screen 6 (Sign In)**, **Screen 7 (Create Account)**, **Screen 8 (Settings)** in full, plus the "Account entry point" note under Navigation.
- Visual truth: `design_handoff_muster_events_app/Muster - Operator Standard Events.dc.html`. Spec only — never copy its runtime.
- Token-only styling; zero hardcoded hex. These three screens use the existing modal shell (close-X, no bottom nav), consistent with the Phase 0 auth/settings routing.

## Mock auth state (session store)

- Add `auth: { signedIn: boolean; name: string | null; contact: string | null }` (contact = email or phone), default signed-out/guest.
- `signIn({ name?, contact })` — sets signedIn true (name defaults to something derivable if not provided at sign-in).
- `signUp({ name, contact })` — sets signedIn true with the given name/contact.
- `signOut()` — returns to guest state.
- Notification prefs: `eventReminders` (default on) and `newEventsNearby` (default on), with setters — held in session so they persist across navigation.
- Mock only; in-memory is fine (no persistence required this phase).

## Status-bar account button (update existing)

- Guest: generic person icon → opens **Sign In**.
- Signed-in: the user's **initials** (derived from `auth.name`) → opens **Settings**.
- This remains the only entry point to auth/settings — no new nav tab.

## Screen 6 — Sign In (`/sign-in`)

- Close (X) top-left → Map.
- "SIGN IN" header (Anton) + subtitle: "Sync your RSVPs, itinerary, and calendar across devices. You can keep browsing without an account."
- "Continue with Google" and "Continue with Apple" buttons — full-width, icon + label. In this phase they call `signIn` with a placeholder identity and return to Map with a toast (wire real OAuth in Phase 3 — leave a clear TODO).
- An "OR" divider.
- "Email or phone" text input + "CONTINUE" button (single field, no password step — treat as the entry to a passwordless/OTP flow later). CONTINUE calls `signIn({ contact })` → Map + toast.
- "New here? Create an account" link → Sign Up.
- A plain-text underlined "Continue browsing as guest" link → Map (no auth).

## Screen 7 — Create Account (`/sign-up`)

- Close (X) → Map.
- "CREATE ACCOUNT" header + subtitle reiterating guest browsing already works.
- Name (text input), Email or phone (text input).
- "CREATE ACCOUNT" button — **disabled + dimmed (~45% opacity) until BOTH fields are filled** (same pattern as the Create wizard).
- "Already have an account? Sign in" link → Sign In.
- Submitting calls `signUp`, signs the user in immediately (no separate verification step), returns to Map with an "Account created" toast.

## Screen 8 — Settings (`/settings`)

- Close (X) + "SETTINGS" header centered (back/close left, symmetric spacer right) → Map.
- **Profile row:** circular avatar slot (reuse PhotoSlot for the uploadable avatar) + name + email/phone, in a bordered card. Populate from `auth`.
- **NOTIFICATIONS section:** two toggle rows (reuse Switch) — "Event reminders" (upcoming RSVP'd events) and "New events near me" — both bound to the session prefs (default on).
- **APPEARANCE section:** a Dark/Light segmented control bound to the SAME global theme state as the status-bar sun/moon toggle (this is just a second entry point — not a separate setting).
- **ACCOUNT section:** "Connect Google Calendar" button (this phase: just fires a confirmation toast; wire real OAuth in Phase 3 — leave a TODO) and a "LOG OUT" button → `signOut`, returns to guest state and Map.
- If Settings is somehow reached while signed out, redirect to Sign In (or Map) — don't render an empty profile.

## Constraints

- Mock auth only; no real OAuth/backend. Leave clear TODOs where Phase 3 wires the real thing.
- Token-only styling; nothing hardcoded. Reuse existing components — don't duplicate Switch/PhotoSlot/Toast/ModalShell.
- Don't touch `design_handoff_muster_events_app/`.
- Keep `npm run build` and `npm run lint` clean.

## Definition of done

- Sign In renders all elements; Google/Apple/email-continue and "guest" all route correctly (auth actions sign in + toast + return to Map).
- Sign Up gates the button (dimmed until both fields filled), signs in on submit, toasts "Account created", returns to Map.
- Status-bar account button flips: guest person icon → Sign In; signed-in initials → Settings.
- Settings shows the profile from auth, notification toggles work, the Appearance control is truly the same global theme state (changing it moves the status-bar toggle and vice versa), Connect Google Calendar toasts, and LOG OUT returns to guest + Map (and the account button reverts to the person icon).
- Dark/light both correct across all three screens; build + lint clean.

When done, summarize what you built, note deviations/TODOs, and confirm the definition-of-done checklist. This completes Phase 1 — after review we move to Phase 2 (Supabase backend).
