-- Phase 14 follow-up: address Supabase security-advisor findings from the
-- anti_spam_hardening migration.
--
-- 1. The 4 new rate-limit/capacity trigger functions were missing an
--    explicit search_path (flagged as function_search_path_mutable) —
--    fixed the same way auto_hide_reported_event already was, by pinning
--    it. ALTER FUNCTION ... SET is enough; no need to redefine the body.
alter function public.enforce_event_rate_limit() set search_path = public;
alter function public.enforce_rsvp_capacity() set search_path = public;
alter function public.enforce_rsvp_rate_limit() set search_path = public;
alter function public.enforce_impact_log_rate_limit() set search_path = public;

-- 2. auto_hide_reported_event is a SECURITY DEFINER trigger function, and
--    Postgres auto-grants EXECUTE on new functions to PUBLIC by default —
--    which the advisor flagged as callable directly via PostgREST RPC
--    (/rest/v1/rpc/auto_hide_reported_event). In practice Postgres refuses
--    to run a trigger function outside of trigger context ("trigger
--    functions can only be called as triggers"), so this was never
--    actually exploitable — but revoking the default PUBLIC grant is a
--    free defense-in-depth fix and silences the finding. Trigger firing
--    itself is unaffected: it runs via the trigger manager, not a role's
--    direct EXECUTE grant.
revoke execute on function public.auto_hide_reported_event() from public, anon, authenticated;
