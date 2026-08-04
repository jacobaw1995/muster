import { useState } from "react";
import type { ReportReason } from "../lib/api/reports";
import { BottomSheet } from "./BottomSheet";

const REASONS: { key: ReportReason; label: string }[] = [
  { key: "spam", label: "Spam" },
  { key: "inappropriate", label: "Inappropriate" },
  { key: "duplicate", label: "Duplicate" },
  { key: "other", label: "Other" },
];

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
  submitting: boolean;
}

export function ReportSheet({
  open,
  onClose,
  onSubmit,
  submitting,
}: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason>("spam");

  return (
    <BottomSheet open={open} onClose={onClose} label="Report this event">
      <div className="flex flex-col gap-1">
        <div className="font-sans text-sm font-bold text-ink">
          Report this event
        </div>
        <div className="font-sans text-[11.5px] font-medium text-ink-dim">
          Let us know what's wrong — we'll review it.
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {REASONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setReason(r.key)}
            className={`rounded-input border-[1.5px] p-3 text-left font-sans text-[12.5px] font-bold ${
              reason === r.key
                ? "border-accent bg-accent text-accent-on"
                : "border-line bg-card text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSubmit(reason)}
        disabled={submitting}
        className="rounded-input border-none bg-danger p-[13px] font-sans text-[12.5px] font-bold tracking-[0.03em] text-danger-on disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting ? "SUBMITTING…" : "SUBMIT REPORT"}
      </button>
    </BottomSheet>
  );
}
