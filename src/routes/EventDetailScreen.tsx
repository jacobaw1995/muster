import { useState, type CSSProperties } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ErrorState } from "../components/ErrorState";
import { PhotoSlot } from "../components/PhotoSlot";
import { ShareSheet } from "../components/ShareSheet";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MapPinOffIcon,
  PeopleIcon,
  ShareIcon,
} from "../components/icons";
import { eventDistanceMi } from "../lib/distance";
import { fmtDateLabel, fmtDistance, fmtVenueLine } from "../lib/format";
import { getCategoryMeta, withRsvpCounts } from "../lib/mockEvents";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

function RsvpButton({
  label,
  active,
  disabled,
  colorVar,
  onVar,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  colorVar: string;
  onVar: string;
  onClick: () => void;
}) {
  const style: CSSProperties = {
    borderColor: `var(${colorVar})`,
    backgroundColor: active ? `var(${colorVar})` : "transparent",
    color: active ? `var(${onVar})` : `var(${colorVar})`,
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={style}
      className="flex-1 rounded-[10px] border-[1.5px] p-3 font-sans text-[12.5px] font-bold tracking-[0.03em] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export default function EventDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    events,
    rsvp,
    setRsvp,
    itinerary,
    addToItinerary,
    toggleItinerary,
    loading,
    loadError,
    retryLoad,
    userLocation,
    userId,
    deleteEvent,
  } = useSession();
  const { showToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const event = events.find((e) => e.id === id);
  // While the initial fetch is still in flight `events` is empty, so a
  // direct/deep link to a real event would otherwise look indistinguishable
  // from a dead one — wait for it to resolve before deciding.
  if (loading) {
    return null;
  }
  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <ErrorState
          message="Couldn't load this event. Check your connection."
          onRetry={retryLoad}
        />
      </div>
    );
  }
  if (!event) {
    // Dead/unknown share link, or an event that's since been deleted — a
    // real state (not a silent redirect) per the spec's flagged follow-up.
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[30px] text-center">
        <MapPinOffIcon className="text-ink-dim" />
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

  const status = rsvp[event.id] ?? null;
  const counts = withRsvpCounts(event, status);
  const meta = getCategoryMeta(event.category);
  const inItinerary = itinerary.includes(event.id);
  const nameChips = event.attendees.slice(0, 4);
  const moreCount = Math.max(0, counts.going - nameChips.length);
  const showMoreLabel = event.attendees.length > 4 || status === "yes";

  // Client-side only for now — TODO(Phase 4 follow-up): enforce this
  // server-side too (a DB check/trigger on rsvps), which belongs with the
  // later anti-spam/hardening pass, not this phase.
  const atCapacity = event.capacity != null && counts.going >= event.capacity;
  const yesBlocked = atCapacity && status !== "yes";

  const originState = location.state as { from?: string } | null;
  const backTarget = originState?.from === "itinerary" ? "/itinerary" : "/";
  const goBack = () => navigate(backTarget);

  const shareUrl = `${window.location.origin}/events/${event.id}`;

  // Works for anonymous creators too — created_by defaults to auth.uid() at
  // insert time (see the auth_rls migration) regardless of whether that
  // session is anonymous or permanent, and it persists across reloads on
  // the same device via the Supabase client's own session storage.
  const isOwner = userId != null && event.createdBy === userId;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      showToast("Event deleted");
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast("Couldn't delete this event — try again");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRsvpYes = () => {
    if (yesBlocked) return;
    const willBecomeYes = status !== "yes";
    const alreadyInItinerary = itinerary.includes(event.id);
    setRsvp(event.id, "yes");
    if (willBecomeYes && !alreadyInItinerary) {
      addToItinerary(event.id);
      showToast("Added to itinerary");
    }
  };

  const handleToggleItinerary = () => {
    const has = itinerary.includes(event.id);
    toggleItinerary(event.id);
    showToast(has ? "Removed from itinerary" : "Added to itinerary");
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setShareOpen(false);
    showToast("Link copied");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[100px]">
      <div className="relative h-[150px] flex-none overflow-hidden">
        <PhotoSlot
          photoUrl={event.photoUrl}
          label="Add an event photo"
          className="h-full w-full"
        />
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-[34px] w-[34px] items-center justify-center rounded-full border-none bg-black/50 text-white backdrop-blur"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="Share"
          className="absolute right-4 top-4 flex h-[34px] w-[34px] items-center justify-center rounded-full border-none bg-black/50 text-white backdrop-blur"
        >
          <ShareIcon />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-[18px]">
        <div className="flex flex-col gap-2">
          <span
            className="self-start rounded-pill border px-2.5 py-[5px] font-mono text-[10px] font-bold tracking-[0.1em]"
            style={{
              color: `var(${meta.cssVar})`,
              borderColor: `color-mix(in srgb, var(${meta.cssVar}) 33%, transparent)`,
              backgroundColor: `color-mix(in srgb, var(${meta.cssVar}) 12%, transparent)`,
            }}
          >
            {meta.label}
          </span>
          <div className="font-display text-[26px] leading-[1.05] tracking-[0.01em] text-ink">
            {event.title}
          </div>
          <div className="font-sans text-xs font-semibold text-ink-dim">
            Hosted by {event.organizer}
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/events/${event.id}/edit`)}
              className="flex-1 rounded-input border-[1.5px] border-line bg-card p-3 font-sans text-[12.5px] font-bold text-ink"
            >
              EDIT EVENT
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex-1 rounded-input border-[1.5px] border-danger bg-transparent p-3 font-sans text-[12.5px] font-bold text-danger"
            >
              DELETE
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5 rounded-card border border-line bg-card px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <CalendarIcon className="mt-0.5 flex-none text-accent" />
            <div>
              <div className="font-sans text-[13px] font-bold text-ink">
                {fmtDateLabel(event.date)}
              </div>
              <div className="font-sans text-[11.5px] font-medium text-ink-dim">
                {event.time} · {event.durationLabel}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPinIcon className="mt-0.5 flex-none text-accent" />
            <div>
              <div className="font-sans text-[13px] font-bold text-ink">
                {fmtVenueLine(event)}
              </div>
              <div className="font-sans text-[11.5px] font-medium text-ink-dim">
                {fmtDistance(eventDistanceMi(userLocation, event))}
                {eventDistanceMi(userLocation, event) != null ? " away" : ""}
              </div>
            </div>
          </div>
          <div className="flex gap-[18px]">
            <div className="flex items-center gap-2">
              <ClockIcon className="text-accent" />
              <span className="font-mono text-[13px] font-bold text-ink">
                {event.cost}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PeopleIcon className={atCapacity ? "text-danger" : "text-accent"} />
              <span
                className={`font-mono text-[13px] font-bold ${atCapacity ? "text-danger" : "text-ink"}`}
              >
                {event.capacity != null
                  ? `${Math.min(counts.going, event.capacity)}/${event.capacity} CAP${atCapacity ? " · FULL" : ""}`
                  : `${counts.going} GOING`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-ink-dim">
            ORGANIZER NOTES
          </div>
          <div className="font-sans text-[13px] leading-[1.55] text-ink">
            {event.notes}
          </div>
        </div>

        {event.website && (
          <a
            href={event.website}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 rounded-input border-[1.5px] border-accent p-[13px] font-sans text-[12.5px] font-bold text-accent no-underline"
          >
            <ExternalLinkIcon />
            VISIT HOST WEBSITE &amp; TICKETS
          </a>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-ink-dim">
              ARE YOU IN?
            </div>
            <div className="font-sans text-[11px] font-semibold text-ink-dim">
              {counts.going} going · {counts.maybe} maybe
            </div>
          </div>
          <div className="flex gap-2">
            <RsvpButton
              label="YES"
              active={status === "yes"}
              disabled={yesBlocked}
              colorVar="--accent"
              onVar="--accent-on"
              onClick={handleRsvpYes}
            />
            <RsvpButton
              label="MAYBE"
              active={status === "maybe"}
              colorVar="--warn"
              onVar="--warn-on"
              onClick={() => setRsvp(event.id, "maybe")}
            />
            <RsvpButton
              label="NO"
              active={status === "no"}
              colorVar="--danger"
              onVar="--danger-on"
              onClick={() => setRsvp(event.id, "no")}
            />
          </div>
          {yesBlocked && (
            <div className="font-sans text-[11px] font-semibold text-danger">
              At capacity — this event is full. You can still RSVP Maybe or No.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {nameChips.map((name) => (
              <span
                key={name}
                className="rounded-pill border border-line bg-card-alt px-2.5 py-[5px] font-sans text-[11px] font-semibold text-ink"
              >
                {name}
              </span>
            ))}
            {showMoreLabel && moreCount > 0 && (
              <span className="font-sans text-[11px] font-semibold text-ink-dim">
                +{moreCount} more
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleToggleItinerary}
            className={`flex flex-1 items-center justify-center gap-2 rounded-input border-none p-3.5 font-sans text-[13px] font-bold tracking-[0.03em] ${
              inItinerary ? "bg-card text-accent" : "bg-signal text-signal-on"
            }`}
          >
            {inItinerary && <CheckIcon />}
            {inItinerary ? "IN YOUR ITINERARY" : "ADD TO ITINERARY"}
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share"
            className="flex w-12 flex-none items-center justify-center rounded-input border-[1.5px] border-line bg-card"
          >
            <ShareIcon className="text-ink" />
          </button>
        </div>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        event={event}
        shareUrl={shareUrl}
        onCopyLink={handleCopyLink}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this event?"
        message="This can't be undone. Its RSVPs, itinerary entries, and impact logs go with it."
        confirmLabel="DELETE"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
