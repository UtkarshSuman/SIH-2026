import config
import raster_utils
import vector_utils
import zonal_stats
import river_data
import capacity
import weather_data
from soil_stats import compute_soil_stats
from soil_fetch import prepare_soil_raster 
import geopandas as gpd
from glofas_fetch import fetch_glofas_historical, fetch_glofas_forecast
from population_fetch import prepare_population_raster, compute_population_stats
from infra_data import fetch_state_pbf, load_osm_layers, distance_to_nearest_road, distance_to_nearest_hospital
def run_pipeline():
    raster_utils.fetch_dem(config.BBOX_WGS84, config.DEM_RAW, api_key=config.OPENTOPO_API_KEY)
    raster_utils.reproject_raster(config.DEM_RAW, config.DEM_UTM, config.TARGET_CRS_UTM)
    raster_utils.compute_slope(config.DEM_UTM, config.SLOPE_RAW)
    raster_utils.classify_slope(config.SLOPE_RAW, config.SLOPE_CLASSIFIED, config.SLOPE_CLASS_BREAKS)

    # 4. Polygonize high-hazard class into Red Zones (class 3 = high, now the top tier)
    vector_utils.polygonize_raster(config.SLOPE_CLASSIFIED, config.RED_ZONES, target_classes=[3])
    # vector_utils.dissolve_zones(config.RED_ZONES, config.RED_ZONES)   # NEW — merge adjacent pixel-clusters into contiguous zones
    # NEW: reproject raw villages (WGS84) to UTM before buffering
    vector_utils.reproject_villages(config.VILLAGES_RAW, config.VILLAGES_UTM, config.TARGET_CRS_UTM)

    vector_utils.buffer_villages(config.VILLAGES_UTM, config.VILLAGE_BUFFERS, config.VILLAGE_BUFFER_DIST_M)

    villages = gpd.read_file(config.VILLAGE_BUFFERS)

    stats_df = zonal_stats.compute_zonal_stats(config.VILLAGE_BUFFERS, config.SLOPE_CLASSIFIED)
    rivers_gdf = river_data.load_river_network(config.RIVER_NETWORK_SHP)
    if config.GLOFAS_MODE == "historical":
      glofas_path = fetch_glofas_historical(config.BBOX_WGS84, config.GLOFAS_RAW, config.GLOFAS_HISTORICAL_DATE)
    else:
      glofas_path = fetch_glofas_forecast(config.BBOX_WGS84, config.GLOFAS_RAW)

    stats_df = river_data.sample_glofas_discharge(stats_df, glofas_path)
    stats_df = river_data.distance_to_nearest_river(stats_df, rivers_gdf)

        # NEW: auto-fetch + reproject soil rasters if missing
    clay_path = prepare_soil_raster("clay", config.BBOX_WGS84, config.SOIL_RAW_DIR, config.SOIL_UTM_DIR, config.TARGET_CRS_UTM)
    silt_path = prepare_soil_raster("silt", config.BBOX_WGS84, config.SOIL_RAW_DIR, config.SOIL_UTM_DIR, config.TARGET_CRS_UTM)
    sand_path = prepare_soil_raster("sand", config.BBOX_WGS84, config.SOIL_RAW_DIR, config.SOIL_UTM_DIR, config.TARGET_CRS_UTM)

    stats_df = weather_data.fetch_rainfall_for_villages(stats_df, past_days=config.RAINFALL_LOOKBACK_DAYS)
    villages = compute_soil_stats(villages, clay_path, "soil_clay_mean")
    villages = compute_soil_stats(villages, silt_path, "soil_silt_mean")
    pop_raster = prepare_population_raster(config.BBOX_WGS84, config.POP_RAW_DIR, config.POP_UTM_DIR, config.TARGET_CRS_UTM, config.WORLDPOP_INDIA_RASTER)    
    villages = compute_population_stats(villages, pop_raster, "population_worldpop")
    villages = compute_soil_stats(villages, sand_path, "soil_sand_mean")

    state_pbf = fetch_state_pbf(config.STATE, config.GEOFABRIK_DIR, region=config.ACTIVE_REGION)    
    roads_gdf, healthcare_gdf = load_osm_layers(state_pbf, config.BBOX_WGS84)
    stats_df = distance_to_nearest_road(stats_df, roads_gdf)
    stats_df = distance_to_nearest_hospital(stats_df, healthcare_gdf)
        # NEW: merge soil results into stats_df BEFORE scoring/export — this was missing
    stats_df = stats_df.merge(
        villages[["full_id", "soil_clay_mean", "soil_silt_mean", "soil_sand_mean", "population_worldpop"]],        
        on="full_id",
        how="left"
    )
    stats_df = capacity.compute_red_zone_flag(stats_df)
    ranked_df = capacity.compute_priority_score(stats_df)
    capacity.export_ml_ready(ranked_df, config.ML_READY_CSV)

    print("Pipeline complete.")


if __name__ == "__main__":
    run_pipeline()