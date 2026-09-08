import geopandas as gpd
from rasterstats import zonal_stats


def compute_zonal_stats(vector_path, raster_path, stats=("mean", "min", "max", "count")):
    gdf = gpd.read_file(vector_path)
    results = zonal_stats(gdf, raster_path, stats=list(stats), geojson_out=False)
    stats_df = gdf.copy()
    for stat in stats:
        stats_df[f"raster_{stat}"] = [r.get(stat) for r in results]
    return stats_df


def merge_zonal_results(gdf, output_path):
    gdf.to_file(output_path, driver="GPKG")
    print(f"Zonal stats saved to {output_path}")