"""hazard_reference.py — single source of truth for the CURRENT live
scoring formula across all 4 hazards, extracted from the
hazard_platform.zip / gis_fetcher.zip you uploaded (ml_service/inference/
predictor.py + ml_service/weighting/judgments/*.json, resolved through
ahp.py). Used by both generate_dummy_datasets.py (to label synthetic
data) and train_hazard_models.py (so the ML target is defined
consistently with what predictor.py itself currently computes).

Weights below are NOT hand-typed guesses -- they were produced by
actually running your ahp.py solver against your judgments/*.json files.
If you re-elicit those judgment files, re-run that solve and update the
WEIGHTS dicts here to match.
"""
from __future__ import annotations
from pyexpat import features

FIELD_ORDER = {
    "FLOOD": [
        "rainfall_mm_24h", "rainfall_mm_72h", "river_level_m",
        "river_level_change_rate_m_per_hr", "soil_saturation_pct",
        "elevation_m", "distance_to_river_m", "historical_flood_count",
    ],
    "LANDSLIDE": [
        "slope_deg", "rainfall_mm_72h", "soil_moisture_pct",
        "soil_type_code", "vegetation_index", "historical_landslide_count",
    ],
    "EROSION": [
        "shoreline_change_rate_m_per_yr", "wave_energy_index",
        "distance_to_coast_m", "sediment_type_code", "mangrove_cover_pct",
        "historical_erosion_events",
    ],
    "CLOUDBURST": [
        "rainfall_intensity_mm_per_hr", "humidity_pct", "temperature_c",
        "elevation_m", "wind_speed_kmph", "historical_cloudburst_count",
    ],
}

# AHP-resolved weights (ahp.solve() run against your actual judgments/*.json).
# soil_type_code / sediment_type_code are pulled out of the linear-normalize
# WEIGHTS dict below and handled via their own lookup tables, same split
# predictor.py itself makes.
WEIGHTS = {
    "FLOOD": {
        "rainfall_mm_24h": 0.17037090007627764, "rainfall_mm_72h": 0.17037090007627764,
        "river_level_m": 0.17662090007627765, "river_level_change_rate_m_per_hr": 0.0981788710907704,
        "soil_saturation_pct": 0.15846613817151575, "elevation_m": 0.08831045003813882,
        "distance_to_river_m": 0.08831045003813882, "historical_flood_count": 0.049371390432603246,
    },
    "LANDSLIDE": {
        "slope_deg": 0.24050116550116551, "rainfall_mm_72h": 0.19970862470862472,
        "soil_moisture_pct": 0.17887529137529137, "vegetation_index": 0.12782634032634033,
        "historical_landslide_count": 0.09344405594405596,
    },
    "EROSION": {
        "shoreline_change_rate_m_per_yr": 0.29714285714285715, "wave_energy_index": 0.19714285714285712,
        "distance_to_coast_m": 0.16857142857142857, "historical_erosion_events": 0.16857142857142857,
    },
    "CLOUDBURST": {
        "rainfall_intensity_mm_per_hr": 0.44603174603174606, "humidity_pct": 0.14034391534391535,
        "elevation_m": 0.14034391534391535, "wind_speed_kmph": 0.13293650793650794,
        "historical_cloudburst_count": 0.14034391534391535,
        # temperature_c: tracked in FIELD_ORDER but NOT in judgments/cloudburst.json
        # at all -- non-monotonic relationship to risk, excluded entirely.
    },
}

REFERENCE_MAX = {
    "FLOOD": {
        "rainfall_mm_24h": 150.0, "rainfall_mm_72h": 300.0, "river_level_m": 5.0,
        "river_level_change_rate_m_per_hr": 0.5, "soil_saturation_pct": 100.0,
        "elevation_m": 50.0, "distance_to_river_m": 1000.0, "historical_flood_count": 10.0,
    },
    "LANDSLIDE": {
        "slope_deg": 45.0, "rainfall_mm_72h": 300.0, "soil_moisture_pct": 100.0,
        "vegetation_index": 1.0, "historical_landslide_count": 10.0,
    },
    "EROSION": {
        "shoreline_change_rate_m_per_yr": 5.0,
        # 100.0, not 1.0 -- gis_fetcher's marine provider computes this as
        # (wave_height_m ** 2) * wave_period_s, routinely 10-50+, not a 0-1 index.
        "wave_energy_index": 100.0,
        "distance_to_coast_m": 2000.0, "historical_erosion_events": 10.0,
    },
    "CLOUDBURST": {
        "rainfall_intensity_mm_per_hr": 100.0, "humidity_pct": 100.0,
        "elevation_m": 2500.0, "wind_speed_kmph": 60.0, "historical_cloudburst_count": 10.0,
    },
}

PROTECTIVE = {
    "FLOOD": {"elevation_m", "distance_to_river_m"},
    "LANDSLIDE": {"vegetation_index"},
    "EROSION": {"distance_to_coast_m"},
    "CLOUDBURST": set(),  # elevation_m is risk-INCREASING here (orographic effect)
}

# Categorical lookup tables -- both keyed 1-12 (USDA texture: 1=clay ... 12=sand),
# both sourced from the same underlying SoilGrids-via-GEE texture classification,
# but ranked on DIFFERENT criteria per hazard (drainage/cohesion for landslide,
# grain-size erodibility under wave action for erosion) -- NOT the same table.
SOIL_RISK_BY_CODE = {
    1: 0.85, 2: 0.80, 3: 0.65, 4: 0.70, 5: 0.65, 6: 0.55,
    7: 0.45, 8: 0.55, 9: 0.35, 10: 0.70, 11: 0.25, 12: 0.15,
}
SOIL_TYPE_WEIGHT = 0.15964452214452216  # LANDSLIDE's soil_type_code weight, pulled out of WEIGHTS

SEDIMENT_RISK_BY_CODE = {
    1: 0.20, 2: 0.25, 3: 0.35, 4: 0.30, 5: 0.35, 6: 0.45,
    7: 0.50, 8: 0.55, 9: 0.65, 10: 0.60, 11: 0.80, 12: 0.90,
}
SEDIMENT_TYPE_WEIGHT = 0.16857142857142857  # EROSION's sediment_type_code weight

MANGROVE_PROTECTION_FACTOR = 0.3  # up to 30% risk reduction at 100% mangrove cover

ZONE_RED_THRESHOLD = 0.7
ZONE_YELLOW_THRESHOLD = 0.4


def normalize(value, reference_max, invert=False):
    """Mirrors predictor.py's _normalize(): missing values -> neutral 0.5."""
    if value is None:
        return 0.5
    ratio = min(max(value / reference_max, 0.0), 1.0)
    return (1.0 - ratio) if invert else ratio


def score(hazard: str, features: dict) -> float:
    """Reproduces predictor.py's per-hazard .score(features).score exactly,
    including LANDSLIDE/EROSION's categorical lookup-table split and
    EROSION's post-hoc mangrove discount. Returns a float in [0, 1]."""
    weights = WEIGHTS[hazard]
    ref_max = REFERENCE_MAX[hazard]
    protective = PROTECTIVE[hazard]

    # EROSION's shoreline_change_rate_m_per_yr is signed (negative =
    # retreat, positive = accretion) but predictor.py's ErosionScorer
    # normalizes its ABSOLUTE VALUE -- either direction of change signals
    # an unstable coastline. Skip it in the generic loop below and add it
    # explicitly, exactly matching predictor.py's norm_change line;
    # without this, a raw normalize() call clips every negative (retreating,
    # the actually-risky case) value to a 0 contribution while treating
    # accretion as the risky direction -- backwards from the live scorer.
    shoreline_field = "shoreline_change_rate_m_per_yr"
    generic_fields = {
        field: w for field, w in weights.items()
        if not (hazard == "EROSION" and field == shoreline_field)
    }
    total = sum(
        w * normalize(features.get(field), ref_max[field], field in protective)
        for field, w in generic_fields.items()
    )
    if hazard == "EROSION":
        raw_change = features.get(shoreline_field)
        total += weights[shoreline_field] * normalize(
            abs(raw_change) if raw_change is not None else None,
            ref_max[shoreline_field],
        )

    if hazard == "LANDSLIDE":
        soil_code = features.get("soil_type_code")
        soil_risk = SOIL_RISK_BY_CODE.get(int(soil_code), 0.5) if soil_code is not None else 0.5
        total += SOIL_TYPE_WEIGHT * soil_risk
        slope_gate = min(1.0, (features.get("slope_deg") or 0.0) / 5.0)
        total *= slope_gate

    if hazard == "EROSION":
        sed_code = features.get("sediment_type_code")
        sed_risk = SEDIMENT_RISK_BY_CODE.get(int(sed_code), 0.5) if sed_code is not None else 0.5
        total += SEDIMENT_TYPE_WEIGHT * sed_risk
        mangrove_cover = features.get("mangrove_cover_pct") or 0.0
        protection = MANGROVE_PROTECTION_FACTOR * (mangrove_cover / 100.0)
        total = total * (1 - protection)

    return min(max(total, 0.0), 1.0)


def zone_color(risk_score: float) -> str:
    if risk_score >= ZONE_RED_THRESHOLD:
        return "RED"
    if risk_score >= ZONE_YELLOW_THRESHOLD:
        return "YELLOW"
    return "GREEN"
