import geopandas as gpd
import config

gdf = gpd.read_file(config.VILLAGE_BUFFERS)

for col in ["population", "population_worldpop", "dist_to_river_m", "raster_mean", "full_id"]:
    if col in gdf.columns:
        print(col, gdf[col].dtype)
        print(gdf[col].unique()[:10])
    else:
        print(col, "MISSING from columns")
    print("---")

# Explicit full_id check for the main.py merge step
if "full_id" not in gdf.columns:
    print("WARNING: 'full_id' missing — main.py's merge on full_id will raise a KeyError.")
    print("Available columns:", list(gdf.columns))
else:
    n_total = len(gdf)
    n_unique = gdf["full_id"].nunique()
    n_null = gdf["full_id"].isna().sum()
    print(f"full_id: {n_unique} unique / {n_total} rows, {n_null} nulls")
    if n_unique < n_total:
        print("WARNING: full_id has duplicates — merge in main.py will fan out rows.")
    if n_null > 0:
        print("WARNING: full_id has nulls — those rows will fail to join in main.py's merge.")