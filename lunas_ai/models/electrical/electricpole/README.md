# Electrical / Electric pole

This folder is reserved for the backend model assigned to the canonical
`electrical` category. The model must return damage/fault regions only; it
must not return ordinary pole, tower, insulator, or other intact-component
detections.

Expected trained checkpoint:

```text
models/electrical/electricpole/best.pt
```

The checkpoint is prepared by:

```bash
cd lunas_ai
python tools/prepare_electrical_damage.py
python train_electrical_damage.py
```

Training sources are limited to datasets with explicit damage/fault labels:

- [Power Equipment Image Dataset](https://huggingface.co/datasets/sxiong/Power-equipment-image-dataset), using only its transmission-line object-detection subset (MIT)
- [Cable Damage](https://huggingface.co/datasets/LibreYOLO/cable-damage), using `break` and `thunderbolt` (CC BY 4.0)

The previous InsPLAD detection checkpoint was an asset-localization model and
is not used for this category. Pole-only and intact-component datasets are
also excluded. The current model is an advisory detector: labels,
confidence, and normalized boxes are evidence for officials, not automatic
damage, severity, routing, priority, or closure decisions. Local Philippine
phone images are still required for validation and fine-tuning.

The checked-in checkpoint completed the full 100-epoch training configuration
at 640 pixels on the damage-only dataset. Its final validation remains modest,
so it is suitable only for advisory assistance and still requires validation
and fine-tuning with local Philippine phone images before operational use.
