# Code Monkeys PM Plan 001 Evidence

- branch: `main`
- commit before: `5192790a051483f298de04dac2b1c8f5885c57ac`
- commit after: `a1863869bf745d01edb0330641b5170d82e867f3`
- push status: PASS

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_PLAN_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_PLAN_001_EVIDENCE.md`
- `worker/src/pm_plan.ts`
- `worker/test_support/code_monkeys_pm_plan_policy_unit.ts`
- `worker/test_support/code_monkeys_pm_plan_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_plan_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_plan_tripwire.py`
- `worker/test_support/build_pm_plan_audit_bundle.py`

## Files Updated
- `openapi/arqon_contextos.openapi.yaml`
- `worker/src/index.ts`
- `worker/test_support/science_to_code_handoff_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_plan_offline_smoke.ts`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_plan_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_specify_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_specify_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_specify_tripwire.py` PASS
- `python3 worker/test_support/pm_specify_strict_audit_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_plan_audit_bundle.py` PASS
- `rg -n "handlePmPlanRequest|PM_PLAN_ROLE_FORBIDDEN|PM_PLAN_IDEMPOTENCY_CONFLICT|generated_pm_plan_context|PM_PLAN_FORBIDDEN_CLAIM_INCLUDED" worker/src worker/test_support docs openapi` PASS

## Audit Bundle Builder
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_plan_audit_bundle_a1863869bf74.zip`
- zip SHA256: `dbe66e0f26612680af5f6c64508421f90de1e3fa09b51460538704278ea22810`
- file count: `11`
- bundle includes the PM plan source, smoke tests, audit bundle builder, and the PM plan spec doc required for independent replay.

## Live Smoke Result
- live PM specification id reused: `FLOW-2026-0033-share-8806579957-handoff-8806579957-intake-8806579957-spec-8806579957`
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_plan_live_smoke.js` PASS
- live PM plan transcript captured at: `tmp/pm_plan_live_transcript_clean.json`

### Redacted Live Transcript Excerpt
```text
create -> 201
replay -> 200
conflict -> 409 PM_PLAN_IDEMPOTENCY_CONFLICT
promotion_guard -> 409 PM_PLAN_FORBIDDEN_CLAIM_INCLUDED
```

## Proofs
- no-auth PM plan denied: PASS
- PM plan succeeds from audited PM specification: PASS
- plan artifact created: PASS
- duplicate PM plan is idempotent: PASS
- changed PM plan payload conflicts: PASS
- promotion language is denied: PASS
- no tasks/Coder handoff/Helper execution generated: PASS
- no Science behavior added: PASS
- no secrets in report: PASS

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
