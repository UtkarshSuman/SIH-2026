# FEATURE: Weighted-overlay landslide susceptibility model. Rule-based, not
#          a trained classifier — there is no labeled historical
#          landslide-incident dataset to train against yet. Weights below
#          follow standard landslide susceptibility mapping literature
#          (slope as the dominant static predictor, rainfall as the dynamic
#          trigger, clay content as a soil-stability modifier) but are a
#          starting point for the project owner to recalibrate once
#          incident data exists — see landslide/README.md.
#
# INSTALLATION: pip install numpy

from __future__ import annotations

import logging

import numpy as np

from app.hazard.model_base import HazardModel, score_to_status

logger = logging.getLogger(__name__)

# --- Weights (sum to 1.0) ---
W_SLOPE = 0.40          # single strongest predictor
W_CLAY = 0.15           # modifies slope's effect — poor drainage on steep ground
W_RAIN_30D = 0.20       # antecedent saturation
W_RAIN_3D = 0.25        # short-window trigger spike, often the proximate cause

# Normalization anchors (literature-derived thresholds, see README)
SLOPE_LOW_DEG = 15.0    # below this: generally stable
SLOPE_HIGH_DEG = 35.0   # at/above this: high risk regardless of other factors
CLAY_HIGH_PCT = 40.0    # clay-heavy soils above this treated as max risk contribution
RAIN_30D_SATURATION_MM = 600.0
RAIN_3D_SATURATION_MM = 100.0

FALLBACK_RISK_SCORE = 0.5  # conservative middling score for missing/partial inputs


def _slope_score(slope_deg: float | None) -> float:
    if slope_deg is None or not np.isfinite(slope_deg):
        return 0.5
    if slope_deg <= SLOPE_LOW_DEG:
        return float(np.clip(slope_deg / SLOPE_LOW_DEG, 0.0, 1.0) * 0.3)  # up to 0.3 in "stable" band
    if slope_deg >= SLOPE_HIGH_DEG:
        return 1.0
    # linear ramp through the moderate-risk band
    span = SLOPE_HIGH_DEG - SLOPE_LOW_DEG
    return float(0.3 + 0.7 * (slope_deg - SLOPE_LOW_DEG) / span)


def _clay_score(clay_pct: float | None) -> float:
    if clay_pct is None or not np.isfinite(clay_pct):
        return 0.5
    return float(np.clip(clay_pct / CLAY_HIGH_PCT, 0.0, 1.0))


def _rain_score(value_mm: float | None, saturation_mm: float) -> float:
    if value_mm is None or not np.isfinite(value_mm):
        return 0.5
    return float(np.clip(value_mm / saturation_mm, 0.0, 1.0))


class LandslideSusceptibilityModel(HazardModel):
    hazard_type = "landslide"

    def predict_batch(self, zone_inputs: dict[str, dict]) -> dict[str, dict]:
        results: dict[str, dict] = {}

        for zone_slug, inputs in zone_inputs.items():
            try:
                results[zone_slug] = self._predict_one(inputs)
            except Exception:
                logger.exception(
                    "Landslide prediction failed for zone %s; returning fail-soft middling score",
                    zone_slug,
                )
                results[zone_slug] = {
                    "risk_score": FALLBACK_RISK_SCORE,
                    "status": score_to_status(FALLBACK_RISK_SCORE),
                }

        return results

    def _predict_one(self, inputs: dict) -> dict:
        slope_score = _slope_score(inputs.get("slope_deg"))
        clay_score = _clay_score(inputs.get("clay_pct"))
        rain_30d_score = _rain_score(inputs.get("rainfall_30d_mm"), RAIN_30D_SATURATION_MM)
        rain_3d_score = _rain_score(inputs.get("rainfall_3d_mm"), RAIN_3D_SATURATION_MM)

        # Clay only matters as a modifier on slope (clay on flat ground isn't
        # a landslide risk) — so its contribution is scaled by slope_score
        # rather than added independently.
        risk_score = (
            W_SLOPE * slope_score
            + W_CLAY * clay_score * slope_score
            + W_RAIN_30D * rain_30d_score
            + W_RAIN_3D * rain_3d_score
        )
        risk_score = float(np.clip(risk_score, 0.0, 1.0))

        return {
            "risk_score": round(risk_score, 4),
            "status": score_to_status(risk_score),
        }