import rasterio
import numpy as np
import requests
from pathlib import Path
from rasterio.warp import calculate_default_transform, reproject, Resampling

def fetch_dem(bbox, out_path, demtype="SRTMGL1", api_key=None):
    """bbox = (minx, miny, maxx, maxy) i.e. (west, south, east, north) — matches config.py convention"""
    if Path(out_path).exists():
        print(f"DEM already cached at {out_path}, skipping download.")
        return out_path

    west, south, east, north = bbox
    url = "https://portal.opentopography.org/API/globaldem"
    params = {
        "demtype": demtype,
        "south": south, "north": north,
        "west": west, "east": east,
        "outputFormat": "GTiff",
        "API_Key": api_key,
    }
    r = requests.get(url, params=params, timeout=120)
    if r.status_code == 401:
        raise RuntimeError("OpenTopography rejected the API key — check .env")
    r.raise_for_status()

    with open(out_path, "wb") as f:
        f.write(r.content)
    return out_path

def reproject_raster(src_path, dst_path, dst_crs):
    with rasterio.open(src_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds
        )
        kwargs = src.meta.copy()
        kwargs.update({"crs": dst_crs, "transform": transform, "width": width, "height": height})
        with rasterio.open(dst_path, "w", **kwargs) as dst:
            for i in range(1, src.count + 1):
                reproject(
                    source=rasterio.band(src, i),
                    destination=rasterio.band(dst, i),
                    src_transform=src.transform, src_crs=src.crs,
                    dst_transform=transform, dst_crs=dst_crs,
                    resampling=Resampling.bilinear,
                )
    print(f"Reprojected raster saved to {dst_path}")


def compute_slope(dem_path, slope_path):
    with rasterio.open(dem_path) as src:
        dem = src.read(1).astype(float)
        transform = src.transform
        cellsize_x = transform[0]
        cellsize_y = -transform[4]

        gy, gx = np.gradient(dem, cellsize_y, cellsize_x)
        slope_rad = np.arctan(np.sqrt(gx**2 + gy**2))
        slope_deg = np.degrees(slope_rad)

        profile = src.profile
        profile.update(dtype=rasterio.float32)
        with rasterio.open(slope_path, "w", **profile) as dst:
            dst.write(slope_deg.astype(rasterio.float32), 1)
    print(f"Slope raster saved to {slope_path}")


def classify_slope(slope_path, classified_path, breaks):
    with rasterio.open(slope_path) as src:
        slope = src.read(1)
        classified = np.zeros_like(slope, dtype=np.uint8)

        for idx, (label, (low, high)) in enumerate(breaks.items(), start=1):
            mask = (slope >= low) & (slope < high)
            classified[mask] = idx

        profile = src.profile
        profile.update(dtype=rasterio.uint8, nodata=0)
        with rasterio.open(classified_path, "w", **profile) as dst:
            dst.write(classified, 1)
    print(f"Classified slope raster saved to {classified_path}")