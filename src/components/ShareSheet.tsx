import type { MusterEvent } from "../lib/mockEvents";
import { BottomSheet } from "./BottomSheet";
import { PhotoSlot } from "./PhotoSlot";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  event: MusterEvent;
  shareUrl: string;
  onCopyLink: () => void;
}

export function ShareSheet({
  open,
  onClose,
  event,
  shareUrl,
  onCopyLink,
}: ShareSheetProps) {
  const smsHref = `sms:?&body=${encodeURIComponent(`${event.title} — ${shareUrl}`)}`;

  return (
    <BottomSheet open={open} onClose={onClose} label="Share this event">
      <div className="font-sans text-sm font-bold text-ink">
        Share this event
      </div>
      <div className="flex items-center gap-2.5 rounded-[12px] border border-line bg-card-alt p-2.5">
        <div className="h-[52px] w-[52px] flex-none overflow-hidden rounded-lg">
          <PhotoSlot photoUrl={event.photoUrl} className="h-[52px] w-[52px]" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate font-sans text-[12.5px] font-bold text-ink">
            {event.title}
          </div>
          <div className="truncate font-mono text-[10.5px] font-medium text-ink-dim">
            {shareUrl}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCopyLink}
          className="flex-1 rounded-input border border-line bg-card p-[13px] font-sans text-xs font-bold text-ink"
        >
          COPY LINK
        </button>
        <a
          href={smsHref}
          onClick={onClose}
          className="flex-1 rounded-input border-none bg-accent p-[13px] text-center font-sans text-xs font-bold text-accent-on no-underline"
        >
          TEXT A FRIEND
        </a>
      </div>
    </BottomSheet>
  );
}
