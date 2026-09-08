import requests
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def _build_session():
    """Automatically retries on connection drops/timeouts, not just bad HTTP status codes."""
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=2,   # waits 2s, 4s, 8s, 16s, 32s between retries
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    session.mount("https://", HTTPAdapter(max_retries=retries))
    return session

_SESSION = _build_session()
def fetch_rainfall_for_villages(gdf, past_days=30, batch_size=100):
    """
    Fetches cumulative rainfall (mm) over the past `past_days` days for each
    village, using the centroid of its geometry. Adds a 'rainfall_mm' column.
    Works regardless of the gdf's current CRS (reprojects to EPSG:4326 internally).
    """
    gdf = gdf.copy()
    # Compute centroids in the original (projected) CRS for accuracy,
    # then reproject just the centroid points to EPSG:4326 for the API.
    centroids_projected = gdf.geometry.centroid
    centroids_4326 = centroids_projected.to_crs("EPSG:4326")
    lats = centroids_4326.y.round(4).tolist()
    lons = centroids_4326.x.round(4).tolist()

    rainfall_values = []

    for i in range(0, len(lats), batch_size):
        batch_lats = lats[i:i + batch_size]
        batch_lons = lons[i:i + batch_size]

        params = {
            "latitude": ",".join(map(str, batch_lats)),
            "longitude": ",".join(map(str, batch_lons)),
            "daily": "precipitation_sum",
            "past_days": past_days,
            "forecast_days": 0,
            "timezone": "auto",
        }

        for attempt in range(5):
            resp = _SESSION.get(OPEN_METEO_URL, params=params, timeout=60)
            if resp.status_code == 429:
                wait = 10 * (attempt + 1)
                print(f"Rate limited by Open-Meteo, waiting {wait}s before retry...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            break
        else:
            raise RuntimeError("Open-Meteo rate limit retries exhausted")

        data = resp.json()
        time.sleep(2)  # small pause between successful batches to avoid re-triggering the limiter
        # Open-Meteo returns a list when multiple lat/lon pairs are passed,
        # a single dict when only one is passed
        results = data if isinstance(data, list) else [data]

        for r in results:
            daily_precip = r.get("daily", {}).get("precipitation_sum", [])
            total = sum(v for v in daily_precip if v is not None)
            rainfall_values.append(total)

    gdf["rainfall_mm"] = rainfall_values
    return gdf