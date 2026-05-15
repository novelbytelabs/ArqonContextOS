# Code Monkeys Coder Tasks 001 Evidence

- branch: `main`
- commit before: `963a2de2b90c46c288f29b057f2918ae15282e4b`
- commit after: `58e930928c0642e98fbf03d6eaa49d7afdc7efb4`
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
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_tasks_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_tasks_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_tasks_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_offline_smoke.js` PASS
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
- redeploy status: `LIVE_ROUTE_PRESENT_AND_SERVING` (no stale `404`)
- command:
  - `set -a && source ~/secrets/arqonmonkeyos_science_keys.env && set +a`
  - `CODER_TASKS_WORK_PLAN_ID='FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--coder-work-plan-8813568942' CODER_TASKS_CODE_FLOW_ID='FLOW-2026-0036' node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_tasks_live_smoke.js`
- result: `PASS`
- ids used:
  - `coder_work_plan_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--coder-work-plan-8813568942`
  - `coder_tasks_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--coder-tasks-8815434954`
  - `code_flow_id`: `FLOW-2026-0036`

### Redacted Live Transcript Excerpt
```text
no-auth Coder tasks denied: 401 UNAUTHORIZED
all non-Coder roles denied: 403 CODER_TASKS_ROLE_FORBIDDEN
Coder tasks succeeds: 201 (artifact_type=coder_tasks)
duplicate replay: 200 idempotent_replay=true
changed payload conflict: 409 CODER_TASKS_IDEMPOTENCY_CONFLICT
promotion denied: 409 CODER_TASKS_FORBIDDEN_CLAIM_INCLUDED
execution-authority denied: 409 CODER_TASKS_EXECUTION_AUTHORITY_FORBIDDEN
PM coder_tasks denied: 403 ARTIFACT_ROLE_FORBIDDEN
Helper coder_tasks denied: 403 ARTIFACT_ROLE_FORBIDDEN
```

## Proof Matrix
- no-auth Coder tasks denied: `PASS` (live smoke)
- all non-Coder roles denied: `PASS` (live smoke)
- Coder tasks succeeds from audited Coder work plan: `PASS` (live smoke)
- `coder_tasks` artifact created: `PASS` (live smoke)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (live smoke assertions)
- duplicate Coder tasks is idempotent: `PASS` (live smoke)
- changed Coder tasks payload conflicts: `PASS` (live smoke)
- promotion language is denied: `PASS` (live smoke)
- execution-authority language is denied: `PASS` (live smoke)
- PM cannot write `coder_tasks`: `PASS` (live smoke)
- Helper cannot write `coder_tasks`: `PASS` (live smoke)
- no implementation bundle created: `PASS` (live smoke + route scope)
- no Coder handoff created: `PASS` (live smoke + route scope)
- no Helper execution created: `PASS` (live smoke + route scope)
- no Science behavior added: `PASS` (source review + regression checks)
- no secrets in report: `PASS`

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
