# Code Monkeys PM Tasking Cleanup 001 Evidence

- branch: `main`
- commit before: `4768b983133cd918a1dc1b379154939337c7b3a4`
- source commit after: `c8ff294c219dd63d4d4bb31a77daa631417857d8`
- evidence commit after: `PENDING_VERIFICATION_EVIDENCE_COMMIT`
- push status: `PENDING`

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
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_tasking_cleanup_audit_bundle_d3cfcdc1ef91.zip`
- bundle sha256: `0ad7b75fa7d1f3febd8c76774434b6ae5d2d54beb3fc4a27400f0f0558fdde63`
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
- deployed worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- redeploy status: `VERIFIED_LIVE_BEHAVIOR_MATCHES_CLEANUP` (live behavior indicates cleanup build is serving)
- live retired-route probe:
  - `POST /v1/pm/tasks` with PM token -> `410 PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING` PASS
- live tasking-route liveness probe:
  - `POST /v1/pm/tasking` without auth -> `401 UNAUTHORIZED` PASS (`404` no longer present)
- full PM tasking live smoke:
  - command: `PM_TASKING_PLAN_ID=... PM_TASKING_CODE_FLOW_ID=... node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_live_smoke.js`
  - status: `BLOCKED_LOCAL_SECRET_ENV`
  - blocker: missing local env var `BROKER_KEY_EXPLORER` (script requires full bearer set for denied-role checks)

### Redacted Live Probe Output
```text
POST /v1/pm/tasks -> 410 PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING
POST /v1/pm/tasking -> 401 UNAUTHORIZED
full live smoke -> Missing token env var: BROKER_KEY_EXPLORER
```

## Secret Leak Check
- checked files in this cleanup diff and evidence report for bearer tokens/private keys
- result: PASS (no secrets found)

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
