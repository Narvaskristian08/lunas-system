# LUNAS repository guidance

Read the root [README.md](README.md) before planning or implementing changes, especially its implementation-status matrix, revised workflow, policy decisions and developer handoff.

- Treat the revised citizen → Tanod verification → separate Secretary approval → agency routing/assessment → conditional external processing → authorized maintenance → review/closure workflow as the target scope, not a claim that it already exists.
- Verify current source before recreating or replacing functionality. Documentation and historical audits are context, not implementation proof.
- Preserve existing security, RBAC, organization/barangay/ownership/assignment scopes and operational history. Respect unresolved institutional policy decisions; do not invent approval, priority, SLA or closure authority.
- Update README.md when functionality is added, revised, tested or removed. Record implementation files, reproducible checks, actual results, limitations, defects and next priorities. Never falsely mark features complete or claim production integration from unit tests alone.
- Follow applicable nested instructions, including lunas_web/AGENTS.md for web work.
