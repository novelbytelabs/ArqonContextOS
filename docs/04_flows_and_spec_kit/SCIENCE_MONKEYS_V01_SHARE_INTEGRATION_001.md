# Science Monkeys v0.1 Share Integration 001

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Summary

- branch: `main`
- commit before: `814a13d2715001778d1ef5429be5a7e025911add`
- commit after: `8e7dad2416de5fddc7b843d858287fbb3d00e2ea`
- push status: PASS

## Files Created

- `worker/src/science_share.ts`
- `worker/test_support/science_monkeys_v01_share_live_smoke.ts`
- `worker/test_support/science_monkeys_v01_share_offline_smoke.ts`
- `worker/test_support/science_monkeys_v01_share_policy_unit.ts`
- `worker/test_support/science_monkeys_v01_share_tripwire.py`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_SHARE_INTEGRATION_001.md`

## Files Updated

- `docs/00_active_state/ROADMAP.md`
- `openapi/arqon_contextos.openapi.yaml`
- `worker/src/index.ts`
- `worker/src/policy.ts`
- `worker/src/science.ts`
- `worker/test_support/science_monkeys_v01_routes_live_smoke.ts`
- `worker/test_support/science_monkeys_v01_routes_policy_unit.ts`

## Validation Commands

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_share_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_share_offline_smoke.js` PASS
- `python3 worker/test_support/science_monkeys_v01_share_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_role_auth_foundation_smoke.js` PASS
- `grep -R "handleScienceShare\|SCIENCE_SHARE_HUMAN_REQUIRED\|server_authenticated_human\|idempotent_replay\|governance/outbox/science_share\|generated_pm_share_context" -n worker/src worker/test_support` PASS
- live deployed smoke command PASS

## Test Results

- share policy unit test result: PASS
- offline share smoke result: PASS
- tripwire result: PASS
- regression test results: PASS
  - Routes policy regression
  - Role/Auth Foundation regression

## Live Deployed Worker Smoke

- worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- result: PASS
- runtime broker key uniqueness: PASS
  - `missing: []`
  - `duplicate_groups: []`
- science flow id: `FLOW-2026-0013`
- science flow name: `share-v01-live-8787729205`
- share id: `FLOW-2026-0013-share-8787729205`
- share packet hash: `c65c95969d5d56a3b2ddf240672f85bbe300782c9c5f8c7794595a27813f1f4f`

## Redacted Transcript Excerpt

Representative excerpt from the committed live smoke client:

- `POST /v1/science/share` without auth -> `401 UNAUTHORIZED`
- `POST /v1/science/share` as `HUMAN` before audit/share prerequisites -> `409 SCIENCE_SHARE_PRECONDITION_FAILED`
- `POST /v1/science/research` as `EXPLORER_AI` -> `201`
- `POST /v1/science/iterate` as `DESIGNER_AI` with `revised_experiment_protocol` -> `201`
- `POST /v1/science/record-finding` as `SCIENCE_AUDITOR_AI` with `inconclusive_finding_record` -> `201`
- `POST /v1/science/share` as `SCIENCE_AUDITOR_AI` -> `403 SCIENCE_SHARE_HUMAN_REQUIRED`
- `POST /v1/science/share` as `HELPER_AI` with body `human_identity` -> `403 SCIENCE_SHARE_HUMAN_REQUIRED`
- `POST /v1/science/share` as `HUMAN` -> `201`
- duplicate `POST /v1/science/share` as `HUMAN` -> `200` with `idempotent_replay: true`
- generic `POST /v1/flows/FLOW-2026-0013/artifacts` with `share_packet` -> `403 SCIENCE_SHARE_ROUTE_REQUIRED`

## Proofs

- proof auth-first share behavior: `401 UNAUTHORIZED` on no-auth `/v1/science/share`
- proof Human-only share behavior: non-HUMAN roles received `403 SCIENCE_SHARE_HUMAN_REQUIRED`
- proof server-derived Human authority: response recorded `human_authority: "server_authenticated_human"`
- proof Science Auditor cannot create share_packet: `SCIENCE_AUDITOR_AI` share attempt denied with `403`
- proof non-HUMAN human_identity spoof denial: `HELPER_AI` with body `human_identity` denied with `403`
- proof idempotency prevents duplicate PM context: second Human share returned `200` with `idempotent_replay: true`
- proof PM message written: `pm_message_path = governance/messages/PM_AI/inbox/MSG-SHARE-FLOW-2026-0013-share-8787729205.md`
- proof generated PM context updated: `pm_context_path = governance/context/pm_share_context/FLOW-2026-0013-share-8787729205.json`
- proof recoverable outbox written/completed: `outbox_path = governance/outbox/science_share/FLOW-2026-0013/FLOW-2026-0013-share-8787729205.json`
- proof generic share_packet remains blocked: generic Flow Core write returned `403 SCIENCE_SHARE_ROUTE_REQUIRED`
- proof broker-key uniqueness runtime guard: `missing: []`, `duplicate_groups: []`
- proof DESIGNER_AI iterate branch covered: live `/v1/science/iterate` write succeeded with `revised_experiment_protocol`
- proof alternate finding-record variant covered: live `/v1/science/record-finding` write succeeded with `inconclusive_finding_record`

## Runtime Scope

- Skill/Memory/Preference runtime added: NO
- any source beyond share integration/test-support/runtime guard changed: NO

## Micro-Edits Made

Execution-blocking micro-edits were required:

- test-only: added module scoping and stricter type narrowing in the smoke scripts so `tsconfig.smoke.json` can compile all `test_support` files together
- regression test-only: updated the old Routes 001 policy unit so it asserts Human-owned share behavior instead of the obsolete reserved-share invariant
- runtime: added `governance/outbox/` to broker write allowlist in `worker/src/policy.ts` after live smoke proved Human share could not complete outbox persistence

## Notes

- The first deployed live smoke after source push exposed a real runtime defect:
  - `500 INTERNAL_ERROR`
  - `Write path is not allowlisted: governance/outbox/science_share/...`
- That defect was fixed by the bounded allowlist update in `worker/src/policy.ts`.
- A subsequent deploy window produced a transient stale-worker result during rerun; final live smoke passed after the deployed worker caught up to `main`.

