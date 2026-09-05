"""
FEATURE: The contract every hazard prediction model implements - takes
normalized per-zone data (from a data source's transform()), returns a
risk score + GREEN/YELLOW/RED status per zone. This is where your
teammate plugs in the real trained model.
INSTALLATION: none.
"""
from abc import ABC, abstractmethod


def score_to_status(risk_score: float) -> str:
    """Shared threshold logic - adjust these cutoffs once the real
    model's score distribution is known."""
    if risk_score >= 0.7:
        return "RED"
    if risk_score >= 0.4:
        return "YELLOW"
    return "GREEN"


class HazardModel(ABC):
    hazard_type: str

    @abstractmethod
    def predict_batch(self, zone_inputs: dict[str, dict]) -> dict[str, dict]:
        """zone_inputs: {zone_slug: {feature: value, ...}}
        Returns: {zone_slug: {"risk_score": float, "status": "RED"|"YELLOW"|"GREEN"}}
        """
        raise NotImplementedError