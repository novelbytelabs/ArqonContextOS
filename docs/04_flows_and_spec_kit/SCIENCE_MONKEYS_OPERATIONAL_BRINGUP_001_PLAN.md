# Science Monkeys Operational Bring-Up 001 Plan

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define a PM-owned operational plan to move Science Monkeys from validated backend/policy support into a controlled GPT-team workflow while preserving existing governance boundaries.

## Scope

- define Explorer GPT setup requirements
- define Hypothesizer GPT setup requirements
- define Designer GPT setup requirements
- define Science Auditor GPT setup requirements
- keep Science Executor as non-GPT/local execution worker
- define GPT Action requirements
- define constitution/context requirements
- define live smoke requirements
- define evidence/audit requirements
- preserve role separation
- preserve no-self-certification
- preserve no fake science / no placeholder evidence
- preserve Code Monkeys and Human authority boundaries

## Non-Scope

- no implementation
- no route changes
- no source edits outside this planning doc
- no deployment
- no certification
- no promotion
- no production-readiness claim
- no GPT creation in this stage
- no live Worker changes

## Operational Model

- Science Monkeys GPT tier: `EXPLORER_AI`, `HYPOTHESIZER_AI`, `DESIGNER_AI`, `SCIENCE_AUDITOR_AI`
- Science Executor: non-GPT local execution worker only (`SCIENCE_EXECUTOR_AI` token path)
- Human authority remains required for official `share_packet` and all cross-flow advancement boundaries.
- No role may claim certification, production readiness, or promotion authority.

## Role Setup Requirements

### Explorer GPT (`EXPLORER_AI`)

- primary responsibility: initiate science flow and produce evidence-gathering artifacts
- required route ownership: `/v1/science/research`
- required artifact ownership: `research_dossier`, `source_map`, `contradiction_map`, `open_questions`
- forbidden behavior: no hypothesis/design/execution/audit claims outside assigned artifacts

### Hypothesizer GPT (`HYPOTHESIZER_AI`)

- primary responsibility: hypothesis and interpretation outputs
- required route ownership: `/v1/science/hypothesize`, `/v1/science/interpret`, `/v1/science/iterate` (hypothesizer subset)
- required artifact ownership: `hypothesis_card`, `null_hypothesis`, `prediction_record`, `interpretation_draft`, `alternative_explanation_review`, `iteration_proposal`, `revised_hypothesis_card`
- forbidden behavior: no protocol execution claims, no audit approval claims

### Designer GPT (`DESIGNER_AI`)

- primary responsibility: experimental design and design-side iteration
- required route ownership: `/v1/science/design-experiment`, `/v1/science/iterate` (designer subset)
- required artifact ownership: `experiment_protocol`, `metric_plan`, `control_plan`, `execution_packet`, `sealed_boundary_plan`, `revised_experiment_protocol`
- forbidden behavior: no execution attestation, no audit verdicts

### Science Auditor GPT (`SCIENCE_AUDITOR_AI`)

- primary responsibility: science audit, evidence scope checks, finding and share recommendation artifacts
- required route ownership: `/v1/science/audit-experiment`, `/v1/science/record-finding`
- required artifact ownership: `science_checklist`, `protocol_audit`, `evidence_audit`, `claim_scope_audit`, `audit_report`, `quarantine_recommendation`, `claim_scope_review`, `finding_record`, `negative_finding_record`, `inconclusive_finding_record`, `finding_boundary_record`, `share_recommendation`
- forbidden behavior: cannot create official `share_packet`; cannot self-authorize deployment/certification/promotion

### Science Executor Local Worker (`SCIENCE_EXECUTOR_AI`)

- remains non-GPT operational worker
- execution path remains tokenized/local workflow only
- required route ownership: `/v1/science/execute-experiment`
- required artifact ownership: `execution_report`, `evidence_manifest`, `command_log`, `raw_result_index`, `deviation_report`
- forbidden behavior: no GPT persona substitution, no policy bypass via other roles

## GPT Action Requirements

- every Science GPT must use the same Worker Action base URL and schema version currently validated in repo
- role token isolation is mandatory: each GPT uses only its own bearer key
- request-body role spoofing is non-authoritative; server-authenticated token role is authoritative
- `/v1/science/share` remains HUMAN-only and must enforce `idempotency_key`, preconditions, and source-artifact evidence classes
- generic `/v1/flows/{id}/artifacts` must continue to reject route-only artifacts where enforced

## Constitution and Context Requirements

- each Science GPT must ingest role-specific constitution sections and route boundaries before first live use
- mandatory guardrails in system instructions:
  - no self-certification
  - no production-readiness claim
  - no deployment authorization
  - no fabricated experiments, data, findings, or evidence references
- context loading must remain repo-grounded; no placeholder evidence chains

## Live Smoke Requirements

Operational bring-up is blocked until all required live smokes pass with fresh run data:

- `science_monkeys_v01_routes_live_smoke`
- `science_monkeys_v01_share_live_smoke`
- `science_to_code_handoff_live_smoke`

Live execution constraints:

- use fresh flow names/IDs per run
- no offline fixture IDs
- if GitHub write SHA conflicts persist after bounded retry in handoff live smoke, classify as blocker: `POSSIBLE_PRODUCT_BUG_GITHUB_WRITE_CONFLICT`

## Evidence and Audit Requirements

- each bring-up attempt must produce:
  - command transcript summary
  - flow IDs and share/handoff IDs used
  - pass/fail per smoke stage
  - explicit non-scope confirmation
- required labels must be present in evidence outputs:
  - `REQUIRES_HUMAN_REVIEW`
  - `development diagnostic only`
  - `NOT SEALED-TEST CERTIFIED`
  - `not promotable`

## Boundary Preservation Requirements

- maintain strict separation between Science roles and Code Monkeys roles
- preserve Human gate authority for share and advancement decisions
- preserve route-only controls and role-scoped ownership
- no exception path for certification/promotion/deployment wording

## Stage Exit Criteria (Planning Stage Only)

- planning document accepted by PM/HUMAN review
- no code/runtime changes performed in this stage
- explicit go/no-go decision for a future GPT-creation stage (separate task)

## Risks and Blockers to Track

- env-key isolation drift across GPT configurations
- stale live data collisions in concurrent runs
- policy drift between live smokes and route-only enforcement expectations
- accidental leakage of forbidden claim phrases in prompts/evidence templates
