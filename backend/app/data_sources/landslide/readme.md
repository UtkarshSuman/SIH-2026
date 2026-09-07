# Landslide / Flood susceptibility — setup & calibration notes

## One-time setup (run before the pipeline can score anything)

```
python -m app.data_sources.landslide.terrain_cache
```

This fetches DEM (OpenTopography SRTMGL1) and soil clay % (SoilGrids WCS) once per
region (Wayanad, Joshimath), derives per-zone `slope_deg`, `clay_pct`, `elevation_m`,
`flatness_score`, and `low_lying_score`, and writes them to
`backend/app/data_sources/landslide/cache/terrain_features.json`.

**Both** the landslide model and the flood model read this same cache — it's shared
because DEM data doesn't change per-hazard, only how you use it does. Re-run this
command only when zones change (new zone added) or you want to refresh against a
newer DEM/soil release — not on any regular schedule.

If the cache file is missing, `LandslideDataSource.__init__` raises immediately at
app startup (fail loud), while `FloodSusceptibilityModel.__init__` logs a warning and
falls back to rainfall-only scoring (fail soft) — landslide risk without slope data
is meaningless, flood risk without terrain data is merely weaker.

## Env vars

| Var | Used by | Notes |
|---|---|---|
| `OPENTOPO_API_KEY` | `terrain_cache.py` | free signup at portal.opentopography.org |

SoilGrids WCS and Open-Meteo need no keys.

## Why imdlib isn't wired into the live fetch path

The spec calls for IMD gridded rainfall as a Wayanad-specific secondary/historical
source. `imdlib` downloads full gridded NetCDF files per request and is built for
historical/batch analysis, not per-cycle lookups — calling it inside `fetch()` would
violate the "keep fetch() to a few seconds" requirement and risks silently stalling
the whole pipeline (flood included) every 30 minutes. It's listed in
`requirements.txt` as available for a **separate, offline** calibration script (e.g.
comparing Open-Meteo's archive rainfall against IMD gridded rainfall for Wayanad to
sanity-check Open-Meteo's accuracy there) rather than a live data source. Happy to
build that offline comparison script if it'd help validate the weights below.

## Where the weights come from, and where to fix them later

Every weight and saturation threshold in `landslide_susceptibility_model.py` and
`flood_susceptibility_model.py` is a **documented starting point** based on general
landslide/flood susceptibility mapping literature (slope bands, clay-content
drainage effects, rainfall-intensity triggers) — none of it has been validated
against actual historical incidents in Wayanad or Joshimath.

To calibrate properly once you have incident data:

1. Get a labeled dataset: date + zone (or lat/lng) + whether a landslide/flood event
   occurred, ideally with severity. Sources to look into: Kerala State Disaster
   Management Authority (Wayanad), Uttarakhand State Disaster Management Authority /
   NRSC subsidence reports (Joshimath), or NASA's Global Landslide Catalog for
   cross-validation.
2. For each historical event, reconstruct what `zone_inputs` would have looked like
   on that date (slope/clay from the cache, rainfall from Open-Meteo's *archive*
   endpoint for that historical date range).
3. Treat `W_SLOPE`, `W_CLAY`, `W_RAIN_30D`, `W_RAIN_3D` (landslide) and `W_RAIN_72H`,
   `W_RAIN_30D`, `W_RIVER_DISCHARGE`, `W_LOW_LYING`, `W_FLATNESS` (flood) as
   parameters to fit (logistic regression against the binary event/no-event label is
   a reasonable next step up in complexity from the current hand-set weights — still
   far short of needing deep learning).
4. Keep `score_to_status()`'s GREEN/YELLOW/RED cutoffs (0.4/0.7) fixed unless the
   whole team agrees to change them — other hazard types share that convention.

## File map

See the final message in the conversation this README was generated from for exact
placement of every file in `backend/`.