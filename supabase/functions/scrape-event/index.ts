// MUSTER scrape-event Edge Function (Phase 15 — "paste a link" autofill).
//
// Free, plain-fetch metadata scraper: given a URL, fetches it server-side
// (browsers can't, due to CORS) and pulls whatever schema.org Event
// JSON-LD or Open Graph meta tags the page exposes. This is a HEAD START,
// not magic — it never renders JS, never logs in, and never guesses; if a
// page doesn't expose structured data, it says so and the client falls
// back to manual entry. No paid APIs, no headless browser, no LLM calls.
//
// Security posture, since this fetches arbitrary user-supplied URLs:
//   - Only http/https schemes.
//   - SSRF guard: rejects localhost/private/link-local/.internal hosts,
//     AND resolves DNS and checks every resolved address too (closes the
//     DNS-rebinding gap where a public hostname resolves to an internal
//     IP after the initial check passes).
//   - Redirects are followed manually (not via fetch's own auto-follow),
//     re-validating each hop's target against the same SSRF guard —
//     otherwise a redirect chain could bounce through the guard into an
//     internal address.
//   - Response capped at ~2MB and ~8s total; non-HTML content types are
//     rejected before ever reading the body.
//   - A modest in-memory per-IP rate limit (this endpoint fetches
//     arbitrary URLs on the caller's behalf, so it's a more sensitive
//     surface than a normal insert). Best-effort only — resets on a cold
//     start, which is an acceptable tradeoff for a free, low-traffic
//     feature; a durable version would need its own DB table, which felt
//     like overkill for "keep it modest."
//
// No database access at all (no read, no write) — deployed with
// verify_jwt=true purely as an access-control gate (every real visitor
// already has a session, anonymous or not; this just keeps the endpoint
// off the open internet), not because the code below needs a session.
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

// ---------------------------------------------------------------------
// Rate limiting — in-memory sliding window per IP. See file header for
// why this isn't a DB table.
// ---------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  requestLog.set(ip, recent);
  // Trim the map occasionally so it doesn't grow unbounded across a long
  // warm isolate lifetime — cheap, approximate, not on the hot path.
  if (requestLog.size > 5000) {
    for (const [key, timestamps] of requestLog) {
      if (timestamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

// ---------------------------------------------------------------------
// SSRF guard
// ---------------------------------------------------------------------
const PRIVATE_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. 169.254.169.254 cloud metadata
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — check the embedded IPv4 address.
    return isPrivateIPv4(lower.slice("::ffff:".length));
  }
  return false;
}

async function isSafeUrl(
  rawUrl: string,
): Promise<{ safe: true; parsed: URL } | { safe: false; reason: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "That doesn't look like a valid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "Only http/https links are supported." };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    PRIVATE_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local")
  ) {
    return { safe: false, reason: "That host isn't allowed." };
  }
  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    return { safe: false, reason: "That host isn't allowed." };
  }
  // Resolve DNS and check every resolved address too — an attacker-
  // controlled public hostname could otherwise resolve to an internal IP
  // and slip past the hostname-only check above (DNS rebinding).
  try {
    const [v4, v6] = await Promise.allSettled([
      Deno.resolveDns(hostname, "A"),
      Deno.resolveDns(hostname, "AAAA"),
    ]);
    const addrs = [
      ...(v4.status === "fulfilled" ? v4.value : []),
      ...(v6.status === "fulfilled" ? v6.value : []),
    ];
    if (addrs.length === 0) {
      return { safe: false, reason: "Couldn't resolve that host." };
    }
    if (addrs.some((a) => isPrivateIPv4(a) || isPrivateIPv6(a))) {
      return { safe: false, reason: "That host isn't allowed." };
    }
  } catch {
    return { safe: false, reason: "Couldn't resolve that host." };
  }
  return { safe: true, parsed };
}

// ---------------------------------------------------------------------
// Fetch with a manual, re-validated redirect chain + size/time/type caps
// ---------------------------------------------------------------------
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // ~2MB
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; MusterLinkPreview/1.0; +https://eventmuster.com)";

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function fetchHtml(
  startUrl: string,
): Promise<{ html: string } | { error: string }> {
  let currentUrl = startUrl;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const safety = await isSafeUrl(currentUrl);
      if (!safety.safe) return { error: safety.reason };

      let res: Response;
      try {
        res = await fetch(currentUrl, {
          redirect: "manual",
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml",
          },
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return { error: "That page took too long to respond." };
        }
        return { error: "Couldn't fetch that page." };
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return { error: "That page redirected with no destination." };
        try {
          currentUrl = new URL(location, currentUrl).toString();
        } catch {
          return { error: "That page redirected to an invalid URL." };
        }
        continue; // loop re-validates currentUrl's safety before following
      }

      if (!res.ok) {
        return { error: `That page responded with ${res.status}.` };
      }

      const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
      if (!contentType.includes("html")) {
        return { error: "That link isn't an HTML page." };
      }

      const reader = res.body?.getReader();
      if (!reader) return { error: "That page had no content." };
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          break; // truncate rather than fail — the <head> metadata we
          // want is almost always near the top of the document anyway.
        }
        chunks.push(value);
      }
      return { html: new TextDecoder().decode(concatChunks(chunks)) };
    }
    return { error: "Too many redirects." };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------
// HTML metadata extraction — plain regex, not a full DOM parser. We only
// need two very specific, simple constructs (JSON-LD <script> blocks and
// self-closing <meta> tags), both of which are reliably regex-matchable
// without pulling in a WASM/DOM dependency for a "best-effort head start"
// feature.
// ---------------------------------------------------------------------
const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  nbsp: " ",
};

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return HTML_ENTITIES[entity] ?? match;
  });
}

function stripHtml(input: string, maxLength = 2000): string {
  const text = decodeHtmlEntities(input.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = decodeHtmlEntities(match[1]).trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Malformed JSON-LD on the source page — not our problem to fix,
      // just skip it and keep looking at the other blocks.
    }
  }
  return blocks;
}

function extractMetaTags(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /<meta\s+([^>]+?)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1];
    const propMatch = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const contentMatch = /content\s*=\s*["']([^"']*)["']/i.exec(attrs);
    if (propMatch && contentMatch) {
      result[propMatch[1].toLowerCase()] = decodeHtmlEntities(contentMatch[1]);
    }
  }
  return result;
}

function isEventType(type: unknown): boolean {
  if (typeof type === "string") {
    const t = type.toLowerCase();
    return t === "event" || t.endsWith("event");
  }
  if (Array.isArray(type)) return type.some(isEventType);
  return false;
}

function findEventNode(blocks: unknown[]): Record<string, unknown> | null {
  for (const block of blocks) {
    let candidates: unknown[];
    if (Array.isArray(block)) {
      candidates = block;
    } else if (
      block &&
      typeof block === "object" &&
      Array.isArray((block as Record<string, unknown>)["@graph"])
    ) {
      candidates = (block as Record<string, unknown>)["@graph"] as unknown[];
    } else {
      candidates = [block];
    }
    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === "object" &&
        isEventType((candidate as Record<string, unknown>)["@type"])
      ) {
        return candidate as Record<string, unknown>;
      }
    }
  }
  return null;
}

/**
 * JSON-LD startDate/endDate carry the venue's own local wall-clock time
 * plus a UTC offset (e.g. "2026-09-12T09:00:00-07:00") — the offset says
 * WHICH timezone that clock time is in, not that we should convert it to
 * ours. We deliberately extract the date/time digits straight from the
 * string's own text rather than routing through `Date` (whose getters
 * would reinterpret it in the server's runtime timezone), so "9:00 AM" on
 * the page stays "9:00 AM" in the form, matching what an organizer
 * actually typed for their own event.
 */
function parseLocalDateTime(iso: string): { date: string; time: string | null } | null {
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(iso.trim());
  if (!m) return null;
  const [, date, hh, mm] = m;
  if (!hh || !mm) return { date, time: null };
  const hour = Number(hh);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return { date, time: `${hour12}:${mm} ${period}` };
}

function extractLocation(node: Record<string, unknown>): {
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  let loc = node.location;
  if (Array.isArray(loc)) loc = loc[0];
  if (typeof loc === "string") {
    return { location: loc, city: null, state: null, zip: null };
  }
  if (loc && typeof loc === "object") {
    const locObj = loc as Record<string, unknown>;
    const name = typeof locObj.name === "string" ? locObj.name : null;
    let address = locObj.address;
    if (Array.isArray(address)) address = address[0];
    if (typeof address === "string") {
      return { location: name ?? address, city: null, state: null, zip: null };
    }
    if (address && typeof address === "object") {
      const a = address as Record<string, unknown>;
      return {
        location: name,
        city: typeof a.addressLocality === "string" ? a.addressLocality : null,
        state: typeof a.addressRegion === "string" ? a.addressRegion : null,
        zip: typeof a.postalCode === "string" ? a.postalCode : null,
      };
    }
    return { location: name, city: null, state: null, zip: null };
  }
  return { location: null, city: null, state: null, zip: null };
}

function extractImage(node: Record<string, unknown>): string | null {
  let image = node.image;
  if (Array.isArray(image)) image = image[0];
  if (typeof image === "string") return image;
  if (image && typeof image === "object") {
    const url = (image as Record<string, unknown>).url;
    if (typeof url === "string") return url;
  }
  return null;
}

function formatPrice(price: unknown, currency: unknown): string | null {
  if (price == null || price === "") return null;
  const num = typeof price === "number" ? price : Number(price);
  if (!Number.isFinite(num)) return null;
  const code = typeof currency === "string" && currency ? currency.toUpperCase() : "USD";
  const amount = num % 1 === 0 ? String(num) : num.toFixed(2);
  return code === "USD" ? `$${amount}` : `${code} ${amount}`;
}

function extractCost(node: Record<string, unknown>): string | null {
  let offers = node.offers;
  if (Array.isArray(offers)) offers = offers[0];
  if (!offers || typeof offers !== "object") return null;
  const o = offers as Record<string, unknown>;
  return formatPrice(o.price ?? o.lowPrice, o.priceCurrency);
}

interface ScrapeFields {
  title: string | null;
  notes: string | null;
  date: string | null;
  time: string | null;
  durationHours: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  cost: string | null;
  imageUrl: string | null;
  website: string | null;
}

function emptyFields(website: string): ScrapeFields {
  return {
    title: null,
    notes: null,
    date: null,
    time: null,
    durationHours: null,
    location: null,
    city: null,
    state: null,
    zip: null,
    cost: null,
    imageUrl: null,
    website,
  };
}

function fieldsFromJsonLd(node: Record<string, unknown>, website: string): ScrapeFields {
  const fields = emptyFields(website);
  fields.title = typeof node.name === "string" ? node.name.trim() || null : null;
  fields.notes = typeof node.description === "string" ? stripHtml(node.description) : null;

  const start = typeof node.startDate === "string" ? parseLocalDateTime(node.startDate) : null;
  if (start) {
    fields.date = start.date;
    fields.time = start.time;
  }
  const end = typeof node.endDate === "string" ? parseLocalDateTime(node.endDate) : null;
  if (start?.time && end) {
    const startMs = Date.parse(node.startDate as string);
    const endMs = Date.parse(node.endDate as string);
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
      fields.durationHours = Math.round(((endMs - startMs) / 3_600_000) * 100) / 100;
    }
  }

  const loc = extractLocation(node);
  fields.location = loc.location;
  fields.city = loc.city;
  fields.state = loc.state;
  fields.zip = loc.zip;

  fields.cost = extractCost(node);
  fields.imageUrl = extractImage(node);

  return fields;
}

function fieldsFromOpenGraph(meta: Record<string, string>, website: string): ScrapeFields {
  const fields = emptyFields(website);
  fields.title = meta["og:title"]?.trim() || null;
  fields.notes = meta["og:description"] ? stripHtml(meta["og:description"]) : null;
  fields.imageUrl = meta["og:image"] || null;
  const price = meta["og:price:amount"] ?? meta["product:price:amount"];
  const currency = meta["og:price:currency"] ?? meta["product:price:currency"];
  fields.cost = price ? formatPrice(price, currency) : null;
  return fields;
}

function computeMissing(fields: ScrapeFields): string[] {
  const missing: string[] = [];
  if (!fields.title) missing.push("title");
  if (!fields.date) missing.push("date");
  if (!fields.location && !fields.city) missing.push("location");
  return missing;
}

function hasAnyField(fields: ScrapeFields): boolean {
  return Object.entries(fields).some(
    ([key, value]) => key !== "website" && value != null,
  );
}

// ---------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return json({ error: "Too many requests — try again in a minute." }, 429);
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const url = body.url?.trim();
  if (!url) {
    return json({ error: "Missing url." }, 400);
  }

  const fetchResult = await fetchHtml(url);
  if ("error" in fetchResult) {
    return json({
      found: false,
      source: "none",
      fields: emptyFields(url),
      missing: ["title", "date", "location"],
    });
  }

  const jsonLdBlocks = extractJsonLdBlocks(fetchResult.html);
  const eventNode = findEventNode(jsonLdBlocks);

  if (eventNode) {
    const fields = fieldsFromJsonLd(eventNode, url);
    return json({
      found: hasAnyField(fields),
      source: "jsonld",
      fields,
      missing: computeMissing(fields),
    });
  }

  const meta = extractMetaTags(fetchResult.html);
  const ogFields = fieldsFromOpenGraph(meta, url);
  if (hasAnyField(ogFields)) {
    return json({
      found: true,
      source: "opengraph",
      fields: ogFields,
      missing: computeMissing(ogFields),
    });
  }

  return json({
    found: false,
    source: "none",
    fields: emptyFields(url),
    missing: ["title", "date", "location"],
  });
});
