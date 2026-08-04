import { useState } from "react";
import { PhotoSlot } from "../PhotoSlot";
import { uploadEventPhoto } from "../../lib/api/storage";
import { useSession } from "../../state/SessionContext";
import { useToast } from "../../state/ToastContext";
import type { CreateFormState } from "../../routes/CreateScreen";

const fieldLabelClass =
  "font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim";
const inputClass =
  "box-border w-full rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none";

interface DetailsStepProps {
  form: CreateFormState;
  onChange: (patch: Partial<CreateFormState>) => void;
}

export function DetailsStep({ form, onChange }: DetailsStepProps) {
  const { userId } = useSession();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleSelectPhoto = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const url = await uploadEventPhoto(file, userId);
      onChange({ photoUrl: url });
    } catch (err) {
      console.error(err);
      showToast("Couldn't upload photo — try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="font-sans text-[11px] font-semibold text-ink-dim">
        Optional — add if it helps people decide
      </div>

      <div className="flex gap-2.5">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>COST</span>
          <input
            value={form.cost}
            onChange={(e) => onChange({ cost: e.target.value })}
            placeholder="Free"
            className={inputClass}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>CAPACITY</span>
          <input
            value={form.capacity}
            onChange={(e) => onChange({ capacity: e.target.value })}
            placeholder="No limit"
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>NOTES</span>
        <textarea
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Bring water, meet at the flagpole…"
          rows={3}
          maxLength={2000}
          className={`${inputClass} resize-none font-medium`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>
          HOST WEBSITE (optional — e.g. for tickets, if this event isn't run
          through Muster)
        </span>
        <input
          value={form.website}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="https://…"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>PHOTO</span>
        <PhotoSlot
          photoUrl={form.photoUrl}
          label="Drop an event photo"
          className="h-[120px] w-full rounded-input"
          onSelectFile={handleSelectPhoto}
          uploading={uploading}
          onRemove={() => onChange({ photoUrl: null })}
        />
        <span className="font-sans text-[10.5px] font-medium text-ink-dim">
          JPG or PNG, landscape works best, up to ~5MB.
        </span>
      </label>
    </div>
  );
}
