# Code Monkeys Coder Implementation Bundle Route-Only Remediation 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Patch the audit blocker where `CODER_AI` could bypass `/v1/coder/implementation-bundle` by creating `implementation_bundle` through the generic Flow artifact endpoint.

## Remediation Scope

- Make `implementation_bundle` route-only for direct generic flow artifact writes.
- Keep the validated `/v1/coder/implementation-bundle` route working through an internal route-scoped artifact writer.
- Reject mismatched `coder_tasks_id` plus `coder_tasks_record_path`.
- Validate upstream `coder_tasks` artifact `source_sha`.
- Fail closed on malformed existing idempotency records.
- Add adversarial offline smoke and tripwire coverage.

## Non-Scope

- no Coder handoff
- no Helper execution
- no Science behavior
- no Skill/Memory/Preference runtime
- no certification
- no promotion

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
