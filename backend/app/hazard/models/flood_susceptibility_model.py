# FEATURE: Weighted-overlay flood susceptibility model. Combines static
#          terrain predisposition (how likely this spot is to pool/collect
#          water, from the shared terrain_cache) with dynamic rainfall/river
#          signals (the trigger, refreshed every pipeline cycle by
#          OpenMeteoFloodSource). Same "literature-supported weighted index"
#          methodology as the landslide model, not a trained classifier —
#          there's no labeled historical flood-incident set to train on yet.
#
# INSTALLATION: no new packages (numpy already required by the landslide model)

from __future__ import annotations

import logging
from typing import Any

import numpy as np

from app.hazard.model_base import HazardModel, score_to_status
from app.data_sources.landslide.terrain_cache import load_cache

logger = logging.getLogger(__name__)

# --- Weights (documented starting point, not yet validated against ground
#     truth — see landslide/README.md for how to recalibrate once real
#     incident data is available for either hazard type) ---
#
# Rainfall/river signals dominate because flooding is trigger-driven far more
# than landslides are: even flat, low-lying terrain won't flood without
# enough water arriving. Terrain acts as a multiplier/predisposition, not
# the primary driver.
W_RAIN_72H = 0.35      # short-window intensity: the immediate trigger
W_RAIN_30D = 0.15      # antecedent saturation of the catchment/soil
W_RIVER_DISCHARGE = 0.20   # anomaly vs normal, if available from Open-Meteo Flood API
W_LOW_LYING = 0.20     # elevation percentile within region (lower = more at risk)
W_FLATNESS = 0.10      # flat land pools water; sloped land drains it

# Normalization anchors — tune once regional rain-gauge/flood history exists
RAIN_72H_SATURATION_MM = 150.0   # 72h rainfall at/above this treated as max risk contribution
RAIN_30D_SATURATION_MM = 600.0   # 30-day rainfall at/above this treated as max risk contribution
DISCHARGE_ANOMALY_SATURATION = 2.5  # e.g. 2.5x normal discharge treated as max risk contribution

FALLBACK_RISK_SCORE = 0.5  # conservative middling score when inputs are missing/partial


def _norm(value: float | None, saturation: float) -> float:
    if value is None or not np.isfinite(value):
        return 0.5  # neutral contribution when a dynamic input is missing
    return float(np.clip(value / saturation, 0.0, 1.0))


class FloodSusceptibilityModel(HazardModel):
    hazard_type = "flood"

    def __init__(self) -> None:
        try:
            self._static_cache = load_cache()
        except FileNotFoundError:
            logger.warning(
                "Flood model starting without a terrain cache — all zones will "
                "score on rainfall/discharge alone until "
                "`python -m app.data_sources.landslide.terrain_cache` is run."
            )
            self._static_cache = {}

    def predict_batch(self, zone_inputs: dict[str, dict]) -> dict[str, dict]:
        results: dict[str, dict] = {}

        for zone_slug, inputs in zone_inputs.items():
            try:
                results[zone_slug] = self._predict_one(zone_slug, inputs)
            except Exception:
                logger.exception(
                    "Flood prediction failed for zone %s; returning fail-soft middling score",
                    zone_slug,
                )
                results[zone_slug] = {
                    "risk_score": FALLBACK_RISK_SCORE,
                    "status": score_to_status(FALLBACK_RISK_SCORE),
                }

        return results

    def _predict_one(self, zone_slug: str, inputs: dict[str, Any]) -> dict:
        static = self._static_cache.get(zone_slug, {})

        rain_72h = inputs.get("rainfall_72h_mm")
        rain_30d = inputs.get("rainfall_30d_mm")
        discharge_anomaly = inputs.get("river_discharge_anomaly")  # e.g. current/normal ratio

        low_lying = static.get("low_lying_score", 0.5)
        flatness = static.get("flatness_score", 0.5)

        rain_72h_score = _norm(rain_72h, RAIN_72H_SATURATION_MM)
        rain_30d_score = _norm(rain_30d, RAIN_30D_SATURATION_MM)
        discharge_score = (
            _norm(discharge_anomaly - 1.0 if discharge_anomaly is not None else None,
                  DISCHARGE_ANOMALY_SATURATION - 1.0)
        )

        risk_score = (
            W_RAIN_72H * rain_72h_score
            + W_RAIN_30D * rain_30d_score
            + W_RIVER_DISCHARGE * discharge_score
            + W_LOW_LYING * float(np.clip(low_lying, 0.0, 1.0))
            + W_FLATNESS * float(np.clip(flatness, 0.0, 1.0))
        )
        risk_score = float(np.clip(risk_score, 0.0, 1.0))

        return {
            "risk_score": round(risk_score, 4),
            "status": score_to_status(risk_score),
        }