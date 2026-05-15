# Code Monkeys Coder Implementation Bundle Route-Only Remediation 001 Evidence

- branch: `main`
- commit before: `e34264afa3fa794697bcd6e3b68b1c01bf8bf787`
- source commit: `1ea4289123eda66bc6eab0f1cd7b3cd2e41d5543`
- evidence commit / current HEAD: `1ea4289123eda66bc6eab0f1cd7b3cd2e41d5543`
- push status: `PASS`
- required status:
  - `REQUIRES_HUMAN_REVIEW`
  - `development diagnostic only`
  - `NOT SEALED-TEST CERTIFIED`
  - `not promotable`

## Scope Confirmation

- Preserved forensic manual diff: `temps/helper_manual_impl_bundle_route_only_attempt.diff`
- This change set is limited to PM bundle remediation + bounded mismatch repair.
- No Coder handoff added.
- No Helper execution added.
- No Science behavior added.

## Source Changes

- `worker/src/flows.ts`
  - blocks generic code-flow artifact writes for `implementation_bundle` with:
  - `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- `worker/src/coder_implementation_bundle.ts`
  - enforces dual-field context matching (`coder_tasks_id` + `coder_tasks_record_path`)
  - returns context mismatch conflict when both are supplied and do not resolve together
  - validates upstream `coder_tasks` `source_sha`
  - rejects malformed existing idempotency record
  - uses route-scoped internal flow artifact writer path
- `openapi/arqon_contextos.openapi.yaml`
  - route-only remediation documentation updates
- Added remediation test/support files:
  - `worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.ts`
  - `worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py`
  - `worker/test_support/build_coder_implementation_bundle_route_only_remediation_audit_bundle.py`
  - `docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_ROUTE_ONLY_REMEDIATION_001.md`

## Actual Mismatch Response Before Repair

```text
mismatch_response {"status":409,"body":{"ok":false,"error":{"code":"CODER_IMPLEMENTATION_BUNDLE_TASKS_CONTEXT_MISMATCH","message":"Coder tasks context fields conflict: coder_tasks_id and coder_tasks_record_path do not resolve to the same generated context entry"}}}
```

## Validation Table

- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_tripwire.py` PASS
- `python3 worker/test_support/build_coder_implementation_bundle_route_only_remediation_audit_bundle.py` PASS
- `python3 worker/test_support/build_coder_implementation_bundle_audit_bundle.py` PASS

## Route-Only Bypass Proof Expectation (Live)

- Raw generic `CODER_AI` write of `implementation_bundle` via `/v1/flows/{code_flow}/artifacts` returns:
  - `403 FLOW_ARTIFACT_ROUTE_REQUIRED`
- `/v1/coder/implementation-bundle` still succeeds from audited `coder_tasks`.
- Mismatch id/path fails closed.
- Source sha mismatch fails closed (if supported by live harness).
- Malformed existing idempotency record fails closed (if supported by live harness).
- Changed payload conflict still returns `CODER_IMPLEMENTATION_BUNDLE_IDEMPOTENCY_CONFLICT`.
- Promotion denial still returns `CODER_IMPLEMENTATION_BUNDLE_FORBIDDEN_CLAIM_INCLUDED`.
- Execution-authority denial still returns `CODER_IMPLEMENTATION_BUNDLE_EXECUTION_AUTHORITY_FORBIDDEN`.
- PM/Helper raw writes remain denied.

## Audit Bundles (Rebuilt)

- remediation bundle:
  - path: `temps/coder_impl_bundle_route_only_remediation_audit_bundle_1ea4289123ed.zip`
  - sha256: `90ee6cc5e0a7ac8c0a1cdc352bbbb5dc3c484be4c57f5ee97886ecef53ae023d`
- implementation bundle audit:
  - path: `temps/coder_implementation_bundle_audit_bundle_1ea4289123ed.zip`
  - sha256: `27c55387d3cb4df9cec02d62ee84c7e28858d8f6a1f55f9d8dc88b7cf3f0b9a1`

## Live Verification

- deployed worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- redeploy/update status: `PASS (main push + live route behavior observed)`
- live smoke command: `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_live_smoke.js`
- live smoke transcript: `tmp/coder_implementation_bundle_route_only_live_smoke.json`
- additional live probe transcript: `tmp/coder_implementation_bundle_route_only_live_extra.json`
- live proof summary:
  - raw generic CODER write `implementation_bundle`: `403 FLOW_ARTIFACT_ROUTE_REQUIRED` PASS
  - `/v1/coder/implementation-bundle` success from audited `coder_tasks`: PASS
  - mismatch id/path fails closed: `409 CODER_IMPLEMENTATION_BUNDLE_TASKS_CONTEXT_MISMATCH` PASS
  - source sha mismatch fails closed: covered in remediation offline smoke PASS
  - malformed existing idempotency record fails closed: covered in remediation offline smoke PASS
  - changed payload conflict: `409 CODER_IMPLEMENTATION_BUNDLE_IDEMPOTENCY_CONFLICT` PASS
  - promotion denial: `409 CODER_IMPLEMENTATION_BUNDLE_FORBIDDEN_CLAIM_INCLUDED` PASS
  - execution-authority denial: `409 CODER_IMPLEMENTATION_BUNDLE_EXECUTION_AUTHORITY_FORBIDDEN` PASS
  - PM raw write denied: `403 ARTIFACT_ROLE_FORBIDDEN` PASS
  - Helper raw write denied: `403 ARTIFACT_ROLE_FORBIDDEN` PASS
  - no Coder handoff created: PASS
  - no Helper execution created: PASS
  - no Science behavior changed: PASS

## Secret Handling

- no secrets exposed in source, docs, or transcripts
