from pathlib import Path

from src.utils.config import config


def test_category_model_routes_are_explicit_and_category_scoped():
    assert config.get_category_model("water") == "water_leak"
    assert config.get_category_model("streetlight") == "streetlight_damage"
    assert config.get_category_model("gas") == "gas_infrastructure_damage"


def test_water_and_streetlight_checkpoints_exist():
    assert (Path(config.BASE_DIR) / "models/water/waterleak/best.pt").is_file()
    assert (Path(config.BASE_DIR) / "models/streetlight/streetlightdamage/best.pt").is_file()


def test_gas_model_remains_manual_until_images_are_available():
    gas_model = config.get_model_config("gas_infrastructure_damage")
    gas_path = Path(config.BASE_DIR) / gas_model["path"]
    assert not gas_path.exists()
    assert config.get_category_model("gas") == "gas_infrastructure_damage"
