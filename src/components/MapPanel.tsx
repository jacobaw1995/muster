import { getCategoryMeta, type MusterEvent } from "../lib/mockEvents";
import { AlertIcon, MapPinOffIcon, NearMeIcon } from "./icons";

export type MapDemoState = "live" | "loading" | "empty" | "error";

interface MapPanelProps {
  demoState: MapDemoState;
  events: MusterEvent[];
  radiusMi: number;
  onCycleRadius: () => void;
  nearMe: boolean;
  onToggleNearMe: () => void;
  onSelectEvent: (id: string) => void;
  /** Extra classes merged onto the root — callers use this for the mobile-inline vs desktop-fill sizing (see MapScreen). */
  className?: string;
}

/**
 * Flat basemap styled like Google/Apple Maps, built entirely from the
 * map* tokens — no real map library. Pins reflect the already-filtered
 * event list so the radius/category/search filters visibly move pins.
 */
export function MapPanel({
  demoState,
  events,
  radiusMi,
  onCycleRadius,
  nearMe,
  onToggleNearMe,
  onSelectEvent,
  className = "",
}: MapPanelProps) {
  return (
    <div
      className={`relative mx-[14px] mb-3 h-[280px] flex-none overflow-hidden rounded-[16px] border border-line bg-map-land ${className}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 360 280"
        className="absolute inset-0"
      >
        <rect
          x="0"
          y="0"
          width="360"
          height="280"
          style={{ fill: "var(--map-land)" }}
        />
        <path
          d="M250 280 L360 280 L360 150 C 300 170, 260 210, 250 280 Z"
          style={{ fill: "var(--map-water)" }}
        />
        <path
          d="M30 40 C 70 20, 120 30, 130 70 C 140 110, 90 120, 60 100 C 30 80, 10 55, 30 40 Z"
          style={{ fill: "var(--map-park)" }}
        />
        <g style={{ stroke: "var(--map-road)" }} strokeWidth={1}>
          <path d="M0 30 L360 30" />
          <path d="M0 65 L360 65" />
          <path d="M0 100 L360 100" />
          <path d="M0 135 L360 135" />
          <path d="M0 170 L360 170" />
          <path d="M0 205 L360 205" />
          <path d="M0 240 L360 240" />
          <path d="M40 0 L40 280" />
          <path d="M85 0 L85 280" />
          <path d="M130 0 L130 280" />
          <path d="M175 0 L175 280" />
          <path d="M220 0 L220 280" />
          <path d="M265 0 L265 280" />
          <path d="M310 0 L310 280" />
        </g>
        <path
          d="M0 120 L360 160"
          style={{ stroke: "var(--map-road-main)" }}
          strokeWidth={4.5}
        />
        <path
          d="M150 0 L200 280"
          style={{ stroke: "var(--map-road-main)" }}
          strokeWidth={4.5}
        />
        <text
          x="205"
          y="112"
          fontSize="9"
          fontFamily="Barlow, sans-serif"
          fontWeight="600"
          style={{ fill: "var(--map-label)" }}
          transform="rotate(9 205 112)"
        >
          Ridgeline Ave
        </text>
        <text
          x="152"
          y="150"
          fontSize="9"
          fontFamily="Barlow, sans-serif"
          fontWeight="600"
          style={{ fill: "var(--map-label)" }}
          transform="rotate(80 152 150)"
        >
          Basin St
        </text>
        <text
          x="70"
          y="70"
          fontSize="9.5"
          fontFamily="Barlow, sans-serif"
          fontWeight="700"
          style={{ fill: "var(--map-label)" }}
        >
          FOUNDERS PARK
        </text>
        <text
          x="18"
          y="20"
          fontSize="11"
          fontFamily="Anton, sans-serif"
          style={{ fill: "var(--ink)" }}
          opacity={0.8}
        >
          BASIN COUNTY
        </text>
      </svg>

      {demoState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-bg">
          <div className="h-[30px] w-[30px] animate-[spin_0.8s_linear_infinite] rounded-full border-[3px] border-line border-t-accent" />
          <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-dim">
            LOCATING EVENTS…
          </div>
        </div>
      )}

      {demoState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg px-[30px] text-center">
          <AlertIcon className="text-danger" />
          <div className="font-sans text-[13px] font-bold text-ink">
            Couldn't load the map
          </div>
          <div className="font-sans text-[11px] leading-[1.4] text-ink-dim">
            Check your connection and try again.
          </div>
        </div>
      )}

      {demoState === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg px-[30px] text-center">
          <MapPinOffIcon className="text-ink-dim" />
          <div className="font-sans text-[13px] font-bold text-ink">
            Nothing happening nearby
          </div>
          <div className="font-sans text-[11px] leading-[1.4] text-ink-dim">
            No events within {radiusMi} mi. Widen your radius or be the first to
            post one.
          </div>
        </div>
      )}

      {demoState === "live" && (
        <>
          {events.map((ev) => {
            const meta = getCategoryMeta(ev.category);
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onSelectEvent(ev.id)}
                aria-label={ev.title}
                className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center border-none bg-transparent p-0"
                style={{ left: `${ev.x}%`, top: `${ev.y}%` }}
              >
                <span
                  className="flex h-[26px] w-[26px] rotate-[-45deg] items-center justify-center rounded-[50%_50%_50%_0] border-2 border-bg shadow-[0_3px_8px_rgba(0,0,0,0.4)]"
                  style={{ background: `var(${meta.cssVar})` }}
                >
                  <span className="h-1.5 w-1.5 rotate-45 rounded-full bg-bg" />
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onToggleNearMe}
            aria-label="Center on my location"
            aria-pressed={nearMe}
            className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-line shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${
              nearMe ? "bg-accent" : "bg-card"
            }`}
          >
            <NearMeIcon
              fill={nearMe ? "var(--accent-on)" : "none"}
              className={nearMe ? "text-accent-on" : "text-ink"}
            />
          </button>

          <button
            type="button"
            onClick={onCycleRadius}
            className="absolute bottom-3 left-3 rounded-lg border border-line bg-card px-[9px] py-[5px] font-mono text-[10px] font-semibold text-ink"
          >
            {radiusMi} MI RADIUS ▾
          </button>
        </>
      )}
    </div>
  );
}
