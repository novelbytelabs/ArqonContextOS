# Code Monkeys PM Tasks 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Create the first PM-controlled task-decomposition artifact from an audited PM plan.

## Boundary

Input:

- generated PM plan context
- official PM plan record
- preserved share hash, handoff hash, intake hash, specification hash, plan hash, uncertainty, claims, source refs, and required labels

Output:

- `tasks` artifact on the target `code_flow`
- generated PM tasks context record

## Role-Policy Change

PM owns `tasks` artifact creation for Code Monkeys PM task decomposition.

Coder owns later implementation artifacts:

- `implementation_bundle`
- `coder_patch_bundle`
- `coder_handoff`

## Non-Scope

- no Coder handoff
- no Helper execution
- no new Science behavior
- no Skill/Memory/Preference runtime
- no implementation authorization
- no certification
- no promotion

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
