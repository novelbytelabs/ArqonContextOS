# Code Monkeys PM Specify Remediation 001

Status:

- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`

## Purpose

Remediate the blocking findings from Code Monkeys PM Specify 001 Audit.

## Blocking Findings Addressed

1. Promotion-language rejection was too narrow.
2. Live-pass evidence was missing from the uploaded audit bundle.

## Scope

This remediation broadens `specification_body` promotion-language rejection and expands offline/live probes for:

- certified
- certification
- production-ready
- production readiness
- ready for production
- product-ready
- promotable
- approved for release
- release-ready

It also adds a strict audit tripwire and requires the next evidence bundle to include the post-rebuild PM report.

## Non-Scope

- no plan generation
- no tasks
- no Coder handoff
- no Helper execution
- no new Science behavior
- no Skill/Memory/Preference runtime
- no certification
- no promotion

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

