import type { CSSProperties } from "react";
import { RADIUS_OPTIONS, type DateFilter } from "../lib/filterEvents";
import { CATEGORY_ORDER, getCategoryMeta } from "../lib/mockEvents";
import { useSession } from "../state/SessionContext";
import { BottomSheet } from "./BottomSheet";
import { Switch } from "./Switch";
import { XIcon } from "./icons";

const DATE_CHOICES: { key: DateFilter; label: string }[] = [
  { key: "any", label: "Any time" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Pick dates" },
];

function chipStyle(active: boolean, cssVar: string): CSSProperties {
  if (!active) return {};
  return {
    borderColor: `var(${cssVar})`,
    backgroundColor: `color-mix(in srgb, var(${cssVar}) 18%, transparent)`,
  };
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  resultCount: number;
}

export function FilterSheet({ open, onClose, resultCount }: FilterSheetProps) {
  const {
    filters,
    toggleCategory,
    setDateFilter,
    setDateFrom,
    setDateTo,
    setRadius,
    setFreeOnly,
    clearFilters,
  } = useSession();

  return (
    <BottomSheet open={open} onClose={onClose} label="Filter events">
      <div className="flex items-center justify-between">
        <div className="font-sans text-[15px] font-bold text-ink">
          Filter events
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clearFilters}
            className="border-none bg-transparent font-sans text-xs font-bold text-accent"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line bg-card text-ink"
          >
            <XIcon size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          CATEGORY
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((key) => {
            const meta = getCategoryMeta(key);
            const active = filters.categories.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                style={chipStyle(active, meta.cssVar)}
                className={`flex items-center gap-1.5 rounded-pill border-[1.5px] px-3 py-[9px] font-sans text-[11.5px] font-bold ${
                  active ? "text-ink" : "border-line bg-card text-ink-dim"
                }`}
              >
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: `var(${meta.cssVar})` }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          WHEN
        </div>
        <div className="flex gap-2">
          {DATE_CHOICES.map((d) => {
            const active = filters.dateFilter === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDateFilter(d.key)}
                className={`flex-1 rounded-[10px] border-[1.5px] px-2.5 py-2.5 font-sans text-[11.5px] font-bold ${
                  active
                    ? "border-accent bg-accent text-accent-on"
                    : "border-line bg-card text-ink-dim"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        {filters.dateFilter === "custom" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 rounded-input border border-line bg-card px-[11px] py-[11px] font-sans text-xs font-semibold text-ink outline-none"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 rounded-input border border-line bg-card px-[11px] py-[11px] font-sans text-xs font-semibold text-ink outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
          SEARCH RADIUS
        </div>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((mi) => {
            const active = filters.radiusMi === mi;
            return (
              <button
                key={mi ?? "any"}
                type="button"
                onClick={() => setRadius(mi)}
                className={`flex-1 rounded-[10px] border-[1.5px] px-2.5 py-2.5 font-sans text-[11.5px] font-bold ${
                  active
                    ? "border-accent bg-accent text-accent-on"
                    : "border-line bg-card text-ink-dim"
                }`}
              >
                {mi == null ? "Any" : `${mi} mi`}
              </button>
            );
          })}
        </div>
        <div className="font-sans text-[10.5px] font-medium text-ink-dim">
          "Any" shows every event regardless of distance, even without
          location enabled.
        </div>
      </div>

      <div
        onClick={() => setFreeOnly(!filters.freeOnly)}
        className="flex cursor-pointer items-center justify-between rounded-card border border-line bg-card p-[13px]"
      >
        <span className="font-sans text-[13px] font-bold text-ink">
          Free events only
        </span>
        <Switch
          checked={filters.freeOnly}
          onCheckedChange={() => setFreeOnly(!filters.freeOnly)}
          ariaLabel="Free events only"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-[12px] border-none bg-accent p-[15px] font-sans text-[13.5px] font-bold text-accent-on"
      >
        SHOW {resultCount} EVENTS
      </button>
    </BottomSheet>
  );
}
