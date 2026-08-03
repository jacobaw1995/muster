import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Coords } from "../lib/distance";
import type { LocationStatus } from "../lib/geolocation";
import { getCategoryMeta, type MusterEvent } from "../lib/mockEvents";
import { useTheme } from "../theme/ThemeContext";
import { AlertIcon, MapPinOffIcon, NearMeIcon } from "./icons";

export type MapDemoState = "live" | "loading" | "empty" | "error";

// Free tiles, no API key/billing — CARTO's basemaps.cartocdn.com endpoint,
// theme-matched (Positron for light, dark_all for dark).
const TILE_URLS: Record<"light" | "dark", string> = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

// Golden, CO — matches the seeded events (see the geolocation migration).
// Only ever shown before a real user location or event pin narrows the
// view, so the exact spot doesn't matter beyond "somewhere with pins on it".
const DEFAULT_CENTER: [number, number] = [39.7555, -105.2211];
const DEFAULT_ZOOM = 11;

function categoryDivIcon(cssVar: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;height:26px;width:26px;transform:rotate(-45deg);align-items:center;justify-content:center;border-radius:50% 50% 50% 0;border:2px solid var(--bg);box-shadow:0 3px 8px rgba(0,0,0,0.4);background:var(${cssVar})"><span style="height:6px;width:6px;transform:rotate(45deg);border-radius:9999px;background:var(--bg)"></span></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

function userLocationDivIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;height:14px;width:14px;border-radius:9999px;background:var(--accent);border:3px solid var(--bg);box-shadow:0 0 0 5px color-mix(in srgb, var(--accent) 30%, transparent)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

interface MapPanelProps {
  demoState: MapDemoState;
  events: MusterEvent[];
  radiusMi: number;
  onCycleRadius: () => void;
  userLocation: Coords | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onSelectEvent: (id: string) => void;
  /** Extra classes merged onto the root — callers use this for the mobile-inline vs desktop-fill sizing (see MapScreen). */
  className?: string;
}

/**
 * Real Leaflet map (Phase 7) — free CARTO/OSM tiles, category-colored
 * divIcon markers at each event's real lat/lng, and an optional
 * user-location marker. Both the mobile inline panel and the desktop fill
 * map mount their own independent instance of this component (see
 * MapScreen/AppShell); a hidden instance (display:none while the other
 * breakpoint is active) inits at zero size, so a ResizeObserver drives
 * `invalidateSize()` whenever the container's actual size changes —
 * without it a map that started hidden renders blank once shown.
 */
export function MapPanel({
  demoState,
  events,
  radiusMi,
  onCycleRadius,
  userLocation,
  locationStatus,
  onRequestLocation,
  onSelectEvent,
  className = "",
}: MapPanelProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasCenteredOnUserRef = useRef(false);

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Self-heals a map that was initialized while its container was
  // display:none (zero-sized) — Leaflet needs an explicit nudge once the
  // container actually has real dimensions, it won't notice on its own.
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Theme-aware tiles — swapped wholesale on toggle rather than restyled.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const layer = L.tileLayer(TILE_URLS[theme], {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    });
    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [theme]);

  // Event markers — re-synced whenever the filtered list changes. Events
  // with no lat/lng (geocode failed, or never ran) simply don't get a pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (demoState !== "live") return;

    for (const ev of events) {
      if (ev.latitude == null || ev.longitude == null) continue;
      const meta = getCategoryMeta(ev.category);
      const marker = L.marker([ev.latitude, ev.longitude], {
        icon: categoryDivIcon(meta.cssVar),
        alt: ev.title,
      });
      marker.on("click", () => onSelectEvent(ev.id));
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [events, demoState, onSelectEvent]);

  // User-location marker + a ONE-TIME recenter the first time we learn
  // where they are (not on every render — the user may have panned since).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userLocation) return;
    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userLocationDivIcon(),
      alt: "Your location",
      zIndexOffset: 1000,
    });
    marker.addTo(map);
    userMarkerRef.current = marker;
    if (!hasCenteredOnUserRef.current) {
      hasCenteredOnUserRef.current = true;
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation]);

  const handleNearMeClick = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
    } else {
      onRequestLocation();
    }
  };

  const handleRadiusClick = () => {
    if (userLocation) {
      onCycleRadius();
    } else {
      onRequestLocation();
    }
  };

  const radiusLabel = userLocation
    ? `${radiusMi} MI RADIUS ▾`
    : locationStatus === "denied"
      ? "LOCATION OFF"
      : locationStatus === "requesting"
        ? "LOCATING…"
        : "ENABLE LOCATION";

  return (
    <div
      className={`relative mx-[14px] mb-3 h-[280px] flex-none overflow-hidden rounded-[16px] border border-line bg-map-land ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0" />

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
            {userLocation
              ? `No events within ${radiusMi} mi. Widen your radius or be the first to post one.`
              : "No events match yet. Be the first to post one."}
          </div>
        </div>
      )}

      {demoState === "live" && (
        <>
          {!userLocation && locationStatus !== "denied" && (
            <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[75%] rounded-lg border border-line bg-card/90 px-2.5 py-1.5 font-sans text-[10.5px] font-semibold text-ink-dim backdrop-blur">
              Enable location to see events near you
            </div>
          )}

          <button
            type="button"
            onClick={handleNearMeClick}
            aria-label="Center on my location"
            aria-pressed={Boolean(userLocation)}
            className={`absolute bottom-3 right-3 z-[500] flex h-10 w-10 items-center justify-center rounded-full border border-line shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${
              userLocation ? "bg-accent" : "bg-card"
            }`}
          >
            <NearMeIcon
              fill={userLocation ? "var(--accent-on)" : "none"}
              className={userLocation ? "text-accent-on" : "text-ink"}
            />
          </button>

          <button
            type="button"
            onClick={handleRadiusClick}
            className="absolute bottom-3 left-3 z-[500] rounded-lg border border-line bg-card px-[9px] py-[5px] font-mono text-[10px] font-semibold text-ink"
          >
            {radiusLabel}
          </button>
        </>
      )}
    </div>
  );
}
