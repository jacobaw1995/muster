import { Switch } from "../Switch";
import { fmtDateLabel, formatTimeOfDay } from "../../lib/format";
import { getCategoryMeta } from "../../lib/mockEvents";
import type { CreateFormState } from "../../routes/CreateScreen";

interface ReviewStepProps {
  form: CreateFormState;
  onChange: (patch: Partial<CreateFormState>) => void;
}

export function ReviewStep({ form, onChange }: ReviewStepProps) {
  const isCustom = form.category === "custom";
  const meta = getCategoryMeta(form.category);
  const catLabel = isCustom
    ? (form.customCategory.trim() || "CUSTOM").toUpperCase()
    : meta.label;

  const whenParts = [
    form.date ? fmtDateLabel(form.date) : "No date set",
    form.time ? formatTimeOfDay(form.time) : null,
    form.duration || null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="font-sans text-[11px] font-semibold text-ink-dim">
        Review &amp; post
      </div>

      <div className="flex flex-col gap-1.5 rounded-card border border-line bg-card p-3.5">
        <span
          className="font-mono text-[9.5px] font-bold tracking-[0.08em]"
          style={{ color: `var(${meta.cssVar})` }}
        >
          {catLabel}
        </span>
        <div className="font-sans text-[17px] font-bold text-ink">
          {form.title.trim() || "Untitled event"}
        </div>
        <div className="font-sans text-xs font-medium text-ink-dim">
          {whenParts.join(" · ")}
        </div>
        <div className="font-sans text-xs font-medium text-ink-dim">
          {form.location.trim() || "No location set"}
        </div>
      </div>

      <div
        onClick={() => onChange({ going: !form.going })}
        className="flex cursor-pointer items-center justify-between rounded-card border border-line bg-card p-3.5"
      >
        <span className="font-sans text-[13px] font-bold text-ink">
          Am I going?
        </span>
        <Switch
          checked={form.going}
          onCheckedChange={() => onChange({ going: !form.going })}
          ariaLabel="Am I going?"
        />
      </div>
    </div>
  );
}
