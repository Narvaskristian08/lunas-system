from pathlib import Path

from src.utils.config import config


def test_category_model_routes_are_explicit_and_category_scoped():
    expected = {
        "road": "road_damage",
        "drainage": "surface_drainage",
        "electrical": "electrical_damage",
        "water": "water_leak",
        "gas": "gas_infrastructure_damage",
        "streetlight": "streetlight_damage",
        "other": "environmental_hazards",
    }
    assert {
        category: config.get_category_model(category)
        for category in expected
    } == expected


def test_available_category_checkpoints_exist():
    for category in ("road", "drainage", "electrical", "water", "streetlight", "other"):
        model = config.get_model_config(config.get_category_model(category))
        assert (Path(config.BASE_DIR) / model["path"]).is_file(), category


def test_water_and_streetlight_checkpoints_exist():
    assert (Path(config.BASE_DIR) / "models/water/waterleak/best.pt").is_file()
    assert (Path(config.BASE_DIR) / "models/streetlight/streetlightdamage/best.pt").is_file()


def test_gas_model_remains_manual_until_images_are_available():
    gas_model = config.get_model_config("gas_infrastructure_damage")
    gas_path = Path(config.BASE_DIR) / gas_model["path"]
    assert not gas_path.exists()
    assert config.get_category_model("gas") == "gas_infrastructure_damage"
