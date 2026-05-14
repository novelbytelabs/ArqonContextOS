# Code Monkeys PM Intake 001 Evidence

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Summary

This evidence records the PM intake boundary after adding the PM-side intake route and hardening the flow-resolution path so a freshly created code flow can be resolved by manifest fallback during the same invocation.

## Branch And Commits

- branch: `main`
- commit before: `ae3bd10a6762156b837d0ef0dfa27d5f2e4329f6`
- source commit after: `433faee624163e50f009acea133426ef3146875d`
- evidence commit after: `pending`
- push status: PASS

## Files Created

- [worker/src/pm_intake.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/pm_intake.ts)
- [worker/test_support/code_monkeys_pm_intake_live_smoke.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/test_support/code_monkeys_pm_intake_live_smoke.ts)
- [worker/test_support/code_monkeys_pm_intake_offline_smoke.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/test_support/code_monkeys_pm_intake_offline_smoke.ts)
- [worker/test_support/code_monkeys_pm_intake_policy_unit.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/test_support/code_monkeys_pm_intake_policy_unit.ts)
- [worker/test_support/code_monkeys_pm_intake_tripwire.py](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/test_support/code_monkeys_pm_intake_tripwire.py)
- [docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_INTAKE_001.md](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_INTAKE_001.md)

## Files Updated

- [openapi/arqon_contextos.openapi.yaml](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/openapi/arqon_contextos.openapi.yaml)
- [worker/src/index.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/index.ts)
- [worker/src/flows.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/flows.ts)

## Validation Commands

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_intake_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_offline_smoke.js` PASS
- `python3 worker/test_support/science_to_code_handoff_tripwire.py` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_share_integration_audit_bundle.py` PASS
- `rg -n "handlePmIntakeRequest|PM_INTAKE_ROLE_FORBIDDEN|PM_INTAKE_IDEMPOTENCY_CONFLICT|generated_pm_intake_context|pm_gate_definition" worker/src worker/test_support docs openapi` PASS

## Live Smoke

- command: `bash -lc 'set -a; source ~/secrets/arqonmonkeyos_science_keys.env; set +a; WORKER_URL="https://arqon-contextos-broker.sonarum.workers.dev" node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_live_smoke.js'`
- result: PASS
- deployed worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`

## Live Transcript Excerpt

The live transcript is redacted. Key outcomes:

- no-auth PM intake denied with `401 UNAUTHORIZED`
- all non-PM roles denied with `PM_INTAKE_ROLE_FORBIDDEN`
- PM intake succeeded from audited handoff
- forbidden claims preserved
- uncertainty and share hash preserved
- code_flow received `pm_dossier` and `pm_gate_definition`
- no specification, plan, tasks, Coder handoff, or Helper execution artifacts were created
- duplicate PM intake replayed idempotently
- changed PM intake payload returned `409 PM_INTAKE_IDEMPOTENCY_CONFLICT`

Sample redacted fields:

```json
{
  "authorization": "Bearer REDACTED",
  "science_flow_id": "FLOW-2026-0025",
  "handoff_id": "FLOW-2026-0025-share-8795522202-handoff-8795522202",
  "code_flow_id": "FLOW-2026-0026",
  "intake_id": "FLOW-2026-0025-share-8795522202-handoff-8795522202-intake-8795522202"
}
```

## Proofs

- no new Science behavior: PASS
- PM-only authority: PASS
- non-laundering preservation: PASS
- idempotency conflict: PASS
- no Skill/Memory/Preference runtime added: PASS

## Required Status Labels

- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
