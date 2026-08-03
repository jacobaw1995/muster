// MUSTER geocode Edge Function (Phase 7).
//
// Free geocoding via Nominatim (OpenStreetMap) — no API key, no billing.
// Called once per event at creation time (never per map render): checks
// geocode_cache first, and only calls out to Nominatim on a cache miss,
// per its usage policy (also requires a real identifying User-Agent, set
// below). The caller's own JWT (anon or a signed-in user's) is forwarded
// so the geocode_cache reads/writes go through normal RLS — no service
// role key needed for a table that's already public read/insert.
import { createClient } from "jsr:@supabase/supabase-js@2";

const NOMINATIM_USER_AGENT = "MUSTER/1.0 (https://eventmuster.com)";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AddressInput {
  street?: string;
  city: string;
  state: string;
  zip?: string;
}

function normalizeAddress(input: AddressInput): string {
  return [input.street, input.city, input.state, input.zip]
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim().toLowerCase())
    .join(", ");
}

function buildNominatimQuery(input: AddressInput): string {
  return [input.street, input.city, input.state, input.zip, "USA"]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  let input: AddressInput;
  try {
    input = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  if (!input.city?.trim() || !input.state?.trim()) {
    return json({ error: "city and state are required" }, 400);
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

  const normalizedAddress = normalizeAddress(input);

  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("lat, lng, display_name")
    .eq("normalized_address", normalizedAddress)
    .maybeSingle();

  if (cached) {
    return json(cached);
  }

  const query = buildNominatimQuery(input);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  let nominatimResults: unknown;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (!res.ok) {
      return json({ error: "geocoding service unavailable" }, 502);
    }
    nominatimResults = await res.json();
  } catch {
    return json({ error: "geocoding service unavailable" }, 502);
  }

  const first = Array.isArray(nominatimResults) ? nominatimResults[0] : null;
  if (!first || typeof first.lat !== "string" || typeof first.lon !== "string") {
    return json({ error: "no match found" }, 404);
  }

  const result = {
    lat: Number(first.lat),
    lng: Number(first.lon),
    display_name:
      typeof first.display_name === "string" ? first.display_name : null,
  };

  // Best-effort cache write — a race with another concurrent geocode of the
  // same new address would hit the unique constraint; ignoreDuplicates
  // means that's a silent no-op rather than a failed response, since the
  // result we already have is what matters to this caller.
  await supabase
    .from("geocode_cache")
    .upsert(
      { normalized_address: normalizedAddress, ...result },
      { onConflict: "normalized_address", ignoreDuplicates: true },
    );

  return json(result);
});
