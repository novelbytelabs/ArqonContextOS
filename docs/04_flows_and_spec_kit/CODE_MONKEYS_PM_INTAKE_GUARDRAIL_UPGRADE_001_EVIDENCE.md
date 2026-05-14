# Code Monkeys PM Intake Guardrail Upgrade 001 Evidence

- branch: `main`
- commit before: `0231211243e3929354c79eab2425ec833b097f06`
- commit after source patch: `f0ccf77bfb2ece42e91fd6d205839dc856f43db3`
- evidence commit: `pending at report creation time`
- push status: PASS

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_INTAKE_GUARDRAIL_UPGRADE_001_EVIDENCE.md`

## Files Updated By The Guardrail Patch
- `worker/src/pm_intake.ts`
- `worker/test_support/code_monkeys_pm_intake_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_intake_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_intake_tripwire.py`
- `worker/test_support/build_pm_intake_audit_bundle.py`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_INTAKE_GUARDRAIL_UPGRADE_001.md`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_intake_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_offline_smoke.js` PASS
- `python3 worker/test_support/science_to_code_handoff_tripwire.py` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_intake_audit_bundle.py` PASS
- `rg -n "validateExpectedHandoffArtifact|PM_INTAKE_HANDOFF_ARTIFACT_TYPE_MISMATCH|PM_INTAKE_HANDOFF_ARTIFACT_SOURCE_MISMATCH|pm-intake-type-tamper-0001|build_pm_intake_audit_bundle" worker/src worker/test_support docs openapi` PASS
- live deployed PM intake smoke command PASS

## Audit Bundle Builder
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_intake_audit_bundle_0231211243e3.zip`
- zip SHA256: `f2280f8bbbb4c8a8f741d5a7a01e422cafb3d2488c99848edd0e41cf23f47d48`
- file count: `41`

## Strict Tripwire Result
- PASS
- coverage added for:
  - `validateExpectedHandoffArtifact`
  - `PM_INTAKE_HANDOFF_ARTIFACT_TYPE_MISMATCH`
  - `PM_INTAKE_HANDOFF_ARTIFACT_SOURCE_MISMATCH`
  - `pm-intake-type-tamper-0001`
  - `pm-intake-source-tamper-0001`

## Offline Smoke Result
- PASS
- the offline harness now rejects handoff artifact type tampering and source-path tampering in addition to the original PM-only and idempotency checks.

## Live Smoke Result
- PASS
- deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- proof artifact type / role / source-path validation:
  - `pm_dossier.role === "PM_AI"`
  - `pm_gate_definition.role === "PM_AI"`
  - the handoff validation uses artifact type, role, and source path, not artifact ID alone

### Redacted Live Transcript Excerpt
```text
no-auth PM intake denied -> 401 UNAUTHORIZED
PM intake succeeds -> 201
duplicate PM intake idempotent -> 200
changed PM intake payload conflicts -> 409 PM_INTAKE_IDEMPOTENCY_CONFLICT
pm_dossier role -> PM_AI
pm_gate_definition role -> PM_AI
```

## Proofs
- proof artifact type / role / source-path validation: PASS
- proof no Science behavior added: PASS
- proof no specs/plans/tasks generated: PASS
- proof no Skill/Memory/Preference runtime: PASS
- proof idempotency conflict: PASS
- proof secrets absent from report: PASS

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`

