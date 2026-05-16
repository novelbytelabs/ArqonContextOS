# Post-Human Advancement Boundary Hardening 001 Plan

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Plan the next bounded hardening stage after Human Advancement Gate 001.

This stage addresses the remaining audit warning: raw generic HUMAN writes for `human_decision`, `advancement_approval`, and `promotion_decision` remain possible and must be handled before any future certification, promotion, deployment, or production-readiness stage.

This is planning only. It does not implement routes, change Worker behavior, deploy, certify, promote, or claim production readiness.

## Scope

Define a future remediation/implementation package that will:

- make `human_decision` route-scoped or formally retire/split it
- make `advancement_approval` route-scoped or formally retire/split it
- make `promotion_decision` route-scoped or formally retire/split it
- preserve `human_advancement_decision` as the current approved Human gate artifact
- prevent raw generic writes from bypassing future Human route boundaries
- keep Science behavior unchanged
- keep current Human Advancement Gate 001 behavior unchanged

## Non-Scope

This planning stage must not:

- implement source code
- mount routes
- change flow policy
- alter OpenAPI
- deploy Worker changes
- certify anything
- promote anything
- create production-readiness claims
- execute Human advancement
- change Science behavior
- create Skill/Memory/Preference runtime

## Problem Statement

Human Advancement Gate 001 is audit-clean for the `human_advancement_decision` route.

However, legacy or adjacent Human-owned artifacts remain raw-generic writable on `code_flow`:

- `human_decision`
- `advancement_approval`
- `promotion_decision`

Those artifacts are outside the audited `human_advancement_decision` route boundary. They must not become bypass lanes for future promotion, certification, deployment, or production-readiness claims.

## Preferred Design Direction

Use route-only hardening for high-authority Human artifacts.

Recommended route-only set on `code_flow`:

- `human_decision`
- `advancement_approval`
- `promotion_decision`

Preferred immediate choice:

Block raw generic writes for all three on `code_flow`.

## Required Future Behavior

For `code_flow`:

- raw HUMAN write of `human_decision` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw HUMAN write of `advancement_approval` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw HUMAN write of `promotion_decision` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`

Existing route behavior must remain unchanged:

- `POST /v1/human/advancement-decision` still works
- `human_advancement_decision` remains route-only
- `advance` still requires `AUDITOR_REVIEW_PASS`
- unresolved blockers still reject `advance`
- forbidden claim guards still work
- secret guards still work

Science behavior must remain unchanged.

## Route/API Proposal

No new route should be implemented in this planning stage.

Future options:

### Option A: Route-only harden legacy artifacts, no new route

- keep artifacts in policy
- block raw generic writes on `code_flow`
- require future dedicated route/spec before they can be written

### Option B: Retire or rename legacy artifacts

- replace ambiguous artifact names with explicit route-bound names
- preserve backwards compatibility only if safe

### Option C: Dedicated future routes

Possible future route names:

- `POST /v1/human/decision`
- `POST /v1/human/advancement-approval`
- `POST /v1/human/promotion-decision`

These should not be implemented until separate PM specs exist.

## Required Tests for Future Implementation

Policy/unit checks:

- `human_decision`, `advancement_approval`, and `promotion_decision` are recognized as high-authority Human artifacts.
- AI roles cannot write them.
- Raw generic `code_flow` writes are route-only blocked.

Offline smoke:

- raw HUMAN `human_decision` on `code_flow` -> `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw HUMAN `advancement_approval` on `code_flow` -> `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw HUMAN `promotion_decision` on `code_flow` -> `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- Human Advancement Gate 001 still passes
- Auditor helper execution review still passes
- Science regression still passes

Tripwire:

- route-only map contains the three high-authority Human artifacts for `code_flow`
- `human_advancement_decision` remains route-only
- no production/certification/promotion bypass language appears in docs or tests
- no Science behavior regression

Live smoke:

- same as offline smoke
- include raw redacted JSON transcript in evidence bundle

## Evidence Requirements

Future audit bundle should include:

- changed source files
- tests
- tripwire
- audit bundle builder
- operational evidence doc
- raw live smoke JSON transcript with secrets redacted
- explicit before/after behavior table

## Rollback / Quarantine Plan

If route-only hardening breaks current Human Advancement Gate behavior:

- stop
- do not deploy further
- preserve audit bundle and SHA
- revert bounded hardening commit if necessary
- write remediation plan

If secret material is exposed:

- stop
- quarantine artifacts
- rotate affected secret if real
- preserve only redacted evidence

## PM Decision

This plan authorizes only a future bounded hardening implementation package.

It does not authorize certification, promotion, deployment, production-readiness claims, or any new Human approval semantics.

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
