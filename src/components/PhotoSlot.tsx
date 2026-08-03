import type { ChangeEvent } from "react";
import { PhotoIcon } from "./icons";

interface PhotoSlotProps {
  photoUrl: string | null;
  label?: string;
  className?: string;
  /** When provided, the slot becomes a click-to-upload control (a transparent file input laid over the slot). Omit for read-only display. */
  onSelectFile?: (file: File) => void;
  uploading?: boolean;
}

export function PhotoSlot({
  photoUrl,
  label,
  className = "",
  onSelectFile,
  uploading,
}: PhotoSlotProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelectFile?.(file);
  };

  const fileInput = onSelectFile && (
    <input
      type="file"
      accept="image/*"
      onChange={handleChange}
      aria-label={label ?? "Upload photo"}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
  );

  if (photoUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        {fileInput}
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-1 border border-dashed border-line bg-card-alt text-ink-dim ${className}`}
    >
      <PhotoIcon size={16} />
      {label && (
        <span className="font-mono text-[9px] tracking-[0.06em]">
          {uploading ? "Uploading…" : label}
        </span>
      )}
      {fileInput}
    </div>
  );
}
