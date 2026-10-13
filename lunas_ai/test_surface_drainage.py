from pathlib import Path

import yaml
import pytest


BASE_DIR = Path(__file__).resolve().parent


@pytest.mark.parametrize("include_blockage", [False, True])
def test_drainage_suppresses_floods_and_keeps_blockage_review_only(monkeypatch, include_blockage):
    from types import SimpleNamespace
    import numpy as np
    from PIL import Image
    from src.services.detection_service import DetectionService

    def box(class_id, confidence):
        return SimpleNamespace(cls=np.array([class_id]), conf=np.array([confidence]),
                               xyxy=np.array([[0, 0, 16, 16]]))

    boxes = [box(0, 0.99)]
    if include_blockage:
        boxes.append(box(1, 0.90))
    prediction = SimpleNamespace(boxes=boxes, names={0: "standing_water", 1: "blocked_surface_drain"})
    model = SimpleNamespace(predict=lambda **kwargs: [prediction])
    service = DetectionService()
    monkeypatch.setattr(service.model_manager, "load_model", lambda name: model)
    result = service.comprehensive_detection(Image.new("RGB", (32, 32)), "drainage")
    assert result["analysis_status"] == "completed"
    assert result["ai_suggestion"] is None
    assert result["manual_review_only"] is True
    assert result["requires_manual_review"] is True
    assert [d["class"] for d in result["detections"]] == (["blocked_surface_drain"] if include_blockage else [])
    if include_blockage:
        assert result["detections"][0]["class_id"] == 1
        assert result["detections"][0]["confidence_status"] == "manual_review"


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


def test_unavailable_category_is_manual_only_and_does_not_load_a_fallback():
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
    result = service.comprehensive_detection(Image.new("RGB", (32, 32)), "gas")

    assert result["model"] == "gas_infrastructure_damage"
    assert result["analysis_status"] == "unavailable"
    assert result["requires_manual_review"] is True
    assert result["advisory_only"] is True
    assert loaded == []


def test_fixed_qa_endpoints_route_by_category_without_exposing_model_paths(monkeypatch):
    from io import BytesIO

    from app import create_app
    from src.api import routes

    calls = []

    def fake_detection(image, category):
        calls.append(category)
        return {
            "success": True,
            "category": category,
            "model": "backend-selected",
            "analysis_status": "completed",
            "model_available": True,
            "detections": [],
            "requires_manual_review": True,
            "advisory_only": True,
        }

    monkeypatch.setattr(routes.detection_service, "comprehensive_detection", fake_detection)
    client = create_app().test_client()

    for endpoint, expected_category in (
        ("/api/v1/detect/road", "road"),
        ("/api/v1/detect/drainage", "drainage"),
        ("/api/v1/detect/electrical", "electrical"),
        ("/api/v1/detect/water", "water"),
        ("/api/v1/detect/streetlight", "streetlight"),
        ("/api/v1/detect/other", "other"),
        ("/api/v1/detect/gas", "gas"),
    ):
        image = BytesIO(b"not-an-image")
        response = client.post(
            endpoint,
            data={
                "image": (image, "test.jpg"),
                "category": "electrical" if expected_category == "drainage" else "drainage",
            },
            content_type="multipart/form-data",
        )
        # The endpoint must still validate image contents before routing.
        assert response.status_code == 400

        from PIL import Image

        image = BytesIO()
        Image.new("RGB", (8, 8), "gray").save(image, format="JPEG")
        image.seek(0)
        response = client.post(
            endpoint,
            data={"image": (image, "test.jpg"), "category": "electrical" if expected_category != "electrical" else "road"},
            content_type="multipart/form-data",
        )
        assert response.status_code == 200
        assert response.get_json()["category"] == expected_category

    assert calls == ["road", "drainage", "electrical", "water", "streetlight", "other", "gas"]
