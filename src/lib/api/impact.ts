import { supabase } from "../supabase";

export interface PersonalImpactTotals {
  bagsOfTrash: number;
  milesRucked: number;
  peopleHelped: number;
  eventsShowedUp: number;
}

export interface LoggedForEntry {
  eventId: string;
  eventTitle: string;
  summary: string;
}

export interface ImpactLogRow {
  eventId: string;
  bags: number;
  miles: number;
  people: number;
  createdAt: string;
}

const ZERO_TOTALS: PersonalImpactTotals = {
  bagsOfTrash: 0,
  milesRucked: 0,
  peopleHelped: 0,
  eventsShowedUp: 0,
};

/** `owner_id` defaults to auth.uid() (see the auth_rls migration) — not passed here. */
export async function logImpact(
  eventId: string,
  amounts: { bags: number; miles: number; people: number },
): Promise<void> {
  const { error } = await supabase.from("impact_logs").insert({
    event_id: eventId,
    bags: amounts.bags,
    miles: amounts.miles,
    people: amounts.people,
  });
  if (error) throw error;
}

/**
 * Sums the caller's own append-only log rows at read time — a brand-new
 * user naturally starts at zero rather than a seeded baseline. See
 * supabase/migrations/20260802024233_initial_schema.sql for the full
 * attribution model.
 */
export async function getPersonalImpact(
  userId: string,
): Promise<{ totals: PersonalImpactTotals; logs: ImpactLogRow[] }> {
  const { data, error } = await supabase
    .from("impact_logs")
    .select("event_id, bags, miles, people, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const logs: ImpactLogRow[] = (data ?? []).map((row) => ({
    eventId: row.event_id,
    bags: row.bags,
    miles: row.miles,
    people: row.people,
    createdAt: row.created_at,
  }));

  const totals = logs.reduce<PersonalImpactTotals>(
    (acc, log) => ({
      bagsOfTrash: acc.bagsOfTrash + log.bags,
      milesRucked: Math.round((acc.milesRucked + log.miles) * 10) / 10,
      peopleHelped: acc.peopleHelped + log.people,
      eventsShowedUp: acc.eventsShowedUp + 1,
    }),
    ZERO_TOTALS,
  );

  return { totals, logs };
}

export interface OrgImpactTotals {
  bagsTrash: number;
  milesRucked: number;
  eventsHeld: number;
  livesImpacted: number;
  activeMembers: number;
}

export type OrgImpactPeriod = "2026" | "all_time";

export async function getOrgImpact(
  period: OrgImpactPeriod,
): Promise<OrgImpactTotals | null> {
  const { data, error } = await supabase
    .from("org_impact_totals")
    .select("*")
    .eq("period", period)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    bagsTrash: data.bags_trash,
    milesRucked: data.miles_rucked,
    eventsHeld: data.events_held,
    livesImpacted: data.lives_impacted,
    activeMembers: data.active_members,
  };
}
