import { useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LogImpactSheet } from "../components/LogImpactSheet";
import { useCountUp } from "../lib/useCountUp";
import { useSession, type OrgImpactTotals } from "../state/SessionContext";

type ImpactTab = "you" | "org";
type OrgPeriod = "year" | "alltime";

const ZERO_ORG_STATS: OrgImpactTotals = {
  lbsTrash: 0,
  milesRucked: 0,
  eventsHeld: 0,
  livesImpacted: 0,
  activeMembers: 0,
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-line bg-card p-4">
      <div className="font-mono text-[30px] font-bold text-accent">{value}</div>
      <div className="font-sans text-[10.5px] font-semibold tracking-[0.04em] text-ink-dim">
        {label}
      </div>
    </div>
  );
}

function OrgStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-[3px] rounded-card border border-line bg-card p-3.5">
      <div className="font-mono text-2xl font-bold text-ink">{value}</div>
      <div className="font-sans text-[10px] font-semibold text-ink-dim">
        {label}
      </div>
    </div>
  );
}

function PersonalImpactView() {
  const { personalImpact, loggedFor } = useSession();
  const animated = useCountUp({ ...personalImpact });

  const monthLine =
    loggedFor.length === 0
      ? "Log your first event to start building this month's streak."
      : loggedFor.length === 1
        ? "You've shown up once this session. Keep it going."
        : `You've shown up ${loggedFor.length} times this session. Keep the streak alive.`;

  return (
    <>
      <div className="font-sans text-[11px] font-semibold text-ink-dim">
        Your running totals — all-time
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          value={Math.round(animated.bagsOfTrash).toLocaleString("en-US")}
          label="BAGS OF TRASH"
        />
        <StatCard
          value={animated.milesRucked.toFixed(1)}
          label="MILES RUCKED"
        />
        <StatCard
          value={Math.round(animated.peopleHelped).toLocaleString("en-US")}
          label="PEOPLE HELPED"
        />
        <StatCard
          value={Math.round(animated.eventsShowedUp).toLocaleString("en-US")}
          label="EVENTS SHOWED UP FOR"
        />
      </div>

      {loggedFor.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
            LOGGED FOR
          </div>
          {loggedFor.map((entry, i) => (
            <div
              key={`${entry.eventId}-${i}`}
              className="flex items-center justify-between rounded-card border border-line bg-card px-[13px] py-[11px]"
            >
              <span className="font-sans text-xs font-bold text-ink">
                {entry.eventTitle}
              </span>
              <span className="font-mono text-[10.5px] font-semibold text-ink-dim">
                {entry.summary}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex flex-col gap-1 rounded-card border border-line p-4"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent), var(--card))",
        }}
      >
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-accent">
          THIS MONTH
        </div>
        <div className="font-sans text-[13px] font-medium text-ink">
          {monthLine}
        </div>
      </div>
    </>
  );
}

function OrgImpactView({
  period,
  onSetPeriod,
}: {
  period: OrgPeriod;
  onSetPeriod: (period: OrgPeriod) => void;
}) {
  const { orgImpact } = useSession();
  const stats =
    (period === "year" ? orgImpact.year : orgImpact.allTime) ??
    ZERO_ORG_STATS;
  const animated = useCountUp({
    trash: stats.lbsTrash,
    miles: stats.milesRucked,
    events: stats.eventsHeld,
    lives: stats.livesImpacted,
    members: stats.activeMembers,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="font-sans text-[11px] font-semibold text-ink-dim">
          Collective good, together
        </div>
        <div className="flex gap-1.5">
          {(
            [
              { key: "year", label: "2026" },
              { key: "alltime", label: "ALL-TIME" },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onSetPeriod(p.key)}
              className={`rounded-[7px] border border-line px-2.5 py-1.5 font-mono text-[10px] font-bold ${
                period === p.key
                  ? "bg-accent text-accent-on"
                  : "bg-card text-ink-dim"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-0.5 rounded-[18px] border border-line px-[18px] py-[22px] text-center"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--accent) 26%, transparent) 0%, var(--card) 60%)",
        }}
      >
        <div className="font-mono text-[44px] font-bold tracking-[-0.01em] text-ink">
          {Math.round(animated.trash).toLocaleString("en-US")}
        </div>
        <div className="font-sans text-[11px] font-bold tracking-[0.08em] text-accent">
          LBS OF TRASH REMOVED
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <OrgStatCard
          value={Math.round(animated.miles).toLocaleString("en-US")}
          label="MILES RUCKED"
        />
        <OrgStatCard
          value={Math.round(animated.events).toLocaleString("en-US")}
          label="EVENTS HELD"
        />
        <OrgStatCard
          value={Math.round(animated.lives).toLocaleString("en-US")}
          label="LIVES IMPACTED"
        />
        <OrgStatCard
          value={Math.round(animated.members).toLocaleString("en-US")}
          label="ACTIVE MEMBERS"
        />
      </div>

      <div className="px-2 text-center font-sans text-[11.5px] leading-[1.5] text-ink-dim">
        Every number here started with someone showing up. That's you.
      </div>
    </>
  );
}

export default function ImpactScreen() {
  const { loading, loadError, retryLoad } = useSession();
  const [tab, setTab] = useState<ImpactTab>("you");
  const [period, setPeriod] = useState<OrgPeriod>("year");
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 pb-[100px] pt-1.5 lg:mx-auto lg:w-full lg:max-w-[720px] lg:pb-10">
      <div className="flex items-center justify-between">
        <div className="font-display text-2xl text-ink">IMPACT</div>
        {tab === "you" && (
          <button
            type="button"
            onClick={() => setLogSheetOpen(true)}
            className="rounded-[9px] border-none bg-signal px-3.5 py-2.5 font-sans text-[11.5px] font-bold tracking-[0.02em] text-signal-on"
          >
            + LOG IMPACT
          </button>
        )}
      </div>

      <div className="flex rounded-button border border-line bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("you")}
          className={`flex-1 rounded-[9px] border-none p-2.5 font-sans text-xs font-bold tracking-[0.03em] ${
            tab === "you" ? "bg-accent text-accent-on" : "text-ink-dim"
          }`}
        >
          YOU
        </button>
        <button
          type="button"
          onClick={() => setTab("org")}
          className={`flex-1 rounded-[9px] border-none p-2.5 font-sans text-xs font-bold tracking-[0.03em] ${
            tab === "org" ? "bg-accent text-accent-on" : "text-ink-dim"
          }`}
        >
          OPERATOR STANDARD
        </button>
      </div>

      {loadError && !loading ? (
        <ErrorState
          message="Couldn't load impact data. Check your connection."
          onRetry={retryLoad}
        />
      ) : tab === "you" ? (
        <PersonalImpactView />
      ) : (
        <OrgImpactView period={period} onSetPeriod={setPeriod} />
      )}

      {logSheetOpen && (
        <LogImpactSheet onClose={() => setLogSheetOpen(false)} />
      )}
    </div>
  );
}
