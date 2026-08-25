"""
FEATURE: The generic /predict endpoint - stays the same no matter which
model is plugged into the registry. Looks up the model by name, runs it,
times it, returns a consistent response shape.
INSTALLATION: none.
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import verify_api_key
from app.models.registry import get_model, list_models
from app.schemas.predict import PredictRequest, PredictResponse

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    try:
        model = get_model(req.modelName)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    start = time.perf_counter()
    output = model.predict(req.input)
    latency_ms = int((time.perf_counter() - start) * 1000)

    return PredictResponse(
        modelName=req.modelName,
        output=output,
        confidence=output.get("confidence"),
        latencyMs=latency_ms,
    )


@router.get("/models")
async def models():
    return {"models": list_models()}