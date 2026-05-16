# Post-Human Advancement Boundary Hardening 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Route-only harden remaining high-authority Human artifacts on `code_flow`:

- `human_decision`
- `advancement_approval`
- `promotion_decision`

## Scope

- update route-only artifact enforcement in `worker/src/flows.ts`
- block raw generic writes for the three artifacts on `code_flow`
- keep `human_advancement_decision` route-only
- preserve Human Advancement Gate 001 behavior
- preserve Auditor Helper Execution Review behavior
- preserve Science behavior

## Non-Scope

- no deployment
- no certification
- no promotion
- no production-readiness claim
- no new Human approval semantics
- no route implementation
- no OpenAPI changes
- no Science behavior changes
- no Skill/Memory/Preference runtime

## Expected Behavior

- raw HUMAN `human_decision` on `code_flow` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw HUMAN `advancement_approval` on `code_flow` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw HUMAN `promotion_decision` on `code_flow` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
