export function fmtDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

/** Null when the user's location or the event's coordinates aren't known yet. */
export function fmtDistance(distanceMi: number | null): string {
  if (distanceMi == null) return "distance unknown";
  return `${distanceMi.toFixed(1)} mi`;
}

/** Venue label with graceful fallbacks: the organizer-entered name, else city/state, else a plain placeholder. Never renders "null". */
export function fmtVenueLine(event: {
  location: string | null;
  city: string | null;
  state: string | null;
}): string {
  if (event.location?.trim()) return event.location;
  if (event.city && event.state) return `${event.city}, ${event.state}`;
  return "Location TBD";
}

/** "City, State" for the Map list cards' primary location line (Phase 11) — independent of the organizer-entered venue name, so a card always shows WHERE before the specific spot. Never renders "null". */
export function fmtCityState(event: {
  city: string | null;
  state: string | null;
}): string {
  if (event.city && event.state) return `${event.city}, ${event.state}`;
  if (event.city) return event.city;
  if (event.state) return event.state;
  return "Location TBD";
}

/** Converts a raw <input type="time"> value ("HH:MM", 24h) into a display-ready string ("5:30 PM"). */
export function formatTimeOfDay(raw: string): string {
  const [hStr, mStr] = raw.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Inverse of formatTimeOfDay — "5:30 AM" -> "05:30", for pre-filling an <input type="time"> when editing an existing event (Phase 10). Falls back to "" if unparseable. */
export function parseTimeOfDayTo24h(display: string): string {
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let hours = Number(match[1]) % 12;
  if (/pm/i.test(match[3])) hours += 12;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** Today's local date as an ISO "YYYY-MM-DD" string, without the UTC-shift risk of Date#toISOString. */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * First letter of up to the first 2 words of a name, e.g. "Alex Rivera" ->
 * "AR". Falls back to the first letter of `contact` (the account's email)
 * when there's no name yet, so a signed-in member with no display name set
 * shows something derived from their actual identity — never a generic
 * placeholder like "Member".
 */
export function getInitials(
  name: string | null,
  contact?: string | null,
): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  const trimmedContact = contact?.trim();
  if (trimmedContact) return trimmedContact[0].toUpperCase();
  return "?";
}
