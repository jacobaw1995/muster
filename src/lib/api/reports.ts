import { supabase } from "../supabase";

export type ReportReason = "spam" | "inappropriate" | "duplicate" | "other";

/** Thrown when the caller has already reported this event — `reports` has a unique (event_id, reporter_id) constraint (Phase 14). Callers should catch this and show a distinct "already reported" message rather than a generic error. */
export class AlreadyReportedError extends Error {
  constructor() {
    super("You've already reported this event");
    this.name = "AlreadyReportedError";
  }
}

/** `reporter_id` defaults to auth.uid() (see the anti_spam_hardening migration) — not passed here. Auto-hides the event once it accumulates enough distinct reports (server-side trigger); no admin UI this phase, see SETUP.md for the DB review workflow. */
export async function reportEvent(
  eventId: string,
  reason: ReportReason,
): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .insert({ event_id: eventId, reason });
  if (error) {
    if (error.code === "23505") throw new AlreadyReportedError();
    throw error;
  }
}
