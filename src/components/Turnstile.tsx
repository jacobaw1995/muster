import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/** Whether a site key is configured client-side — callers use this to decide whether to require a token before allowing submit (see CreateScreen). False in local dev until VITE_TURNSTILE_SITE_KEY is set; see SETUP.md. */
export const TURNSTILE_CONFIGURED = Boolean(SITE_KEY);

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Turnstile"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface TurnstileProps {
  onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile widget for the Create-event flow's final step
 * (Phase 14) — server-verified in the create-event Edge Function. Renders
 * nothing when VITE_TURNSTILE_SITE_KEY isn't set (local dev without a
 * Cloudflare account configured yet) — the Edge Function itself likewise
 * skips verification when its own TURNSTILE_SECRET_KEY secret is unset, so
 * the two degrade together. See SETUP.md for the director's setup steps.
 *
 * Mount with a fresh `key` after a failed submit (see CreateScreen) to
 * force a full remount — Turnstile tokens are single-use, so a retry needs
 * a brand new widget instance, not just a callback re-fire.
 */
export function Turnstile({ onToken }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} />;
}
