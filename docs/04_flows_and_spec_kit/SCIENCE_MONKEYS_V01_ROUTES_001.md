# Science Monkeys v0.1 Routes 001

## Status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Summary

Science Monkeys v0.1 Routes 001 adds dedicated `/v1/science/*` command routes as wrappers over Flow Core and preserves the later `/v1/science/share` integration boundary.

- Branch: `main`
- Commit before: `800e4715ccd98a6624525d23a0f83a1ef2353425`
- Commit after: pending final commit in this task
- Push status: pending

## Files created

- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_ROUTES_001.md`
- `docs/08_research_personalization/NANORESEARCH_INSPIRED_SKILL_MEMORY_PREFERENCE_ROADMAP.md`
- `worker/src/science.ts`
- `worker/test_support/science_monkeys_v01_routes_live_smoke.ts`
- `worker/test_support/science_monkeys_v01_routes_policy_unit.ts`
- `worker/test_support/science_monkeys_v01_routes_tripwire.py`

## Files updated

- [docs/00_active_state/ROADMAP.md](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/docs/00_active_state/ROADMAP.md)
- [docs/03_commands_and_runbooks/GPT_COMMANDS.md](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/docs/03_commands_and_runbooks/GPT_COMMANDS.md)
- [openapi/arqon_contextos.openapi.yaml](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/openapi/arqon_contextos.openapi.yaml)
- [worker/src/auth.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/auth.ts)
- [worker/src/flow_policy.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/flow_policy.ts)
- [worker/src/flows.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/flows.ts)
- [worker/src/index.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/index.ts)

## Validation

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_policy_unit.js` PASS
- `python3 worker/test_support/science_monkeys_v01_routes_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/flow_core_v03_offline_smoke.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/flow_core_v03_policy_smoke.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_role_auth_foundation_smoke.js` PASS
- `grep -R "handleScienceRequest\|SCIENCE_COMMANDS\|SCIENCE_SHARE_NOT_IMPLEMENTED\|FLOW_CREATE_ROLE_FORBIDDEN\|validateBrokerKeyUniqueness" -n worker/src worker/test_support` PASS
- `git diff --stat` PASS
- `git diff -- worker/src worker/test_support openapi docs` PASS
- `git status --short` PASS

## Local Test Results

- Unit/policy test result: PASS
- Tripwire result: PASS
- Flow Core regression result: PASS
- Role/Auth Foundation regression result: PASS

## Live Smoke

- Live deployed Worker smoke result: BLOCKED
- Deployed worker response on `/v1/science/research`: `404 NOT_FOUND`
- Transcript excerpt:

```text
Error: 2 research creates science_flow and research_dossier: expected status 201, got 404: {
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No route for POST /v1/science/research"
  }
}
```

The local route layer is implemented and validated, but the deployed worker at `https://arqon-contextos-broker.sonarum.workers.dev` has not yet been updated to this Routes 001 build.

## Proofs

- PM_AI route denial: PROVEN
- HELPER_AI execution route denial: PROVEN
- SCIENCE_EXECUTOR_AI execute route allowed: PROVEN
- SCIENCE_AUDITOR_AI audit route allowed: PROVEN
- SCIENCE_AUDITOR_AI share_packet remains denied through generic route: PROVEN
- `/v1/science/share` remains not implemented: PROVEN
- code_flow compatibility: PROVEN
- v0.2 route compatibility: PROVEN

## Broker key uniqueness

- `BROKER_KEY_PM`
- `BROKER_KEY_CODER`
- `BROKER_KEY_AUDITOR`
- `BROKER_KEY_HELPER`
- `BROKER_KEY_EXPLORER`
- `BROKER_KEY_HYPOTHESIZER`
- `BROKER_KEY_DESIGNER`
- `BROKER_KEY_SCIENCE_AUDITOR`
- `BROKER_KEY_SCIENCE_EXECUTOR`
- `BROKER_KEY_HUMAN`

Result: PASS

## Scope checks

- `/share` implementation added: NO
- Skill/Memory/Preference runtime added: NO
- Secrets present in report: NO

## Notes

- Routes 001 adds the science command layer only.
- Share remains reserved for the later Share Integration slice.
- The deployed worker must be updated separately for live route smoke to pass.

