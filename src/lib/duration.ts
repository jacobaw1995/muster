export interface DurationPreset {
  key: string;
  label: string;
  /** Minutes for calendar math — null for the two "no fixed length" presets (All day is a full 24h span computed separately; TBD has no real end). */
  minutes: number | null;
}

/** Common event lengths — anything else (half-hours, long days) goes through "Custom…" instead of forcing a rigid preset. */
export const DURATION_PRESETS: DurationPreset[] = [
  { key: "1h", label: "1 hour", minutes: 60 },
  { key: "1.5h", label: "1.5 hours", minutes: 90 },
  { key: "2h", label: "2 hours", minutes: 120 },
  { key: "3h", label: "3 hours", minutes: 180 },
  { key: "4h", label: "4 hours", minutes: 240 },
  { key: "6h", label: "6 hours", minutes: 360 },
  { key: "all_day", label: "All day", minutes: null },
  { key: "tbd", label: "TBD / by ear", minutes: null },
];

export const CUSTOM_DURATION_KEY = "custom";

export interface ResolvedDuration {
  label: string;
  minutes: number | null;
}

/**
 * Turns the Create flow's duration selection (a preset key, or the
 * "custom" sentinel plus a free-text hours value) into the pair of fields
 * events.duration_label/duration_minutes actually store.
 */
export function resolveDuration(
  durationChoice: string,
  durationCustomHours: string,
): ResolvedDuration {
  if (durationChoice === CUSTOM_DURATION_KEY) {
    const hours = Number(durationCustomHours);
    if (!durationCustomHours.trim() || !Number.isFinite(hours) || hours <= 0) {
      // Left blank or invalid — treat like "TBD" rather than post a bogus duration.
      return { label: "TBD", minutes: null };
    }
    return {
      label: `${hours} hour${hours === 1 ? "" : "s"}`,
      minutes: Math.round(hours * 60),
    };
  }
  const preset = DURATION_PRESETS.find((p) => p.key === durationChoice);
  if (!preset) return { label: "2 hours", minutes: 120 };
  return { label: preset.label, minutes: preset.minutes };
}
