# MUSTER — Phase 1b: Create Event wizard (mock data)

Phase 0 (shell/tokens/nav) and Phase 1a (Map + Event Detail on mock data, shared BottomSheet/Toast/Session/PhotoSlot) are complete and approved. This is **Phase 1b**. Build the **Create Event 4-step wizard** (`/create`), pixel-accurate against the spec, wired to the existing in-memory session state so a posted event shows up on the Map. No backend/auth. Reuse Phase 0/1a tokens, components (PhotoSlot, Toast, Switch), and the `Event` type — do not restyle or fork them.

## Reference

- Spec: `design_handoff_muster_events_app/README.md` — read **Screen 3 (Create Event, 4-step wizard)** in full, plus the disabled-button and footer notes.
- Visual truth: `design_handoff_muster_events_app/Muster - Operator Standard Events.dc.html`. Spec only — never copy its runtime.
- Token-only styling; zero hardcoded hex. Reuse the `Event` type from `src/lib/mockEvents.ts` (extend it only if needed, e.g. an `isMine`/attending flag).

## Wizard shell

- Header "POST AN EVENT" with a close (X) top-left that exits to Map and **resets the whole form**.
- "STEP N OF 4" label + a **4-segment progress bar**.
- Footer: back arrow (steps 2–4 only) + primary Continue/Post button. **Disabled state must be BOTH non-interactive AND visually dimmed (~45% opacity)** — not just disabled attribute. Footer must always render **above the bottom tab bar** (never covered).
- Wizard step state is local to the Create flow (not global); resets on close or after a successful post.

## Steps

**Step 1 — Category:** grid of 6 category chips (dot + label, same categories/colors as elsewhere) + a full-width dashed "+ ADD YOUR OWN CATEGORY" button that reveals a free-text input for a custom category name. Continue disabled until a category (built-in or custom) is chosen.

**Step 2 — Basics:** Title (text), Location (text), Date + Time (two inputs side by side), and a **Duration** picker — 6 buttons: 1 hour / 2 hours / 3 hours / 4 hours / 6 hours / All day (single-select, default "2 hours"). Continue disabled until Title AND Location are non-empty.

**Step 3 — Optional details:** Cost (text, placeholder "Free") and Capacity (text, placeholder "No limit") **side by side, equal width, and the combined row must align exactly to the same right edge as the full-width Notes textarea below** — set `box-sizing:border-box; width:100%` on both inputs; do NOT rely on flex-stretch alone. Then Notes (multi-line textarea). Then **Host Website** (optional text input, placeholder "https://…", labeled to clarify it's for events not run through Muster — e.g. ticket links) → populates the Event Detail host-website link. Then Photo (reuse the PhotoSlot upload component, optional). Nothing here is required — Continue always enabled.

**Step 4 — Review & post:** read-only summary card (category, title, date/time/duration, location) + an "Am I going?" toggle switch (reuse Switch, default ON) + final primary button reads **"POST EVENT"**. Submitting:

- Prepends the new event to the Map's list (via session state), computing sensible defaults (distanceMi small/0, goingCount = 1 if attending else 0, capacity from input or null, cost "FREE" if blank, website null if blank, photoUrl null).
- If "Am I going?" was ON, mark the user's RSVP for it as `yes` and add it to the itinerary (consistent with the RSVP→itinerary rule).
- Returns to Map and shows a toast "Event posted — live now".
- Resets the wizard.

## Constraints

- Mock/session only; posted events live in the in-memory store (fine if they don't survive reload).
- Token-only styling; nothing hardcoded. Reuse existing components — don't duplicate BottomSheet/Toast/Switch/PhotoSlot.
- Don't touch `design_handoff_muster_events_app/`.
- Keep `npm run build` and `npm run lint` clean.

## Definition of done

- All 4 steps render per spec; progress bar + step label correct; back/close behave (close resets form).
- Continue is correctly gated on steps 1 and 2 and is visibly dimmed (~45%) when disabled; footer never hidden behind the tab bar.
- Step 3 Cost/Capacity row aligns exactly to the Notes textarea's right edge.
- Posting adds the event to the top of the Map list, honors "Am I going?" (RSVP yes + itinerary add + nav badge increments), returns to Map, and toasts "Event posted — live now".
- Custom category flows through to the new event and renders with the neutral dot everywhere.
- Dark/light still correct; build + lint clean.

When done, summarize what you built, note deviations/TODOs, and confirm the definition-of-done checklist for review before Phase 1c (Impact + Itinerary).
