# Science to Code Handoff 001 Evidence

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Summary

This evidence records the Science to Code handoff boundary after the runtime hardening fix that cached the GitHub installation token for the deployed worker. The runtime behavior now passes the full live handoff smoke against the deployed worker.

## Branch And Commits

- branch: `main`
- commit before: `4d420b9bde824a01cfbbd5870d67e4173d0ef54c`
- source fix commit after: `eb6e483dd548384ba79e5fc858ead0f1c219cdbc`
- evidence commit after: `pending`
- push status: PASS

## Files Updated

- [worker/src/github_app.ts](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/worker/src/github_app.ts)
- [docs/04_flows_and_spec_kit/SCIENCE_TO_CODE_HANDOFF_001_EVIDENCE.md](/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/docs/04_flows_and_spec_kit/SCIENCE_TO_CODE_HANDOFF_001_EVIDENCE.md)

## Validation Commands

- `cd worker && npm run typecheck` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_offline_smoke.js` PASS
- `python3 worker/test_support/science_to_code_handoff_tripwire.py` PASS

## Live Smoke

- command: `bash -lc 'set -a; source ~/secrets/arqonmonkeyos_science_keys.env; set +a; WORKER_URL="https://arqon-contextos-broker.sonarum.workers.dev" node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_to_code_handoff_live_smoke.js'`
- result: PASS
- deployed worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`

## Transcript Excerpt

The live smoke transcript is redacted and safe to share. Key outcomes:

- no-auth handoff denied with `401 UNAUTHORIZED`
- science flow created successfully as `FLOW-2026-0021`
- Human-approved share created successfully as `FLOW-2026-0021-share-8792928006`
- PM handoff succeeded as `FLOW-2026-0021-share-8792928006-handoff-8792928006`
- duplicate PM handoff replay returned `200` with `idempotent_replay: true`
- changed PM handoff payload returned `409 PM_HANDOFF_IDEMPOTENCY_CONFLICT`

Sample redacted transcript fields:

```json
{
  "authorization": "Bearer REDACTED",
  "share_id": "FLOW-2026-0021-share-8792928006",
  "handoff_id": "FLOW-2026-0021-share-8792928006-handoff-8792928006",
  "code_flow_id": "FLOW-2026-0022"
}
```

## Proofs

- no new Science behavior: PASS
- PM-only authority: PASS
- non-laundering preservation: PASS
- idempotency conflict: PASS
- no Skill/Memory/Preference runtime added: PASS

## Notes

- The live failure mode was a Cloudflare subrequest budget issue caused by repeated GitHub installation token fetches within one worker invocation.
- The deployed fix caches the GitHub installation token for the invocation window and does not weaken role gates or add new product behavior.

## Required Status Labels

- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
