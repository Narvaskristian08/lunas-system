# Model confidence scores

The service returns model confidence scores for detections that pass each
configured model threshold. Thresholds are configuration values in
`config.yaml`; they are filters, not proof that a detection is correct or a
calibrated probability.

Use the score as advisory evidence for a human reviewer. It must not set
incident priority, validate a report, select a provider, approve a repair, or
resolve/close an incident. A missing or failed model means manual review; do
not infer that the image contains no damage.

Automatic privacy detection and visual masking are excluded from current
scope. The legacy `/detect/privacy` route returns HTTP 410 without inference.
Backend metadata stripping does not anonymize visible image content. See the
[AI service setup and route catalog](./README.md).
