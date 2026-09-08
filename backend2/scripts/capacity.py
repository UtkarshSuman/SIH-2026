import pandas as pd
import numpy as np

def clean_population(df, col="population"):
    def parse_val(v):
        if pd.isna(v):
            return np.nan
        v = str(v).strip()
        if "-" in v:
            # range like '100-150' -> take upper bound
            parts = v.split("-")
            try:
                return float(parts[-1])
            except ValueError:
                return np.nan
        try:
            return float(v)
        except ValueError:
            return np.nan

    df[col] = df[col].apply(parse_val)
    median_val = df[col].median()
    df[col] = df[col].fillna(median_val)
    return df


def compute_carrying_capacity(df, available_land_col, land_per_household=100):
    df["carrying_capacity_households"] = (df[available_land_col] / land_per_household).astype(int)
    return df


def compute_priority_score(df, weights=None, log_transform_cols=None):
    weights = weights or {
        "raster_mean": 0.20,
        "dist_to_river_m": -0.10,
        "population_worldpop": 0.20,        
        "rainfall_mm": 0.10,
        "flood_risk_discharge_cumecs": 0.15,
        "soil_clay_mean": 0.05,
        "dist_to_road_m": 0.10,
        "dist_to_hospital_m": 0.10,
    }
    log_transform_cols = log_transform_cols or ["population_worldpop", "flood_risk_discharge_cumecs"]
    df["priority_score"] = 0.0
    for col, weight in weights.items():
        if col not in df.columns:
            continue
        series = df[col]
        if col in log_transform_cols:
            series = np.log1p(series.clip(lower=0))
        normalized = (series - series.min()) / (series.max() - series.min() + 1e-9)
        df["priority_score"] += normalized * weight

    df = df.sort_values("priority_score", ascending=False).reset_index(drop=True)
    df["priority_rank"] = df.index + 1
    return df

def compute_red_zone_flag(df, weights=None, log_transform_cols=None, top_percentile=0.25):
    weights = weights or {
        "raster_mean": 0.30,               # slope-class mean
        "dist_to_river_m": -0.25,          # closer = higher hazard
        "flood_risk_discharge_cumecs": 0.25,
        "rainfall_mm": 0.10,
        "soil_clay_mean": 0.10,
    }
    log_transform_cols = log_transform_cols or ["flood_risk_discharge_cumecs"]

    df["hazard_score"] = 0.0
    for col, weight in weights.items():
        if col not in df.columns:
            continue
        series = df[col]
        if col in log_transform_cols:
            series = np.log1p(series.clip(lower=0))
        normalized = (series - series.min()) / (series.max() - series.min() + 1e-9)
        df["hazard_score"] += normalized * weight

    threshold = df["hazard_score"].quantile(1 - top_percentile)
    df["red_zone_flag"] = df["hazard_score"] >= threshold
    return df

def export_ml_ready(df, output_csv):
    df.to_csv(output_csv, index=False)
    print(f"ML-ready dataset saved to {output_csv}")