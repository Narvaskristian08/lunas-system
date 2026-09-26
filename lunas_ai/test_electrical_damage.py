from pathlib import Path

import yaml


BASE_DIR = Path(__file__).resolve().parent


def test_electrical_category_uses_damage_model_only():
    config = yaml.safe_load((BASE_DIR / "config.yaml").read_text(encoding="utf-8"))
    assert config["category_models"]["electrical"] == "electrical_damage"
    model = config["models"]["electrical_damage"]
    assert model["damage_only"] is True
    assert model["path"] == "models/electrical/electricpole/best.pt"
    assert model["classes"]
    assert all("pole" not in name and "tower" not in name for name in model["classes"])


def test_generated_electrical_dataset_has_all_splits_and_allowlisted_labels():
    data_dir = BASE_DIR / "datasets/electrical/damage"
    data_yaml = data_dir / "data.yaml"
    if not data_yaml.is_file():
        return

    data = yaml.safe_load(data_yaml.read_text(encoding="utf-8"))
    classes = data["names"]
    for split in ("train", "val", "test"):
        assert (data_dir / "images" / split).is_dir()
        assert (data_dir / "labels" / split).is_dir()
    for label_path in (data_dir / "labels").rglob("*.txt"):
        for line in label_path.read_text(encoding="utf-8").splitlines():
            fields = line.split()
            assert len(fields) == 5
            assert 0 <= int(fields[0]) < len(classes)
            assert all(0.0 <= float(value) <= 1.0 for value in fields[1:])
