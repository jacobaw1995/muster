import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BasicsStep } from "../components/create/BasicsStep";
import { CategoryStep } from "../components/create/CategoryStep";
import { DetailsStep } from "../components/create/DetailsStep";
import { ReviewStep } from "../components/create/ReviewStep";
import { ChevronLeftIcon, XIcon } from "../components/icons";
import { geocodeAddress } from "../lib/api/geocode";
import {
  deriveDurationSelection,
  resolveDuration,
} from "../lib/duration";
import {
  formatTimeOfDay,
  parseTimeOfDayTo24h,
  todayIso,
} from "../lib/format";
import { CATEGORY_ORDER, type MusterEvent } from "../lib/mockEvents";
import type { NewEventInput, UpdateEventInput } from "../state/SessionContext";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

const TOTAL_STEPS = 4;

export interface CreateFormState {
  /** '' (none chosen), a built-in CategoryKey, or the "custom" sentinel — matches the design file's own state shape. */
  category: string;
  customCategory: string;
  title: string;
  /** Optional venue/label, e.g. "Basin Park trailhead" — city/state below are what actually get geocoded. */
  venueName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  date: string;
  time: string;
  /** A DURATION_PRESETS key, or the CUSTOM_DURATION_KEY sentinel (paired with durationCustomHours) — see lib/duration.ts. */
  durationChoice: string;
  durationCustomHours: string;
  cost: string;
  capacity: string;
  notes: string;
  website: string;
  photoUrl: string | null;
  going: boolean;
}

const INITIAL_FORM: CreateFormState = {
  category: "",
  customCategory: "",
  title: "",
  venueName: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  date: "",
  time: "",
  durationChoice: "2h",
  durationCustomHours: "",
  cost: "",
  capacity: "",
  notes: "",
  website: "",
  photoUrl: null,
  going: true,
};

/** Reverse of the field-building in handleSubmit — reconstructs the Create form's shape from a stored event (Phase 10 edit flow). */
function formFromEvent(event: MusterEvent): CreateFormState {
  const isBuiltIn = (CATEGORY_ORDER as string[]).includes(event.category);
  const duration = deriveDurationSelection(
    event.durationLabel,
    event.durationMinutes,
  );
  return {
    category: isBuiltIn ? event.category : "custom",
    customCategory: isBuiltIn ? "" : event.category,
    title: event.title,
    venueName: event.location ?? "",
    street: event.street ?? "",
    city: event.city ?? "",
    state: event.state ?? "",
    zip: event.zip ?? "",
    date: event.date,
    time: parseTimeOfDayTo24h(event.time),
    durationChoice: duration.durationChoice,
    durationCustomHours: duration.durationCustomHours,
    cost: event.cost === "FREE" ? "" : event.cost,
    capacity: event.capacity != null ? String(event.capacity) : "",
    notes: event.notes,
    website: event.website ?? "",
    photoUrl: event.photoUrl,
    going: true,
  };
}

export default function CreateScreen() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const {
    events,
    loading,
    addEvent,
    updateEvent,
    setRsvp,
    addToItinerary,
  } = useSession();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateFormState>(INITIAL_FORM);
  const [posting, setPosting] = useState(false);

  const isEditMode = Boolean(editId);
  const editingEvent = editId ? events.find((e) => e.id === editId) : undefined;

  const prefilledRef = useRef(false);
  const originalAddressRef = useRef<{
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);

  useEffect(() => {
    if (!isEditMode || prefilledRef.current || !editingEvent) return;
    prefilledRef.current = true;
    setForm(formFromEvent(editingEvent));
    originalAddressRef.current = {
      street: editingEvent.street ?? "",
      city: editingEvent.city ?? "",
      state: editingEvent.state ?? "",
      zip: editingEvent.zip ?? "",
    };
  }, [isEditMode, editingEvent]);

  const update = (patch: Partial<CreateFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setStep(0);
  };

  const handleClose = () => {
    if (isEditMode && editId) {
      navigate(`/events/${editId}`);
      return;
    }
    resetForm();
    navigate("/");
  };

  // Hooks above this line run unconditionally on every render (Rules of
  // Hooks) — the edit-mode loading/not-found states below are plain early
  // returns, same pattern as EventDetailScreen/SettingsScreen.
  if (isEditMode && loading) {
    return null;
  }
  if (isEditMode && !loading && !editingEvent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[30px] text-center">
        <div className="font-sans text-sm font-bold text-ink">
          Event not found
        </div>
        <div className="font-sans text-xs font-medium text-ink-dim">
          This link may have expired, or the event was removed.
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-[10px] border-none bg-signal px-[22px] py-3 font-sans text-[12.5px] font-bold tracking-[0.03em] text-signal-on"
        >
          BACK TO MAP
        </button>
      </div>
    );
  }

  const nextDisabled =
    (step === 0 && !form.category) ||
    (step === 1 &&
      (!form.title.trim() || !form.city.trim() || !form.state.trim()));

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (posting) return;
    setPosting(true);
    const isCustom = form.category === "custom";
    const category = isCustom
      ? form.customCategory.trim() || "custom"
      : form.category;
    const cost = form.cost.trim()
      ? form.cost.trim().startsWith("$")
        ? form.cost.trim()
        : `$${form.cost.trim()}`
      : "FREE";
    const capacityNum = form.capacity.trim()
      ? Number(form.capacity.trim())
      : NaN;
    const duration = resolveDuration(form.durationChoice, form.durationCustomHours);

    const original = originalAddressRef.current;
    const addressChanged =
      !isEditMode ||
      !original ||
      form.street.trim() !== original.street ||
      form.city.trim() !== original.city ||
      form.state.trim() !== original.state ||
      form.zip.trim() !== original.zip;

    // Geocoded only when the address actually changed (or it's a brand-new
    // event) — never per render, never a wasted call on an unchanged
    // address. A failure never blocks saving: the event just keeps
    // whatever pin it had (or none) until re-geocoded.
    let latitude: number | null = null;
    let longitude: number | null = null;
    let geoFailed = false;
    if (addressChanged) {
      const geo = await geocodeAddress({
        street: form.street.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim() || undefined,
      });
      latitude = geo?.lat ?? null;
      longitude = geo?.lng ?? null;
      geoFailed = !geo;
    } else if (editingEvent) {
      latitude = editingEvent.latitude;
      longitude = editingEvent.longitude;
    }

    const payload: UpdateEventInput = {
      title: form.title.trim() || "Untitled event",
      category,
      location: form.venueName.trim() || null,
      street: form.street.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim() || null,
      latitude,
      longitude,
      date: form.date || todayIso(),
      time: form.time ? formatTimeOfDay(form.time) : "12:00 PM",
      durationLabel: duration.label,
      durationMinutes: duration.minutes,
      cost,
      capacity: Number.isFinite(capacityNum) ? capacityNum : null,
      notes: form.notes.trim() || "No additional notes from the organizer.",
      website: form.website.trim() || null,
      photoUrl: form.photoUrl,
    };

    try {
      if (isEditMode && editId) {
        await updateEvent(editId, payload);
        showToast(
          geoFailed ? "Changes saved — couldn't re-pin the new address yet" : "Changes saved",
        );
        navigate(`/events/${editId}`);
      } else {
        const input: NewEventInput = { ...payload, organizer: "You" };
        const created = await addEvent(input);
        if (form.going) {
          setRsvp(created.id, "yes");
          addToItinerary(created.id);
        }
        showToast(
          geoFailed ? "Event posted — couldn't pin it on the map yet" : "Event posted — live now",
        );
        resetForm();
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      showToast(
        isEditMode
          ? "Couldn't save changes — try again"
          : "Couldn't post your event — try again",
      );
    } finally {
      setPosting(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    void handleSubmit();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none flex-col gap-3 px-5 pb-3.5 pt-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line bg-card"
          >
            <XIcon size={15} />
          </button>
          <div className="font-display text-[22px] text-ink">
            {isEditMode ? "EDIT EVENT" : "POST AN EVENT"}
          </div>
          <span className="font-mono text-[10px] font-semibold text-ink-dim">
            STEP {step + 1} OF {TOTAL_STEPS}
          </span>
        </div>
        <div className="flex gap-[5px]">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-accent" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
        {step === 0 && <CategoryStep form={form} onChange={update} />}
        {step === 1 && <BasicsStep form={form} onChange={update} />}
        {step === 2 && <DetailsStep form={form} onChange={update} />}
        {step === 3 && (
          <ReviewStep form={form} onChange={update} isEditMode={isEditMode} />
        )}
      </div>

      <div className="flex flex-none gap-2.5 bg-bg px-5 pb-24 pt-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="flex w-[52px] flex-none items-center justify-center rounded-[12px] border-[1.5px] border-line bg-card text-ink"
          >
            <ChevronLeftIcon />
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={nextDisabled || posting}
          className="flex-1 rounded-[12px] border-none bg-signal p-[15px] font-sans text-sm font-bold tracking-[0.03em] text-signal-on disabled:cursor-not-allowed disabled:opacity-45"
        >
          {step < TOTAL_STEPS - 1
            ? "CONTINUE"
            : posting
              ? isEditMode
                ? "SAVING…"
                : "POSTING…"
              : isEditMode
                ? "SAVE CHANGES"
                : "POST EVENT"}
        </button>
      </div>
    </div>
  );
}
