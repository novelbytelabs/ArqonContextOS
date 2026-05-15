# Code Monkeys Coder Tasks 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Create the first Coder-owned implementation task-decomposition artifact from an audited Coder work plan.

## Boundary

Input:

- generated Coder work plan context
- official Coder work plan record
- preserved share hash, handoff hash, intake hash, specification hash, plan hash, tasking hash, work-plan hash, uncertainty, claims, source refs, and required labels

Output:

- `coder_tasks` artifact on the target `code_flow`
- generated Coder tasks context record

## Authority Separation

PM owns:

- `specification`
- `plan`
- `pm_tasking`

Coder owns:

- `coder_work_plan`
- `coder_tasks`
- later implementation artifacts

This stage allows Coder to decompose implementation tasks. It does not create implementation code, patches, Coder handoff, Helper execution, deployment, certification, or promotion.

## Non-Scope

- no `implementation_bundle`
- no `coder_handoff`
- no Helper execution
- no new Science behavior
- no Skill/Memory/Preference runtime
- no execution authorization
- no certification
- no promotion

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
