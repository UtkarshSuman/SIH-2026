"""FEATURE: One model per hazard type - swap a placeholder for the real
trained model by changing one line here.
INSTALLATION: none."""
from app.hazard.model_base import HazardModel
from app.hazard.placeholder_flood_model import PlaceholderFloodModel
from app.hazard.placeholder_landslide_model import PlaceholderLandslideModel

HAZARD_MODELS: dict[str, HazardModel] = {
    "flood": PlaceholderFloodModel(),
    "landslide": PlaceholderLandslideModel(),
}