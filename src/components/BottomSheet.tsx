import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}

/** Scrim + slide-up sheet, shared by the filter and share sheets. */
export function BottomSheet({
  open,
  onClose,
  children,
  label,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      // z-[2000]: comfortably above Leaflet's own control-container z-index
      // (1000) and every custom map overlay (near-me/radius buttons at
      // z-[500]) — without this the scrim used to sit BELOW those map
      // elements, so taps meant for the sheet could land on the map
      // underneath instead (the map also eats touch/scroll gestures for
      // its own pan/zoom, so any leak-through felt like "the sheet won't
      // scroll"). `overscroll-contain` stops the sheet's own scroll from
      // chaining to whatever's behind it once it hits either end.
      className="absolute inset-0 z-[2000] flex items-end bg-black/55"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="flex max-h-[80%] w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-sheet bg-bg p-5 [animation:sheet-in_0.25s_ease]"
      >
        <div className="h-1 w-9 flex-none self-center rounded-pill bg-line" />
        {children}
      </div>
    </div>
  );
}
