# Category routes, checkpoint folders and switches

Mobile/web submit the report category to Express. Express calls
`POST /api/v1/detect/<category>` on `AI_SERVICE_URL`. Flask fixes the category
from the URL; an upload's conflicting `category`, model name or checkpoint path
cannot redirect it. The older comprehensive endpoint remains available.

Paths below are relative to `lunas_ai/`.

| Category / route suffix | Selector | Model folder | Active file | Behavior |
|---|---|---|---|---|
| `road` | `category_models.road: road_damage` | `models/road/rdd/` | `yolov8s-rdd2022-mit.pt` | Existing road model; rejected road candidate is not active |
| `drainage` | `category_models.drainage: surface_drainage` | `models/drainage/surfacedrainage/` | `best.pt` | New balanced checkpoint; only generic blockage review boxes; water class suppressed |
| `electrical` | `category_models.electrical: electrical_damage` | `models/electrical/electricpole/` | `best.pt` | Electrical damage candidates, manual-only |
| `water` | `category_models.water: water_leak` | `models/water/waterleak/` | `best.pt` | Water-leak model, separate from drainage |
| `streetlight` | `category_models.streetlight: streetlight_damage` | `models/streetlight/streetlightdamage/` | `best.pt` | Visible streetlight damage model |
| `other` | `category_models.other: null`; `review_models.other: environmental_hazards` | `models/other/environmentalhazard/` | `yolov8n-env-hazards-best.pt` | Review-only environmental findings; no automatic classifier |
| `gas` | `category_models.gas: gas_infrastructure_damage` | `models/gas/gasinfrastructure/` | No checkpoint installed | Unavailable/manual review; no substitute model |

All results require official review. A missing model never falls through to
another category's checkpoint. Electrical and streetlight are separate choices:
selecting streetlight does not silently run the electrical model on wiring.

## Routing switches

- `config.yaml` → `category_models`: the category-to-model selector.
- `config.yaml` → `review_models`: review-only fallback explicitly assigned to
  a category with no production classifier, currently `other` only.
- `config.yaml` → `models.<selector>.path`: the active checkpoint file.
- `models.<selector>.manual_only`: disables AI suggestions while retaining
  review findings. Currently enabled for drainage, electrical and environmental.
- `models.surface_drainage.enabled_classes: [blocked_surface_drain]`: suppresses
  standing-water/flood findings while preserving the checkpoint's original IDs.
  This does not turn generic blockage labels into validated garbage labels.
- `confidence_threshold`, `class_confidence_thresholds` and
  `candidate_threshold`: suggestion/review gates, not model-selection switches.
- Express environment `AI_SERVICE_ENABLED=false`: disables AI integration;
  any other/default value enables it. `AI_SERVICE_URL` selects the AI service
  address and defaults to `http://localhost:5001`.

Only drainage's production weights changed in the preceding training work.
Its prior weights remain in `models/drainage/surfacedrainage/pre-roadside-20261013.pt`.
Other model selections remain as listed above. This routing update changes the
Express request URL and exposes fixed category routes for every canonical code;
it does not change weights or enable an unvalidated classifier.

Restart/redeploy both Express and the AI service to apply the route changes in
a running environment. No external deployment was performed.
