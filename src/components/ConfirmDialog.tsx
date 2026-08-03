interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both buttons while the confirmed action is in flight. */
  busy?: boolean;
}

/**
 * Centered confirmation modal for destructive actions (event delete, so
 * far) — a floating card rather than BottomSheet's slide-up sheet, since a
 * two-button confirm reads better centered than anchored to the bottom.
 * Same z-[2000] scrim as BottomSheet (see its own comment): comfortably
 * above Leaflet's control layer and MapPanel's own overlay buttons, which
 * on desktop can render right behind Event Detail's panel.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/55 px-6"
      onClick={busy ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-[320px] flex-col gap-3 rounded-card border border-line bg-bg p-5"
      >
        <div className="font-sans text-[15px] font-bold text-ink">{title}</div>
        <div className="font-sans text-[12.5px] leading-[1.5] text-ink-dim">
          {message}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-input border border-line bg-card p-3 font-sans text-[12.5px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-input border-none bg-danger p-3 font-sans text-[12.5px] font-bold text-danger-on disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
