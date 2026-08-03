import type { CreateFormState } from "../../routes/CreateScreen";

const DURATION_OPTIONS = [
  "1 hour",
  "2 hours",
  "3 hours",
  "4 hours",
  "6 hours",
  "All day",
];

const fieldLabelClass =
  "font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim";
const inputClass =
  "rounded-input border border-line bg-card p-[13px] font-sans text-sm font-semibold text-ink outline-none";

interface BasicsStepProps {
  form: CreateFormState;
  onChange: (patch: Partial<CreateFormState>) => void;
}

export function BasicsStep({ form, onChange }: BasicsStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>TITLE</span>
        <input
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Sunrise Ruck: Basin Loop"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>LOCATION</span>
        <input
          value={form.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="Basin Reservoir Trailhead"
          className={inputClass}
        />
      </label>
      <div className="flex gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>DATE</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={`${inputClass} text-[13px]`}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
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
          {DURATION_OPTIONS.map((option) => {
            const active = form.duration === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ duration: option })}
                className={`rounded-[10px] border-[1.5px] px-1.5 py-[11px] font-sans text-xs font-bold ${
                  active
                    ? "border-accent bg-accent text-accent-on"
                    : "border-line bg-card text-ink-dim"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </label>
    </div>
  );
}
