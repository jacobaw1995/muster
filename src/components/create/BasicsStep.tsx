import { CUSTOM_DURATION_KEY, DURATION_PRESETS } from "../../lib/duration";
import type { CreateFormState } from "../../routes/CreateScreen";

const fieldLabelClass =
  "font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim";
const inputClass =
  "box-border w-full rounded-input border border-line bg-card p-[13px] font-sans text-sm font-semibold text-ink outline-none";
const inputHighlightClass = "border-[1.5px] border-warn";

interface BasicsStepProps {
  form: CreateFormState;
  onChange: (patch: Partial<CreateFormState>) => void;
  /** Fields a link-paste autofill (Phase 15) couldn't find — currently only "date"/"city"/"state" are ever flagged. Draws attention to what still needs manual entry without blocking the flow. */
  highlightFields?: Set<string>;
}

export function BasicsStep({ form, onChange, highlightFields }: BasicsStepProps) {
  const isCustomDuration = form.durationChoice === CUSTOM_DURATION_KEY;
  const highlighted = (field: string) =>
    highlightFields?.has(field) ? inputHighlightClass : "";

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>TITLE</span>
        <input
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Sunrise Ruck: Basin Loop"
          maxLength={120}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>VENUE / LOCATION NAME (OPTIONAL)</span>
        <input
          value={form.venueName}
          onChange={(e) => onChange({ venueName: e.target.value })}
          placeholder="Basin Reservoir Trailhead"
          maxLength={200}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>STREET (OPTIONAL)</span>
        <input
          value={form.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="1310 Washington Ave"
          maxLength={200}
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap gap-2.5">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>CITY</span>
          <input
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Golden"
            maxLength={100}
            className={`${inputClass} ${highlighted("location")}`}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>STATE</span>
          <input
            value={form.state}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder="CO"
            maxLength={50}
            className={`${inputClass} ${highlighted("location")}`}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>ZIP (OPTIONAL)</span>
          <input
            value={form.zip}
            onChange={(e) => onChange({ zip: e.target.value })}
            placeholder="80401"
            maxLength={20}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex gap-2.5">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>DATE</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={`${inputClass} text-[13px] ${highlighted("date")}`}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>TIME</span>
          <input
            type="time"
            value={form.time}
            onChange={(e) => onChange({ time: e.target.value })}
            className={`${inputClass} text-[13px]`}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>DURATION</span>
        <div className="grid grid-cols-3 gap-2">
          {DURATION_PRESETS.map((preset) => {
            const active = form.durationChoice === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onChange({ durationChoice: preset.key })}
                className={`rounded-[10px] border-[1.5px] px-1.5 py-[11px] font-sans text-xs font-bold ${
                  active
                    ? "border-accent bg-accent text-accent-on"
                    : "border-line bg-card text-ink-dim"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onChange({ durationChoice: CUSTOM_DURATION_KEY })}
            className={`rounded-[10px] border-[1.5px] px-1.5 py-[11px] font-sans text-xs font-bold ${
              isCustomDuration
                ? "border-accent bg-accent text-accent-on"
                : "border-line bg-card text-ink-dim"
            }`}
          >
            Custom…
          </button>
        </div>
        {isCustomDuration && (
          <div className="flex items-center gap-2">
            <input
              value={form.durationCustomHours}
              onChange={(e) => onChange({ durationCustomHours: e.target.value })}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0.5"
              placeholder="e.g. 1.5"
              className={inputClass}
            />
            <span className="flex-none font-sans text-xs font-semibold text-ink-dim">
              hours
            </span>
          </div>
        )}
      </label>
    </div>
  );
}
