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

export function fmtDistance(distanceMi: number): string {
  return `${distanceMi.toFixed(1)} mi`;
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

/** Today's local date as an ISO "YYYY-MM-DD" string, without the UTC-shift risk of Date#toISOString. */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** First letter of up to the first 2 words of a name, e.g. "Alex Rivera" -> "AR". */
export function getInitials(name: string | null): string {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
