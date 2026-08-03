const EARTH_RADIUS_MI = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in miles. */
export function haversineMi(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MI * c;
}

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Distance from the user's location to an event, or null when either side
 * is unknown (no location permission yet, or the event failed to geocode)
 * — callers render that as "distance unavailable" rather than a fake 0.
 */
export function eventDistanceMi(
  userLocation: Coords | null,
  event: { latitude: number | null; longitude: number | null },
): number | null {
  if (!userLocation || event.latitude == null || event.longitude == null) {
    return null;
  }
  return haversineMi(
    userLocation.lat,
    userLocation.lng,
    event.latitude,
    event.longitude,
  );
}
