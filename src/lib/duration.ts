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

export interface DurationSelection {
  durationChoice: string;
  durationCustomHours: string;
}

/**
 * The inverse of resolveDuration — given a stored event's duration_label/
 * duration_minutes (Phase 10 edit flow), reconstructs which preset (or
 * custom hours value) the Create form should show pre-selected.
 */
export function deriveDurationSelection(
  durationLabel: string,
  durationMinutes: number | null,
): DurationSelection {
  const preset = DURATION_PRESETS.find((p) => p.label === durationLabel);
  if (preset) return { durationChoice: preset.key, durationCustomHours: "" };
  if (durationMinutes != null && durationMinutes > 0) {
    const hours = durationMinutes / 60;
    return {
      durationChoice: CUSTOM_DURATION_KEY,
      durationCustomHours: String(hours),
    };
  }
  // Doesn't match a preset label and there's no minutes to derive hours
  // from (e.g. a blank "Custom…" was saved as "TBD" — see resolveDuration)
  // — the TBD preset is the closest honest fallback.
  return { durationChoice: "tbd", durationCustomHours: "" };
}

/**
 * Used by the "paste a link" autofill (Phase 15): a scraped page's
 * endDate-minus-startDate rarely lands exactly on one of the fixed
 * presets, so this snaps to whichever preset is numerically CLOSEST
 * rather than falling through to "Custom…" — a scraped "2h 10m" event
 * should land on the 2-hour chip, not force the user into a custom-hours
 * field for a difference that small.
 */
export function snapDurationToNearestPreset(hours: number): DurationSelection {
  if (!Number.isFinite(hours) || hours <= 0) {
    return { durationChoice: "tbd", durationCustomHours: "" };
  }
  const timedPresets = DURATION_PRESETS.filter(
    (p): p is DurationPreset & { minutes: number } => p.minutes != null,
  );
  const targetMinutes = hours * 60;
  let closest = timedPresets[0];
  let closestDiff = Math.abs(closest.minutes - targetMinutes);
  for (const preset of timedPresets.slice(1)) {
    const diff = Math.abs(preset.minutes - targetMinutes);
    if (diff < closestDiff) {
      closest = preset;
      closestDiff = diff;
    }
  }
  return { durationChoice: closest.key, durationCustomHours: "" };
}
