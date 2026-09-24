import os
from rasterstats import zonal_stats

def compute_soil_stats(village_buffers, soil_raster, column_name):
    if not os.path.exists(soil_raster):
        raise FileNotFoundError(
            f"Soil raster not found at {soil_raster}. "
            "Run soil_fetch.prepare_soil_raster() before calling this, "
            "or check the path in config.py."
        )
    stats = zonal_stats(village_buffers, soil_raster, stats=["mean"])
    village_buffers[column_name] = [s["mean"] for s in stats]
    return village_buffers
