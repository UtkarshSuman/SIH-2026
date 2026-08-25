"""
FEATURE: The contract every ML model must implement - whether it's
scikit-learn, PyTorch, ONNX, or a wrapped external API call, it plugs
in the same way. This is the extensibility point for whoever builds
the real model.
INSTALLATION: none - just Python's abc module (built in).
"""
from abc import ABC, abstractmethod
from typing import Any


class BaseModel(ABC):
    name: str
    version: str = "v1"

    @abstractmethod
    def load(self) -> None:
        """Load weights/artifacts into memory. Called once at startup."""
        raise NotImplementedError

    @abstractmethod
    def predict(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Run inference. Must return a JSON-serializable dict."""
        raise NotImplementedError