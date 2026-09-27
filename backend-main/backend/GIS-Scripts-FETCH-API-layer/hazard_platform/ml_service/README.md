# Rescue-Arc — ML Training Layer: Session Log

Scope of this session: build/verify a synthetic training set for a distillation
ML model over `ml_service`'s live rule-based scoring, then complete the ML
inference layer so it can be swapped in behind `predictor.py`'s existing
`.score(features) -> ScoreResult` interface (per that file's own docstring:
*"Swapping any single hazard to a trained model later means implementing the
same interface on a new class — nothing else needs to change."*).

## Inputs

- `hazard_platform.zip`, `gis_fetcher.zip` — your live project source (uploaded for audit)
- `hazard_reference.py`, `generate_dummy_datasets.py` — produced by a prior agent session, claiming to be an exact standalone reproduction of `predictor.py`'s scoring, used to label synthetic training rows

## Part 1 — Audit of `hazard_reference.py` / `generate_dummy_datasets.py`

Verified against your actual source (not just read — re-ran your real AHP solver,
fuzz-tested against your real scorer classes):

| Checked | Result |
|---|---|
| `FIELD_ORDER` vs `ml_service/features/feature_engineering.py` | ✅ exact match, all 4 hazards |
| AHP weights (re-ran `weight_resolver.get_weights()` against your real `judgments/*.json`) | ✅ matched at 4dp, but see bug #2 below |
| `REFERENCE_MAX`, `PROTECTIVE` sets vs `predictor.py` | ✅ exact match |
| `SOIL_RISK_BY_CODE` / `SEDIMENT_RISK_BY_CODE` lookup tables | ✅ exact match |
| RED/YELLOW thresholds (0.7 / 0.4) vs `zone_classifier.py` | ✅ exact match |
| USDA texture coding (1=clay…12=sand) vs `soil.py` / `fetch_sediment_type.py` | ✅ exact match |
| `flood_status_severity_code` exclusion | ✅ correct — despite a stale docstring comment in `predictor.py` claiming it's weighted, it isn't actually in `judgments/flood.json`'s factor list |

### Bugs found and fixed

**1. EROSION formula bug (the significant one).** `hazard_reference.py`'s `score()`
normalized `shoreline_change_rate_m_per_yr` on its **signed** value. Your live
`ErosionScorer.score()` takes `abs()` of it first (either direction of shoreline
change signals instability). Effect: a coastline **accreting** (growing, safe) at
+6 m/yr scored *higher* (0.23) than one **retreating** (actual erosion) at -6 m/yr
(0.024) — backwards. This also silently capped erosion's max possible score at
0.686, so RED was mathematically unreachable regardless of input data.
**Fixed** — `hazard_reference.py`, `score()`, EROSION branch: now special-cases
`abs(shoreline_change_rate_m_per_yr)` before normalizing, matching `predictor.py`'s
`ErosionScorer.score()` exactly.

**2. Weight rounding drift.** Weights were hardcoded to 4 decimal places, causing
~1e-4 systematic drift from the live AHP solver's actual float output.
**Fixed** — replaced with full-precision values pulled directly from
`weight_resolver.get_weights()`.

**Verification:** fuzz-tested 3,000 random feature samples per hazard against your
real `FloodScorer` / `LandslideScorer` / `ErosionScorer` / `CloudburstScorer`
classes. All four now match to floating-point precision (max diff 2.2e-16 —
machine epsilon, i.e. exact).

**3. Generator distribution bug (`generate_dummy_datasets.py`).** Even with the
formula fixed, independently-sampled features rarely co-occur at their joint
extremes across 1000 rows — erosion had 0 RED examples, cloudburst had 3. A model
trained on that could never learn to recognize a RED zone.
**Fixed** — added risk-tiered stratified sampling: a latent low/moderate/high tier
per row shifts feature draws toward realistic joint-extreme combinations (e.g. a
high-tier erosion row is more likely to combine close-to-coast + high wave energy
+ sandy sediment + low mangrove cover, all at once). Labels are still computed
from the exact fixed reference formula — only which input combinations get
sampled changed. Also clipped `wave_energy_index` to your pipeline's real
ingestion bound (500, per `cleaning.py`'s `VALID_RANGES`) so no synthetic row has
a value your live pipeline would actually drop.

### Final dataset (1000 rows/hazard)

| Hazard | GREEN | YELLOW | RED | Risk score range |
|---|---|---|---|---|
| Flood | 688 | 275 | 37 | 0.052 – 0.934 |
| Landslide | 202 | 738 | 60 | 0.182 – 0.941 |
| Erosion | 609 | 252 | 139 | 0.060 – 0.944 |
| Cloudburst | 582 | 268 | 150 | 0.106 – 0.910 |

No NaNs, no out-of-range values, all four hazards have real examples across every
zone tier.

### Files from Part 1

- `hazard_reference.py` — fixed, fuzz-verified-exact reproduction of live scoring
- `generate_dummy_datasets.py` — fixed generator with stratified sampling
- `flood_training_data.csv`, `landslide_training_data.csv`, `erosion_training_data.csv`, `cloudburst_training_data.csv` — regenerated 1000-row sets

## Part 2 — ML inference layer

**Approach:** *Scalable* — per-hazard calibrated RandomForest (one-hot-encoded
categoricals, `hazard_reference.FIELD_ORDER` as the single schema source, joblib
persistence + metadata for reproducible train/serve), swappable to gradient
boosting later with no interface change. Went with this over the *quick/simple*
alternative (a single plain classifier per hazard, raw integer categoricals, no
calibration) since scalability and being an honest drop-in for `predictor.py`'s
interface mattered more here than saving a few minutes of training time.

Two models per hazard:
1. **Risk-score regressor** (`RandomForestRegressor`, target = continuous
   `<hazard>_risk_score`) — this is what backs `ScoreResult.score`, since it's
   directly comparable to the 0.7/0.4 zone thresholds, making it an actual
   drop-in for `predictor.py`'s scorers.
2. **Zone classifier** (`RandomForestClassifier` + isotonic calibration via
   `CalibratedClassifierCV`, target = noisy binary `<hazard>_label`) — a second,
   independent read on separability, reported alongside for calibration
   diagnostics.

**Honest limitation, stated plainly:** both targets are deterministic functions
of the same features, computed by `hazard_reference.score()` itself. This model
is a *distillation* of the existing AHP formula, not something trained on
independent real-world outcomes — it can approximate the formula closely but not
exceed it. What this session actually built and validated is the full pipeline
wired correctly end-to-end (schema, categorical handling, train/eval/save/load,
and a `ScoreResult`-compatible inference class) — swap the training CSVs to real
historical incident labels later and everything downstream keeps working
unchanged, and at that point the model can genuinely improve on the hand-set
formula.

### Files added

- `train_hazard_models.py` — trains + evaluates + saves both models per hazard;
  run as `python3 train_hazard_models.py --data-dir . --out-dir trained_models`
- `ml_predictor.py` — the swap-in inference class (`MLFloodScorer`,
  `MLLandslideScorer`, `MLErosionScorer`, `MLCloudburstScorer` + a `predict()`
  matching `predictor.py`'s signature exactly); drop into
  `ml_service/inference/` next to `predictor.py`, with the `trained_models/`
  folder alongside it
- `trained_models/` — the actual trained artifacts (already run this session):
  `<hazard>_risk_regressor.joblib`, `<hazard>_zone_classifier.joblib`,
  `<hazard>_model_metadata.json` (feature schema + imputation fallbacks +
  metrics), `training_summary.csv`

### Results (held-out 20% test split, stratified by zone_color)

| Hazard | Regressor R² | Regressor MAE | Zone-color accuracy | Classifier accuracy | Classifier ROC-AUC | Top feature |
|---|---|---|---|---|---|---|
| Flood | 0.972 | 0.019 | 0.955 | 0.955 | 0.963 | `rainfall_mm_72h` |
| Landslide | 0.911 | 0.029 | 0.895 | 0.835 | 0.901 | `slope_deg` |
| Erosion | 0.971 | 0.028 | 0.940 | 0.940 | 0.931 | `shoreline_change_rate_m_per_yr` |
| Cloudburst | 0.988 | 0.017 | 0.920 | 0.910 | 0.910 | `rainfall_intensity_mm_per_hr` |

Top feature per hazard matches domain expectation (rainfall dominates
flood/cloudburst, slope dominates landslide, shoreline change dominates erosion)
— a reasonable sanity check that the model learned the formula's actual
structure rather than spurious correlations.

**Integration-tested**, not just unit-tested: ran `ml_predictor.predict()` and
`predictor.predict()` side by side on the same sample inputs (including a
missing field per hazard, to exercise the imputation path) inside your actual
`hazard_platform` package structure — both return the same `ScoreResult` shape,
`ml_predictor` handles `None` fields via stored training-set medians/modes
without crashing, and scores track reasonably close to the rule-based ones
(e.g. EROSION: rule-based 0.834 vs ML 0.748 on the same inputs) as expected for
a distillation model.

### To use this in your repo

1. Copy `hazard_reference.py`, `generate_dummy_datasets.py`, the four
   `*_training_data.csv` files, `train_hazard_models.py`, and `ml_predictor.py`
   into your project (the CSVs/training script can live anywhere; `ml_predictor.py`
   belongs in `ml_service/inference/`)
2. `python3 train_hazard_models.py --data-dir . --out-dir ml_service/inference/trained_models`
   (already run once this session — artifacts are included above, re-run only if
   you regenerate the CSVs)
3. To actually swap over: the real call site is `backend/api.py` (line ~45,
   `from ml_service.inference.predictor import predict`) — `zone_classifier.py`
   only imports `ScoreResult` for typing and never calls `predict()` itself.
   Change that one import to `from ml_service.inference.ml_predictor import predict`
   — nothing else changes, since both expose the same
   `predict(features_by_hazard) -> dict[HazardType, ScoreResult]`
