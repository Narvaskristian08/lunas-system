# Drainage scope correction — 13 October 2026

The user specified **visible garbage blocking roadside drains, gutters or
canals**, with flooding excluded from drainage AI findings.

Changes:

- The `drainage` category still maps to `surface_drainage`.
- `enabled_classes: [blocked_surface_drain]` suppresses standing-water boxes
  before suggestions or summaries are generated. Both checkpoint class names
  remain in their original order to preserve class IDs.
- `manual_only: true` prevents the current generic blockage checkpoint from
  suggesting a garbage-caused incident, even at high confidence. Review boxes
  retain `blocked_surface_drain`; they are not relabeled as garbage.
- Mobile fallback and backend default category descriptions now say visible
  garbage blocking roadside drains, gutters or canals.

No garbage-specific model was trained by this correction. The available
public source has folder-level blocked/clear labels rather than annotated
garbage obstructing a drain. Previous water/blockage mAP and flood QA scores
do not establish garbage-specific accuracy. The current checkpoint is retained
only as a review aid; its weights were not changed in this correction.

A proper next dataset needs visible trash actually obstructing roadside drains,
plus healthy drains, unrelated roadside trash, vegetation/silt blockages and
flood-only scenes. Annotate obstruction regions and preserve independent
validation/test splits. The five original QA photos remain held out.

Regression tests exercise a 0.99-confidence standing-water prediction alone
and mixed with a 0.90 blockage prediction. Water must be excluded, blockage must
keep class ID 1, and no AI suggestion may be produced. Actual five-image results
are in [the scope QA](garbage_blockage_scope_qa_20261013.json); the full suite
output is in [the tests](pytest_garbage_blockage_scope_20261013.txt).
