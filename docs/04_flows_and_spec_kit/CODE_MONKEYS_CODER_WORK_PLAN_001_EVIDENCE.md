# Code Monkeys Coder Work Plan 001 Evidence

- branch: `main`
- commit before: `f3c2295469e6e5bd52f2a954c36c625b9d327b77`
- commit after: `PENDING_COMMIT`
- push status: `PENDING_PUSH`

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_WORK_PLAN_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_WORK_PLAN_001_EVIDENCE.md`
- `worker/src/coder_work_plan.ts`
- `worker/test_support/code_monkeys_coder_work_plan_policy_unit.ts`
- `worker/test_support/code_monkeys_coder_work_plan_offline_smoke.ts`
- `worker/test_support/code_monkeys_coder_work_plan_live_smoke.ts`
- `worker/test_support/code_monkeys_coder_work_plan_tripwire.py`
- `worker/test_support/build_coder_work_plan_audit_bundle.py`

## Files Updated
- `worker/src/index.ts`
- `openapi/arqon_contextos.openapi.yaml`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_work_plan_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_tripwire.py` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py` PASS
- `python3 worker/test_support/build_coder_work_plan_audit_bundle.py` PASS
- `rg -n "handleCoderWorkPlanRequest|CODER_WORK_PLAN_ROLE_FORBIDDEN|CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT|CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN|generated_coder_work_plan_context|coder_work_plan" worker/src worker/test_support docs openapi` PASS

## Coder Work Plan Audit Bundle
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/coder_work_plan_audit_bundle_f3c2295469e6.zip`
- bundle SHA256: `173cc20a68c309cab17bbbc22a3319bae9b8b9cbdef93f9c7e7a4a7f6d2f53c0`
- file count: `30`

## Live Deployed Worker Smoke
- worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- command:
  - `set -a && source ~/secrets/arqonmonkeyos_science_keys.env && set +a`
  - `CODER_WORK_PLAN_TASKING_ID='FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--tasking-8811976228' CODER_WORK_PLAN_CODE_FLOW_ID='FLOW-2026-0036' node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_live_smoke.js`
- result: `BLOCKED`
- blocker:
  - `POST /v1/coder/work-plan` returns `404 NOT_FOUND` in deployed worker, indicating stale deployment does not yet include Coder Work Plan route.

### Redacted Live Transcript Excerpt
```text
no-auth Coder work plan denied: expected 401, got 404
error.code: NOT_FOUND
message: No route for POST /v1/coder/work-plan
```

## Proof Matrix
- no-auth Coder work plan denied: `BLOCKED_BY_STALE_DEPLOYMENT`
- all non-Coder roles denied: `PASS` (offline smoke)
- Coder work plan succeeds from audited PM tasking: `PASS` (offline smoke)
- `coder_work_plan` artifact created: `PASS` (offline smoke)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (offline smoke checks + source record assertions)
- duplicate Coder work plan is idempotent: `PASS` (offline smoke)
- changed Coder work plan payload conflicts: `PASS` (offline smoke)
- promotion language is denied: `PASS` (offline smoke)
- execution-authority language is denied: `PASS` (offline smoke)
- PM cannot write `coder_work_plan`: `PASS` (policy + offline deny matrix)
- Helper cannot write `coder_work_plan`: `PASS` (policy + offline deny matrix)
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
