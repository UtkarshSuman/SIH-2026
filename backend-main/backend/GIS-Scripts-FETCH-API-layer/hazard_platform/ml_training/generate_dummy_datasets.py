"""
Generates 1000-row synthetic (dummy) training sets for ALL FOUR hazards,
matching the CURRENT live pipeline exactly:
  - locked FIELD_ORDER per hazard (feature_engineering.py)
  - current AHP-resolved weights (ml_service/weighting/, not hand-set)
  - current 1-12 USDA soil/sediment texture codes + their real risk tables
  - current wave_energy_index scale (0-100+, not 0-1)

This REPLACES the earlier landslide_training_data.csv, which used the
now-superseded 1-5 soil scheme and hand-set weights.

Each row also gets:
  - <hazard>_risk_score: computed with hazard_reference.score(), i.e. the
    EXACT current predictor.py formula -- so an ML model trained against
    it is a genuine surrogate of your live scorer, not an approximation
    of a stale one.
  - zone_color: RED/YELLOW/GREEN via the same 0.7/0.4 thresholds
    zone_classifier.py uses (applied to this hazard alone, as a stand-in
    -- the real system takes the worst of all 4).
  - <hazard>_label: binary target with ~7% injected noise, so it's not
    trivially recoverable by re-deriving the deterministic formula.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone

import hazard_reference as ref

RNG_SEED = 42
N_ROWS = 1000
LABEL_NOISE = 0.07


def _timestamps(rng, n):
    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    end = datetime(2026, 9, 22, tzinfo=timezone.utc)
    span = int((end - start).total_seconds())
    return [(start + timedelta(seconds=int(s))).isoformat() for s in rng.integers(0, span, n)]


def _zone_ids(prefix, n):
    return [f"{prefix}_{i:04d}" for i in range(1, n + 1)]


def _risk_tier(rng, n, probs=(0.55, 0.30, 0.15)):
    """Per-row latent risk tier (0=low, 1=moderate, 2=high), used to
    stratify feature draws toward realistic RED-producing combinations.
    Independent per-feature sampling alone rarely lands every adverse
    factor at once across a modest row count -- this makes "a genuinely
    high-risk zone" (exposed coast + high wave energy + sandy sediment +
    no mangrove, or intense rain + high humidity + high elevation) a
    real, sampled regime instead of a coincidence that a 1000-row draw
    may never hit. Labels are still computed by hazard_reference.score()
    on whatever feature values come out -- this only shapes which
    combinations of inputs get drawn, not the formula or the label."""
    return rng.choice(3, size=n, p=probs)

def _check_independence(df: pd.DataFrame, hazard: str, field: str, driver: str = "rainfall_mm_72h", max_abs_corr: float = 0.3):
    """Fails loudly if `field` is too tightly coupled to `driver`.
    This is the exact class of bug that caused the FLOOD/LANDSLIDE
    flattening incident: a feature generated as a near-deterministic
    function of rainfall meant real zones with an uncommon combination
    (e.g. low rainfall + high soil moisture) fell outside the trained
    range and the RandomForest couldn't extrapolate, collapsing
    unrelated zones onto the same score. Run this on every generated
    field that is supposed to vary somewhat independently of its
    strongest correlated driver.
    """
    if driver not in df.columns:
        return
    corr = df[field].corr(df[driver])
    if abs(corr) > max_abs_corr:
        raise ValueError(
            f"[{hazard}] {field} is too correlated with {driver} "
            f"(corr={corr:.3f}, max allowed={max_abs_corr}). "
            f"This will make the model collapse on real-world zones "
            f"outside the training distribution's dependent range."
        )


def _finalize(hazard: str, df: pd.DataFrame, rng) -> pd.DataFrame:
    """Adds risk_score / zone_color / noisy binary label using the exact
    current live formula from hazard_reference.py, plus standard metadata."""
    fields = ref.FIELD_ORDER[hazard]
    scores = df[fields].apply(lambda row: ref.score(hazard, row.to_dict()), axis=1)
    colors = scores.apply(ref.zone_color)

    base_label = (scores >= 0.5).astype(int)
    flip_mask = rng.random(len(df)) < LABEL_NOISE
    label = np.where(flip_mask, 1 - base_label, base_label)

    df.insert(0, "zone_id", _zone_ids(hazard[:3], len(df)))
    df.insert(1, "hazard_type", hazard)
    df.insert(2, "source", "synthetic_demo")
    df.insert(3, "recorded_at", _timestamps(rng, len(df)))
    df[f"{hazard.lower()}_risk_score"] = scores.round(3)
    df["zone_color"] = colors
    df[f"{hazard.lower()}_label"] = label
    df["data_quality"] = "raw"
    return df


# ---------------------------------------------------------------------
# FLOOD
# ---------------------------------------------------------------------

def generate_flood(rng, n=N_ROWS) -> pd.DataFrame:
    rainfall_24h = np.clip(rng.gamma(2.0, 25.0, n), 0, 250)
    rainfall_72h = np.clip(rainfall_24h * rng.uniform(1.8, 3.2, n) + rng.normal(0, 15, n), 0, 700)
    soil_saturation_pct = np.clip(rng.uniform(10, 90, n) + 0.03 * rainfall_72h + rng.normal(0, 12, n), 0, 100)    
    _check_independence(
        pd.DataFrame({"soil_saturation_pct": soil_saturation_pct, "rainfall_mm_72h": rainfall_72h}),
        "FLOOD", "soil_saturation_pct"
    )
    river_level_m = np.clip(0.5 + 0.012 * rainfall_72h + rng.normal(0, 0.6, n), 0, 8)
    river_level_change_rate = np.clip(
        (rainfall_24h - 40) / 400 + rng.normal(0, 0.15, n), -3, 3
    )
    elevation_m = np.clip(rng.exponential(180, n), 0, 2500)
    distance_to_river_m = np.clip(rng.exponential(700, n), 0, 8000)

    propensity = (
        0.30 * (rainfall_72h / 300) + 0.25 * (river_level_m / 5)
        + 0.20 * (soil_saturation_pct / 100) + 0.15 * (1 - np.clip(elevation_m / 50, 0, 1))
        + 0.10 * (1 - np.clip(distance_to_river_m / 1000, 0, 1))
    )
    historical_flood_count = np.clip(rng.poisson(np.clip(propensity, 0, None) * 6), 0, 18)
    # flood_status_severity_code intentionally NOT generated: it isn't in
    # FIELD_ORDER["FLOOD"] (excluded from judgments/flood.json's factor
    # list -- see hazard_reference.py), so it isn't a training feature.

    df = pd.DataFrame({
        "rainfall_mm_24h": np.round(rainfall_24h, 1),
        "rainfall_mm_72h": np.round(rainfall_72h, 1),
        "river_level_m": np.round(river_level_m, 2),
        "river_level_change_rate_m_per_hr": np.round(river_level_change_rate, 4),
        "soil_saturation_pct": np.round(soil_saturation_pct, 1),
        "elevation_m": np.round(elevation_m, 1),
        "distance_to_river_m": np.round(distance_to_river_m, 1),
        "historical_flood_count": historical_flood_count,
    })
    return _finalize("FLOOD", df, rng)


# ---------------------------------------------------------------------
# LANDSLIDE
# ---------------------------------------------------------------------

def generate_landslide(rng, n=N_ROWS) -> pd.DataFrame:
    slope_deg = np.clip(rng.beta(2.0, 2.5, n) * 70, 0, 90)
    rainfall_72h = np.clip(rng.gamma(2.0, 60.0, n), 0, 600)
    soil_moisture_pct = np.clip(rng.uniform(10, 90, n) + 0.03 * rainfall_72h + rng.normal(0, 12, n), 0, 100)
    soil_type_code = rng.choice(range(1, 13), size=n)  # 1-12 USDA texture, uniform-ish
    vegetation_index = np.clip(
        rng.beta(2.5, 2.0, n) - 0.003 * slope_deg + rng.normal(0, 0.05, n), 0, 1
    )
    _check_independence(
        pd.DataFrame({"soil_moisture_pct": soil_moisture_pct, "rainfall_mm_72h": rainfall_72h}),
        "LANDSLIDE", "soil_moisture_pct"
    )
    propensity = (
        0.35 * (slope_deg / 45) + 0.30 * (rainfall_72h / 300)
        + 0.20 * (soil_moisture_pct / 100) + 0.15 * (1 - vegetation_index)
    )
    historical_landslide_count = np.clip(rng.poisson(np.clip(propensity, 0, None) * 6), 0, 18)

    df = pd.DataFrame({
        "slope_deg": np.round(slope_deg, 1),
        "rainfall_mm_72h": np.round(rainfall_72h, 1),
        "soil_moisture_pct": np.round(soil_moisture_pct, 1),
        "soil_type_code": soil_type_code,
        "vegetation_index": np.round(vegetation_index, 3),
        "historical_landslide_count": historical_landslide_count,
    })
    return _finalize("LANDSLIDE", df, rng)


# ---------------------------------------------------------------------
# EROSION
# ---------------------------------------------------------------------

def generate_erosion(rng, n=N_ROWS) -> pd.DataFrame:
    tier = _risk_tier(rng, n, probs=(0.60, 0.28, 0.12))  # 0=low, 1=moderate, 2=high

    # shoreline retreat magnitude grows with tier (loc/scale both shift);
    # sign stays mostly negative (retreating), matching the original bias
    shoreline_change = rng.normal(-0.4 - 2.6 * tier, 0.9 + 1.0 * tier, n)
    shoreline_change = np.clip(shoreline_change, -6, 6)

    wave_height_m = np.clip(rng.gamma(2.0, 0.4 + 1.3 * tier, n), 0.1, 6)
    wave_period_s = np.clip(rng.normal(7 + 3 * tier, 2, n), 3, 16)
    # clipped to cleaning.py's VALID_RANGES upper bound (500) -- a raw
    # reading above that would be dropped/imputed by the live pipeline,
    # so it should never appear in training data either
    wave_energy_index = np.clip(np.round((wave_height_m ** 2) * wave_period_s, 2), 0, 500)

    # higher tier -> zone sits closer to the coastline (smaller exponential scale)
    distance_to_coast_m = np.clip(rng.exponential(900 - 380 * tier, n), 0, 4000)

    sediment_type_code = np.array([
        rng.choice(range(1, 13), p=_coastal_sediment_probs(t)) for t in tier
    ])

    # higher tier -> less mangrove protection (shift beta mode toward 0)
    mangrove_cover_pct = np.clip(rng.beta(1.0, 2.0 + 7.0 * tier, n) * 100, 0, 100)

    propensity = (
        0.35 * (np.abs(shoreline_change) / 5) + 0.25 * np.clip(wave_energy_index / 100, 0, 1)
        + 0.20 * (1 - np.clip(distance_to_coast_m / 2000, 0, 1)) + 0.20 * (1 - mangrove_cover_pct / 100)
    )
    historical_erosion_events = np.clip(rng.poisson(np.clip(propensity, 0, None) * 5), 0, 15)

    df = pd.DataFrame({
        "shoreline_change_rate_m_per_yr": np.round(shoreline_change, 2),
        "wave_energy_index": wave_energy_index,
        "distance_to_coast_m": np.round(distance_to_coast_m, 1),
        "sediment_type_code": sediment_type_code,
        "mangrove_cover_pct": np.round(mangrove_cover_pct, 1),
        "historical_erosion_events": historical_erosion_events,
    })
    return _finalize("EROSION", df, rng)


def _coastal_sediment_probs(tier=0):
    # Weighted toward sandier codes (9-12), realistic for open-coast India;
    # still covers the full 1-12 range for river-mouth/deltaic zones.
    # Higher tier shifts more mass onto the sandiest (highest-risk) codes
    # 11-12, matching exposed-beach/dune sediment on high-erosion coasts.
    base = np.array([0.04, 0.04, 0.04, 0.05, 0.05, 0.06, 0.08, 0.09, 0.13, 0.14, 0.14, 0.14])
    shift = np.array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.10, 0.20]) * tier
    raw = base + shift
    return raw / raw.sum()


# ---------------------------------------------------------------------
# CLOUDBURST
# ---------------------------------------------------------------------

def generate_cloudburst(rng, n=N_ROWS) -> pd.DataFrame:
    tier = _risk_tier(rng, n)  # 0=low, 1=moderate, 2=high

    rainfall_intensity = np.clip(rng.gamma(2.0, 12.0 + 30.0 * tier, n), 0, 150)
    humidity_pct = np.clip(rng.normal(65 + 8 * tier, 13, n), 10, 100)
    temperature_c = np.clip(rng.normal(27, 5, n), -5, 45)  # excluded from scoring; tier-independent
    elevation_m = np.clip(rng.gamma(2.0, 200.0 + 175.0 * tier, n), 0, 3500)  # hilly-region skew
    wind_speed_kmph = np.clip(rng.gamma(2.0, 6.0 + 8.0 * tier, n), 0, 90)

    propensity = (
        0.45 * (rainfall_intensity / 100) + 0.15 * (humidity_pct / 100)
        + 0.15 * np.clip(elevation_m / 2500, 0, 1) + 0.10 * (wind_speed_kmph / 60)
    )
    historical_cloudburst_count = np.clip(rng.poisson(np.clip(propensity, 0, None) * 5), 0, 15)

    df = pd.DataFrame({
        "rainfall_intensity_mm_per_hr": np.round(rainfall_intensity, 1),
        "humidity_pct": np.round(humidity_pct, 1),
        "temperature_c": np.round(temperature_c, 1),
        "elevation_m": np.round(elevation_m, 1),
        "wind_speed_kmph": np.round(wind_speed_kmph, 1),
        "historical_cloudburst_count": historical_cloudburst_count,
    })
    return _finalize("CLOUDBURST", df, rng)


if __name__ == "__main__":
    import os

    out_dir = os.path.dirname(os.path.abspath(__file__)) or "."
    os.makedirs(out_dir, exist_ok=True)

    generators = {
        "flood": generate_flood,
        "landslide": generate_landslide,
        "erosion": generate_erosion,
        "cloudburst": generate_cloudburst,
    }

    for name, fn in generators.items():
        rng = np.random.default_rng(RNG_SEED)
        df = fn(rng)
        path = f"{out_dir}/{name}_training_data.csv"
        df.to_csv(path, index=False)
        print(f"{name}: {df.shape}, zone_color counts -> {df['zone_color'].value_counts().to_dict()}")
