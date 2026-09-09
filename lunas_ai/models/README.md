# Category model layout

Model weights are grouped by the canonical incident category used by the web,
mobile, and backend APIs:

```text
models/<category>/<model>/
```

Only models explicitly assigned in `config.yaml` under `category_models` may be
used for incident assistance. Missing model folders are manual-review states;
the service never downloads or substitutes a model from another category.
