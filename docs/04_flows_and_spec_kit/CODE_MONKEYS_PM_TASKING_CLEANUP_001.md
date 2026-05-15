# Code Monkeys PM Tasking Cleanup 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Retire the rejected generic PM Tasks route before live redeploy.

## Problem

The corrected design uses:

- `POST /v1/pm/tasking`
- `pm_tasking` artifact owned by `PM_AI`

The rejected generic route must not remain active:

- `POST /v1/pm/tasks`
- `PM_AI` ownership of generic `tasks`

## Required Cleanup

- Remove `handlePmTasksRequest` import from `worker/src/index.ts`.
- Remove the old `/v1/pm/tasks` handler call.
- Add explicit retired-route response:
  - `410 PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING`
- Keep `/v1/pm/tasking` active.
- Keep Coder ownership of implementation task decomposition:
  - `tasks`
  - `coder_work_plan`
  - `coder_tasks`
  - `implementation_bundle`
  - `coder_patch_bundle`
  - `coder_handoff`

## Non-Scope

- no new Science behavior
- no Coder handoff
- no Helper execution
- no Skill/Memory/Preference runtime
- no certification
- no promotion

## Live Acceptance

After redeploy:

- `POST /v1/pm/tasks` returns `410 PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING`
- `POST /v1/pm/tasking` remains the active PM tasking route
- `PM_AI` cannot write generic `tasks`
- `CODER_AI` can write implementation decomposition artifacts later

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
