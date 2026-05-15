# Code Monkeys PM Tasks 001 Evidence

- branch: `main`
- commit before: `2292b513f20004ed411ee0c0cb460d46aa3e1779`
- commit after: `cb42684d5dadaa5559f5c40bc0abe558baf94f25`
- push status: `PASS`

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKS_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKS_001_EVIDENCE.md`
- `worker/src/pm_tasks.ts`
- `worker/test_support/code_monkeys_pm_tasks_policy_unit.ts`
- `worker/test_support/code_monkeys_pm_tasks_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_tasks_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_tasks_tripwire.py`
- `worker/test_support/build_pm_tasks_audit_bundle.py`

## Files Updated
- `openapi/arqon_contextos.openapi.yaml`
- `worker/src/index.ts`
- `worker/src/flow_policy.ts`
- `worker/src/pm_plan.ts`
- `worker/test_support/code_monkeys_pm_plan_tripwire.py`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasks_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasks_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasks_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_plan_tripwire.py` PASS
- `python3 worker/test_support/pm_specify_strict_audit_tripwire.py .` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_tasks_audit_bundle.py` PASS
- `rg -n "handlePmTasksRequest|PM_TASKS_ROLE_FORBIDDEN|PM_TASKS_IDEMPOTENCY_CONFLICT|PM_TASKS_IMPLEMENTATION_AUTHORITY_FORBIDDEN|generated_pm_tasks_context" worker/src worker/test_support docs openapi` PASS

## PM Tasks Audit Bundle
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_tasks_audit_bundle_2292b513f200.zip`
- zip SHA256: `eff083de4c06a0b5735bd601c0ffe22712a6b2fa94b2687401d3ec26830d884f`
- file count: `29`

## Live Deployed Worker Smoke
- command:
  - `PM_TASKS_PLAN_ID='FLOW-2026-0033-share-8806579957-handoff-8806579957-intake-8806579957-spec-8806579957-plan-8806579957' node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasks_live_smoke.js`
- result: `BLOCKED`
- blocker:
  - `/v1/pm/tasks` returned `404 NOT_FOUND` from deployed Worker URL, indicating stale deployment missing PM Tasks route.

### Redacted Live Transcript Excerpt
```text
no-auth PM tasks denied: expected 401, got 404
error.code: NOT_FOUND
message: No route for POST /v1/pm/tasks
```

## Proof Matrix
- no-auth PM tasks denied: `BLOCKED_BY_STALE_DEPLOYMENT` (endpoint 404 before auth check)
- all non-PM roles denied: `PASS` (offline smoke)
- PM tasks succeeds from audited PM plan: `PASS` (offline smoke)
- tasks artifact created: `PASS` (offline smoke)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (offline smoke)
- duplicate PM tasks is idempotent: `PASS` (offline smoke)
- changed PM tasks payload conflicts: `PASS` (offline smoke)
- promotion language is denied: `PASS` (offline smoke)
- implementation authority language is denied: `PASS` (offline smoke)
- no Coder handoff / Helper execution generated: `PASS` (offline smoke)
- no Science behavior added: `PASS` (source review + offline smoke)
- no secrets in report: `PASS`

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
