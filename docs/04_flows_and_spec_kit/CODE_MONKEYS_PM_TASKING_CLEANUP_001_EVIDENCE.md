# Code Monkeys PM Tasking Cleanup 001 Evidence

- branch: `main`
- commit before: `4768b983133cd918a1dc1b379154939337c7b3a4`
- source commit after: `c8ff294c219dd63d4d4bb31a77daa631417857d8`
- evidence commit after: `bffcf8aa0334fd2ea1083a8587bd1bcade03483e`
- push status: `PASS`

## Files Changed
- `worker/src/index.ts`
- `openapi/arqon_contextos.openapi.yaml`
- `worker/test_support/code_monkeys_pm_tasking_cleanup_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py`
- `worker/test_support/build_pm_tasking_cleanup_audit_bundle.py`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKING_CLEANUP_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKING_CLEANUP_001_EVIDENCE.md`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_cleanup_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_tripwire.py` PASS
- `python3 worker/test_support/build_pm_tasking_cleanup_audit_bundle.py` PASS
- `rg -n "PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING|handlePmTasksRequest|/v1/pm/tasks|/v1/pm/tasking|pm_tasking|coder_work_plan|coder_tasks" worker/src worker/test_support docs openapi` PASS

## Cleanup Bundle Builder
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_tasking_cleanup_audit_bundle_4768b983133c.zip`
- bundle sha256: `d0356817073029fe1c416351c4b05889129a5fe69f57626368576f425dd5df69`
- file count: `11`

## Route Retirement Proof
- old route import removed:
  - `handlePmTasksRequest` is not imported in `worker/src/index.ts`
- old route handler removed:
  - no `/v1/pm/tasks` call to `handlePmTasksRequest`
- explicit retired response added:
  - `POST /v1/pm/tasks` returns `410 PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING`

## Tasking Route Proof
- active PM tasking route preserved:
  - `POST /v1/pm/tasking` is still handled by `handlePmTaskingRequest`
- PM ownership preserved:
  - PM owns `pm_tasking`
- coder ownership preserved:
  - Coder owns generic `tasks`, `coder_work_plan`, and `coder_tasks`

## Scope Proofs
- no Science behavior added: PASS
- no Coder handoff added: PASS
- no Helper execution added: PASS
- no Skill/Memory/Preference runtime added: PASS

## Live Deployed Worker Smoke
- status: `PENDING_REDEPLOY`
- expected after Cloudflare redeploy from `main`:
  - `POST /v1/pm/tasks` with PM token returns `410 PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING`
  - `POST /v1/pm/tasking` no longer returns stale `404`

## Secret Leak Check
- checked files in this cleanup diff and evidence report for bearer tokens/private keys
- result: PASS (no secrets found)

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
