// Shared HTML email template + Resend send helper for the notification
// Edge Functions (send-event-reminders, send-nearby-events — Phase 13).
// Pure helpers, no top-level Deno.serve — deployed alongside each function
// as a relative dependency (see the two functions' own index.ts).

const BRAND_BG = "#0e0f0c";
const BRAND_INK = "#f5f3ea";
const BRAND_INK_DIM = "#a3a394";
const BRAND_ACCENT = "#9caf58";
const BRAND_SIGNAL = "#ff6a2b";

export interface EmailEventRow {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // display string, e.g. "5:30 AM"
  city: string;
  state: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function eventCard(event: EmailEventRow): string {
  const url = `https://www.eventmuster.com/events/${event.id}`;
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  return `
    <tr>
      <td style="padding: 16px 0; border-top: 1px solid #2a2c1f;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; color: ${BRAND_INK};">
          ${escapeHtml(event.title)}
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ${BRAND_INK_DIM}; margin-top: 4px;">
          ${escapeHtml(fmtDateLabel(event.date))} &middot; ${escapeHtml(event.time)} &middot; ${escapeHtml(cityState)}
        </div>
        <a href="${url}" style="display: inline-block; margin-top: 10px; padding: 9px 16px; background: ${BRAND_SIGNAL}; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 8px;">
          VIEW EVENT
        </a>
      </td>
    </tr>`;
}

function shell(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background: #17190f;">
    <span style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(opts.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #17190f; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%; background: ${BRAND_BG}; border-radius: 16px; overflow: hidden;">
            <tr>
              <td style="padding: 28px 28px 8px;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 22px; letter-spacing: 1px;">
                  <span style="color: ${BRAND_ACCENT};">M</span><span style="color: ${BRAND_INK};">USTER</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 28px 0;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: bold; color: ${BRAND_INK};">
                  ${escapeHtml(opts.heading)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 28px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${opts.bodyHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 28px 28px; border-top: 1px solid #2a2c1f;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: ${BRAND_INK_DIM}; line-height: 1.5;">
                  You're receiving this because you opted in on Muster.
                  <a href="https://www.eventmuster.com/settings" style="color: ${BRAND_ACCENT};">Manage notification preferences</a>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderReminderEmail(opts: {
  kind: "evening" | "morning";
  events: EmailEventRow[];
}): { subject: string; html: string } {
  const when = opts.kind === "evening" ? "tomorrow" : "today";
  const plural = opts.events.length > 1;
  const subject = plural
    ? `Reminder: ${opts.events.length} events ${when}`
    : `Reminder: ${opts.events[0].title} ${when}`;
  const heading = plural
    ? `You're set for ${opts.events.length} events ${when}`
    : `You're set for ${when}`;
  return {
    subject,
    html: shell({
      preheader: subject,
      heading,
      bodyHtml: opts.events.map(eventCard).join(""),
    }),
  };
}

export function renderNearbyEmail(opts: {
  events: EmailEventRow[];
}): { subject: string; html: string } {
  const plural = opts.events.length > 1;
  const subject = plural
    ? `${opts.events.length} new events near you`
    : `New event near you: ${opts.events[0].title}`;
  const heading = plural ? `${opts.events.length} new events near you` : "A new event near you";
  return {
    subject,
    html: shell({
      preheader: subject,
      heading,
      bodyHtml: opts.events.map(eventCard).join(""),
    }),
  };
}

/**
 * Sends via the Resend API. Sets a List-Unsubscribe header pointing at
 * Settings (a valid URL-only List-Unsubscribe is standard and widely
 * supported — a full one-click POST endpoint is out of scope here).
 * Never throws — returns { ok, error } so a per-recipient send failure
 * doesn't abort the whole batch.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  resendApiKey: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Muster <no-reply@eventmuster.com>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        headers: {
          "List-Unsubscribe": "<https://www.eventmuster.com/settings>",
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
