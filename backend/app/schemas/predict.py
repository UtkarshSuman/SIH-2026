"""FEATURE: Request/response shape for /predict - mirrors the TS types
in packages/types/src/index.ts, keep them in sync manually for now."""
from typing import Any
from pydantic import BaseModel


class PredictRequest(BaseModel):
    modelName: str
    input: dict[str, Any]


class PredictResponse(BaseModel):
    modelName: str
    output: dict[str, Any]
    confidence: float | None = None
    latencyMs: int