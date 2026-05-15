# Code Monkeys PM Tasking 001 Evidence

- branch: `main`
- commit before: `29d6afeea243fac28c74400585ceaab3482ebb3c`
- commit after: `PENDING_COMMIT`
- push status: `PENDING_PUSH`

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKING_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKING_001_EVIDENCE.md`
- `worker/src/pm_tasking.ts`
- `worker/test_support/code_monkeys_pm_tasking_policy_unit.ts`
- `worker/test_support/code_monkeys_pm_tasking_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_tasking_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_tasking_tripwire.py`
- `worker/test_support/build_pm_tasking_audit_bundle.py`

## Files Updated
- `openapi/arqon_contextos.openapi.yaml`
- `worker/src/flow_policy.ts`
- `worker/src/index.ts`
- `worker/test_support/code_monkeys_pm_tasks_live_smoke.ts`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_plan_tripwire.py` PASS
- `python3 worker/test_support/pm_specify_strict_audit_tripwire.py .` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_tasking_audit_bundle.py` PASS
- `rg -n "handlePmTaskingRequest|PM_TASKING_ROLE_FORBIDDEN|PM_TASKING_IDEMPOTENCY_CONFLICT|PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN|generated_pm_tasking_context|pm_tasking|coder_work_plan|coder_tasks" worker/src worker/test_support docs openapi` PASS

## PM Tasking Audit Bundle
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_tasking_audit_bundle_29d6afeea243.zip`
- zip SHA256: `8b9eab5ffb9dcc12d2b9e0c65682498e744d1d619abefe3f41a3b44c0114b252`
- file count: `29`

## Live Deployed Worker Smoke
- command:
  - `PM_TASKING_PLAN_ID='FLOW-2026-0033-share-8806579957-handoff-8806579957-intake-8806579957-spec-8806579957-plan-8806579957' PM_TASKING_CODE_FLOW_ID='FLOW-2026-0033' node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_live_smoke.js`
- result: `BLOCKED`
- blocker:
  - `/v1/pm/tasking` returned `404 NOT_FOUND` from deployed Worker URL, indicating stale deployment missing PM Tasking route.

### Redacted Live Transcript Excerpt
```text
no-auth PM tasking denied: expected 401, got 404
error.code: NOT_FOUND
message: No route for POST /v1/pm/tasking
```

## Proof Matrix
- no-auth PM tasking denied: `BLOCKED_BY_STALE_DEPLOYMENT` (endpoint 404 before auth check)
- all non-PM roles denied: `PASS` (offline smoke)
- PM tasking succeeds from audited PM plan: `PASS` (offline smoke)
- `pm_tasking` artifact created: `PASS` (offline smoke)
- PM cannot write generic `tasks`: `PASS` (offline smoke)
- Coder can write `coder_tasks`: `PASS` (offline smoke)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (offline smoke)
- duplicate PM tasking is idempotent: `PASS` (offline smoke)
- changed PM tasking payload conflicts: `PASS` (offline smoke)
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
