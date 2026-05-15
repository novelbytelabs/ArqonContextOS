# Science Monkeys v0.1 Role/Auth Foundation 001

## Status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Execution summary

- Branch: `main`
- Commit before: `cdae35feec892fee4eb09d21ee3166f092ef6ceb`
- Commit after: pending commit in this task
- Push status: pending push in this task

## Files created

- `worker/test_support/science_monkeys_v01_role_auth_foundation_smoke.ts`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_ROLE_AUTH_FOUNDATION_001.md`

## Files updated

- `worker/src/auth.ts`
- `worker/src/flow_policy.ts`
- `worker/src/flows.ts`
- `worker/src/policy.ts`
- `worker/src/projects.ts`
- `worker/src/types.ts`
- `worker/test_support/flow_core_v03_offline_smoke.ts`
- `worker/test_support/flow_core_v03_policy_smoke.ts`

## Validation commands

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/flow_core_v03_offline_smoke.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/flow_core_v03_policy_smoke.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/science_monkeys_v01_role_auth_foundation_smoke.js` PASS
- `grep -R "EXPLORER_AI|HYPOTHESIZER_AI|DESIGNER_AI|SCIENCE_AUDITOR_AI|SCIENCE_EXECUTOR_AI|ARTIFACT_ROLE_FORBIDDEN|SCIENCE_SHARE_ROUTE_REQUIRED" -n worker/src worker/test_support` PASS
- `git diff --stat` PASS
- `git diff -- worker/src worker/test_support docs/04_flows_and_spec_kit` PASS
- `git status --short` PASS

## Smoke results

- Offline Flow Core smoke: PASS
- Offline Flow Core policy smoke: PASS
- Science role/auth foundation smoke: PASS

## Required policy proofs

- PM_AI cannot write Science Monkey artifacts: PASS (`research_dossier` and `hypothesis_card` denied)
- HELPER_AI cannot write `science_flow` `execution_report`: PASS (denied)
- HELPER_CODEX denied by policy oracle for `science_flow` `execution_report`: PASS
- SCIENCE_EXECUTOR_AI can write `science_flow` `execution_report`: PASS
- SCIENCE_AUDITOR_AI can write `share_recommendation` but not `share_packet`: PASS
- Generic `science_flow` `share_packet` blocked pending `/v1/science/share`: PASS (`SCIENCE_SHARE_ROUTE_REQUIRED`)

## Micro-edits made

- `worker/test_support/science_monkeys_v01_role_auth_foundation_smoke.ts`
  - Adjusted callback body form in `record(...)` helper so it returns `void` (TypeScript `TS2322` fix).
  - No policy/auth logic changes.

## Scope check

- Source behavior changed outside role/auth foundation: NO

