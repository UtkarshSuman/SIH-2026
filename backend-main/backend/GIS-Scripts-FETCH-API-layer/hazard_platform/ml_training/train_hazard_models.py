"""train_hazard_models.py — trains the ML layer that plugs into
ml_service/inference/predictor.py's `.score(features) -> ScoreResult`
interface, per that file's own docstring: swapping a hazard to a trained
model means implementing that interface on a new class, nothing else
changes.

WHAT THIS TRAINS, per hazard, and WHY two models rather than one:

  1. A risk-score REGRESSOR (target: <hazard>_risk_score, the continuous
     0-1 value from hazard_reference.score()). This is what ml_predictor.py
     actually uses for ScoreResult.score -- it's the one that's directly
     comparable to the RED/YELLOW/GREEN 0.7/0.4 thresholds, so it's a
     genuine drop-in for predictor.py's scorers.
  2. A binary zone CLASSIFIER (target: <hazard>_label, the noisy binary
     target from generate_dummy_datasets.py) -- reported alongside for a
     second, independent read on how well the model separates high-risk
     from low-risk zones, since the label's 7% injected noise makes it a
     different (harder, more realistic) target than the deterministic
     score.

HONEST LIMITATION, stated plainly (same standard the rest of this project
holds itself to): both targets are DETERMINISTIC FUNCTIONS of the same
input features, computed by hazard_reference.score() itself. A model
trained on this data is a *distillation* of the existing AHP-weighted
formula, not something that has learned from independent real-world
outcomes -- it cannot be more accurate than the formula it was trained on,
only approximate it (usually very closely, since the formula is mostly
linear-in-normalized-features plus a couple of lookup tables and one
multiplicative interaction). The actual value of this pipeline today is
that it's WIRED CORRECTLY end-to-end: feature schema, categorical
handling, train/eval/save/load, and the ScoreResult-compatible inference
class. The day you have real historical incident outcomes (an actual
zone flooded / didn't), retarget these CSVs to that column and everything
downstream — training, evaluation, ml_predictor.py — keeps working
unchanged, and at that point the model can genuinely exceed the hand-set
formula rather than just approximate it.

USAGE:
    python3 train_hazard_models.py --data-dir /path/to/csvs --out-dir models/
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, confusion_matrix, mean_absolute_error,
    r2_score, roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

import hazard_reference as ref

RANDOM_STATE = 42
TEST_SIZE = 0.2

# The two fields that are categorical codes (1-12 USDA texture), not
# magnitudes -- one-hot encode these rather than feeding the raw integer
# to the model, since the underlying risk-by-code lookup tables are NOT
# monotonic in the code (e.g. LANDSLIDE's code 10 "silt" is deliberately
# ranked higher-risk than its neighbors 9 and 11 -- see hazard_reference.py's
# SOIL_RISK_BY_CODE comment). A raw-integer feature would bias a tree
# model toward assuming ordinal risk, which the real formula does not.
CATEGORICAL_FIELDS = {"soil_type_code", "sediment_type_code"}


def _build_pipeline(categorical: list[str], numeric: list[str], estimator) -> Pipeline:
    pre = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("num", "passthrough", numeric),
        ]
    )
    return Pipeline([("pre", pre), ("model", estimator)])


def _feature_importances(pipeline: Pipeline, categorical: list[str], numeric: list[str]) -> dict[str, float]:
    """Map one-hot-expanded importances back to original feature names by
    summing each categorical field's exploded columns."""
    model = pipeline.named_steps["model"]
    # CalibratedClassifierCV wraps the fitted estimator per CV fold; use
    # the first fold's underlying RandomForest for an importance readout
    # (calibration itself doesn't change which features mattered).
    if hasattr(model, "calibrated_classifiers_"):
        model = model.calibrated_classifiers_[0].estimator
    importances = model.feature_importances_
    cat_names = (
        pipeline.named_steps["pre"].named_transformers_["cat"].get_feature_names_out(categorical)
        if categorical else []
    )
    names = list(cat_names) + numeric
    raw = dict(zip(names, importances))

    merged: dict[str, float] = {}
    for field in categorical:
        merged[field] = sum(v for k, v in raw.items() if k.startswith(f"{field}_"))
    for field in numeric:
        merged[field] = raw[field]
    return dict(sorted(merged.items(), key=lambda kv: -kv[1]))


def train_hazard(hazard: str, df: pd.DataFrame, out_dir: Path) -> dict:
    fields = ref.FIELD_ORDER[hazard]
    categorical = [f for f in fields if f in CATEGORICAL_FIELDS]
    numeric = [f for f in fields if f not in CATEGORICAL_FIELDS]

    hazard_lc = hazard.lower()
    X = df[fields]
    y_score = df[f"{hazard_lc}_risk_score"]
    y_label = df[f"{hazard_lc}_label"]
    strata = df["zone_color"]  # preserves RED representation in the test split

    X_train, X_test, yscore_train, yscore_test, ylabel_train, ylabel_test = train_test_split(
        X, y_score, y_label, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=strata
    )

    # --- regressor: predicts the continuous risk_score (ScoreResult.score) ---
    reg = _build_pipeline(
        categorical, numeric,
        RandomForestRegressor(n_estimators=300, max_depth=None, random_state=RANDOM_STATE, n_jobs=-1),
    )
    reg.fit(X_train, yscore_train)
    pred_score = reg.predict(X_test)
    pred_zone = pd.Series(pred_score, index=X_test.index).apply(ref.zone_color)
    true_zone = strata.loc[X_test.index]

    reg_metrics = {
        "r2": round(r2_score(yscore_test, pred_score), 4),
        "mae": round(mean_absolute_error(yscore_test, pred_score), 4),
        "zone_color_accuracy": round(accuracy_score(true_zone, pred_zone), 4),
        "zone_color_confusion_matrix": confusion_matrix(
            true_zone, pred_zone, labels=["GREEN", "YELLOW", "RED"]
        ).tolist(),
    }

    # --- classifier: predicts the noisy binary label, calibrated probabilities ---
    base_clf = RandomForestClassifier(
        n_estimators=300, max_depth=None, class_weight="balanced",
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    clf = _build_pipeline(categorical, numeric, CalibratedClassifierCV(base_clf, cv=5, method="isotonic"))
    clf.fit(X_train, ylabel_train)
    pred_proba = clf.predict_proba(X_test)[:, 1]
    pred_label = (pred_proba >= 0.5).astype(int)

    clf_metrics = {
        "accuracy": round(accuracy_score(ylabel_test, pred_label), 4),
        "roc_auc": round(roc_auc_score(ylabel_test, pred_proba), 4),
        "confusion_matrix": confusion_matrix(ylabel_test, pred_label).tolist(),
    }

    importances = _feature_importances(reg, categorical, numeric)

    joblib.dump(reg, out_dir / f"{hazard_lc}_risk_regressor.joblib")
    joblib.dump(clf, out_dir / f"{hazard_lc}_zone_classifier.joblib")

    medians = {f: float(df[f].median()) for f in numeric}
    modes = {f: int(df[f].mode().iloc[0]) for f in categorical}
    metadata = {
        "hazard": hazard,
        "field_order": fields,
        "categorical_fields": categorical,
        "numeric_fields": numeric,
        # fallback values for ml_predictor.py to impute a missing (None)
        # field with at inference time, same role cleaning.py's
        # REGIONAL_DEFAULTS plays for the rule-based path
        "impute_medians": medians,
        "impute_modes": modes,
        "n_train_rows": len(X_train),
        "n_test_rows": len(X_test),
        "regressor_metrics": reg_metrics,
        "classifier_metrics": clf_metrics,
        "feature_importances": importances,
    }
    (out_dir / f"{hazard_lc}_model_metadata.json").write_text(json.dumps(metadata, indent=2))
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", default=".", help="Directory containing <hazard>_training_data.csv files")
    parser.add_argument("--out-dir", default="models", help="Directory to write .joblib models + metadata into")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    summary_rows = []
    for hazard in ("FLOOD", "LANDSLIDE", "EROSION", "CLOUDBURST"):
        csv_path = data_dir / f"{hazard.lower()}_training_data.csv"
        df = pd.read_csv(csv_path)
        meta = train_hazard(hazard, df, out_dir)
        summary_rows.append({
            "hazard": hazard,
            "n_train": meta["n_train_rows"],
            "n_test": meta["n_test_rows"],
            "reg_r2": meta["regressor_metrics"]["r2"],
            "reg_mae": meta["regressor_metrics"]["mae"],
            "zone_color_acc": meta["regressor_metrics"]["zone_color_accuracy"],
            "clf_accuracy": meta["classifier_metrics"]["accuracy"],
            "clf_roc_auc": meta["classifier_metrics"]["roc_auc"],
            "top_feature": next(iter(meta["feature_importances"])),
        })
        print(f"[{hazard}] regressor R2={meta['regressor_metrics']['r2']} "
              f"zone_color_acc={meta['regressor_metrics']['zone_color_accuracy']} | "
              f"classifier acc={meta['classifier_metrics']['accuracy']} "
              f"roc_auc={meta['classifier_metrics']['roc_auc']}")

    summary_df = pd.DataFrame(summary_rows)
    summary_path = out_dir / "training_summary.csv"
    summary_df.to_csv(summary_path, index=False)
    print(f"\nWrote {summary_path}")
    print(summary_df.to_string(index=False))


if __name__ == "__main__":
    main()
