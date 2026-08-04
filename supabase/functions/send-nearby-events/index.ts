// MUSTER — new-events-nearby digest emails (Phase 13).
//
// Invoked hourly by pg_cron (see the notifications migration). Looks back
// 2 hours for newly-created, geocoded events (a 1hr buffer over the hourly
// cadence so a slow/delayed run never misses one — notifications_sent's
// unique constraint makes the resulting overlap harmless, see below),
// matches them against each opted-in user's home location via the same
// haversine formula as src/lib/distance.ts and the migration's
// haversine_miles SQL function, and sends ONE digest email per user
// listing every new nearby event found this run (never more than one email
// per user per invocation — the digest itself is the anti-flood cap; full
// anti-spam hardening is a later phase).
//
// De-dupe: same claim-before-send pattern as send-event-reminders — a
// (user, event) pair is only emailed once, ever, regardless of how many
// hourly windows it appears in.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { renderNearbyEmail, sendEmail, type EmailEventRow } from "../_shared/email.ts";

const LOOKBACK_HOURS = 2;
const RADIUS_MI = 50;
const EARTH_RADIUS_MI = 3958.8;

/** Mirrors src/lib/distance.ts's haversineMi exactly (same Earth radius) — kept in sync deliberately, not imported, since this runs in Deno and that file is bundled for the browser. */
function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MI * c;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - LOOKBACK_HOURS * 3_600_000).toISOString();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, date, time, city, state, latitude, longitude")
    .gte("created_at", since)
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  if (eventsError) {
    return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 });
  }
  if (!events || events.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no new geocoded events in the lookback window" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, contact, home_lat, home_lng")
    .eq("new_events_nearby", true)
    .not("contact", "is", null)
    .not("home_lat", "is", null)
    .not("home_lng", "is", null);
  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
  }
  if (!profiles || profiles.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no opted-in recipients with a home location" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const eventById = new Map(events.map((e) => [e.id, e as EmailEventRow & { latitude: number; longitude: number }]));

  const candidates: { user_id: string; event_id: string; kind: string }[] = [];
  for (const profile of profiles) {
    for (const event of events) {
      const distance = haversineMi(
        profile.home_lat as number,
        profile.home_lng as number,
        event.latitude as number,
        event.longitude as number,
      );
      if (distance <= RADIUS_MI) {
        candidates.push({ user_id: profile.id, event_id: event.id, kind: "nearby" });
      }
    }
  }

  if (candidates.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no events within radius of any opted-in user" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: newlyClaimed, error: claimError } = await supabase
    .from("notifications_sent")
    .upsert(candidates, { onConflict: "user_id,event_id,kind", ignoreDuplicates: true })
    .select("user_id, event_id");
  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
  }

  const contactById = new Map(profiles.map((p) => [p.id, p.contact as string]));
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
    const { subject, html } = renderNearbyEmail({ events: userEvents });
    const result = await sendEmail({ to, subject, html, resendApiKey });
    if (result.ok) sent += 1;
    else failures.push(`${userId}: ${result.error}`);
  }

  return new Response(
    JSON.stringify({ candidateEvents: events.length, recipients: eventsByUser.size, sent, failures }),
    { headers: { "Content-Type": "application/json" } },
  );
});
