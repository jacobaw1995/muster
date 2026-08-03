import type { Coords } from "./distance";

export type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export type LocationResult =
  | { status: "granted"; coords: Coords }
  | { status: "denied" }
  | { status: "unavailable" };

/**
 * Wraps the browser Geolocation API in a Promise, distinguishing "denied"
 * (user said no — show a subtle re-enable hint) from "unavailable" (no API,
 * or a transient error) so callers can render the right affordance instead
 * of just silently not filtering by distance.
 */
export function requestBrowserLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve({ status: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }),
      (err) =>
        resolve({
          status:
            err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}
