# Science Monkeys v0.1 Share Source Artifact Boundary 001 Evidence

branch: `main`
commit before: `4fef6024d1ab6b06c22a21f60b4be24563bfe43a`
commit after: `7967806b8e7d7171d7a4901e3f6d4b44c2995ccd`
push status: PASS

## Files Created
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_SHARE_SOURCE_ARTIFACT_BOUNDARY_001_EVIDENCE.md`

## Files Updated
- `openapi/arqon_contextos.openapi.yaml`
- `worker/src/policy.ts`
- `worker/src/science_share.ts`
- `worker/test_support/science_monkeys_v01_share_live_smoke.ts`
- `worker/test_support/science_monkeys_v01_share_offline_smoke.ts`
- `worker/test_support/share_integration_strict_tripwire.py`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_SHARE_SOURCE_ARTIFACT_BOUNDARY_001.md`

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
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_role_auth_foundation_smoke.js` PASS
- `rg -n "SCIENCE_SHARE_SOURCE_ARTIFACTS_REQUIRED|requireSourceEvidenceCoverage|resolved_source_artifacts|governance/outbox/science_share/" worker/src worker/test_support docs openapi` PASS

## Strict Tripwire Result
- PASS
- The strict tripwire now scans `worker/src` and `openapi` only.
- It confirms auth-before-share dispatch, Human-only share handling, resolved source metadata preservation, and the narrowed outbox allowlist.

## Offline Adversarial Smoke Result
- PASS
- Empty `source_artifacts` denied with `SCIENCE_SHARE_SOURCE_ARTIFACTS_REQUIRED`.
- Semantically unrelated `source_artifacts` denied with `SCIENCE_SHARE_PRECONDITION_FAILED`.
- `SCIENCE_AUDITOR_AI` cannot create an official share packet.
- Non-Human `human_identity` spoof is denied.
- Human share succeeds only with the required evidence classes.
- Duplicate Human share is idempotent.
- Generic Flow Core `share_packet` remains blocked.

## Live Deployed Smoke Result
- PASS
- Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- Command: `bash -lc 'set -a; source ~/secrets/arqonmonkeyos_science_keys.env; set +a; WORKER_URL="https://arqon-contextos-broker.sonarum.workers.dev" node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_share_live_smoke.js'`
- Raw transcript: captured in the command output for this run; redacted Authorization values were not printed.

### Transcript Excerpt
- `1 no-auth share requires auth` -> `401 UNAUTHORIZED`
- `3 premature Human share denied` -> `409 SCIENCE_SHARE_PRECONDITION_FAILED`
- `11 empty source_artifacts denied` -> `400 SCIENCE_SHARE_SOURCE_ARTIFACTS_REQUIRED`
- `12 semantically unrelated source_artifacts denied` -> `409 SCIENCE_SHARE_PRECONDITION_FAILED`
- `13 Science Auditor cannot share` -> `403 SCIENCE_SHARE_HUMAN_REQUIRED`
- `14 Helper human_identity spoof cannot share` -> `403 SCIENCE_SHARE_HUMAN_REQUIRED`
- `15 Human share succeeds` -> `201`
- `16 duplicate Human share is idempotent` -> `200` with `idempotent_replay: true`
- `17 generic share_packet remains blocked` -> `403 SCIENCE_SHARE_ROUTE_REQUIRED`

## Proofs
- Auth-first share behavior: PASS
- Human-only share behavior: PASS
- Server-derived Human authority: PASS
- Empty `source_artifacts` denied: PASS
- Unrelated `source_artifacts` denied: PASS
- Required source evidence classes enforced: PASS
- Resolved source metadata preserved: PASS
- Outbox allowlist narrowed to `governance/outbox/science_share/`: PASS
- OpenAPI stale share naming cleaned: PASS
- Science Auditor cannot create `share_packet`: PASS
- Non-Human `human_identity` spoof denial: PASS
- Idempotency prevents duplicate PM context: PASS
- PM message written: PASS
- Generated PM context updated: PASS
- Recoverable outbox written and completed: PASS
- Generic `share_packet` remains blocked: PASS
- Broker-key uniqueness runtime guard: PASS

## Scope Checks
- Any Skill/Memory/Preference runtime added: NO
- Any `/share` redesign beyond the approved boundary patch: NO
- Any secrets exposed in reports or tracked files: NO

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
