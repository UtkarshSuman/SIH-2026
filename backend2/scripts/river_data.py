import geopandas as gpd
import xarray as xr
import numpy as np  # add this import at the top of the file if not already there



def sample_glofas_discharge(stats_df, glofas_nc_path, lat_col="lat_wgs84", lon_col="lon_wgs84"):
    ds = xr.open_dataset(glofas_nc_path)
    ds = ds.squeeze(drop=True)  # drops singleton dims like time/step/number that GRIB sometimes adds

    var_name = "avg_dis"  # confirm against list(ds.data_vars) if this still fails

    lat_name = "latitude" if "latitude" in ds.coords else "lat"
    lon_name = "longitude" if "longitude" in ds.coords else "lon"

    lats = xr.DataArray(stats_df[lat_col].values, dims="points")
    lons = xr.DataArray(stats_df[lon_col].values, dims="points")

    sampled = ds[var_name].sel({lat_name: lats, lon_name: lons}, method="nearest")
    values = np.asarray(sampled.values).reshape(-1)

    if len(values) != len(stats_df):
        raise RuntimeError(
            f"GloFAS sampling returned {len(values)} values but expected {len(stats_df)} "
            f"(one per village). ds['{var_name}'].dims = {ds[var_name].dims}, "
            f"shape = {ds[var_name].shape}. Inspect these before retrying."
        )

    stats_df["flood_risk_discharge_cumecs"] = values
    return stats_df

def load_river_network(river_path):
    return gpd.read_file(river_path, layer="HydroRIVERS_v10_as")


def distance_to_nearest_river(villages_gdf, rivers_gdf):
    if rivers_gdf.crs != villages_gdf.crs:
        rivers_gdf = rivers_gdf.to_crs(villages_gdf.crs)
    rivers_union = rivers_gdf.geometry.unary_union
    villages_gdf["dist_to_river_m"] = villages_gdf.geometry.distance(rivers_union)
    return villages_gdf


def flag_flood_risk(villages_gdf, threshold_m=200):
    villages_gdf["flood_risk"] = villages_gdf["dist_to_river_m"] <= threshold_m
    return villages_gdf