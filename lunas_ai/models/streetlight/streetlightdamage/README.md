# Streetlight damage model

The category route is `streetlight -> streetlight_damage` and expects `best.pt`
in this directory.

The checkpoint is trained from the full local export of the Roboflow
`StreetLampPole` dataset (CC BY 4.0), whose dedicated source class is `Damaged`,
normalized to `streetlight_damage`. Training completed through early stopping
at epoch 47, with the best checkpoint retained. It is advisory only and
requires an official manual decision; it is not production-ready without local
testing.
