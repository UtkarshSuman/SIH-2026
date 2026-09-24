import os
import requests
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling

WCS_BASE = "https://maps.isric.org/mapserv?map=/map/{prop}.map"

SOIL_LAYERS = {
    "clay": "clay_0-5cm_mean",
    "silt": "silt_0-5cm_mean",
    "sand": "sand_0-5cm_mean",
}

def fetch_soilgrids_layer(property_name, bbox_wgs84, out_path_raw):
    minx, miny, maxx, maxy = bbox_wgs84
    coverage_id = SOIL_LAYERS[property_name]
    params = {
        "SERVICE": "WCS", "VERSION": "2.0.1", "REQUEST": "GetCoverage",
        "COVERAGEID": coverage_id, "FORMAT": "GEOTIFF_INT16",
        "SUBSET": [f"X({minx},{maxx})", f"Y({miny},{maxy})"],
        "SUBSETTINGCRS": "http://www.opengis.net/def/crs/EPSG/0/4326",
        "OUTPUTCRS": "http://www.opengis.net/def/crs/EPSG/0/4326",
    }
    url = WCS_BASE.format(prop=property_name)
    resp = requests.get(url, params=params, timeout=120)
    resp.raise_for_status()
    os.makedirs(os.path.dirname(out_path_raw), exist_ok=True)
    with open(out_path_raw, "wb") as f:
        f.write(resp.content)
    return out_path_raw


def reproject_to_utm(src_path, dst_path, dst_crs):
    with rasterio.open(src_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds
        )
        kwargs = src.meta.copy()
        kwargs.update({"crs": dst_crs, "transform": transform, "width": width, "height": height})
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        with rasterio.open(dst_path, "w", **kwargs) as dst:
            for i in range(1, src.count + 1):
                reproject(
                    source=rasterio.band(src, i), destination=rasterio.band(dst, i),
                    src_transform=src.transform, src_crs=src.crs,
                    dst_transform=transform, dst_crs=dst_crs,
                    resampling=Resampling.bilinear,
                )
    return dst_path


def prepare_soil_raster(property_name, bbox_wgs84, raw_dir, utm_dir, dst_crs):
    """Idempotent — skips fetch/reproject if the final UTM raster already exists."""
    raw_path = os.path.join(raw_dir, f"{property_name}_raw.tif")
    utm_path = os.path.join(utm_dir, f"{property_name}_content.tif")
    if not os.path.exists(utm_path):
        fetch_soilgrids_layer(property_name, bbox_wgs84, raw_path)
        reproject_to_utm(raw_path, utm_path, dst_crs)
    return utm_path