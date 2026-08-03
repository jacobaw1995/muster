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
      className="absolute inset-0 z-40 flex items-end bg-black/55"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="flex max-h-[80%] w-full flex-col gap-4 overflow-y-auto rounded-t-sheet bg-bg p-5 [animation:sheet-in_0.25s_ease]"
      >
        <div className="h-1 w-9 flex-none self-center rounded-pill bg-line" />
        {children}
      </div>
    </div>
  );
}
