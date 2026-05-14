# Code Monkeys PM Intake Guardrail Upgrade 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Harden Code Monkeys PM Intake 001 before moving to PM Specify 001.

## Scope

This upgrade addresses the audit warning that PM intake validated handoff artifact IDs on the code flow, but did not also verify their artifact type, role, and source path.

## Required Behavior

- `handoff_intake` must resolve on the code flow by artifact ID.
- The resolved artifact must have artifact type `handoff_intake`.
- The resolved artifact must have role `PM_AI`.
- The resolved artifact source path must match the handoff record.
- `dossier_seed` must resolve on the code flow by artifact ID.
- The resolved artifact must have artifact type `dossier_seed`.
- The resolved artifact must have role `PM_AI`.
- The resolved artifact source path must match the handoff record.
- Tampered artifact type returns `PM_INTAKE_HANDOFF_ARTIFACT_TYPE_MISMATCH`.
- Tampered source path returns `PM_INTAKE_HANDOFF_ARTIFACT_SOURCE_MISMATCH`.

## Non-Scope

- no Science behavior
- no specs
- no plans
- no tasks
- no Coder handoff
- no Helper execution
- no Skill/Memory/Preference runtime
- no certification
- no promotion

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
