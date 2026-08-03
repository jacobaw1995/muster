// MUSTER — server-side Open Graph meta injection for /events/:id (Phase 8).
//
// Crawlers (iMessage, Slack, social) don't run JS, so a client-rendered SPA
// serves them nothing useful. This function is rewritten to from
// /events/:id (see vercel.json) and returns the SAME built index.html real
// users get — just with the <!-- OG:START -->...<!-- OG:END --> block
// swapped for event-specific tags. Real users still get the full app: the
// script/asset tags are untouched, so it boots and hydrates identically.
//
// Needs SUPABASE_URL and SUPABASE_ANON_KEY as plain (non-VITE_) Vercel
// Environment Variables — the client's VITE_ vars are build-time-only and
// aren't readable here. Anon key only; this reads public event data that's
// already publicly readable by RLS (see the auth_rls migration).

const DEFAULT_DESCRIPTION =
  "Discover, create, and RSVP to local rucks, cleanups, training & more.";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(str, max) {
  const trimmed = str.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function fmtDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Fetches one event by id via Supabase's REST API (anon key, no client library needed). Returns null on any failure or not-found — callers fall back to the default card, never a hard error. */
async function fetchEvent(id, supabaseUrl, supabaseAnonKey) {
  const url = `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(id)}&select=title,photo_url,city,state,date,notes`;
  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

function buildMeta(event, origin, canonicalUrl) {
  const defaultMeta = {
    title: "Muster — Operator Standard Events",
    description: DEFAULT_DESCRIPTION,
    image: `${origin}/og-default.png`,
    url: `${origin}/`,
  };
  if (!event) return defaultMeta;

  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const description =
    truncate(
      [fmtDateLabel(event.date), cityState, event.notes]
        .filter(Boolean)
        .join(" · "),
      200,
    ) || DEFAULT_DESCRIPTION;

  return {
    title: `${event.title} — Muster`,
    description,
    // photo_url is already an absolute Supabase Storage URL.
    image: event.photo_url || defaultMeta.image,
    url: canonicalUrl,
  };
}

function injectMeta(html, meta) {
  const safeTitle = escapeHtml(meta.title);
  const safeDescription = escapeHtml(meta.description);
  const safeImage = escapeHtml(meta.image);
  const safeUrl = escapeHtml(meta.url);

  const ogBlock = `<!-- OG:START -->
    <meta property="og:site_name" content="Muster" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    <!-- OG:END -->`;

  return html
    .replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${safeDescription}" />`,
    )
    .replace(/<!-- OG:START -->[\s\S]*?<!-- OG:END -->/, ogBlock);
}

export default async function handler(req, res) {
  const id = typeof req.query.id === "string" ? req.query.id : "";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;

  let html;
  try {
    const shellRes = await fetch(`${origin}/index.html`);
    html = await shellRes.text();
  } catch (err) {
    console.error("event-og: failed to fetch index.html", err);
    res.status(502).send("Bad Gateway");
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  let event = null;
  if (id && supabaseUrl && supabaseAnonKey) {
    try {
      event = await fetchEvent(id, supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error("event-og: failed to fetch event", err);
    }
  } else if (id && (!supabaseUrl || !supabaseAnonKey)) {
    console.error(
      "event-og: SUPABASE_URL/SUPABASE_ANON_KEY not set — serving default OG meta",
    );
  }

  const meta = buildMeta(event, origin, `${origin}/events/${id}`);
  const finalHtml = injectMeta(html, meta);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
  );
  res.status(200).send(finalHtml);
}
