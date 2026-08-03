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
        <span className={fieldLabelClass}>VENUE / LOCATION NAME (OPTIONAL)</span>
        <input
          value={form.venueName}
          onChange={(e) => onChange({ venueName: e.target.value })}
          placeholder="Basin Reservoir Trailhead"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabelClass}>STREET (OPTIONAL)</span>
        <input
          value={form.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="1310 Washington Ave"
          className={inputClass}
        />
      </label>
      <div className="flex gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>CITY</span>
          <input
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Golden"
            className={inputClass}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>STATE</span>
          <input
            value={form.state}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder="CO"
            className={inputClass}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={fieldLabelClass}>ZIP (OPTIONAL)</span>
          <input
            value={form.zip}
            onChange={(e) => onChange({ zip: e.target.value })}
            placeholder="80401"
            className={inputClass}
          />
        </label>
      </div>
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
