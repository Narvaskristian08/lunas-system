# Model confidence scores

The service returns model confidence scores for detections that pass each
configured model threshold. Thresholds are configuration values in
`config.yaml`; they are filters, not proof that a detection is correct or a
calibrated probability.

Use the score as advisory evidence for a human reviewer. It must not set
incident priority, validate a report, select a provider, approve a repair, or
resolve/close an incident. A missing or failed model means manual review; do
not infer that the image contains no damage.

Privacy detection uses bundled OpenCV cascades and returns face/license-plate
regions for the backend to redact. It is a privacy control rather than a public-
safety decision; if the detector is unavailable, the backend fails closed and
does not persist the new upload. See the [AI service setup and route catalog](./README.md).
