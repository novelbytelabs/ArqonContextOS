# Science Monkeys E2E Smoke 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define the minimum end-to-end smoke plan required before Science Monkeys can be called operational as a controlled GPT-team workflow.

This document is a planning/governance smoke specification only.

It does not run the smoke.  
It does not create GPTs.  
It does not modify routes.  
It does not deploy.  
It does not certify or promote Science Monkeys.

## Scope

This smoke specification covers:

- role-auth route boundaries
- Science workflow sequence
- Human-only share boundary
- Science-to-Code handoff boundary
- route-only artifact enforcement
- evidence packet completeness
- fresh live data requirements
- anti-deception tripwire expectations
- pass/fail classification

## Non-Scope

- no implementation
- no route changes
- no source edits
- no GPT creation
- no GPT Action creation
- no deployment
- no certification
- no promotion
- no production-readiness claim
- no autonomous science execution
- no Code Monkeys route modification

## Required Smoke Families

Operational bring-up remains blocked until fresh smoke evidence passes for:

- `science_monkeys_v01_routes_live_smoke`
- `science_monkeys_v01_share_live_smoke`
- `science_to_code_handoff_live_smoke`

If an offline smoke is used, it is supplementary only.

Offline pass does not replace fresh live evidence.

## Fresh Data Requirement

Every live smoke run must use fresh identifiers.

Required fresh values:

- unique flow name
- unique flow ID or flow reference
- unique idempotency key
- unique share or handoff ID when applicable
- fresh source artifact references

Forbidden:

- stale fixture IDs
- reused live IDs from prior successful runs
- copied evidence from old runs
- unverified historical pass status
- invented flow IDs
- invented artifact IDs

## Required Environment Boundary

Deployment secrets live in Worker/Cloudflare environment secrets.

Local Helper workflow env files are:

- `~/secrets/arqonmonkeyos_code_keys.env`
- `~/secrets/arqonmonkeyos_science_keys.env`

Live smoke execution may source these local files if required.

Smoke reports must not print secret values.

Smoke reports may state whether required env variables were present or missing.

## Smoke 1: Role Route Boundary

Purpose:

Verify each Science role can use only its assigned route and cannot use another role's route by body spoofing or token misuse.

Expected valid route mapping:

| Role | Route |
|---|---|
| `EXPLORER_AI` | `/v1/science/research` |
| `HYPOTHESIZER_AI` | `/v1/science/hypothesize` |
| `DESIGNER_AI` | `/v1/science/design-experiment` |
| `SCIENCE_EXECUTOR_AI` | `/v1/science/execute-experiment` |
| `SCIENCE_AUDITOR_AI` | `/v1/science/audit-experiment` |
| `HUMAN` | `/v1/science/share` |

Required checks:

1. Assigned route succeeds with correct token and valid payload.
2. Wrong role token is rejected.
3. Request-body role spoofing does not grant authority.
4. Generic artifact writes are rejected for route-only artifacts where enforced.
5. Error messages preserve policy clarity without leaking secrets.

Pass condition:

All assigned-route calls behave as expected and all wrong-role/spoof attempts fail.

Fail condition:

Any role can access a route it does not own, or route-only artifact controls are bypassed.

## Smoke 2: Minimal Science Loop

Purpose:

Verify the controlled Science flow can proceed through role-scoped artifacts without collapsing role boundaries.

Minimum sequence:

1. Explorer creates research artifact.
2. Hypothesizer creates hypothesis artifact from Explorer context.
3. Designer creates experiment protocol/execution packet from hypothesis.
4. Science Executor creates execution evidence from approved packet.
5. Science Auditor creates audit artifact from protocol and execution evidence.
6. Science Auditor records finding or negative/inconclusive finding if appropriate.
7. Human creates official share packet only if evidence boundaries support it.

Required checks:

- each artifact is produced by the correct authenticated role
- each artifact references appropriate predecessor artifacts
- no role produces another role's artifact
- no role self-certifies
- no raw GPT text is treated as evidence
- failed or incomplete stages do not advance as pass

Pass condition:

The sequence completes with correct role boundaries and evidence links, or stops correctly at a bounded blocker.

Fail condition:

The sequence advances through missing, fabricated, weak, or wrong-role evidence.

## Smoke 3: Human-Only Share

Purpose:

Verify `/v1/science/share` remains guarded by Human authority and source-artifact evidence requirements.

Required fields:

- `flow_ref`
- `idempotency_key`
- `evidence_level`
- `uncertainty`
- `source_artifacts`
- `allowed_claims`
- `forbidden_claims`
- `body`

Required checks:

1. Human token can create a valid bounded share packet when preconditions are met.
2. Science GPT tokens cannot create official share packets.
3. Missing source artifacts are rejected.
4. Missing allowed claims are rejected.
5. Missing forbidden claims are rejected.
6. Missing uncertainty is rejected.
7. Duplicate idempotency key behavior is deterministic.
8. Secret values do not appear in share body or response.

Pass condition:

Human-only authority and evidence preconditions are enforced.

Fail condition:

Any non-Human role creates an official share packet, or missing evidence boundaries are accepted.

## Smoke 4: Science-to-Code Handoff Boundary

Purpose:

Verify Code Monkeys may receive only bounded, Human-shared Science findings rather than raw Science GPT output.

Required checks:

- Code handoff references Human-created share packet
- handoff preserves allowed claims
- handoff preserves forbidden claims
- handoff preserves uncertainty
- handoff preserves source artifact references
- handoff does not convert Science finding into certification
- handoff does not authorize implementation beyond scope
- handoff does not modify Code Monkeys route policy

Pass condition:

Code Monkeys receives a bounded handoff with preserved claim boundary.

Fail condition:

Raw Science output becomes implementation authority, or forbidden claims are dropped.

## Smoke 5: Anti-Deception Tripwire

Purpose:

Verify smoke artifacts do not launder forbidden claims or fake evidence.

Tripwire must detect live claims such as:

- certified
- production-ready
- deployed
- promoted
- sealed-test certified
- autonomous science operational
- evidence exists when missing
- Human approved when no Human artifact exists

Tripwire must not false-positive on:

- detector literals
- forbidden-claim examples
- validator labels
- test names
- documentation explaining what is forbidden

Pass condition:

Tripwire catches live forbidden claims without treating detector literals as claims.

Fail condition:

Tripwire misses live forbidden claims or blocks valid detector literals in a way that invalidates the smoke.

## SHA Conflict Handling

If GitHub write SHA conflicts occur:

1. record the conflict,
2. retry only within bounded policy,
3. rerun with fresh serialized IDs,
4. if conflict persists, classify as:
   `POSSIBLE_PRODUCT_BUG_GITHUB_WRITE_CONFLICT`

Do not silently pass a run with unresolved conflicts.

## Evidence Packet Requirements

A complete smoke evidence packet must include:

- command transcript summary
- local env file paths referenced, without values
- flow IDs used
- artifact IDs used
- share IDs or handoff IDs used
- pass/fail per smoke stage
- route responses summarized without secrets
- files changed
- source changed: YES/NO
- route files changed: YES/NO
- secrets exposed: YES/NO
- deviations
- blockers
- required status labels present
- allowed claims
- forbidden claims
- uncertainty
- non-scope confirmation

## Overall Pass Criteria

Science Monkeys E2E smoke passes only if:

- all required smoke families pass
- fresh live data is used
- role boundaries hold
- Human share remains guarded
- route-only artifact controls hold
- Science-to-Code handoff preserves claim boundaries
- no secrets are exposed
- no forbidden claims are made as live claims
- no source or route files change unless separately authorized
- evidence packet is complete
- required status labels are present

## Overall Fail Criteria

The smoke fails if any of the following occur:

- wrong-role route succeeds
- request-body spoofing grants authority
- Human-only share is bypassed
- generic artifact route bypasses route-only controls
- missing source artifacts are accepted
- forbidden claims are made
- fake evidence appears
- secret values are exposed
- stale IDs are used
- persistent SHA conflicts remain unresolved
- evidence packet is incomplete
- route/source changes occur without authorization

## Stage Exit Criteria For This Document

This document may be accepted into the planning bundle only if:

- PM/Human accepts the smoke specification
- Helper commits the exact PM-authored document only
- no source files change
- no route files change
- no GPTs are created
- no GPT Actions are created
- no smoke is executed in this document-commit stage unless separately authorized
- no deployment occurs
- no secrets are exposed
- required status labels remain present

Acceptance of this document does not mean the smoke passed.

A separate execution packet is required before Helper runs any smoke.
