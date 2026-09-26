# Water leak model

The category route is `water -> water_leak` and expects `best.pt` in this directory.

The checkpoint is trained from the full local export of the Roboflow `pipe-leak`
v6 dataset (CC BY 4.0), normalized to the single class `water_leak`. Training
completed through early stopping at epoch 76, with the best checkpoint retained.
It is advisory only and requires an official manual decision; it is not a
replacement for validation on local surface-drainage or pipe-leak images.
