# Code Monkeys Coder Tasks 001 Evidence

- branch: `main`
- commit before: `963a2de2b90c46c288f29b057f2918ae15282e4b`
- commit after: `82e631e765147ddd255f04c28ae05e1c85a5d5bc`
- push status: `PASS`

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_TASKS_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_TASKS_001_EVIDENCE.md`
- `worker/src/coder_tasks.ts`
- `worker/test_support/code_monkeys_coder_tasks_policy_unit.ts`
- `worker/test_support/code_monkeys_coder_tasks_offline_smoke.ts`
- `worker/test_support/code_monkeys_coder_tasks_live_smoke.ts`
- `worker/test_support/code_monkeys_coder_tasks_tripwire.py`
- `worker/test_support/build_coder_tasks_audit_bundle.py`

## Files Updated
- `worker/src/index.ts`
- `openapi/arqon_contextos.openapi.yaml`
- `worker/test_support/code_monkeys_coder_work_plan_live_smoke.ts`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_tasks_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_tasks_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_tasks_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_work_plan_tripwire.py` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_tripwire.py` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py` PASS
- `python3 worker/test_support/build_coder_tasks_audit_bundle.py` PASS
- `rg -n "handleCoderTasksRequest|CODER_TASKS_ROLE_FORBIDDEN|CODER_TASKS_IDEMPOTENCY_CONFLICT|CODER_TASKS_EXECUTION_AUTHORITY_FORBIDDEN|generated_coder_tasks_context|coder_tasks" worker/src worker/test_support docs openapi` PASS

## Coder Tasks Audit Bundle
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/coder_tasks_audit_bundle_963a2de2b90c.zip`
- bundle SHA256: `314b1e057702179f9281fac7480293a74013f74a81bac6f1750eac9ac79cfbef`
- file count: `32`

## Live Deployed Worker Smoke
- worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- command:
  - `set -a && source ~/secrets/arqonmonkeyos_science_keys.env && set +a`
  - `CODER_TASKS_WORK_PLAN_ID='FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--coder-work-plan-8813568942' CODER_TASKS_CODE_FLOW_ID='FLOW-2026-0036' node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_tasks_live_smoke.js`
- result: `BLOCKED`
- blocker:
  - `POST /v1/coder/tasks` returns `404 NOT_FOUND` in deployed worker, indicating stale deployment does not yet include Coder Tasks route.

### Redacted Live Transcript Excerpt
```text
no-auth Coder tasks denied: expected 401, got 404
error.code: NOT_FOUND
message: No route for POST /v1/coder/tasks
```

## Proof Matrix
- no-auth Coder tasks denied: `BLOCKED_BY_STALE_DEPLOYMENT`
- all non-Coder roles denied: `PASS` (offline smoke)
- Coder tasks succeeds from audited Coder work plan: `PASS` (offline smoke)
- `coder_tasks` artifact created: `PASS` (offline smoke)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (offline smoke checks + source record assertions)
- duplicate Coder tasks is idempotent: `PASS` (offline smoke)
- changed Coder tasks payload conflicts: `PASS` (offline smoke)
- promotion language is denied: `PASS` (offline smoke)
- execution-authority language is denied: `PASS` (offline smoke)
- PM cannot write `coder_tasks`: `PASS` (policy + offline deny matrix)
- Helper cannot write `coder_tasks`: `PASS` (policy + offline deny matrix)
- no implementation bundle created: `PASS` (offline smoke manifest assertions)
- no Coder handoff created: `PASS` (offline smoke manifest assertions)
- no Helper execution created: `PASS` (offline smoke manifest assertions)
- no Science behavior added: `PASS` (source review + regression checks)
- no secrets in report: `PASS`

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
