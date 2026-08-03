import { supabase } from "../supabase";

export interface GeocodeAddress {
  street?: string;
  city: string;
  state: string;
  zip?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Geocodes an address via the `geocode` Edge Function (Nominatim, cached
 * server-side — see supabase/functions/geocode). Returns null on any
 * failure so posting an event never blocks on this: the caller just stores
 * null lat/lng and the event posts without a map pin or real distance
 * until it's re-geocoded.
 */
export async function geocodeAddress(
  address: GeocodeAddress,
): Promise<GeocodeResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("geocode", {
      body: address,
    });
    if (
      error ||
      !data ||
      typeof data.lat !== "number" ||
      typeof data.lng !== "number"
    ) {
      return null;
    }
    return { lat: data.lat, lng: data.lng };
  } catch (err) {
    console.error(err);
    return null;
  }
}
