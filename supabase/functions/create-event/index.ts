// MUSTER create-event Edge Function (Phase 14 anti-spam hardening).
//
// The one path for posting a NEW event (the client's api/events.ts calls
// this instead of inserting into `events` directly). Does three things
// before the actual insert:
//   1. Verifies the Cloudflare Turnstile token server-side — skipped, with
//      a console warning, when TURNSTILE_SECRET_KEY isn't set (so local
//      dev without a Cloudflare account configured yet still works; see
//      SETUP.md for the director's setup steps). The client's own
//      Turnstile widget degrades the same way when VITE_TURNSTILE_SITE_KEY
//      is unset, so the two stay in sync.
//   2. Captures the caller's IP (x-forwarded-for) to store on the row.
//   3. Inserts using the CALLER's own JWT (forwarded, not the service role
//      key) — so `created_by` defaults to auth.uid() and the existing
//      "authenticated users can post an event as themselves" RLS policy
//      still applies unchanged. This function adds a gate in front of that
//      policy, it doesn't replace it.
//
// Rate limiting (uid + IP) and content-length/URL validation are NOT
// re-implemented here as a separate pre-check — they're enforced
// unconditionally at the DB layer (see the anti_spam_hardening migration's
// events_rate_limit trigger and events_* check constraints), which fires
// on this insert exactly the same as it would on a direct PostgREST call.
// This function's job is just to surface those errors with a clean
// message instead of a raw Postgres one — see mapInsertError below.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface CreateEventBody {
  title: string;
  category: string;
  organizer: string;
  location: string | null;
  street: string | null;
  city: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  durationLabel: string;
  durationMinutes: number | null;
  cost: string;
  capacity: number | null;
  notes: string;
  website: string | null;
  photoUrl: string | null;
  turnstileToken: string | null;
}

async function verifyTurnstile(
  token: string | null,
  secret: string,
  remoteIp: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) {
    return { ok: false, error: "Verification required — please try again." };
  }
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const result = await res.json();
    if (!result.success) {
      return { ok: false, error: "Verification failed — please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Verification service unavailable — please try again." };
  }
}

/** Postgres error codes -> a clean client-facing message + HTTP status. Falls through to a generic 500 for anything unrecognized. */
function mapInsertError(error: { code?: string; message: string }): {
  status: number;
  message: string;
} {
  if (error.code === "23514") {
    // check_violation — one of the events_* content constraints.
    return {
      status: 400,
      message: "Check your event details (title/notes length, website format) and try again.",
    };
  }
  if (error.code === "P0001") {
    // raise_exception from the rate-limit trigger — message is already
    // user-facing text we wrote ourselves in the migration.
    return { status: 429, message: error.message };
  }
  return { status: 500, message: "Couldn't post your event — try again." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  let body: CreateEventBody;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  if (!body.title?.trim() || !body.category || !body.city?.trim() || !body.state?.trim()) {
    return json({ ok: false, error: "Missing required fields." }, 400);
  }

  const remoteIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (turnstileSecret) {
    const verified = await verifyTurnstile(body.turnstileToken, turnstileSecret, remoteIp);
    if (!verified.ok) {
      return json({ ok: false, error: verified.error }, 403);
    }
  } else {
    console.warn(
      "TURNSTILE_SECRET_KEY not set — skipping verification (expected in local dev only; see SETUP.md).",
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: body.title,
      category: body.category,
      organizer: body.organizer,
      location: body.location,
      street: body.street,
      city: body.city,
      state: body.state,
      zip: body.zip,
      latitude: body.latitude,
      longitude: body.longitude,
      date: body.date,
      time: body.time,
      duration_label: body.durationLabel,
      duration_minutes: body.durationMinutes,
      cost: body.cost,
      capacity: body.capacity,
      notes: body.notes,
      website: body.website,
      photo_url: body.photoUrl,
      ip_address: remoteIp,
    })
    .select()
    .single();

  if (error) {
    const mapped = mapInsertError(error);
    return json({ ok: false, error: mapped.message }, mapped.status);
  }

  return json({ ok: true, event: data });
});
