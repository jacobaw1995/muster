import type { CSSProperties } from "react";
import { CATEGORY_ORDER, getCategoryMeta } from "../../lib/mockEvents";
import type { CreateFormState } from "../../routes/CreateScreen";

function chipStyle(active: boolean, cssVar: string): CSSProperties {
  if (!active) return {};
  return {
    borderColor: `var(${cssVar})`,
    backgroundColor: `color-mix(in srgb, var(${cssVar}) 18%, transparent)`,
  };
}

interface CategoryStepProps {
  form: CreateFormState;
  onChange: (patch: Partial<CreateFormState>) => void;
}

export function CategoryStep({ form, onChange }: CategoryStepProps) {
  const isCustom = form.category === "custom";

  return (
    <>
      <div className="font-sans text-[11px] font-semibold text-ink-dim">
        What kind of event is it?
      </div>
      <div className="grid grid-cols-2 gap-[9px]">
        {CATEGORY_ORDER.map((key) => {
          const meta = getCategoryMeta(key);
          const active = form.category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ category: key })}
              style={chipStyle(active, meta.cssVar)}
              className={`flex items-center gap-[9px] rounded-button border-[1.5px] p-[13px] font-sans text-[12.5px] font-bold ${
                active ? "text-ink" : "border-line bg-card text-ink-dim"
              }`}
            >
              <span
                className="h-[9px] w-[9px] flex-none rounded-full"
                style={{ background: `var(${meta.cssVar})` }}
              />
              {meta.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange({ category: "custom" })}
        style={chipStyle(isCustom, "--accent")}
        className={`flex items-center justify-center gap-2 rounded-button border-[1.5px] border-dashed p-[13px] font-sans text-[12.5px] font-bold ${
          isCustom ? "text-ink" : "border-line text-ink-dim"
        }`}
      >
        + ADD YOUR OWN CATEGORY
      </button>
      {isCustom && (
        <input
          value={form.customCategory}
          onChange={(e) => onChange({ customCategory: e.target.value })}
          placeholder="Name your category"
          className="rounded-input border border-line bg-card p-[13px] font-sans text-[13px] font-semibold text-ink outline-none"
        />
      )}
    </>
  );
}
