"""ml_predictor.py — the trained-model counterpart to
ml_service/inference/predictor.py, implementing the exact same
`.score(features) -> ScoreResult` interface predictor.py's own docstring
names as the swap-in contract. Drop this file into ml_service/inference/
alongside predictor.py; nothing in feature_engineering.py, zone_classifier.py,
or backend/ needs to change to use it.

WHAT'S DIFFERENT FROM predictor.py: each hazard's score() here comes from
a RandomForestRegressor (trained by train_hazard_models.py on
hazard_reference-labeled synthetic data) instead of an AHP-weighted linear
formula. See train_hazard_models.py's docstring for the honest limitation:
today this model is a distillation of predictor.py's own formula, not
something trained on independent outcomes -- swap the training CSVs to
real historical incident labels later and this class keeps working
unchanged.

MISSING VALUES: predictor.py's rule-based scorers fall back a missing
(None) field to a neutral 0.5 inside _normalize(). A trained sklearn
model can't take None as an input at all, so this uses each field's
training-set median (numeric) / mode (categorical) instead -- stored per
hazard in <hazard>_model_metadata.json at training time. Same spirit
(don't crash, don't silently look more confident than the data supports)
as predictor.py's approach, via a different mechanism a trained model
requires. missing_fields is still populated so callers can tell a
value was imputed, same contract as ScoreResult always had.

GUARDRAIL FIELDS: imputing training-set medians is fine when a field is
missing because one provider had a bad day. It's misleading when a field
is missing because the hazard structurally doesn't apply to this zone --
e.g. EROSION's distance_to_coast_m and shoreline_change_rate_m_per_yr are
both None for an inland zone with no coastline at all. Imputing coastal-
typical medians there fabricates a mid-range "looks coastal" score for a
zone that has no coast. When ALL of a hazard's guardrail_fields are
missing, skip the model entirely and report guardrail_score instead.

USAGE:
    from ml_service.inference.ml_predictor import predict
    results = predict({HazardType.FLOOD: feature_dict, ...})
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import warnings
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except ImportError:
    pass

from data_pipeline.models import HazardType
from ml_service.inference.predictor import ScoreResult

_MODELS_DIR = Path(__file__).parent / "trained_models"


class _MLScorer:
    """Generic hazard-agnostic wrapper around one hazard's trained
    regressor + metadata. Hazard-specific classes below just set
    `hazard_key`; all loading/imputation/scoring logic lives here once,
    same shape as predictor.py's four near-identical Scorer classes."""

    hazard_key: str  # e.g. "flood" -- matches the training CSV/model filename stem

    # Fields whose total absence means "this hazard type structurally
    # doesn't apply to this zone" rather than "one provider had a bad
    # day". When ALL of these are None, skip the model/imputation and
    # report guardrail_score directly. None (default) disables this
    # check entirely -- most hazards apply everywhere and don't need it.
    guardrail_fields: list[str] | None = None
    guardrail_score: float = 0.0

    def __init__(self) -> None:
        key = self.hazard_key
        model_path = _MODELS_DIR / f"{key}_risk_regressor.joblib"
        meta_path = _MODELS_DIR / f"{key}_model_metadata.json"
        if not model_path.exists() or not meta_path.exists():
            raise FileNotFoundError(
                f"No trained model for hazard {key!r} at {model_path} -- "
                f"run train_hazard_models.py first (see its module docstring)."
            )
        self._model = joblib.load(model_path)
        self._meta = json.loads(meta_path.read_text())
        self._fields: list[str] = self._meta["field_order"]
        self._medians: dict[str, float] = self._meta["impute_medians"]
        self._modes: dict[str, int] = self._meta["impute_modes"]

    def _impute(self, field: str) -> float:
        if field in self._modes:
            return self._modes[field]
        return self._medians[field]

    def score(self, features: dict[str, Any]) -> ScoreResult:
        missing = [f for f in self._fields if features.get(f) is None]

        if self.guardrail_fields and all(f in missing for f in self.guardrail_fields):
            # e.g. an inland zone with no distance_to_coast_m or
            # shoreline_change_rate_m_per_yr at all -- don't let
            # training-set imputation medians fabricate a coastal-
            # looking score for a zone that structurally has no coast.
            return ScoreResult(score=self.guardrail_score, missing_fields=missing)

        row = {
            f: (features.get(f) if features.get(f) is not None else self._impute(f))
            for f in self._fields
        }
        # sklearn Pipeline expects a 2D, column-ordered input; a
        # single-row DataFrame keeps column names aligned with the
        # ColumnTransformer fitted at training time.
        import pandas as pd  # local import: keep this module importable without pandas at module load
        X = pd.DataFrame([row], columns=self._fields)
        raw_score = float(self._model.predict(X)[0])
        return ScoreResult(score=min(max(raw_score, 0.0), 1.0), missing_fields=missing)


class MLFloodScorer(_MLScorer):
    hazard_key = "flood"


class MLLandslideScorer(_MLScorer):
    hazard_key = "landslide"


class MLErosionScorer(_MLScorer):
    hazard_key = "erosion"
    # A zone with neither a measured coastline distance nor a shoreline
    # change rate has no coast at all in this dataset -- score it near-
    # zero instead of imputing coastal-typical training medians.
    guardrail_fields = ["distance_to_coast_m", "shoreline_change_rate_m_per_yr"]


class MLCloudburstScorer(_MLScorer):
    hazard_key = "cloudburst"


_ML_SCORERS: dict[HazardType, _MLScorer] | None = None


def _get_scorers() -> dict[HazardType, _MLScorer]:
    # Lazy singleton: loading 4 joblib models + metadata files is real
    # I/O, so do it once on first predict() call, not at import time
    # (importing this module shouldn't require trained models to exist
    # yet, e.g. during initial setup before train_hazard_models.py has run).
    global _ML_SCORERS
    if _ML_SCORERS is None:
        _ML_SCORERS = {
            HazardType.FLOOD: MLFloodScorer(),
            HazardType.LANDSLIDE: MLLandslideScorer(),
            HazardType.EROSION: MLErosionScorer(),
            HazardType.CLOUDBURST: MLCloudburstScorer(),
        }
    return _ML_SCORERS


def predict(features_by_hazard: dict[HazardType, dict[str, Any]]) -> dict[HazardType, ScoreResult]:
    """Drop-in replacement for predictor.py's predict() -- same signature,
    same return shape, trained-model scores instead of AHP-weighted ones.
    backend/zone_classifier.py's classify_zone() takes a dict[HazardType,
    ScoreResult] and doesn't care which predict() produced it."""
    scorers = _get_scorers()
    return {
        hazard: scorers[hazard].score(features)
        for hazard, features in features_by_hazard.items()
    }
