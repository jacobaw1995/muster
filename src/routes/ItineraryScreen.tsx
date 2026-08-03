import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { CalendarPlusIcon, ListIcon, XIcon } from "../components/icons";
import {
  buildGoogleCalendarUrl,
  downloadIcsFile,
  eventDateRange,
} from "../lib/calendar";
import { getCategoryMeta, type MusterEvent } from "../lib/mockEvents";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";

function ItineraryRow({
  event,
  onOpen,
  onRemove,
}: {
  event: MusterEvent;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const meta = getCategoryMeta(event.category);
  const d = new Date(event.date + "T00:00:00");
  const day = d.getDate();
  const mon = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  const handleCalendar = (e: MouseEvent) => {
    e.stopPropagation();
    window.open(buildGoogleCalendarUrl(event), "_blank", "noopener");
  };

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    onRemove(event.id);
  };

  return (
    <div
      onClick={() => onOpen(event.id)}
      className="flex cursor-pointer items-center gap-3 rounded-card border border-line bg-card p-3"
    >
      <div className="w-[46px] flex-none text-center">
        <div className="font-mono text-[17px] font-bold text-ink">{day}</div>
        <div
          className="font-mono text-[9px] font-bold tracking-[0.05em]"
          style={{ color: `var(${meta.cssVar})` }}
        >
          {mon}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate font-sans text-[13.5px] font-bold text-ink">
          {event.title}
        </div>
        <div className="font-sans text-[11px] font-medium text-ink-dim">
          {event.time} · {event.location}
        </div>
      </div>
      <button
        type="button"
        onClick={handleCalendar}
        aria-label="Add to Google Calendar"
        className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] border border-line bg-card-alt"
      >
        <CalendarPlusIcon className="text-ink" />
      </button>
      <button
        type="button"
        onClick={handleRemove}
        aria-label="Remove from itinerary"
        className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] border border-line bg-card-alt"
      >
        <XIcon size={13} className="text-ink-dim" />
      </button>
    </div>
  );
}

export default function ItineraryScreen() {
  const navigate = useNavigate();
  const { events, itinerary, removeFromItinerary, loading, loadError, retryLoad } =
    useSession();
  const { showToast } = useToast();

  const items = itinerary
    .map((id) => events.find((e) => e.id === id))
    .filter((e): e is MusterEvent => Boolean(e))
    .sort(
      (a, b) =>
        eventDateRange(a).start.getTime() - eventDateRange(b).start.getTime(),
    );

  const openDetail = (id: string) => {
    navigate(`/events/${id}`, { state: { from: "itinerary" } });
  };

  const handleExport = () => {
    downloadIcsFile(items, "muster-itinerary.ics");
    showToast(".ics file downloaded");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[720px]">
      <div className="flex flex-none flex-col gap-0.5 px-5 pb-2.5 pt-2">
        <div className="font-display text-2xl text-ink">ITINERARY</div>
        <div className="font-sans text-[11px] font-semibold text-ink-dim">
          {items.length} EVENT{items.length === 1 ? "" : "S"} PLANNED
        </div>
      </div>

      {loadError && !loading ? (
        <ErrorState
          message="Couldn't load your itinerary. Check your connection."
          onRetry={retryLoad}
          className="flex-1 justify-center"
        />
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[30px] text-center">
          <ListIcon size={30} className="text-ink-dim" />
          <div className="font-sans text-sm font-bold text-ink">
            Your plan is empty
          </div>
          <div className="font-sans text-xs font-medium text-ink-dim">
            Add events from the map to start building your week.
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-[10px] border-none bg-accent px-[22px] py-3 font-sans text-[12.5px] font-bold text-accent-on"
          >
            BROWSE EVENTS
          </button>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pb-3 pt-1">
            {items.map((event) => (
              <ItineraryRow
                key={event.id}
                event={event}
                onOpen={openDetail}
                onRemove={removeFromItinerary}
              />
            ))}
          </div>
          <div className="flex-none px-5 pb-24 pt-2.5">
            <button
              type="button"
              onClick={handleExport}
              className="w-full rounded-[12px] border-none bg-accent p-[15px] font-sans text-[13.5px] font-bold tracking-[0.03em] text-accent-on"
            >
              EXPORT ALL — .ICS FILE
            </button>
          </div>
        </>
      )}
    </div>
  );
}
