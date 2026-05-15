# Code Monkeys Coder Implementation Bundle Route-Only Remediation 001 Evidence

- branch: `main`
- commit before: `e34264afa3fa794697bcd6e3b68b1c01bf8bf787`
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
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.js` PASS
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
  - path: `temps/coder_impl_bundle_route_only_remediation_audit_bundle_e34264afa3fa.zip`
  - sha256: `f189f4c2e8c9dc9e9c8c5f7cdebf4bd97438f424f278b9f9235725f8e145595a`
- implementation bundle audit:
  - path: `temps/coder_implementation_bundle_audit_bundle_e34264afa3fa.zip`
  - sha256: `e1ca0630f6737ce7eaa95d3ffabeee447f7b308a862fcc721a334f281e28327b`

## Live Verification

- deployed worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- status: `PENDING_REDEPLOY_AND_LIVE_SMOKE`

## Secret Handling

- no secrets exposed in source, docs, or transcripts
