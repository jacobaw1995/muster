-- Seed data — the same 10 mock events from src/lib/mockEvents.ts (kept
-- there too, as the Phase 0-1 reference/fallback), plus the two org-wide
-- impact snapshots the design spec's "OPERATOR STANDARD" view reads.
-- Real ids are freshly generated (the old "e1".."e10" mock ids aren't
-- valid uuids), so anything keying off event id is DB-generated from here
-- on.

insert into public.events
  (title, category, organizer, location, distance_mi, date, time, duration_label, cost, capacity, going_count, maybe_count, attendees, notes, website, photo_url, map_x, map_y)
values
  ('Sunrise Ruck: Basin Loop', 'ruck', 'Iron Ruck Co.', 'Basin Reservoir Trailhead', 1.2, '2026-08-03', '5:30 AM', '2 hours', 'FREE', 40, 22, 6, array['Marcus T.','Dana K.','Wyatt R.','Priya S.'], '6 miles, ruck weight optional. We regroup every 2 miles. Coffee after at the trailhead lot.', null, null, 24, 22),
  ('Founders Green Cleanup', 'cleanup', 'Basin Cleanup Crew', 'Founders Green', 2.8, '2026-08-06', '8:00 AM', '3 hours', 'FREE', 60, 38, 9, array['Leah M.','Tomas V.','Grace O.','Kenji H.'], 'Gloves and bags provided. Bring your own water bottle — we''re cutting single-use plastic from the event itself.', null, null, 68, 64),
  ('Ironclad Strength Session', 'fitness', 'Steel Line Fitness', 'Ironclad CrossFit', 0.6, '2026-08-08', '6:00 AM', '1 hour', '$10', 25, 14, 4, array['Andre B.','Sam L.'], 'Scaled options for every movement. First-timers welcome — introduce yourself at the door.', null, null, 40, 40),
  ('Land Nav Fundamentals', 'training', 'Overwatch Training Group', 'Ridgeline Park', 4.1, '2026-08-12', '9:00 AM', '6 hours', '$15', 20, 9, 5, array['Julia F.','Marcus T.'], 'Bring a compass if you own one — loaners available. Covers map reading, pace counting, and route planning.', 'https://overwatchtraining.example.com/land-nav', null, 78, 28),
  ('Porchlight Sessions: Live Acoustic', 'music', 'The Armory Hall', 'The Armory Hall', 3.4, '2026-08-15', '7:00 PM', '4 hours', '$12', 150, 96, 20, array['Renee C.','Big Mike','Ashley P.','Dev N.'], 'Doors at 6:30. All-ages, cash bar 21+. Local openers, then the headline set.', 'https://thearmoryhall.example.com/events/porchlight-sessions', null, 55, 78),
  ('Members Social & Cookout', 'social', 'Operator Standard Community', 'Overwatch Brewing Co.', 1.9, '2026-08-20', '5:00 PM', '4 hours', 'FREE', null, 51, 14, array['Hannah G.','DJ R.','Faith W.'], 'Bring a dish if you can. Kids and dogs welcome — this one''s low-key.', null, null, 20, 60),
  ('Night Ruck: 10-Miler', 'ruck', 'Iron Ruck Co.', 'Basin Reservoir Trailhead', 1.2, '2026-08-22', '9:00 PM', 'All day', 'FREE', 30, 18, 3, array['Wyatt R.','Priya S.'], 'Headlamps required. This one''s a grind — pace yourself, we don''t leave anyone behind.', null, null, 85, 50),
  ('Trailhead Yoga & Mobility', 'fitness', 'Steel Line Fitness', 'Ridgeline Park', 3.9, '2026-08-09', '7:00 AM', '1 hour', 'FREE', 35, 11, 2, array['Priya S.','Grace O.'], 'Mats not provided — bring your own. Beginner-friendly, focused on hip and shoulder mobility for ruckers.', null, null, 72, 34),
  ('Overwatch Airsoft Skirmish', 'skirmish', 'Overwatch Training Group', 'Basin County Fields', 15.5, '2026-08-14', '10:00 AM', '6 hours', '$25', 48, 31, 7, array['Julia F.','Andre B.','Dev N.'], 'Full gear required, rentals available on-site. A custom category — not one of the six built-ins.', null, null, 10, 82),
  ('Basin County Cleanup: River Bend', 'cleanup', 'Basin Cleanup Crew', 'River Bend Access', 42, '2026-08-29', '8:30 AM', '3 hours', 'FREE', 45, 12, 3, array['Leah M.','Kenji H.'], 'Waders recommended but not required. This stretch collects a lot of debris after storms.', null, null, 92, 12);

insert into public.org_impact_totals (period, lbs_trash, miles_rucked, events_held, lives_impacted, active_members)
values
  ('2026', 48210, 9840, 212, 6100, 1840),
  ('all_time', 214500, 41200, 960, 24800, 1840);
