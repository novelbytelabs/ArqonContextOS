# Code Monkeys Coder Implementation Bundle Global Route-Only Remediation 002

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Patch the residual audit blocker from Route-Only Remediation 001.

Remediation 001 blocked raw generic `implementation_bundle` creation on `code_flow`, but the Auditor found that `governance_flow` still allowed direct generic `implementation_bundle` creation by `CODER_AI`.

This remediation makes `implementation_bundle` route-only across applicable flow types.

## Scope

- Replace the `code_flow`-only route-only guard with a global `implementation_bundle` route-only guard.
- Add adversarial smoke proving generic `implementation_bundle` creation is blocked on:
    - `code_flow`
    - `governance_flow`
- Preserve the guarded `/v1/coder/implementation-bundle` route.
- Preserve Remediation 001 checks:
    - mismatched `coder_tasks_id` + `coder_tasks_record_path` fail closed
    - source SHA mismatch fails closed
    - malformed existing idempotency record fails closed

## Non-Scope

- no Coder Handoff
- no Helper execution
- no new Science behavior
- no Skill/Memory/Preference runtime
- no certification
- no promotion

## Required Live Proofs

- raw generic `CODER_AI` write of `implementation_bundle` to `code_flow` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- raw generic `CODER_AI` write of `implementation_bundle` to `governance_flow` returns `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- `/v1/coder/implementation-bundle` still succeeds from audited `coder_tasks`
- no Coder handoff created
- no Helper execution created
- no Science behavior changed
- no secrets exposed

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
