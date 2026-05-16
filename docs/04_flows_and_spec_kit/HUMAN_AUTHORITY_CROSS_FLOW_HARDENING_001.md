# Human Authority Cross-Flow Hardening 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Route-only harden high-authority Human artifacts across every flow type where they are valid.

Target artifacts:

- `human_decision`
- `advancement_approval`
- `promotion_decision`

## Scope

- update route-only artifact enforcement in `worker/src/flows.ts`
- block raw generic writes for these Human artifacts across all relevant flow types
- keep `human_advancement_decision` route-only on `code_flow`
- preserve Human Advancement Gate 001 behavior
- preserve Post-Human Advancement Boundary Hardening 001 behavior
- preserve Auditor Helper Execution Review behavior
- preserve Science executor behavior

## Expected Route-Only Scope

- `human_decision`: `science_flow`, `code_flow`, `audit_flow`, `governance_flow`
- `advancement_approval`: `science_flow`, `code_flow`, `audit_flow`, `governance_flow`
- `promotion_decision`: `code_flow`, `governance_flow`
- `human_advancement_decision`: `code_flow`

## Non-Scope

- no deployment
- no certification
- no promotion
- no production-readiness claim
- no new Human approval semantics
- no route implementation
- no OpenAPI changes
- no Science executor behavior changes
- no Skill/Memory/Preference runtime

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
