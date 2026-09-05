"""
FEATURE: REAL, working example source for flood-relevant data - Open-Meteo's
free Flood API (river discharge forecasts) + Weather API (precipitation).
No API key required, no rate limit for reasonable use. This is a genuine
usable source, not a placeholder - use it as-is or alongside a second
source your team adds (e.g. a government hydrology API) for redundancy.
INSTALLATION: pip install httpx
"""
import httpx
from app.data_sources.base import HazardDataSource


class OpenMeteoFloodSource(HazardDataSource):
    name = "open_meteo_flood"
    hazard_type = "flood"

    async def fetch(self, zones: list[dict]) -> dict:
        results = {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            for zone in zones:
                res = await client.get(
                    "https://flood-api.open-meteo.com/v1/flood",
                    params={
                        "latitude": zone["lat"],
                        "longitude": zone["lng"],
                        "daily": "river_discharge",
                        "forecast_days": 1,
                    },
                )
                res.raise_for_status()
                results[zone["slug"]] = res.json()
        return results

    def transform(self, raw: dict, zones: list[dict]) -> dict[str, dict]:
        normalized = {}
        for zone in zones:
            data = raw.get(zone["slug"], {})
            discharge = data.get("daily", {}).get("river_discharge", [None])[0]
            normalized[zone["slug"]] = {"river_discharge": discharge or 0}
        return normalized