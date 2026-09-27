# Rescue-Arc — Zone Alert Broadcast System: Build Spec for Antigravity

**Revision note:** the old `rescue_arc_db.habitations`-based design is dropped entirely. This
version is built fresh around `hazard_platform`'s own model — `zone_id`, not "habitation" — and
targets Supabase (Postgres + RLS) instead of a bare Postgres instance.

## 0. What hazard_platform actually gives you (confirmed from the current code)

- `backend/api.py`'s `/api/zone-status/{zone_id}` computes classification **fresh on every
  call and persists nothing**. This system's DB is the only place a classification will ever
  live.
- `zone_classifier.py`: zone color = worst of 4 hazard scores (RED ≥ 0.7, YELLOW ≥ 0.4, else
  GREEN), not an average.
- `zones.py`: a "zone" is a ~5km bbox. 5 are hand-seeded (Patna, Wayanad, Guwahati, Puri,
  Joshimath). Any other point gets one dynamically via `zone_from_point(lat, lon)`, which
  derives a deterministic `zone_id` from coordinates — this is what powers "click anywhere" on
  the dashboard, and it's exactly the mechanism a new subscriber's location should go through.
- Live-fetched hazard readings and static datasets already have homes inside hazard_platform
  (`hazard_readings.db`, `static_zone_data.db`) — this system does not touch or duplicate
  those. It only ever consumes `/api/zone-status/{zone_id}`'s output.

**Security note (confirmed, more specific than before):** `root-isotope-457419-b2-...json` is
the Google Earth Engine service-account key that `GEE_SERVICE_ACCOUNT_KEY_PATH` (in `.env`)
points at — it's sitting unprotected at the repo root instead of a gitignored path (the code's
own docstring in `fetch_sediment_type.py` recommends `secrets/your-key-file.json`). Rotate this
key in Google Cloud Console, move the replacement into a gitignored `secrets/` folder, and
update `GEE_SERVICE_ACCOUNT_KEY_PATH` to match before this build starts.

**API access note:** `backend/api.py`'s CORS defaults to `allow_origins=["*"]` with no auth —
fine for local dev, restrict it via the `HAZARD_PLATFORM_CORS_ORIGINS` env var (comma-separated
origins) once the new alert backend has a real origin to call from. All of hazard_platform's
endpoints are GET-only and read/compute — nothing here needs the alert backend to send it
credentials or handle POSTs into hazard_platform itself.

**Data-quality caveat to carry into the demo:** `priority`/`priority_score` (also stored below)
currently come from a hardcoded `_PLACEHOLDER_VULNERABILITY` in `api.py`, not real
population/census data — worth a caveat if shown on stage, distinct from `zone_color`/
`hazard_scores`, which are real.

**This is a new, separate service** — confirmed `hazard_platform/requirements*.txt` has no
Postgres/Supabase/Firebase dependencies, so nothing here conflicts with or needs to modify
hazard_platform itself. The alert backend's own requirements need a Supabase client
(`supabase-py`, or plain `psycopg2`/`asyncpg` against the Supabase connection string) and
`firebase-admin` — add these to the alert backend's own `requirements.txt`, not
hazard_platform's.

## 1. Schema (Supabase / Postgres)

```sql
-- Extension needed for gen_random_uuid(); usually already enabled on Supabase.
create extension if not exists pgcrypto;

-- Mirrors hazard_platform's zone registry (5 seeded zones + any dynamically
-- registered via zone_from_point when a new subscriber signs up).
create table zones (
    zone_id     text primary key,          -- matches hazard_platform's zone_id string
    name        text,
    min_lon     double precision not null,
    min_lat     double precision not null,
    max_lon     double precision not null,
    max_lat     double precision not null,
    created_at  timestamptz not null default now()
);

-- Append-only classification history. Every bridge run inserts a new row per
-- zone rather than overwriting — this IS the "current status" store (query
-- the latest row per zone_id) AND the history/audit trail, from one table.
create table zone_classifications (
    id                uuid primary key default gen_random_uuid(),
    zone_id           text not null references zones(zone_id),
    zone_color        text not null check (zone_color in ('RED','YELLOW','GREEN')),
    worst_hazard      text,
    hazard_scores     jsonb,               -- {"FLOOD":0.23,"LANDSLIDE":0.71,...}
    priority          text,
    priority_score    numeric,
    classified_at     timestamptz not null default now(),
    data_recorded_at  timestamptz,         -- from zone-status's freshness fields
    stale             boolean,
    priority_is_placeholder boolean not null default true  -- see Section 7: false once
                                                             -- the capacity engine replaces
                                                             -- _PLACEHOLDER_VULNERABILITY
);
create index idx_zone_classifications_zone_time
    on zone_classifications (zone_id, classified_at desc);

-- "Current status per zone" is just the latest row — a view, not a table,
-- so there's never a sync-drift risk between "current" and "history".
create view zone_current_status as
    select distinct on (zone_id) *
    from zone_classifications
    order by zone_id, classified_at desc;

-- Who to push to. A subscriber is tied to a zone (auto-detected from their
-- location via zone_from_point at signup, or manually chosen).
create table subscribers (
    id           uuid primary key default gen_random_uuid(),
    zone_id      text references zones(zone_id),
    fcm_token    text not null unique,
    created_at   timestamptz not null default now(),
    last_seen_at timestamptz,
    active       boolean not null default true
);

-- What actually got sent, for the admin history view.
create table alert_log (
    id                  uuid primary key default gen_random_uuid(),
    zone_id             text not null references zones(zone_id),
    severity            text not null check (severity in ('alert','warning')),
    from_color          text,
    to_color             text,
    classification_id   uuid references zone_classifications(id),
    sent_at             timestamptz not null default now(),
    recipients_targeted integer,
    recipients_delivered integer
);
```

**Row Level Security:** Supabase exposes every table via its auto-REST API by default, so
enable RLS on all four tables. `zones` and `zone_current_status` can have a public read policy
(harmless to expose current status). `subscribers` and `alert_log` should have **no public
policy** — only the backend's service-role key (used server-side in `alert_service.py`, never
shipped to the browser) can read/write them.

**Optional, not required for this build:** Supabase Realtime can broadcast Postgres inserts on
`zone_classifications` to any connected client — handy for making the admin panel's status
view update live without polling. This is separate from the subscriber-facing push channel
(Section 3 below), which stays Firebase per your earlier decision — Realtime here would only
be an admin-dashboard convenience, not a replacement.

## 2. The classification bridge (new job, doesn't exist yet)

Two distinct calls into hazard_platform, for two distinct situations — don't conflate them:

**New subscriber signup (point not yet a known zone):** call `/api/analyze-point?lat=..&lon=..`
**once**. Confirmed from the actual endpoint code — it does everything in one round trip:
registers the zone dynamically (`zone_from_point` internally), live-fetches and scores all 4
hazards, persists into hazard_platform's own stores, and returns the classification directly
in the response (`zone_id`, `zone_color`, `hazard_scores`, `priority`, freshness fields, etc.).
There is no separate `zone-status` call needed for a brand-new point — that would just
re-request what `analyze-point` already returned. Use this response to upsert `zones` and
insert the first `zone_classifications` row for that zone in the same step, then upsert the
subscriber's `subscribers` row with their `zone_id`.

**Recurring reclassification of already-known zones:** runs on a schedule (or on-demand from
the admin panel for the demo), for every `zone_id` already in `zones`:
1. Call `/api/zone-status/{zone_id}` — reads what's already stored in hazard_platform and
   auto-refreshes only if stale, cheaper than re-running `analyze-point`.
2. Before inserting, read that zone's current latest row from `zone_classifications` (or the
   `zone_current_status` view) — this is "previous."
3. Insert the new result as a new row.
4. Compare previous vs. new `zone_color`:
   - `* → RED`: fire broadcast alert.
   - `GREEN → YELLOW`: fire warning.
   - Otherwise: no push.
5. Log whatever fired into `alert_log`.

## 3. Delivery mechanism: Firebase Web Push, rebuilt solid

Root cause of the original flakiness was never diagnosed. Close off the known common failure
points explicitly, and prove each one works before demo day:

**A. Registration & permission flow**
- VAPID key from env, not hardcoded.
- Separate "permission granted" from "token registered with backend" in the UI — these fail
  independently; say which one failed.
- Serve via Live Server/HTTPS-equivalent, never `file://` (service workers won't register).

**B. Token lifecycle**
- Handle FCM token refresh; on send, if FCM reports an invalid/unregistered token, mark that
  `subscribers` row `active = false` (or delete it) automatically.

**C. Known platform limitation**
- iOS Safari only gets Web Push after "Add to Home Screen" (iOS 16.4+). Demo from
  Android/desktop Chrome; treat iOS as "works once installed."

**D. Pre-demo health check**
- Admin-triggerable endpoint/button: send a test push to a known token, confirm delivery.

## 4. Admin panel (`admin.html`)

- **Manual zone override**: force a zone's next classification to RED/YELLOW by inserting a
  synthetic row into `zone_classifications`, running it through the *same* transition +
  broadcast path as a real bridge run. Show confirmation (message ID / delivered count).
  "Reset" = trigger a real bridge run for that zone.
- **Run bridge now** button (Section 2's job, on demand).
- **Zone status table**: reads `zone_current_status`, plus subscriber counts per zone.
- **Alert history**: reads `alert_log`.
- **Push health-check** button (Section 3D).

## 5. Suggested build order

1. Create the Supabase schema (Section 1).
2. Build the classification bridge (Section 2).
3. Build the subscriber signup flow (`zone_from_point` → `zones`/`subscribers`).
4. Rebuild the FCM integration (Section 3, A–D).
5. Wire transition detection into the bridge's write path.
6. Build the admin panel (Section 4).
7. Test on real devices (Android/desktop Chrome primary) well before demo day.

## 6. Future work: automating the 3 vulnerability inputs (documented now, not required for launch)

**Confirmed OK to ship without this.** `priority`/`priority_score` are display-only fields —
nothing in the alert/broadcast logic (Section 2) reads them; that logic runs entirely off
`zone_color`/`hazard_scores`, which are already real. This section exists purely so the swap
is easy when a capacity-assessment engine is ready, not because it blocks anything now.

**The single interface point:** `backend/prioritization.py`'s `VulnerabilityInputs` dataclass
is the only thing that changes. `api.py` currently constructs it once as
`_PLACEHOLDER_VULNERABILITY` (all three fields hardcoded to `0.5`) and passes it into
`prioritize()`. Replace that constant with a call to a new `get_vulnerability_inputs(zone_id)
-> VulnerabilityInputs` function. `classify_zone()`, `zone_color`, and `hazard_scores` are
never touched by this — the swap is fully contained to the priority-tier calculation.

**Plan for each of the 3 fields, in order of how automatable they already are:**
1. **`disaster_history_score`** — cheapest to automate. hazard_platform already fetches
   `historical_flood_count`, `historical_landslide_count`, `historical_erosion_events`, and
   `historical_cloudburst_count` into `static_zone_data.db` for the hazard scorers themselves.
   Just needs a normalization function turning the relevant count(s) into a 0–1 score — no new
   fetcher required.
2. **`population_density_score`** — reuse the WorldPop raster-clipping approach already built
   for the old SIH-Project pipeline (`capacity.py`/`population_fetch.py`), clipped to
   hazard_platform's zone bbox instead of a village polygon, normalized 0–1.
3. **`socioeconomic_vulnerability_score`** — the genuinely hard one. No live, zone-granular API
   exists for this in India the way one does for weather/soil. Realistically follows the same
   pattern as `STATIC_DATASETS.md`'s other two manual fields (shoreline change, mangrove
   cover): a one-time downloaded dataset, ingested via a loader script, not live-fetched.

**Configuration groundwork already in this schema for a clean cutover:** `zone_classifications`
carries `priority_is_placeholder` (Section 1) — every row written before the capacity engine
exists is `true`; flip the bridge to write `false` once real `VulnerabilityInputs` are wired
in. This means historical rows stay honestly labeled instead of silently mixing
placeholder-based and real priority scores with no way to tell them apart later, and the admin
panel can show a "provisional" tag on `priority`/`priority_score` while `priority_is_placeholder
= true`.

## 7. Explicitly out of scope
- Native mobile app.
- Any non-Firebase delivery mechanism.
- The old `habitations`/`rescue_arc_db` schema — fully replaced, not migrated.
- Unrelated open items from prior sessions (ReliefWeb 403, Puri `soil_type_code`, Joshimath
  `vegetation_index`) — don't touch these.
