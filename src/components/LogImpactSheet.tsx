import { useState } from "react";
import { fmtDateLabel } from "../lib/format";
import { useSession } from "../state/SessionContext";
import { useToast } from "../state/ToastContext";
import { BottomSheet } from "./BottomSheet";

interface LogImpactSheetProps {
  onClose: () => void;
}

const numberInputClass =
  "rounded-input border border-line bg-card p-[13px] font-sans text-sm font-semibold text-ink outline-none";

/**
 * Mounted only while the sheet is open (see ImpactScreen's `{logSheetOpen &&
 * ...}` render), so local form state starts fresh every time — no reset
 * effect needed.
 */
export function LogImpactSheet({ onClose }: LogImpactSheetProps) {
  const { events, rsvp, logImpact } = useSession();
  const { showToast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [bags, setBags] = useState("");
  const [miles, setMiles] = useState("");
  const [people, setPeople] = useState("");

  const eligibleEvents = events.filter((e) => rsvp[e.id] === "yes");
  const selectedEvent = eligibleEvents.find((e) => e.id === selectedEventId);

  const handleSubmit = () => {
    if (!selectedEventId) return;
    logImpact(selectedEventId, {
      bags: Number(bags) || 0,
      miles: Number(miles) || 0,
      people: Number(people) || 0,
    });
    onClose();
    showToast("Logged — totals updated");
  };

  return (
    <BottomSheet open onClose={onClose} label="Log impact for an event">
      <div className="font-sans text-[15px] font-bold text-ink">
        Log impact for an event
      </div>
      <div className="-mt-2 font-sans text-xs font-medium text-ink-dim">
        Impact is tied to an event you RSVP'd yes to — pick which one this was
        for.
      </div>

      {eligibleEvents.length === 0 ? (
        <>
          <div className="py-2 font-sans text-[12.5px] leading-[1.5] text-ink-dim">
            RSVP "yes" to an event first, then come back here to log what you
            did for it.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-input border border-line bg-card p-[13px] font-sans text-[12.5px] font-bold text-ink"
          >
            CLOSE
          </button>
        </>
      ) : (
        <>
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
            {eligibleEvents.map((event) => {
              const active = event.id === selectedEventId;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className={`flex flex-col items-start gap-0.5 rounded-input border-[1.5px] p-[11px_13px] text-left ${
                    active ? "border-accent" : "border-line bg-card"
                  }`}
                >
                  <span className="font-sans text-[12.5px] font-bold text-ink">
                    {event.title}
                  </span>
                  <span className="font-mono text-[10.5px] font-semibold text-ink-dim">
                    {fmtDateLabel(event.date)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedEvent && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
                  BAGS OF TRASH
                </span>
                <input
                  value={bags}
                  onChange={(e) => setBags(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                  className={numberInputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
                  MILES RUCKED
                </span>
                <input
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className={numberInputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
                  PEOPLE HELPED
                </span>
                <input
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                  className={numberInputClass}
                />
              </label>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-[12px] border-none bg-accent p-[15px] font-sans text-[13.5px] font-bold text-accent-on"
              >
                LOG IT FOR {selectedEvent.title}
              </button>
            </>
          )}
        </>
      )}
    </BottomSheet>
  );
}
