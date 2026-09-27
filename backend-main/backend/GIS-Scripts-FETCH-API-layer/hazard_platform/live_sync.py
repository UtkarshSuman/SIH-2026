"""Turn stored live readings into Supabase map and relocation read models."""
from __future__ import annotations

from data_pipeline.models import HazardType
from data_pipeline.supabase_store import SupabaseHazardReadingStore
from backend.prioritization import VulnerabilityInputs, prioritize
from backend.zone_classifier import classify_zone
from ml_service.features.feature_engineering import build_feature_dict
from ml_service.inference.ml_predictor import predict
from zones import get_zone


def publish_latest_assessment(zone_id: str, store) -> bool:
    """Publish only when the worker is configured for Supabase."""
    if not isinstance(store, SupabaseHazardReadingStore):
        return False
    readings = {hazard: store.latest_for_zone(zone_id, hazard) for hazard in HazardType}
    available = {hazard: reading for hazard, reading in readings.items() if reading is not None}
    if not available:
        return False
    scores = predict({hazard: build_feature_dict(hazard, reading.parameters) for hazard, reading in available.items()})
    classification = classify_zone(zone_id, scores)
    priority = prioritize(classification, VulnerabilityInputs(0.5, 0.5, 0.5))
    store.publish_assessment(get_zone(zone_id), classification, priority, available)
    return True
