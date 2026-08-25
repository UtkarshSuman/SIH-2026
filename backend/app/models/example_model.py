"""
FEATURE: Reference implementation showing the minimum a new model needs.
DELETE this once a real model is built - it's here purely as a template
and to prove the /predict endpoint works end-to-end.
INSTALLATION: none.
"""
from typing import Any
from app.models.base import BaseModel


class ExampleEchoModel(BaseModel):
    name = "example_echo"

    def load(self) -> None:
        pass  # real models: load a .pkl/.onnx/.pt file from models_store/ here

    def predict(self, input_data: dict[str, Any]) -> dict[str, Any]:
        return {"echo": input_data, "confidence": 0.99}