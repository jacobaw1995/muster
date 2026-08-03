import { Switch } from "../Switch";
import { resolveDuration } from "../../lib/duration";
import { fmtDateLabel, formatTimeOfDay } from "../../lib/format";
import { getCategoryMeta } from "../../lib/mockEvents";
import type { CreateFormState } from "../../routes/CreateScreen";

interface ReviewStepProps {
  form: CreateFormState;
  onChange: (patch: Partial<CreateFormState>) => void;
  /** Hides the initial-RSVP toggle — editing an event's details shouldn't also silently change the editor's own RSVP. */
  isEditMode?: boolean;
}

export function ReviewStep({ form, onChange, isEditMode = false }: ReviewStepProps) {
  const isCustom = form.category === "custom";
  const meta = getCategoryMeta(form.category);
  const catLabel = isCustom
    ? (form.customCategory.trim() || "CUSTOM").toUpperCase()
    : meta.label;

  const duration = resolveDuration(form.durationChoice, form.durationCustomHours);
  const whenParts = [
    form.date ? fmtDateLabel(form.date) : "No date set",
    form.time ? formatTimeOfDay(form.time) : null,
    duration.label,
  ].filter(Boolean);

  const addressParts = [
    form.venueName.trim(),
    [form.city.trim(), form.state.trim()].filter(Boolean).join(", "),
  ].filter(Boolean);
  const addressLine = addressParts.length
    ? addressParts.join(" · ")
    : "No location set";

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
          {addressLine}
        </div>
      </div>

      {!isEditMode && (
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
      )}
    </div>
  );
}
