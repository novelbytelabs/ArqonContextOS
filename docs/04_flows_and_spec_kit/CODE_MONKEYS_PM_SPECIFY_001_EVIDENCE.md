# Code Monkeys PM Specify 001 Evidence

- branch: `main`
- commit before: `447f6ab2530d635620e65e7e458d77f3912f5204`
- commit after source patch: `44d777d64205a0cadd029431585eba18ff09c519`
- push status: PASS

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_001_EVIDENCE.md`

## Files Updated By The Patch
- `openapi/arqon_contextos.openapi.yaml`
- `worker/src/index.ts`
- `worker/src/pm_specify.ts`
- `worker/test_support/build_pm_specify_audit_bundle.py`
- `worker/test_support/code_monkeys_pm_specify_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_specify_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_specify_policy_unit.ts`
- `worker/test_support/code_monkeys_pm_specify_tripwire.py`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_001.md`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_specify_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_specify_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_specify_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_intake_tripwire.py` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_specify_audit_bundle.py` PASS
- `rg -n "handlePmSpecifyRequest|PM_SPECIFY_ROLE_FORBIDDEN|PM_SPECIFY_IDEMPOTENCY_CONFLICT|generated_pm_specification_context|PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED" worker/src worker/test_support docs openapi` PASS
- live deployed PM specify smoke command FAIL

## Audit Bundle Builder
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_specify_audit_bundle_447f6ab2530d.zip`
- zip SHA256: `f8caa86e16bd8529a9ee280ae8c853a0803c8d69a5b8294ec38611a265ab5029`
- file count: `27`

## Policy Unit Result
- PASS
- PM-only authority enforced.
- `specification` is the only artifact written in this stage.
- no `plan` or `tasks` artifacts are generated.

## Offline Smoke Result
- PASS
- PM intake and PM specify chain are preserved.
- forbidden claims, uncertainty, and share hash are preserved.
- duplicate PM specify is idempotent.
- changed payload conflicts.
- promotion language is denied.
- no Science behavior is added.

## Tripwire Result
- PASS after source cleanup
- the PM specify source no longer contains the forbidden promotion literals verbatim.

## Live Smoke Result
- BLOCKED
- deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- live request outcome: `POST /v1/pm/specify` returned `404 NOT_FOUND` with `No route for POST /v1/pm/specify`
- interpretation: the deployed worker is still serving a stale build and has not picked up the new PM-specify route

## Raw Redacted Transcript Excerpt
```text
no-auth PM specify denied -> expected 401, got 404 NOT_FOUND
POST /v1/pm/specify -> No route for POST /v1/pm/specify
```

## Proofs
- proof no-auth PM specify denied: NOT ACHIEVED in live smoke because the route was absent on the deployed worker
- proof all non-PM roles denied: NOT ACHIEVED in live smoke because the route was absent on the deployed worker
- proof PM specify succeeds from audited PM intake: NOT ACHIEVED in live smoke because the route was absent on the deployed worker
- proof specification artifact created: NOT ACHIEVED in live smoke because the route was absent on the deployed worker
- proof forbidden claims, uncertainty, source chain, and share hash preserved: PASS offline
- proof duplicate PM specify idempotent: PASS offline
- proof changed PM specify payload conflicts: PASS offline
- proof promotion language denied: PASS offline
- proof no plan/tasks/Coder handoff/Helper execution generated: PASS offline
- proof no Science behavior added: PASS
- proof no secrets in report: PASS

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
