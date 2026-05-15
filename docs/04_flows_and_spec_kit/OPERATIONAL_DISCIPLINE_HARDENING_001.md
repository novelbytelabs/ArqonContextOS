# Operational Discipline Hardening 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Harden repository operational discipline before Coder Handoff 001.

This milestone is required because prior audits found that live smoke artifacts were referenced by local workspace paths instead of being included as portable audit evidence, and validation depended on generated smoke JavaScript in a disposable scratch path.

## Scope

- Move smoke build output to `runtime/flow-core-smoke-dist`.
- Keep `tmp/` as scratch only.
- Add a static guard against critical `tmp/` path references.
- Add deterministic compile-before-run helper.
- Add a selftest proving the guard fails on injected critical `tmp/` command references.
- Add an audit bundle builder for this hardening milestone.
- Preserve route-only protections as regression checks.

## Non-Scope

- no route behavior changes
- no role gate changes
- no Science behavior changes
- no Coder behavior changes
- no Coder Handoff
- no Helper execution
- no Skill/Memory/Preference runtime
- no certification
- no promotion

## Acceptance Criteria

- Typecheck passes.
- Smoke compile writes to `runtime/flow-core-smoke-dist`.
- Smoke commands run from `runtime/`.
- Static guard finds no critical `tmp/` paths.
- Static guard fails on an intentionally injected critical `tmp/` command.
- Existing route-only protections still pass.
- Evidence docs avoid treating machine-local scratch paths as proof.
- Required diagnostic labels are preserved.

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
