"""FEATURE: PLACEHOLDER landslide risk model - same pattern as the flood
one, replace predict_batch() with the real model.
INSTALLATION: none."""
from app.hazard.model_base import HazardModel, score_to_status


class PlaceholderLandslideModel(HazardModel):
    hazard_type = "landslide"

    def predict_batch(self, zone_inputs: dict[str, dict]) -> dict[str, dict]:
        results = {}
        for slug, features in zone_inputs.items():
            rainfall = features.get("rainfall_mm", 0)
            # TODO: replace with the real trained model's inference
            risk_score = min(rainfall / 60, 1.0)
            results[slug] = {"risk_score": risk_score, "status": score_to_status(risk_score)}
        return results