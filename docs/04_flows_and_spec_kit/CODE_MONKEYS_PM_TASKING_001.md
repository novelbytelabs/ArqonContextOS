# Code Monkeys PM Tasking 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Create the first PM-controlled tasking / work-order artifact from an audited PM plan.

## Boundary

Input:

- generated PM plan context
- official PM plan record
- preserved share hash, handoff hash, intake hash, specification hash, plan hash, uncertainty, claims, source refs, and required labels

Output:

- `pm_tasking` artifact on the target `code_flow`
- generated PM tasking context record

## Authority Separation

PM owns:

- `specification`
- `plan`
- `pm_tasking`

Coder owns later implementation decomposition:

- `tasks`
- `coder_work_plan`
- `coder_tasks`
- `implementation_bundle`
- `coder_patch_bundle`
- `coder_handoff`

## Non-Scope

- no generic `tasks` artifact by PM
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
