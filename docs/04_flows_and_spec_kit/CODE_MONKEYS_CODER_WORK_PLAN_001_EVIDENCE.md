# Code Monkeys Coder Work Plan 001 Evidence

- branch: `main`
- commit before: `f3c2295469e6e5bd52f2a954c36c625b9d327b77`
- commit after: `70b93ef0825941ed6005e7e0b50ab6f0ea236366`
- push status: `PASS`

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
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_work_plan_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_tripwire.py` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py` PASS
- `python3 worker/test_support/build_coder_work_plan_audit_bundle.py` PASS
- `rg -n "handleCoderWorkPlanRequest|CODER_WORK_PLAN_ROLE_FORBIDDEN|CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT|CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN|generated_coder_work_plan_context|coder_work_plan" worker/src worker/test_support docs openapi` PASS

## Coder Work Plan Audit Bundle
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/coder_work_plan_audit_bundle_70b93ef08259.zip`
- bundle SHA256: `6f05a84716580d8528f3c40cd84a0e7188b08ae02acac90b26ab3d8790e89465`
- file count: `30`

## Live Deployed Worker Smoke
- worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- redeploy status: `LIVE_ROUTE_PRESENT_AND_SERVING` (no stale `404`)
- command:
  - `set -a && source ~/secrets/arqonmonkeyos_science_keys.env && set +a`
  - `CODER_WORK_PLAN_TASKING_ID='FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--tasking-8811976228' CODER_WORK_PLAN_CODE_FLOW_ID='FLOW-2026-0036' node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_work_plan_live_smoke.js`
- result: `PASS`
- ids used:
  - `tasking_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--tasking-8811976228`
  - `code_flow_id`: `FLOW-2026-0036`
  - `coder_work_plan_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--coder-work-plan-8813568942`

### Redacted Live Transcript Excerpt
```text
no-auth Coder work plan denied: 401 UNAUTHORIZED
all non-Coder roles denied: 403 CODER_WORK_PLAN_ROLE_FORBIDDEN
Coder work plan succeeds: 201 (artifact_type=coder_work_plan)
duplicate replay: 200 idempotent_replay=true
changed payload conflict: 409 CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT
promotion denied: 409 CODER_WORK_PLAN_FORBIDDEN_CLAIM_INCLUDED
execution-authority denied: 409 CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN
PM coder_work_plan denied: 403 ARTIFACT_ROLE_FORBIDDEN
Helper coder_work_plan denied: 403 ARTIFACT_ROLE_FORBIDDEN
```

## Proof Matrix
- no-auth Coder work plan denied: `PASS` (live smoke)
- all non-Coder roles denied: `PASS` (live smoke)
- Coder work plan succeeds from audited PM tasking: `PASS` (live smoke)
- `coder_work_plan` artifact created: `PASS` (live smoke)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (live smoke assertions)
- duplicate Coder work plan is idempotent: `PASS` (live smoke)
- changed Coder work plan payload conflicts: `PASS` (live smoke)
- promotion language is denied: `PASS` (live smoke)
- execution-authority language is denied: `PASS` (live smoke)
- PM cannot write `coder_work_plan`: `PASS` (live smoke)
- Helper cannot write `coder_work_plan`: `PASS` (live smoke)
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
