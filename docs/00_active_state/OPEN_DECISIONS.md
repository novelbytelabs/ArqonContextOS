# OPEN DECISIONS

Status labels:

- REQUIRES_HUMAN_REVIEW
- development diagnostic only
- NOT SEALED-TEST CERTIFIED
- not promotable

## Open design decisions

- Exact flow artifact schema
- Exact `/create-flow` payload and response shape
- Whether `/write-flow` is user-facing or mostly backend/manual primitive
- How ContextOS flow artifacts sync with real Spec Kit paths
- Whether `/checklists` belongs primarily to Auditor, PM, or both
- Exact Helper/Codex `/execute` handoff format
- How Helper reports to both Coder and Auditor evidence stream
- How `/adv-flow` validates gate requirements before advancing
- How to implement GitHub Contents API 409 retry behavior
- How to trigger or schedule context rebuild after broker writes
- Whether to keep `/sync-constitution` as context route or separate constitution payload
- Multi-user identity strategy:
  - temporary user labels
  - `/whoami`
  - OAuth
- Multi-repo swarm generator config format
- How to prevent old docs from overriding merged ground truth
- How to mark stale/superseded docs
- Exact approval gate taxonomy:
  - PLAN_READY
  - DEV_EVIDENCE_READY
  - INTEGRITY_GATE_PASSED
  - CLAIM_OR_PROMOTION_CANDIDATE
- Final repo name decision: RESOLVED -> `ArqonMonkeyOS`
- Whether current repo becomes umbrella repo or infrastructure-only repo
- Whether Science Monkeys and Code Monkeys initially live in the same repo
- Whether Auditor GPT is shared across Science and Code modes
- How `/share` creates PM context
- How Mike/Ash identity is represented before OAuth
- When to rename OpenAPI/server/docs/site references
- Cloudflare naming alignment plan and timing
- GPT Action naming/URL alignment plan and timing
- Source/package naming alignment plan and timing
- Whether `/share` writes a PM inbox message, an official artifact, or both
- First `science_flow` schema and artifact contract
- Science finding evidence levels and claim boundaries
- How to keep old ContextOS URLs/actions working during rename transition
- Whether generated context should switch to MonkeyOS/ContextBus terminology now or after Flow Core

## Conservative resolution rule

If a decision is unresolved, fail closed, preserve status labels, and require PM/Human review before implementation.

Related ground-truth references:

- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md)
- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md)
- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/09_SECURITY_AND_GOVERNANCE.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/09_SECURITY_AND_GOVERNANCE.md)
