import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  DEFAULT_FILTERS,
  type DateFilter,
  type EventFilters,
} from "../lib/filterEvents";
import { hadAuthRedirectHash, supabase } from "../lib/supabase";
import type { MusterEvent, RsvpStatus } from "../lib/mockEvents";
import {
  createEvent as apiCreateEvent,
  deleteEvent as apiDeleteEvent,
  getEvent as apiGetEvent,
  listEvents,
  updateEvent as apiUpdateEvent,
  type NewEventInput,
  type UpdateEventInput,
} from "../lib/api/events";
import {
  linkOrSignInWithOAuth,
  requestMagicLink as apiRequestMagicLink,
  type OAuthProvider,
} from "../lib/api/auth";
import {
  hasPendingProfileName,
  takePendingProfileName,
} from "../lib/pendingProfileName";
import {
  getOrgImpact,
  getPersonalImpact,
  logImpact as apiLogImpact,
  type LoggedForEntry,
  type OrgImpactTotals,
  type PersonalImpactTotals,
} from "../lib/api/impact";
import {
  addItinerary as apiAddItinerary,
  listItinerary,
  removeItinerary as apiRemoveItinerary,
} from "../lib/api/itinerary";
import { getProfile, upsertProfile } from "../lib/api/profiles";
import { reportEvent as apiReportEvent, type ReportReason } from "../lib/api/reports";
import { geocodeAddress } from "../lib/api/geocode";
import {
  clearRsvp,
  listRsvpsForUser,
  setRsvp as apiSetRsvp,
} from "../lib/api/rsvps";
import type { Coords } from "../lib/distance";
import {
  requestBrowserLocation,
  type LocationStatus,
} from "../lib/geolocation";
import { useToast } from "./ToastContext";

export type {
  LoggedForEntry,
  NewEventInput,
  UpdateEventInput,
  OAuthProvider,
  OrgImpactTotals,
  PersonalImpactTotals,
  LocationStatus,
  ReportReason,
};
export { apiGetEvent as getEventById };

export interface OrgImpactByPeriod {
  year: OrgImpactTotals | null;
  allTime: OrgImpactTotals | null;
}

const ZERO_PERSONAL_IMPACT: PersonalImpactTotals = {
  bagsOfTrash: 0,
  milesRucked: 0,
  peopleHelped: 0,
  eventsShowedUp: 0,
};

function summarizeAmounts(amounts: {
  bags: number;
  miles: number;
  people: number;
}) {
  return (
    [
      amounts.bags ? `${amounts.bags} bags` : null,
      amounts.miles ? `${amounts.miles} mi` : null,
      amounts.people ? `${amounts.people} people` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "logged"
  );
}

/**
 * Real Supabase auth (Phase 3, magic-link since Phase 6). Every visitor
 * gets a session on first load — anonymous by default (see the bootstrap
 * effect below), upgraded in place to a permanent identity via emailed
 * magic link or Google/Apple identity linking. Because the upgrade
 * preserves auth.uid(), existing RSVPs/itinerary/impact carry over
 * automatically — no data migration.
 *
 * `signedIn` means "has a permanent identity," not just "has a session"
 * (an anonymous visitor always has a session). `name` is the raw profile
 * value (null until one's been set) — screens decide their own fallback
 * copy (e.g. Settings shows "Member") rather than baking a placeholder in
 * here, since AccountButton needs the *real* absence of a name to fall
 * back to an email-initial instead.
 */
export interface AuthState {
  signedIn: boolean;
  name: string | null;
  contact: string | null;
  avatarUrl: string | null;
}

const SIGNED_OUT_AUTH: AuthState = {
  signedIn: false,
  name: null,
  contact: null,
  avatarUrl: null,
};

interface ProfileState {
  name: string | null;
  contact: string | null;
  avatarUrl: string | null;
  eventReminders: boolean;
  newEventsNearby: boolean;
  homeCity: string | null;
  homeState: string | null;
  homeZip: string | null;
}

function toProfileState(p: {
  name: string | null;
  contact: string | null;
  avatarUrl: string | null;
  eventReminders: boolean;
  newEventsNearby: boolean;
  homeCity: string | null;
  homeState: string | null;
  homeZip: string | null;
}): ProfileState {
  return {
    name: p.name,
    contact: p.contact,
    avatarUrl: p.avatarUrl,
    eventReminders: p.eventReminders,
    newEventsNearby: p.newEventsNearby,
    homeCity: p.homeCity,
    homeState: p.homeState,
    homeZip: p.homeZip,
  };
}

/**
 * Session-scoped app state shared across screens: RSVPs, itinerary, posted
 * events, personal/org impact, real auth, and the active map/filter
 * selection. Backed by Supabase — attribution comes from the session's
 * auth.uid() (anonymous or permanent), enforced by per-owner RLS (see
 * supabase/migrations/20260802040000_auth_rls.sql).
 *
 * TODO(Phase 4): anti-spam (rate limits, moderation, captcha) is still
 * deferred — not addressed here.
 */
interface SessionContextValue {
  /** All events from the DB, newest-created first. The single source of truth Map/Detail should read from. */
  events: MusterEvent[];
  rsvp: Record<string, RsvpStatus>;
  itinerary: string[];
  filters: EventFilters;
  personalImpact: PersonalImpactTotals;
  loggedFor: LoggedForEntry[];
  orgImpact: OrgImpactByPeriod;
  auth: AuthState;
  eventReminders: boolean;
  newEventsNearby: boolean;
  /** True while the auth bootstrap and/or the initial Supabase fetch is in flight. */
  loading: boolean;
  /**
   * Set when the initial read (events/rsvps/itinerary/impact/profile) fails
   * — distinct from "loaded successfully with zero results." Screens should
   * render a proper error state (icon + message + retry) instead of a
   * blank or falsely-empty view. Background write failures do NOT set
   * this — they show a toast and roll back instead (see setRsvp etc.).
   */
  loadError: string | null;
  /** Re-runs the initial load after a `loadError`. */
  retryLoad: () => void;
  /** Current session's user id (anonymous or permanent) — null only until the bootstrap resolves. Handy for e.g. attributing storage uploads. */
  userId: string | null;

  /** Null until `requestLocation` succeeds — real device coordinates (Phase 7), used for distance labels, the radius filter, and nearest-first sort. */
  userLocation: Coords | null;
  /** Distinguishes "haven't asked" from "asked and denied" from "asked and it's just unavailable" so the map/filter UI can hint appropriately. */
  locationStatus: LocationStatus;
  /** Prompts the browser's geolocation permission (or reads a cached grant). Never throws — a denial or error just leaves `userLocation` null with `locationStatus` reflecting why. */
  requestLocation: () => Promise<void>;

  /** Inserts a new event row (via the create-event Edge Function — see api/events.ts) and prepends it to `events`. `turnstileToken` is null when Turnstile isn't configured client-side (see components/Turnstile.tsx). Returns the created row (with its DB-generated id) so callers can immediately RSVP/add-to-itinerary against it. */
  addEvent: (
    input: NewEventInput,
    turnstileToken: string | null,
  ) => Promise<MusterEvent>;
  /** Updates an existing event in place (never creates a new row) — RLS restricts this to the event's own creator. Preserves the live-merged goingCount/maybeCount already in state, since editing never touches RSVPs. */
  updateEvent: (id: string, input: UpdateEventInput) => Promise<MusterEvent>;
  /** Deletes an event — RLS restricts this to its creator. rsvps/itinerary_items/impact_logs cascade server-side; this also prunes the id from local itinerary/rsvp state so nothing ghosts in the UI before the next reload. */
  deleteEvent: (id: string) => Promise<void>;
  /** Inserts a report row (reporter_id = auth.uid()); the DB auto-hides the event once it accumulates enough distinct reports (Phase 14) — no local state change here, since a report never affects what the reporter themselves can see. Rejects with the friendly AlreadyReportedError message on a duplicate report. */
  reportEvent: (eventId: string, reason: ReportReason) => Promise<void>;
  /** Toggles the given status on; tapping the already-active status clears it. Persists in the background. */
  setRsvp: (eventId: string, status: Exclude<RsvpStatus, null>) => void;
  addToItinerary: (eventId: string) => void;
  removeFromItinerary: (eventId: string) => void;
  toggleItinerary: (eventId: string) => void;
  /** Adds the given amounts to personal totals, +1 to eventsShowedUp, appends a LOGGED FOR row, and persists in the background. */
  logImpact: (
    eventId: string,
    amounts: { bags: number; miles: number; people: number },
  ) => void;

  /**
   * Sends a magic-link sign-in email to the given address. An anonymous
   * session upgrades in place (preserving auth.uid()); anyone else gets a
   * normal magic-link sign-in. The browser comes back via the emailed link
   * and the session is picked up automatically — see the bootstrap effect.
   */
  requestMagicLink: (email: string) => Promise<void>;
  /** Google/Apple — upgrades the anonymous session in place (or signs in normally if already permanent). Rejects without crashing if the provider isn't configured yet in the dashboard. */
  linkOAuth: (provider: OAuthProvider) => Promise<void>;
  /** Updates the caller's own profile row (name/contact/avatarUrl) — fields left undefined are untouched. */
  updateProfile: (patch: {
    name?: string;
    contact?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  /** Signs out, then immediately re-establishes a fresh anonymous session so browsing keeps working signed-out. */
  signOut: () => Promise<void>;
  /** Persisted to profiles.event_reminders — read by the send-event-reminders Edge Function. Optimistic update with rollback + toast on failure. */
  setEventReminders: (value: boolean) => void;
  /** Persisted to profiles.new_events_nearby — read by the send-nearby-events Edge Function. Optimistic update with rollback + toast on failure. */
  setNewEventsNearby: (value: boolean) => void;
  /** Null until the user sets a home location in Settings — the display fields (not the geocoded lat/lng, which are server-side only). */
  homeCity: string | null;
  homeState: string | null;
  homeZip: string | null;
  /** Geocodes (best-effort) and persists the home location used for "new events nearby" matching. Returns { geocoded: false } if the geocode failed — the display fields still save either way, same "never blocks" precedent as event creation. */
  setHomeLocation: (input: {
    city: string;
    state: string;
    zip: string;
  }) => Promise<{ geocoded: boolean }>;

  setSearch: (value: string) => void;
  toggleCategory: (key: string) => void;
  setFreeOnly: (value: boolean) => void;
  setDateFilter: (value: DateFilter) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setRadius: (mi: number | null) => void;
  clearFilters: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);

  const [events, setEvents] = useState<MusterEvent[]>([]);
  const [rsvp, setRsvpMap] = useState<Record<string, RsvpStatus>>({});
  const [itinerary, setItinerary] = useState<string[]>([]);
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [personalImpact, setPersonalImpact] = useState<PersonalImpactTotals>(
    ZERO_PERSONAL_IMPACT,
  );
  const [loggedFor, setLoggedFor] = useState<LoggedForEntry[]>([]);
  const [orgImpact, setOrgImpact] = useState<OrgImpactByPeriod>({
    year: null,
    allTime: null,
  });
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast } = useToast();

  const user: User | null = session?.user ?? null;
  const userId = user?.id ?? null;
  // Deliberately NOT `?? true` — if there's no session at all (e.g. the
  // anonymous-sign-in bootstrap itself failed), OTP/OAuth should take the
  // fresh sign-in path, not the "upgrade an anonymous session" path, which
  // requires an active session to call and would just fail differently.
  const isAnonymous = user?.is_anonymous === true;

  // Bumped by retryLoad() — both effects below depend on it, so "try
  // again" re-attempts whichever step actually failed (auth bootstrap or
  // the data read) without the caller needing to know which one it was.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const retryLoad = useCallback(() => setLoadAttempt((n) => n + 1), []);

  // Seeded from a synchronous check of the URL at module-import time (see
  // hadAuthRedirectHash) so it's accurate regardless of effect-subscription
  // timing. Cleared the first time we see a resulting permanent session, so
  // the "you just signed in" toast fires exactly once per redirect.
  const awaitingRedirectReturn = useRef(hadAuthRedirectHash);

  // Auth bootstrap: restore an existing session, or establish a fresh
  // anonymous one so every visitor — signed in or not — has a real
  // auth.uid(). Stays subscribed for the lifetime of the app so sign
  // in/out/link events (including the redirect-back from a magic link or
  // Google/Apple) flow straight into state.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setSession(data.session);
        return;
      }
      const { data: anon, error: anonError } =
        await supabase.auth.signInAnonymously();
      if (cancelled) return;
      if (anonError) {
        console.error(anonError);
        setLoadError("Couldn't start a session. Check your connection.");
        return;
      }
      setSession(anon.session);
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (
        awaitingRedirectReturn.current &&
        newSession &&
        !newSession.user.is_anonymous
      ) {
        awaitingRedirectReturn.current = false;
        // A pending name means this is a Sign Up completing — the
        // pending-profile-name effect below applies it and toasts
        // "Account created" itself once it lands. Otherwise this is a
        // plain magic-link sign-in with nothing else to do.
        if (!hasPendingProfileName()) {
          showToast("Signed in");
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadAttempt, showToast]);

  // Data load: events/rsvps/itinerary/impact/org totals/profile, once a
  // real uid is available. Upgrading anonymous -> permanent keeps the same
  // uid, so this deliberately does NOT need to re-run on that transition —
  // existing rows are already attributed correctly.
  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [
          loadedEvents,
          loadedRsvp,
          loadedItinerary,
          personal,
          orgYear,
          orgAllTime,
          loadedProfile,
        ] = await Promise.all([
          listEvents(uid),
          listRsvpsForUser(uid),
          listItinerary(uid),
          getPersonalImpact(uid),
          getOrgImpact("2026"),
          getOrgImpact("all_time"),
          getProfile(uid),
        ]);
        if (cancelled) return;

        setEvents(loadedEvents);
        setRsvpMap(loadedRsvp);
        setItinerary(loadedItinerary);
        setPersonalImpact(personal.totals);
        setLoggedFor(
          personal.logs.map((log) => ({
            eventId: log.eventId,
            eventTitle:
              loadedEvents.find((e) => e.id === log.eventId)?.title ??
              "Event",
            summary: summarizeAmounts(log),
          })),
        );
        setOrgImpact({ year: orgYear, allTime: orgAllTime });

        if (loadedProfile) {
          setProfile(toProfileState(loadedProfile));
        } else if (!isAnonymous) {
          // Permanent user with no profile row yet — e.g. just linked
          // Google/Apple, which doesn't go through our upsertProfile call
          // itself. Auto-provision a minimal row from the auth identity.
          const { data: userRes } = await supabase.auth.getUser();
          const meta = userRes.user?.user_metadata as
            | { full_name?: string; name?: string }
            | undefined;
          const created = await upsertProfile({
            name: meta?.full_name ?? meta?.name ?? undefined,
            contact: userRes.user?.email ?? userRes.user?.phone ?? undefined,
          });
          if (!cancelled) {
            setProfile(toProfileState(created));
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setLoadError("Couldn't load events. Check your connection.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isAnonymous, loadAttempt]);

  // Applies a name stashed by Sign Up (see pendingProfileName.ts) once the
  // magic-link round trip completes and the session is permanent. Runs
  // after the data-load effect above, so it always has the last word over
  // whatever `getProfile`/auto-provisioning set — deliberately overwriting
  // in the sign-up case. A no-op on every render after the first, since
  // `takePendingProfileName` clears the stash as soon as it's read.
  useEffect(() => {
    if (!userId || isAnonymous) return;
    const pendingName = takePendingProfileName();
    if (!pendingName) return;
    upsertProfile({ name: pendingName })
      .then((updated) => {
        setProfile(toProfileState(updated));
        showToast("Account created");
      })
      .catch((err) => {
        console.error(err);
        showToast("Signed in — couldn't save your name, add it in Settings");
      });
  }, [userId, isAnonymous, showToast]);

  const addEvent = useCallback(
    async (input: NewEventInput, turnstileToken: string | null) => {
      const created = await apiCreateEvent(input, turnstileToken);
      setEvents((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const updateEvent = useCallback(
    async (id: string, input: UpdateEventInput) => {
      const updated = await apiUpdateEvent(id, input);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === id
            ? { ...updated, goingCount: ev.goingCount, maybeCount: ev.maybeCount }
            : ev,
        ),
      );
      return updated;
    },
    [],
  );

  const deleteEvent = useCallback(async (id: string) => {
    await apiDeleteEvent(id);
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setItinerary((prev) => prev.filter((eventId) => eventId !== id));
    setRsvpMap((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const reportEvent = useCallback(
    (eventId: string, reason: ReportReason) => apiReportEvent(eventId, reason),
    [],
  );

  const setRsvp = useCallback(
    (eventId: string, status: Exclude<RsvpStatus, null>) => {
      const prevStatus = rsvp[eventId] ?? null;
      const turningOff = prevStatus === status;
      const nextStatus: RsvpStatus = turningOff ? null : status;
      setRsvpMap((prev) => ({ ...prev, [eventId]: nextStatus }));

      const persist = turningOff ? clearRsvp(eventId) : apiSetRsvp(eventId, status);
      persist.catch((err) => {
        console.error(err);
        setRsvpMap((prev) => ({ ...prev, [eventId]: prevStatus }));
        showToast("Couldn't save your RSVP — try again");
      });
    },
    [rsvp, showToast],
  );

  const addToItinerary = useCallback(
    (eventId: string) => {
      setItinerary((prev) =>
        prev.includes(eventId) ? prev : [...prev, eventId],
      );
      apiAddItinerary(eventId).catch((err) => {
        console.error(err);
        setItinerary((prev) => prev.filter((id) => id !== eventId));
        showToast("Couldn't update your itinerary — try again");
      });
    },
    [showToast],
  );

  const removeFromItinerary = useCallback(
    (eventId: string) => {
      const wasPresent = itinerary.includes(eventId);
      setItinerary((prev) => prev.filter((id) => id !== eventId));
      apiRemoveItinerary(eventId).catch((err) => {
        console.error(err);
        if (wasPresent) {
          setItinerary((prev) =>
            prev.includes(eventId) ? prev : [...prev, eventId],
          );
        }
        showToast("Couldn't update your itinerary — try again");
      });
    },
    [itinerary, showToast],
  );

  const toggleItinerary = useCallback(
    (eventId: string) => {
      const has = itinerary.includes(eventId);
      setItinerary((prev) =>
        has ? prev.filter((id) => id !== eventId) : [...prev, eventId],
      );
      const persist = has ? apiRemoveItinerary(eventId) : apiAddItinerary(eventId);
      persist.catch((err) => {
        console.error(err);
        setItinerary((prev) =>
          has
            ? prev.includes(eventId)
              ? prev
              : [...prev, eventId]
            : prev.filter((id) => id !== eventId),
        );
        showToast("Couldn't update your itinerary — try again");
      });
    },
    [itinerary, showToast],
  );

  const logImpact = useCallback(
    (
      eventId: string,
      amounts: { bags: number; miles: number; people: number },
    ) => {
      setPersonalImpact((prev) => ({
        bagsOfTrash: prev.bagsOfTrash + amounts.bags,
        milesRucked: Math.round((prev.milesRucked + amounts.miles) * 10) / 10,
        peopleHelped: prev.peopleHelped + amounts.people,
        eventsShowedUp: prev.eventsShowedUp + 1,
      }));
      const event = events.find((e) => e.id === eventId);
      const loggedForEntry: LoggedForEntry = {
        eventId,
        eventTitle: event?.title ?? "Event",
        summary: summarizeAmounts(amounts),
      };
      setLoggedFor((prev) => [...prev, loggedForEntry]);

      apiLogImpact(eventId, amounts).catch((err) => {
        console.error(err);
        setPersonalImpact((prev) => ({
          bagsOfTrash: prev.bagsOfTrash - amounts.bags,
          milesRucked:
            Math.round((prev.milesRucked - amounts.miles) * 10) / 10,
          peopleHelped: prev.peopleHelped - amounts.people,
          eventsShowedUp: prev.eventsShowedUp - 1,
        }));
        setLoggedFor((prev) => prev.filter((entry) => entry !== loggedForEntry));
        showToast("Couldn't save your impact log — try again");
      });
    },
    [events, showToast],
  );

  const requestMagicLink = useCallback(
    (email: string) => apiRequestMagicLink(email, isAnonymous),
    [isAnonymous],
  );

  const linkOAuth = useCallback(
    (provider: OAuthProvider) => linkOrSignInWithOAuth(provider, isAnonymous),
    [isAnonymous],
  );

  const updateProfile = useCallback(
    async (patch: { name?: string; contact?: string; avatarUrl?: string }) => {
      const updated = await upsertProfile(patch);
      setProfile(toProfileState(updated));
    },
    [],
  );

  // event_reminders/new_events_nearby are derived from `profile`, not their
  // own state — one source of truth instead of two copies that could drift.
  // Default true (matching the DB column default) for the brief window
  // before the profile loads, or for a signed-in-but-no-profile-row-yet
  // edge case.
  const eventReminders = profile?.eventReminders ?? true;
  const newEventsNearby = profile?.newEventsNearby ?? true;
  const homeCity = profile?.homeCity ?? null;
  const homeState = profile?.homeState ?? null;
  const homeZip = profile?.homeZip ?? null;

  const setEventReminders = useCallback(
    (value: boolean) => {
      setProfile((prev) => (prev ? { ...prev, eventReminders: value } : prev));
      upsertProfile({ eventReminders: value }).catch((err) => {
        console.error(err);
        setProfile((prev) =>
          prev ? { ...prev, eventReminders: !value } : prev,
        );
        showToast("Couldn't save — try again");
      });
    },
    [showToast],
  );

  const setNewEventsNearby = useCallback(
    (value: boolean) => {
      setProfile((prev) =>
        prev ? { ...prev, newEventsNearby: value } : prev,
      );
      upsertProfile({ newEventsNearby: value }).catch((err) => {
        console.error(err);
        setProfile((prev) =>
          prev ? { ...prev, newEventsNearby: !value } : prev,
        );
        showToast("Couldn't save — try again");
      });
    },
    [showToast],
  );

  // Geocodes city/state/zip (best-effort — same "never blocks on a failed
  // geocode" precedent as event creation, see CreateScreen) and persists
  // both the display fields and the resulting lat/lng, which is what
  // send-nearby-events actually matches against. Returns whether the
  // geocode succeeded so the caller (SettingsScreen) can toast accordingly.
  const setHomeLocation = useCallback(
    async (input: { city: string; state: string; zip: string }) => {
      const city = input.city.trim();
      const state = input.state.trim();
      const zip = input.zip.trim();
      const geo =
        city && state
          ? await geocodeAddress({ city, state, zip: zip || undefined })
          : null;
      const updated = await upsertProfile({
        homeCity: city || null,
        homeState: state || null,
        homeZip: zip || null,
        homeLat: geo?.lat ?? null,
        homeLng: geo?.lng ?? null,
      });
      setProfile(toProfileState(updated));
      return { geocoded: geo != null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    const { data, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      console.error(anonError);
      showToast("Couldn't sign out — try again");
      return;
    }
    setSession(data.session);
  }, [showToast]);

  const requestLocation = useCallback(async () => {
    setLocationStatus("requesting");
    const result = await requestBrowserLocation();
    if (result.status === "granted") {
      setUserLocation(result.coords);
    }
    setLocationStatus(result.status);
  }, []);

  const setSearch = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, search: value })),
    [],
  );
  const toggleCategory = useCallback(
    (key: string) =>
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(key)
          ? prev.categories.filter((k) => k !== key)
          : [...prev.categories, key],
      })),
    [],
  );
  const setFreeOnly = useCallback(
    (value: boolean) => setFilters((prev) => ({ ...prev, freeOnly: value })),
    [],
  );
  const setDateFilter = useCallback(
    (value: DateFilter) =>
      setFilters((prev) => ({ ...prev, dateFilter: value })),
    [],
  );
  const setDateFrom = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, dateFrom: value })),
    [],
  );
  const setDateTo = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, dateTo: value })),
    [],
  );
  const setRadius = useCallback(
    (mi: number | null) => setFilters((prev) => ({ ...prev, radiusMi: mi })),
    [],
  );
  const clearFilters = useCallback(
    () =>
      setFilters((prev) => ({
        ...prev,
        categories: [],
        freeOnly: false,
        dateFilter: "any",
      })),
    [],
  );

  const auth: AuthState = useMemo(() => {
    const signedIn = Boolean(userId) && !isAnonymous;
    if (!signedIn) return SIGNED_OUT_AUTH;
    return {
      signedIn: true,
      name: profile?.name ?? null,
      contact: profile?.contact ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  }, [userId, isAnonymous, profile]);

  const value = useMemo<SessionContextValue>(
    () => ({
      events,
      rsvp,
      itinerary,
      filters,
      personalImpact,
      loggedFor,
      orgImpact,
      auth,
      eventReminders,
      newEventsNearby,
      loading,
      loadError,
      retryLoad,
      userId,
      userLocation,
      locationStatus,
      requestLocation,
      addEvent,
      updateEvent,
      deleteEvent,
      reportEvent,
      setRsvp,
      addToItinerary,
      removeFromItinerary,
      toggleItinerary,
      logImpact,
      requestMagicLink,
      linkOAuth,
      updateProfile,
      signOut,
      setEventReminders,
      setNewEventsNearby,
      homeCity,
      homeState,
      homeZip,
      setHomeLocation,
      setSearch,
      toggleCategory,
      setFreeOnly,
      setDateFilter,
      setDateFrom,
      setDateTo,
      setRadius,
      clearFilters,
    }),
    [
      events,
      rsvp,
      itinerary,
      filters,
      personalImpact,
      loggedFor,
      orgImpact,
      auth,
      eventReminders,
      newEventsNearby,
      loading,
      loadError,
      retryLoad,
      userId,
      userLocation,
      locationStatus,
      requestLocation,
      addEvent,
      updateEvent,
      deleteEvent,
      reportEvent,
      setRsvp,
      addToItinerary,
      removeFromItinerary,
      toggleItinerary,
      logImpact,
      requestMagicLink,
      linkOAuth,
      updateProfile,
      signOut,
      setEventReminders,
      setNewEventsNearby,
      homeCity,
      homeState,
      homeZip,
      setHomeLocation,
      setSearch,
      toggleCategory,
      setFreeOnly,
      setDateFilter,
      setDateFrom,
      setDateTo,
      setRadius,
      clearFilters,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
