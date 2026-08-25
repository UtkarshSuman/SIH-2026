"""
FEATURE: Model registry - the ONE place new ML models get plugged in.
To add a real model: create a new file implementing BaseModel, import it
below, add one line to MODEL_REGISTRY. It's then immediately callable via
POST /api/v1/predict with {"modelName": "<key>", "input": {...}}.
INSTALLATION: none.
"""
from app.models.base import BaseModel
from app.models.example_model import ExampleEchoModel

MODEL_REGISTRY: dict[str, BaseModel] = {
    "example_echo": ExampleEchoModel(),
    # "your_real_model": YourRealModel(),
}


def get_model(model_name: str) -> BaseModel:
    if model_name not in MODEL_REGISTRY:
        raise KeyError(f"Unknown model '{model_name}'. Available: {list(MODEL_REGISTRY.keys())}")
    return MODEL_REGISTRY[model_name]


def load_all_models() -> None:
    for model in MODEL_REGISTRY.values():
        model.load()


def list_models() -> list[str]:
    return list(MODEL_REGISTRY.keys())