# Code Monkeys Coder Implementation Bundle Global Route-Only Remediation 002 Evidence

- branch: `main`
- commit before: `3b050aa6e138e55a1ce51f7c6f5352ea8b685f44`
- source commit: `a781a15d5c9821938aa1a6ff5fae775695992f4d`
- evidence commit / current HEAD: `PENDING`
- push status: `PASS (source commit)`
- PM bundle path used: `temps/arqonmonkeyos_impl_bundle_global_route_only_remediation_002.zip`

## Scope

- Objective: make `implementation_bundle` route-only globally where generic Flow artifact writes were still possible.
- Required status labels:
  - `REQUIRES_HUMAN_REVIEW`
  - `development diagnostic only`
  - `NOT SEALED-TEST CERTIFIED`
  - `not promotable`

## Source/Test-Support Changes

- `worker/src/flows.ts`
  - route-only check now applies to `implementation_bundle` across flow types via `ROUTE_ONLY_ARTIFACTS`.
- `openapi/arqon_contextos.openapi.yaml`
  - updated route-only remediation docs for global scope.
- `worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_offline_smoke.ts`
- `worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_tripwire.py`
- `worker/test_support/build_coder_implementation_bundle_global_route_only_audit_bundle.py`
- `worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py`
  - bounded compatibility fix-up for renamed route-only marker constant.
- Documentation from PM bundle:
  - `docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_GLOBAL_ROUTE_ONLY_REMEDIATION_002.md`
  - `docs/01_monkeyos_doctrine/AUDITOR_PANEL_MODE_001.md`
  - `docs/01_monkeyos_doctrine/MDASH_IMPACT_ON_MONKEYOS_001.md`
  - `docs/09_benchmarks/CYBERGYM_BENCHMARK_TRACK_001.md`

## Validation PASS Table

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_global_route_only_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_tripwire.py` PASS
- `python3 worker/test_support/build_coder_implementation_bundle_global_route_only_audit_bundle.py` PASS
- `python3 worker/test_support/build_coder_implementation_bundle_route_only_remediation_audit_bundle.py` PASS
- `python3 worker/test_support/build_coder_implementation_bundle_audit_bundle.py` PASS

## Bounded Fix-ups

- Added expected compiled smoke JS into `runtime/flow-core-smoke-dist/test_support/` from provided TS so validation command path resolves.
- Updated one stale tripwire marker check to accept `ROUTE_ONLY_ARTIFACTS` in addition to old marker naming.

## Live Verification

- Deployed worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- Redeploy/update status: `PASS (main push observed live)`
- Live smoke transcript:
  - `tmp/coder_implementation_bundle_global_route_only_live_smoke.json`
  - `tmp/coder_implementation_bundle_global_route_only_live_extra.json`
- Live proof results:
  - raw `CODER_AI` generic `implementation_bundle` on `code_flow`: `403 FLOW_ARTIFACT_ROUTE_REQUIRED` PASS
  - raw `CODER_AI` generic `implementation_bundle` on `governance_flow`: `403 FLOW_ARTIFACT_ROUTE_REQUIRED` PASS
  - `/v1/coder/implementation-bundle` succeeds from audited `coder_tasks`: PASS
  - changed payload conflict: `409 CODER_IMPLEMENTATION_BUNDLE_IDEMPOTENCY_CONFLICT` PASS
  - promotion denial: `409 CODER_IMPLEMENTATION_BUNDLE_FORBIDDEN_CLAIM_INCLUDED` PASS
  - execution-authority denial: `409 CODER_IMPLEMENTATION_BUNDLE_EXECUTION_AUTHORITY_FORBIDDEN` PASS
  - PM/Helper raw writes remain denied: PASS (`403 ARTIFACT_ROLE_FORBIDDEN`)
  - no Coder handoff: PASS
  - no Helper execution: PASS
  - no Science behavior: PASS

## Safety / Non-Scope

- no Coder handoff
- no Helper execution
- no Science behavior
- no secrets exposed

## Audit Bundles

- global route-only bundle:
  - path: `temps/coder_impl_bundle_global_route_only_audit_bundle_a781a15d5c98.zip`
  - sha256: `fa7b5fb541149f969dbbe07d2c503a4268d3d68c9b11af2a0963c4e3a34a661a`
- route-only remediation 001 bundle:
  - path: `temps/coder_impl_bundle_route_only_remediation_audit_bundle_a781a15d5c98.zip`
  - sha256: `54dc2d615af5e5f08e3f3c4844ce356bdad8e206886b8e9d2a5b4d38e7b9e9f6`
- implementation bundle base audit:
  - path: `temps/coder_implementation_bundle_audit_bundle_a781a15d5c98.zip`
  - sha256: `27bd3dd37ec2af0c20d3344de3b8b5ecf37bf83edbb7720c1b002d13639093c5`
