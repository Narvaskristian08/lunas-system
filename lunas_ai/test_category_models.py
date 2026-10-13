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
        "other": None,
    }
    assert {
        category: config.get_category_model(category)
        for category in expected
    } == expected


def test_available_category_checkpoints_exist():
    for category in ("road", "drainage", "electrical", "water", "streetlight"):
        model = config.get_model_config(config.get_category_model(category))
        assert (Path(config.BASE_DIR) / model["path"]).is_file(), category


def test_rdd_checkpoint_class_order_matches_configured_labels():
    road_model = config.get_model_config("road_damage")
    assert road_model["path"] == "models/road/rdd/yolov8s-rdd2022-mit.pt"
    assert road_model["classes"] == [
        "longitudinal_crack",
        "transverse_crack",
        "alligator_crack",
        "pothole",
    ]
    assert road_model["confidence_threshold"] == 0.65


def test_water_and_streetlight_checkpoints_exist():
    assert (Path(config.BASE_DIR) / "models/water/waterleak/best.pt").is_file()
    assert (Path(config.BASE_DIR) / "models/streetlight/streetlightdamage/best.pt").is_file()


def test_gas_model_remains_manual_until_images_are_available():
    gas_model = config.get_model_config("gas_infrastructure_damage")
    gas_path = Path(config.BASE_DIR) / gas_model["path"]
    assert not gas_path.exists()
    assert config.get_category_model("gas") == "gas_infrastructure_damage"


def test_other_category_is_manual_review_only():
    assert config.get_category_model("other") is None
    assert config.get_review_model("other") == "environmental_hazards"
    assert config.get_model_config("environmental_hazards")["manual_only"] is True


def test_other_review_model_never_creates_an_automatic_suggestion():
    from PIL import Image
    from src.services.detection_service import DetectionService

    service = DetectionService()
    service.detect_environmental_hazards = lambda image: {
        "success": True,
        "model": "environmental_hazards",
        "detections": [{
            "class": "fire_source",
            "confidence": 0.21,
            "confidence_status": "manual_review",
        }],
    }

    result = service.comprehensive_detection(Image.new("RGB", (32, 32)), "other")

    assert result["model"] == "environmental_hazards"
    assert result["model_available"] is True
    assert result["manual_review_only"] is True
    assert result["ai_suggestion"] is None
    assert result["classification_status"] == "manual_review"
