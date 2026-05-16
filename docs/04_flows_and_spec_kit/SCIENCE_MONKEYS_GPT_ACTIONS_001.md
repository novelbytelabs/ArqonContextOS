# Science Monkeys GPT Actions 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define GPT Action setup requirements for Science Monkeys operational bring-up while preserving role-scoped bearer-token authority, route-only artifact controls, Human share authority, and anti-deception boundaries.

This document is planning/configuration governance only.

It does not create GPTs.  
It does not create GPT Actions.  
It does not modify OpenAPI schemas.  
It does not modify Worker routes.  
It does not authorize deployment, certification, promotion, or production readiness.

## Scope

This document defines:

- Action base URL expectations
- role-token isolation requirements
- route ownership mapping
- request-body role spoofing prohibition
- `/v1/science/share` Human-only boundary
- local Helper env-file references
- minimum GPT startup checks
- expected smoke-test requirements before operational use

## Non-Scope

- no GPT creation
- no GPT Action creation
- no implementation
- no source changes
- no route changes
- no OpenAPI changes
- no Worker deployment
- no certification
- no promotion
- no production-readiness claim
- no autonomous science operation

## Action Base URL Requirement

Each Science GPT must use the same validated Worker Action base URL for the ArqonMonkeyOS broker.

The exact production/staging URL must be provided by Human or existing repo-grounded configuration at GPT setup time.

No GPT may invent an Action base URL.

No GPT may use a personal, test, or alternate URL unless Human explicitly authorizes that environment.

## OpenAPI Schema Requirement

Each Science GPT Action must use the currently validated repo-grounded OpenAPI schema.

The GPT setup stage must verify:

- schema source path
- schema version or commit context
- route availability
- request/response fields for assigned route
- no stale route expectations
- no unauthorized route additions

If the schema and live Worker behavior disagree, operational bring-up must stop and classify the issue before use.

## Role Token Isolation

Each Science GPT must have access only to its own bearer key.

Required mapping:

| GPT / Worker Path | Authenticated Role | Allowed Primary Route(s) |
|---|---|---|
| Explorer GPT | `EXPLORER_AI` | `/v1/science/research` |
| Hypothesizer GPT | `HYPOTHESIZER_AI` | `/v1/science/hypothesize`, `/v1/science/interpret`, hypothesizer-owned `/v1/science/iterate` |
| Designer GPT | `DESIGNER_AI` | `/v1/science/design-experiment`, designer-owned `/v1/science/iterate` |
| Science Auditor GPT | `SCIENCE_AUDITOR_AI` | `/v1/science/audit-experiment`, `/v1/science/record-finding` |
| Science Executor local worker | `SCIENCE_EXECUTOR_AI` | `/v1/science/execute-experiment` |
| Human | `HUMAN` | `/v1/science/share` and Human-only gates |

A GPT must not have access to another role's bearer key.

A GPT must not ask the user to paste another role's bearer key.

A GPT must not print or summarize any bearer key.

A GPT must not claim a route succeeded unless the server accepted the token-authenticated request.

## Secret Locations

Deployment secrets are stored in Worker/Cloudflare environment secrets.

Local Helper workflow env files are:

- `~/secrets/arqonmonkeyos_code_keys.env`
- `~/secrets/arqonmonkeyos_science_keys.env`

These file paths may be referenced for Helper setup and local smoke execution.

Secret values must never be printed, copied into docs, or committed.

## Server-Authenticated Role Is Authoritative

Request-body role fields are not authoritative.

The Worker must treat bearer-token-authenticated role as the authority.

If a GPT sends a request body that claims a role different from its token-authenticated role, the request must not be treated as valid role authority.

GPT instructions must state:

- do not spoof role fields
- do not rely on request-body role claims
- do not treat local text identity as server authority
- use only assigned role token and assigned route

## Route Ownership

### Explorer GPT

Allowed route:

- `/v1/science/research`

Allowed artifacts:

- `research_dossier`
- `source_map`
- `contradiction_map`
- `open_questions`

Forbidden:

- hypothesis cards
- experiment protocols
- execution reports
- audit reports
- finding records
- share packets

### Hypothesizer GPT

Allowed routes:

- `/v1/science/hypothesize`
- `/v1/science/interpret`
- `/v1/science/iterate` for hypothesizer-owned iteration only

Allowed artifacts:

- `hypothesis_card`
- `null_hypothesis`
- `prediction_record`
- `interpretation_draft`
- `alternative_explanation_review`
- `iteration_proposal`
- `revised_hypothesis_card`

Forbidden:

- experiment execution
- command logs
- evidence manifests
- audit verdicts
- share packets

### Designer GPT

Allowed routes:

- `/v1/science/design-experiment`
- `/v1/science/iterate` for designer-owned iteration only

Allowed artifacts:

- `experiment_protocol`
- `metric_plan`
- `control_plan`
- `execution_packet`
- `sealed_boundary_plan`
- `revised_experiment_protocol`

Forbidden:

- execution reports
- raw result indexes
- evidence audits
- finding records
- share packets

### Science Auditor GPT

Allowed routes:

- `/v1/science/audit-experiment`
- `/v1/science/record-finding`

Allowed artifacts:

- `science_checklist`
- `protocol_audit`
- `evidence_audit`
- `claim_scope_audit`
- `audit_report`
- `quarantine_recommendation`
- `claim_scope_review`
- `finding_record`
- `negative_finding_record`
- `inconclusive_finding_record`
- `finding_boundary_record`
- `share_recommendation`

Forbidden:

- raw evidence production
- experiment execution
- official Human share packet creation
- deployment, certification, promotion, or production readiness

### Science Executor Local Worker

Allowed route:

- `/v1/science/execute-experiment`

Allowed artifacts:

- `execution_report`
- `evidence_manifest`
- `command_log`
- `raw_result_index`
- `deviation_report`

Forbidden:

- GPT persona substitution
- hypothesis creation
- experiment design
- audit verdicts
- share packets

### Human

Allowed route:

- `/v1/science/share`

Human-only authority:

- official share packets
- cross-flow advancement
- approval/rejection of audit recommendations
- promotion decisions
- certification decisions
- deployment decisions
- exception approvals

## `/v1/science/share` Boundary

`/v1/science/share` remains Human-only.

A Science GPT may recommend a share.

A Science GPT may draft bounded allowed claims and forbidden claims.

A Science GPT may not create the official share packet.

The share route must require:

- Human authenticated role
- `flow_ref`
- `idempotency_key`
- `evidence_level`
- `uncertainty`
- `source_artifacts`
- `allowed_claims`
- `forbidden_claims`
- `body`

A share packet must not be treated as valid if source artifacts are missing, weak, fabricated, or out of role scope.

## Generic Artifact Route Boundary

Generic artifact routes such as `/v1/flows/{id}/artifacts` must continue to reject route-only artifacts where enforced.

Expected failure for raw route-only artifact writes remains a protected behavior, not a bug.

For example, raw Helper `execution_report` writes on `code_flow` should be denied with route-only enforcement where policy requires it.

## Minimum GPT Startup Checks

Before a Science GPT is used live, its setup must confirm:

1. Correct role name.
2. Correct Action base URL.
3. Correct bearer key assigned only to that role.
4. Correct allowed route list.
5. Correct forbidden route list.
6. Correct allowed artifact list.
7. Correct forbidden artifact list.
8. Required status labels are present.
9. No-self-certification rule is present.
10. No fake science rule is present.
11. Human share authority boundary is present.
12. Science-to-Code boundary is present.
13. Secret handling rule is present.
14. No production/deployment/certification/promotion authority is present.
15. The GPT cannot access other Science role tokens.

## Minimum GPT System Instruction Blocks

Every Science GPT must include role-specific instructions that state:

- "You are not Human."
- "You are not Helper unless explicitly configured as local Science Executor."
- "Your text is not evidence."
- "Do not claim certification."
- "Do not claim production readiness."
- "Do not claim deployment authorization."
- "Do not promote findings."
- "Do not bypass route-only artifact controls."
- "Do not print secrets."
- "Use only your assigned route and token."

## Live Smoke Requirement Before Operational Use

Science GPT Action setup is not accepted until fresh live smoke data demonstrates:

- each GPT can call only its assigned route
- each GPT is rejected from routes it does not own
- request-body role spoofing does not grant authority
- Human-only `/v1/science/share` remains Human-only
- source-artifact evidence requirements are enforced
- generic route-only artifact writes remain rejected where required
- no secret values are exposed

Required smoke families:

- `science_monkeys_v01_routes_live_smoke`
- `science_monkeys_v01_share_live_smoke`
- `science_to_code_handoff_live_smoke`

## Stale Data and Conflict Handling

Live smoke runs must use fresh flow names and IDs.

Offline fixture IDs must not be used for live validation.

If GitHub write SHA conflicts occur during live smoke:

1. retry only within a bounded policy,
2. rerun with fresh serialized IDs,
3. if conflicts persist under fresh serialized runs, classify as:
   `POSSIBLE_PRODUCT_BUG_GITHUB_WRITE_CONFLICT`

Do not hide conflicts.

Do not reclassify persistent conflicts as pass.

## Stage Exit Criteria For This Document

This document may be accepted into the planning bundle only if:

- PM/Human accepts the GPT Action boundary model
- Helper commits the exact PM-authored document only
- no source files change
- no route files change
- no OpenAPI files change unless separately authorized
- no GPTs are created
- no GPT Actions are created
- no deployment occurs
- no secrets are exposed
- required status labels remain present

Acceptance of this document does not authorize GPT creation or Action creation.

A separate Human go/no-go is required before any Science GPT or GPT Action is configured.
