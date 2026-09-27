import hazard_reference as ref

flood_inputs = {
    "rainfall_mm_24h": 4.0,
    "rainfall_mm_72h": 27.0,
    "river_level_m": None,
    "river_level_change_rate_m_per_hr": -0.0467,
    "soil_saturation_pct": 81.0,
    "distance_to_river_m": 2533.146301368352,
    "historical_flood_count": 0.0,
    "flood_status_severity_code": 0.0,
    "elevation_m": 52.0,
    "river_discharge_m3s": 7.61,
    "historical_cloudburst_count": 0.0,
    "historical_erosion_events": 0.0,
    "historical_landslide_count": 0.0,
    "sediment_type_code": 4.0,
}

landslide_inputs = {
    "rainfall_mm_72h": 27.0,
    "slope_deg": 1.61,
    "soil_type_code": 4,
    "soil_moisture_pct": 83.0,
    "vegetation_index": 0.06402043993496359,
    "historical_landslide_count": 0.0,
    "distance_to_river_m": 2533.146301368352,
    "flood_status_severity_code": 0.0,
    "historical_cloudburst_count": 0.0,
    "historical_erosion_events": 0.0,
    "historical_flood_count": 0.0,
    "sediment_type_code": 4.0,
}

flood_score = ref.score("FLOOD", flood_inputs)
landslide_score = ref.score("LANDSLIDE", landslide_inputs)

print("FLOOD score (rule-based, ground truth):", flood_score)
print("LANDSLIDE score (rule-based, ground truth):", landslide_score)