# FEATURE: Registers the active HazardModel for each hazard type.
# INSTALLATION: no new packages (this file only wires up models built elsewhere)

from app.hazard.model_base import HazardModel
from app.hazard.models.flood_susceptibility_model import FloodSusceptibilityModel
from app.hazard.models.landslide_susceptibility_model import LandslideSusceptibilityModel

HAZARD_MODELS: dict[str, HazardModel] = {
    "flood": FloodSusceptibilityModel(),
    "landslide": LandslideSusceptibilityModel(),
}