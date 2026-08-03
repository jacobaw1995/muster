import type { MusterEvent } from "./mockEvents";

/** Parses a display-ready time string ("5:30 AM") into 24h hours/minutes. */
function parseDisplayTime(display: string): { hours: number; minutes: number } {
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hours: 12, minutes: 0 };
  let hours = Number(match[1]) % 12;
  if (/pm/i.test(match[3])) hours += 12;
  return { hours, minutes: Number(match[2]) };
}

function durationToMinutes(label: string): number {
  if (/all day/i.test(label)) return 24 * 60;
  const match = label.match(/^(\d+)\s*hours?$/i);
  if (match) return Number(match[1]) * 60;
  return 120;
}

/** Local-time start/end Date objects for an event, derived from date + time + duration. */
export function eventDateRange(event: MusterEvent): { start: Date; end: Date } {
  const [year, month, day] = event.date.split("-").map(Number);
  const isAllDay = /all day/i.test(event.durationLabel);
  const { hours, minutes } = isAllDay
    ? { hours: 0, minutes: 0 }
    : parseDisplayTime(event.time);
  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(
    start.getTime() + durationToMinutes(event.durationLabel) * 60_000,
  );
  return { start, end };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local floating-time "YYYYMMDDTHHMMSS" — no timezone suffix, matching the design file's own format. */
function formatIcsDateTime(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function buildGoogleCalendarUrl(event: MusterEvent): string {
  const { start, end } = eventDateRange(event);
  const dates = `${formatIcsDateTime(start)}/${formatIcsDateTime(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(text: string): string {
  return text.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Builds a full VCALENDAR string with one VEVENT per event. */
export function buildIcsCalendar(events: MusterEvent[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MUSTER//EN"];
  for (const event of events) {
    const { start, end } = eventDateRange(event);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@muster`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `LOCATION:${escapeIcsText(event.location)}`,
      `DTSTART:${formatIcsDateTime(start)}`,
      `DTEND:${formatIcsDateTime(end)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Builds the .ics file and triggers a browser download. */
export function downloadIcsFile(events: MusterEvent[], filename: string): void {
  const ics = buildIcsCalendar(events);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
