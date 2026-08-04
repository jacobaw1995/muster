// MUSTER — event reminder emails (Phase 13).
//
// Invoked by pg_cron twice daily (see the notifications migration):
// evening (~6pm Mountain) reminds about TOMORROW's yes-RSVPd events,
// morning (~8am Mountain) reminds about TODAY's. Deployed with
// verify_jwt=false — this is a server-to-server call from pg_cron, not an
// end-user request; it uses the service-role key internally (auto-injected
// by Supabase into every Edge Function's environment) to bypass RLS and
// read across all users' rsvps/profiles.
//
// De-dupe: candidate (user, event) pairs are claimed in notifications_sent
// via an upsert-with-ignoreDuplicates BEFORE sending — only pairs that
// weren't already claimed (i.e. genuinely new) get emailed. This means a
// re-run (retry, overlapping schedule) can never double-send, at the cost
// of the rare case where the DB claim succeeds but the Resend call then
// fails — an accepted tradeoff for a notification feature (never spam >
// occasionally miss one).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { renderReminderEmail, sendEmail, type EmailEventRow } from "../_shared/email.ts";

// Matches the seed region — see the migration's own comment on the DST
// caveat (pg_cron's fixed UTC schedule drifts ~1hr during Standard Time).
const APP_TZ = "America/Denver";

/** The wall-clock date in `tz`, `offsetDays` from now, as "YYYY-MM-DD" (en-CA formats exactly that way) — matches the `events.date` column's format. */
function localDateInTz(tz: string, offsetDays: number): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

Deno.serve(async (req) => {
  let body: { kind?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const kind: "evening" | "morning" = body.kind === "morning" ? "morning" : "evening";
  const targetDate = localDateInTz(APP_TZ, kind === "evening" ? 1 : 0);
  const ledgerKind = kind === "evening" ? "reminder_evening" : "reminder_morning";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, date, time, city, state")
    .eq("date", targetDate);
  if (eventsError) {
    return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 });
  }
  if (!events || events.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: `no events on ${targetDate}` }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
  const eventById = new Map(events.map((e) => [e.id, e as EmailEventRow]));
  const eventIds = events.map((e) => e.id);

  const { data: rsvps, error: rsvpError } = await supabase
    .from("rsvps")
    .select("event_id, attendee_id")
    .eq("status", "yes")
    .in("event_id", eventIds);
  if (rsvpError) {
    return new Response(JSON.stringify({ error: rsvpError.message }), { status: 500 });
  }
  if (!rsvps || rsvps.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no yes-RSVPs for target date" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // profiles.contact holds the permanent user's email (set at sign-up/OAuth
  // — see upsertProfile's callers in SessionContext). Anonymous users never
  // get a profiles row in the current app, so `contact is not null` is a
  // sufficient "permanent user with a real address" filter without needing
  // the Auth Admin API.
  const attendeeIds = [...new Set(rsvps.map((r) => r.attendee_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, contact")
    .in("id", attendeeIds)
    .eq("event_reminders", true)
    .not("contact", "is", null);
  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
  }
  const contactById = new Map((profiles ?? []).map((p) => [p.id, p.contact as string]));
  if (contactById.size === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no opted-in recipients" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const candidates = rsvps
    .filter((r) => contactById.has(r.attendee_id))
    .map((r) => ({ user_id: r.attendee_id, event_id: r.event_id, kind: ledgerKind }));

  const { data: newlyClaimed, error: claimError } = await supabase
    .from("notifications_sent")
    .upsert(candidates, { onConflict: "user_id,event_id,kind", ignoreDuplicates: true })
    .select("user_id, event_id");
  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
  }

  const eventsByUser = new Map<string, EmailEventRow[]>();
  for (const row of newlyClaimed ?? []) {
    const event = eventById.get(row.event_id as string);
    if (!event) continue;
    const list = eventsByUser.get(row.user_id as string) ?? [];
    list.push(event);
    eventsByUser.set(row.user_id as string, list);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  let sent = 0;
  const failures: string[] = [];
  for (const [userId, userEvents] of eventsByUser) {
    const to = contactById.get(userId);
    if (!to) continue;
    if (!resendApiKey) {
      failures.push(`${userId}: RESEND_API_KEY not set`);
      continue;
    }
    const { subject, html } = renderReminderEmail({ kind, events: userEvents });
    const result = await sendEmail({ to, subject, html, resendApiKey });
    if (result.ok) sent += 1;
    else failures.push(`${userId}: ${result.error}`);
  }

  return new Response(
    JSON.stringify({ kind, targetDate, recipients: eventsByUser.size, sent, failures }),
    { headers: { "Content-Type": "application/json" } },
  );
});
