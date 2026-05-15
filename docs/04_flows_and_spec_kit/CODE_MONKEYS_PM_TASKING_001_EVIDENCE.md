# Code Monkeys PM Tasking 001 Evidence

- branch: `main`
- commit before: `29d6afeea243fac28c74400585ceaab3482ebb3c`
- commit after: `48bcfd779ecda0df820ee321450b074a20588854`
- push status: `PASS`

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
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_tasking_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_plan_tripwire.py` PASS
- `python3 worker/test_support/pm_specify_strict_audit_tripwire.py .` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_tasking_audit_bundle.py` PASS
- `rg -n "handlePmTaskingRequest|PM_TASKING_ROLE_FORBIDDEN|PM_TASKING_IDEMPOTENCY_CONFLICT|PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN|generated_pm_tasking_context|pm_tasking|coder_work_plan|coder_tasks" worker/src worker/test_support docs openapi` PASS

## PM Tasking Audit Bundle
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_tasking_audit_bundle_64bdde8c3a7b.zip`
- zip SHA256: `79a5c45d11544c9a786824c99aa4a339b49774f8b8a5f96f4c867bb13a15332e`
- file count: `29`

## Live Deployed Worker Smoke
- command:
  - `set -a && source ~/secrets/arqonmonkeyos_science_keys.env && set +a`
  - `PM_TASKING_PLAN_ID='FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan-live-8811960177' PM_TASKING_CODE_FLOW_ID='FLOW-2026-0036' node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_tasking_live_smoke.js`
- result: `PASS`
- worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- flow IDs used:
  - `science_flow_id`: `FLOW-2026-0035`
  - `code_flow_id`: `FLOW-2026-0036`
  - `share_id`: `FLOW-2026-0035-share-8811894980`
  - `handoff_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980`
  - `intake_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980`
  - `specification_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980`
  - `plan_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan-live-8811960177`
  - `tasking_id`: `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--tasking-8811976228`

### Redacted Live Transcript Excerpt
```text
no-auth /v1/pm/tasking: 401 UNAUTHORIZED
PM tasking succeeds: 201
duplicate PM tasking idempotent: 200 (idempotent_replay=true)
changed payload conflicts: 409 PM_TASKING_IDEMPOTENCY_CONFLICT
promotion language denied: 409 PM_TASKING_FORBIDDEN_CLAIM_INCLUDED
implementation authority denied: 409 PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN
PM generic tasks denied: 403 ARTIFACT_ROLE_FORBIDDEN
Coder coder_tasks allowed: 201
```

## Proof Matrix
- no-auth PM tasking denied: `PASS` (live `401 UNAUTHORIZED`)
- all non-PM roles denied: `PASS` (live smoke denied-role matrix)
- PM tasking succeeds from audited PM plan: `PASS` (live `201`)
- `pm_tasking` artifact created: `PASS` (live response artifact type)
- PM cannot write generic `tasks`: `PASS` (live `403 ARTIFACT_ROLE_FORBIDDEN`)
- Coder can write `coder_tasks`: `PASS` (live `201`)
- forbidden claims, uncertainty, source chain, and share hash preserved: `PASS` (live source_plan preservation assertions)
- duplicate PM tasking is idempotent: `PASS` (live `200`, replay=true)
- changed PM tasking payload conflicts: `PASS` (live `409 PM_TASKING_IDEMPOTENCY_CONFLICT`)
- promotion language is denied: `PASS` (live `409 PM_TASKING_FORBIDDEN_CLAIM_INCLUDED`)
- implementation authority language is denied: `PASS` (live `409 PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN`)
- no Coder handoff / Helper execution generated: `PASS` (live smoke + stage scope)
- no Science behavior added: `PASS` (source review + route-level live checks)
- no secrets in report: `PASS`

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
