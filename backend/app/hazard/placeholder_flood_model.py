"""
FEATURE: PLACEHOLDER flood risk model - simple threshold on river
discharge, standing in until the real trained model is ready. REPLACE
predict_batch() with the real model's inference call; keep the same
input/output shape so nothing else in the pipeline changes.
INSTALLATION: none - swap in your model's actual dependencies
(scikit-learn/torch/etc.) when replacing this.
"""
from app.hazard.model_base import HazardModel, score_to_status


class PlaceholderFloodModel(HazardModel):
    hazard_type = "flood"

    def predict_batch(self, zone_inputs: dict[str, dict]) -> dict[str, dict]:
        results = {}
        for slug, features in zone_inputs.items():
            discharge = features.get("river_discharge", 0)
            # TODO: replace with the real trained model's inference
            risk_score = min(discharge / 500, 1.0)
            results[slug] = {"risk_score": risk_score, "status": score_to_status(risk_score)}
        return results