import { supabase } from "../supabase";

export type ScrapeEventSource = "jsonld" | "opengraph" | "none";

export interface ScrapeEventFields {
  title: string | null;
  notes: string | null;
  /** ISO "YYYY-MM-DD". */
  date: string | null;
  /** Display format, e.g. "9:00 AM" — matches lib/format.ts's formatTimeOfDay so parseTimeOfDayTo24h can round-trip it into the form's <input type="time">. */
  time: string | null;
  durationHours: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  /** Only set when a real price was found — never a forced "FREE". */
  cost: string | null;
  imageUrl: string | null;
  website: string | null;
}

export interface ScrapeEventResult {
  found: boolean;
  source: ScrapeEventSource;
  fields: ScrapeEventFields;
  /** Important fields we couldn't fill — "date" and/or "location" whenever absent. */
  missing: string[];
}

function emptyResult(url: string): ScrapeEventResult {
  return {
    found: false,
    source: "none",
    fields: {
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
      website: url,
    },
    missing: ["title", "date", "location"],
  };
}

/**
 * Calls the `scrape-event` Edge Function (see supabase/functions/scrape-event)
 * to pull whatever schema.org Event JSON-LD or Open Graph metadata a
 * pasted event link exposes. Never throws — a network failure, a
 * malformed response, or the function reporting nothing useful all
 * collapse to the same "found: false" shape, so the Create wizard's
 * autofill can always fall back to manual entry without special-casing
 * errors.
 */
export async function scrapeEvent(url: string): Promise<ScrapeEventResult> {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-event", {
      body: { url },
    });
    if (error || !data || typeof data.found !== "boolean" || !data.fields) {
      return emptyResult(url);
    }
    return data as ScrapeEventResult;
  } catch (err) {
    console.error(err);
    return emptyResult(url);
  }
}
