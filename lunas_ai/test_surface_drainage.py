from pathlib import Path

import yaml


BASE_DIR = Path(__file__).resolve().parent


def test_drainage_category_uses_only_surface_drainage_model():
    config = yaml.safe_load((BASE_DIR / "config.yaml").read_text(encoding="utf-8"))
    assert config["category_models"]["drainage"] == "surface_drainage"
    model = config["models"]["surface_drainage"]
    assert model["path"] == "models/drainage/surfacedrainage/best.pt"
    assert model["damage_only"] is True
    assert model["classes"] == ["standing_water", "blocked_surface_drain"]


def test_surface_dataset_has_all_splits_and_safe_boxes():
    data_dir = BASE_DIR / "datasets/drainage/surface"
    data_yaml = data_dir / "data.yaml"
    if not data_yaml.is_file():
        return

    data = yaml.safe_load(data_yaml.read_text(encoding="utf-8"))
    assert data["names"] == ["standing_water", "blocked_surface_drain"]
    for split in ("train", "val", "test"):
        assert (data_dir / "images" / split).is_dir()
        assert (data_dir / "labels" / split).is_dir()
        assert list((data_dir / "images" / split).iterdir())
        for label_path in (data_dir / "labels" / split).glob("*.txt"):
            for line in label_path.read_text(encoding="utf-8").splitlines():
                fields = line.split()
                assert len(fields) == 5
                assert 0 <= int(fields[0]) < len(data["names"])
                assert all(0.0 <= float(value) <= 1.0 for value in fields[1:])


def test_unsupported_category_is_manual_only_and_does_not_load_a_fallback():
    from PIL import Image

    from src.services.detection_service import DetectionService

    service = DetectionService()
    loaded = []

    class NoFallbackManager:
        device = "cpu"

        def load_model(self, model_name):
            loaded.append(model_name)
            raise AssertionError("unsupported category must not load a fallback model")

    service.model_manager = NoFallbackManager()
    result = service.comprehensive_detection(Image.new("RGB", (32, 32)), "water")

    assert result["model"] is None
    assert result["analysis_status"] == "unavailable"
    assert result["requires_manual_review"] is True
    assert result["advisory_only"] is True
    assert loaded == []
