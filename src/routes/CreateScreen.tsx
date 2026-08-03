import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BasicsStep } from "../components/create/BasicsStep";
import { CategoryStep } from "../components/create/CategoryStep";
import { DetailsStep } from "../components/create/DetailsStep";
import { ReviewStep } from "../components/create/ReviewStep";
import { ChevronLeftIcon, XIcon } from "../components/icons";
import { geocodeAddress } from "../lib/api/geocode";
import { formatTimeOfDay, todayIso } from "../lib/format";
import type { NewEventInput } from "../state/SessionContext";
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
  duration: string;
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
  duration: "2 hours",
  cost: "",
  capacity: "",
  notes: "",
  website: "",
  photoUrl: null,
  going: true,
};

export default function CreateScreen() {
  const navigate = useNavigate();
  const { addEvent, setRsvp, addToItinerary } = useSession();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateFormState>(INITIAL_FORM);
  const [posting, setPosting] = useState(false);

  const update = (patch: Partial<CreateFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setStep(0);
  };

  const handleClose = () => {
    resetForm();
    navigate("/");
  };

  const nextDisabled =
    (step === 0 && !form.category) ||
    (step === 1 &&
      (!form.title.trim() || !form.city.trim() || !form.state.trim()));

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handlePost = async () => {
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

    // Geocoded once, here, at creation time — never per map render (see
    // supabase/functions/geocode). A failure never blocks posting: the
    // event just goes live without a map pin or real distance until it's
    // re-geocoded.
    const geo = await geocodeAddress({
      street: form.street.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim() || undefined,
    });

    const input: NewEventInput = {
      title: form.title.trim() || "Untitled event",
      category,
      organizer: "You",
      location: form.venueName.trim() || null,
      street: form.street.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim() || null,
      latitude: geo?.lat ?? null,
      longitude: geo?.lng ?? null,
      date: form.date || todayIso(),
      time: form.time ? formatTimeOfDay(form.time) : "12:00 PM",
      durationLabel: form.duration || "2 hours",
      cost,
      capacity: Number.isFinite(capacityNum) ? capacityNum : null,
      notes: form.notes.trim() || "No additional notes from the organizer.",
      website: form.website.trim() || null,
      photoUrl: form.photoUrl,
    };

    try {
      const created = await addEvent(input);
      if (form.going) {
        setRsvp(created.id, "yes");
        addToItinerary(created.id);
      }
      showToast(
        geo
          ? "Event posted — live now"
          : "Event posted — couldn't pin it on the map yet",
      );
      resetForm();
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast("Couldn't post your event — try again");
    } finally {
      setPosting(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    void handlePost();
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
          <div className="font-display text-[22px] text-ink">POST AN EVENT</div>
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
        {step === 3 && <ReviewStep form={form} onChange={update} />}
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
              ? "POSTING…"
              : "POST EVENT"}
        </button>
      </div>
    </div>
  );
}
