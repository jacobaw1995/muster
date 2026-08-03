import { AlertIcon } from "./icons";

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

/**
 * Shared "couldn't load" state for failed Supabase reads — distinct from a
 * legitimate empty result (see Map/Itinerary's own empty states) and from
 * "no matches" for an active filter. Same icon/copy/button language as the
 * rest of the app's empty states, just with a danger-toned icon and a
 * retry action instead of a call-to-action.
 */
export function ErrorState({
  message = "Couldn't load this. Check your connection and try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 px-6 py-10 text-center ${className}`}
    >
      <AlertIcon className="text-danger" />
      <div className="font-sans text-[13px] font-bold text-ink">
        Something went wrong
      </div>
      <div className="font-sans text-[11px] leading-[1.4] text-ink-dim">
        {message}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[10px] border-none bg-signal px-[22px] py-3 font-sans text-[12.5px] font-bold tracking-[0.03em] text-signal-on"
      >
        TRY AGAIN
      </button>
    </div>
  );
}
