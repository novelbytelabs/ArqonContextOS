# Science Monkeys v0.1 Quick Guardrail Upgrade 001 Evidence

branch: `main`
commit before: `530fcc36c9074d071826d309b744d06422914fd0`
commit after: `7eb8a5016d3972ef74c1129fc3002d3ffe337827`
push status: PASS

## Files Created
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_QUICK_GUARDRAIL_UPGRADE_001.md`
- `worker/test_support/build_share_integration_audit_bundle.py`

## Files Updated
- `worker/src/science_share.ts`
- `worker/test_support/science_monkeys_v01_share_live_smoke.ts`
- `worker/test_support/science_monkeys_v01_share_offline_smoke.ts`
- `worker/test_support/share_integration_strict_tripwire.py`

## Validation
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
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_share_integration_audit_bundle.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_role_auth_foundation_smoke.js` PASS
- `rg -n "SCIENCE_SHARE_IDEMPOTENCY_CONFLICT|submitted_payload_hash|build_share_integration_audit_bundle|same idempotency key with changed payload" worker/src worker/test_support docs` PASS

## Strict Tripwire Result
- PASS
- The strict tripwire confirms auth-first share handling, Human-only share, idempotency conflict detection, and the audit bundle dependency set.

## Audit Bundle Builder Result
- PASS
- Bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/share_integration_audit_bundle_7eb8a5016d39.zip`
- Zip SHA256: `d6fda17ef371f1bd1365c3caa64807d7c1236bbd01e05a9ec25ee29d4be82644`
- File count: `24`

## Offline Idempotency Conflict Test Result
- PASS
- Same idempotency key with changed payload returns `409 SCIENCE_SHARE_IDEMPOTENCY_CONFLICT`.
- Offline share smoke also confirms the share packet, PM context, and recoverable outbox path still behave as expected.

## Live Idempotency Conflict Test Result
- PASS
- Deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- Command:
  - `bash -lc 'set -a; source ~/secrets/arqonmonkeyos_science_keys.env; set +a; WORKER_URL="https://arqon-contextos-broker.sonarum.workers.dev" node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_share_live_smoke.js'`

### Redacted Transcript Excerpt
- `15 Human share succeeds` -> `201`
- `16 duplicate Human share is idempotent` -> `200`
- `17 same idempotency key with changed payload denied` -> `409 SCIENCE_SHARE_IDEMPOTENCY_CONFLICT`
- `18 generic share_packet remains blocked` -> `403 SCIENCE_SHARE_ROUTE_REQUIRED`

## Proofs
- Same idempotency key with changed payload returns 409: PASS
- Shared record preserves `submitted_payload_hash`: PASS
- Audit bundle produces zip + manifest for independent replay: PASS
- Secrets absent from reports: PASS
- No Skill/Memory/Preference runtime added: PASS

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
