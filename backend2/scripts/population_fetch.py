import os
import rasterio
from rasterio.mask import mask
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterstats import zonal_stats
from shapely.geometry import box


def fetch_population_raster(bbox_wgs84, out_path, india_raster_path):
    """Clips the region's population raster from the pre-downloaded India-wide
    WorldPop raster instead of calling the (unreliable) ArcGIS ImageServer."""
    if os.path.exists(out_path):
        print(f"Population raster already cached at {out_path}, skipping fetch.")
        return out_path

    minx, miny, maxx, maxy = bbox_wgs84
    geom = [box(minx, miny, maxx, maxy)]

    with rasterio.open(india_raster_path) as src:
        out_image, out_transform = mask(src, geom, crop=True)
        out_meta = src.meta.copy()
        out_meta.update({
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform,
        })

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with rasterio.open(out_path, "w", **out_meta) as dst:
        dst.write(out_image)

    print(f"Population raster clipped from India-wide WorldPop file, saved to {out_path}")
    return out_path
def reproject_population_raster(src_path, dst_path, dst_crs):
    with rasterio.open(src_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds
        )
        kwargs = src.meta.copy()
        kwargs.update({"crs": dst_crs, "transform": transform, "width": width, "height": height})
        with rasterio.open(dst_path, "w", **kwargs) as dst:
            for i in range(1, src.count + 1):
                reproject(
                    source=rasterio.band(src, i), destination=rasterio.band(dst, i),
                    src_transform=src.transform, src_crs=src.crs,
                    dst_transform=transform, dst_crs=dst_crs,
                    resampling=Resampling.bilinear,
                )
    return dst_path


def prepare_population_raster(bbox_wgs84, raw_dir, utm_dir, dst_crs, india_raster_path):
    """Idempotent, same pattern as prepare_soil_raster — dst_crs must be passed explicitly
    (no hardcoded default, to avoid repeating the Joshimath-CRS bug found in soil_fetch.py)."""
    raw_path = os.path.join(raw_dir, "population_raw.tif")
    utm_path = os.path.join(utm_dir, "population_worldpop.tif")
    if not os.path.exists(utm_path):
        fetch_population_raster(bbox_wgs84, raw_path, india_raster_path)
        os.makedirs(utm_dir, exist_ok=True)
        reproject_population_raster(raw_path, utm_path, dst_crs)
    return utm_path

def compute_population_stats(village_buffers, population_raster, column_name="population_worldpop"):
    """Uses SUM, not mean — each pixel is a population COUNT, so summing pixels inside
    a village's buffer gives total estimated population there."""
    stats = zonal_stats(village_buffers, population_raster, stats=["sum"])
    village_buffers[column_name] = [s["sum"] if s["sum"] is not None else 0 for s in stats]
    return village_buffers