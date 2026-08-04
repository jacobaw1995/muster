import { useState } from "react";
import { isValidHttpUrl } from "../../lib/format";
import { scrapeEvent, type ScrapeEventResult } from "../../lib/api/scrapeEvent";
import { useToast } from "../../state/ToastContext";

interface PasteLinkPanelProps {
  onResult: (result: ScrapeEventResult) => void;
}

/**
 * Sits above the category grid on Create's first step (Phase 15). Purely
 * optional — never blocks the normal manual-entry flow, and never posts
 * anything itself; it only ever hands a normalized result up to
 * CreateScreen, which pre-fills the wizard for the user to review.
 */
export function PasteLinkPanel({ onResult }: PasteLinkPanelProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleAutofill = async () => {
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    if (!isValidHttpUrl(trimmed)) {
      showToast("Enter a valid http:// or https:// link");
      return;
    }
    setLoading(true);
    try {
      const result = await scrapeEvent(trimmed);
      onResult(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-card-alt p-3.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
        PASTE EVENT LINK
      </span>
      <span className="font-sans text-[11px] font-medium text-ink-dim">
        Have a link from Eventbrite, GORUCK, etc.? Paste it and we'll fill
        what we can.
      </span>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAutofill();
            }
          }}
          type="url"
          inputMode="url"
          placeholder="https://…"
          disabled={loading}
          className="box-border min-w-0 flex-1 rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void handleAutofill()}
          disabled={!url.trim() || loading}
          className="flex-none rounded-input border-none bg-accent px-4 font-sans text-[12.5px] font-bold tracking-[0.02em] text-accent-on disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "READING…" : "AUTOFILL"}
        </button>
      </div>
    </div>
  );
}
