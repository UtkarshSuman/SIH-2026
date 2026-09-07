# FEATURE: Real flood HazardDataSource. Pulls rainfall (72h + 30d, same
#          Open-Meteo archive endpoint the landslide source uses) plus river
#          discharge anomaly from Open-Meteo's dedicated Flood API. This
#          REPLACES/becomes the canonical OpenMeteoFloodSource referenced in
#          the registry — if you already have a working version of this
#          file, diff against it rather than overwriting blindly, since your
#          existing version may already handle rainfall and just needs the
#          river_discharge_anomaly field added (see REGISTRY_EDITS.md).
#
# INSTALLATION: pip install httpx

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

import httpx

from app.data_sources.base import HazardDataSource

logger = logging.getLogger(__name__)

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPEN_METEO_FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"

RAINFALL_LOOKBACK_DAYS = 30
SPIKE_WINDOW_DAYS = 3


class OpenMeteoFloodSource(HazardDataSource):
    name = "open_meteo_flood_source"
    hazard_type = "flood"

    async def fetch(self, zones: list[dict]) -> Any:
        today = date.today()
        start = today - timedelta(days=RAINFALL_LOOKBACK_DAYS)

        raw: dict[str, dict] = {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            for zone in zones:
                rain_params = {
                    "latitude": zone["lat"],
                    "longitude": zone["lng"],
                    "start_date": start.isoformat(),
                    "end_date": today.isoformat(),
                    "daily": "precipitation_sum",
                    "timezone": "auto",
                }
                rain_resp = await client.get(OPEN_METEO_ARCHIVE_URL, params=rain_params)
                rain_resp.raise_for_status()
                daily_precip = rain_resp.json().get("daily", {}).get("precipitation_sum")
                if daily_precip is None:
                    raise ValueError(f"Open-Meteo returned no precipitation for {zone['slug']}")

                flood_params = {
                    "latitude": zone["lat"],
                    "longitude": zone["lng"],
                    "daily": "river_discharge",
                    "forecast_days": 1,
                    "past_days": 1,
                }
                # River discharge coverage is sparse for small hill-catchment
                # streams — treat a failure here as "no discharge signal" for
                # this zone rather than failing the whole fetch, since
                # rainfall alone is still a valid (if weaker) basis to score
                # flood risk on.
                discharge_anomaly = None
                try:
                    flood_resp = await client.get(OPEN_METEO_FLOOD_URL, params=flood_params)
                    flood_resp.raise_for_status()
                    discharge_series = flood_resp.json().get("daily", {}).get("river_discharge")
                    if discharge_series:
                        current = discharge_series[-1]
                        normal = sum(discharge_series) / len(discharge_series)
                        if normal:
                            discharge_anomaly = current / normal
                except Exception:
                    logger.info(
                        "No river discharge coverage for zone '%s' — scoring on rainfall only",
                        zone["slug"],
                    )

                raw[zone["slug"]] = {
                    "daily_precip_mm": daily_precip,
                    "river_discharge_anomaly": discharge_anomaly,
                }

        return raw

    def transform(self, raw: Any, zones: list[dict]) -> dict[str, dict]:
        out: dict[str, dict] = {}

        for zone in zones:
            slug = zone["slug"]
            zone_raw = raw.get(slug)
            if zone_raw is None:
                raise KeyError(f"No flood data returned for zone '{slug}'")

            daily = zone_raw["daily_precip_mm"]
            rainfall_30d_mm = float(sum(v for v in daily if v is not None))
            rainfall_72h_mm = float(sum(v for v in daily[-3:] if v is not None))  # daily granularity ~= 72h

            out[slug] = {
                "rainfall_72h_mm": rainfall_72h_mm,
                "rainfall_30d_mm": rainfall_30d_mm,
                "river_discharge_anomaly": zone_raw.get("river_discharge_anomaly"),
            }

        return out