# FLOW MODEL

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

Flow Core v0.3 is the next implementation milestone.

Planned primary flow commands:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

Planned generic flow families:

- `science_flow`
- `code_flow`
- `audit_flow`
- `governance_flow`

Notes:

- Science and Code artifacts remain distinct.
- Flow artifacts are official.
- Notes/messages remain informal.
- Human approval remains required for advancement and promotion decisions.

Ground-truth detail:

- [`ground_truth/.../06_FLOW_MODEL.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md)

## Flow Core v0.3 implementation slice

Canonical paths:

- flow index: `governance/flows/flow_index.json`
- flow manifest: `governance/flows/<flow_id>/flow_manifest.json`
- flow artifacts: `governance/flows/<flow_id>/artifacts/*.md`

Supported flow families:

- `science_flow`
- `code_flow`
- `audit_flow`
- `governance_flow`

Flow reference semantics:

- `name` is the human-friendly alias.
- `flow_id` is the canonical identifier (for example `FLOW-2026-0001`).
- `/load-flow` and `/flow-status` may resolve by either `name` or `flow_id`.

v0.3 authority and defaults:

- Human-only advancement is enforced for `/adv-flow`.
- Artifact writes are role-gated by artifact type.
- Project defaults to `ArqonZero` when omitted.
