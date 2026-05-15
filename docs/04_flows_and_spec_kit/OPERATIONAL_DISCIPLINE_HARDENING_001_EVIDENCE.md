# Operational Discipline Hardening 001 Evidence

- source commit: `ccd7c3de659f9bad80f52f0a847f08ddc4ae25ea`
- evidence commit/current HEAD: `PENDING`
- required status labels:
  - `REQUIRES_HUMAN_REVIEW`
  - `development diagnostic only`
  - `NOT SEALED-TEST CERTIFIED`
  - `not promotable`

## Changed-File Summary

- `.gitignore`
  - ignores `runtime/`
- `worker/tsconfig.smoke.json`
  - smoke output now writes to `../runtime/flow-core-smoke-dist`
- Added:
  - `worker/test_support/compile_smoke_runtime.py`
  - `worker/test_support/check_no_tmp_critical_paths.py`
  - `worker/test_support/check_no_tmp_critical_paths_selftest.py`
  - `worker/test_support/build_operational_discipline_audit_bundle.py`
  - `docs/01_monkeyos_doctrine/OPERATIONAL_WORKSPACE_POLICY_001.md`
  - `docs/04_flows_and_spec_kit/OPERATIONAL_DISCIPLINE_HARDENING_001.md`
- Updated operational command docs and audit-bundle builders to use:
  - `runtime/flow-core-smoke-dist`
  - `runtime/<bundle_dir>`

## Validation Table

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `python3 worker/test_support/compile_smoke_runtime.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_global_route_only_offline_smoke.js` PASS
- `python3 worker/test_support/check_no_tmp_critical_paths.py` PASS
- `python3 worker/test_support/check_no_tmp_critical_paths_selftest.py` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_coder_implementation_bundle_tripwire.py` PASS
- `python3 worker/test_support/build_operational_discipline_audit_bundle.py` PASS
- `python3 worker/test_support/build_coder_implementation_bundle_global_route_only_audit_bundle.py` PASS
- `rg -n "tmp/flow-core-smoke-dist|node .*tmp/|python3 tmp/|runtime/flow-core-smoke-dist|OPERATIONAL_WORKSPACE_POLICY_001|check_no_tmp_critical_paths" worker docs README* .github || true` PASS

## Guard / Selftest Results

- guard result: no critical `tmp/` operational references remain in scanned paths
- selftest result: intentionally injected critical `tmp/` command fails, scratch-only policy text passes
- bounded follow-up fix applied:
  - `check_no_tmp_critical_paths.py` allowlists its own selftest file so the negative fixture does not create a false positive in real scans

## Audit Bundles

- operational discipline bundle:
  - path: `temps/operational_discipline_hardening_audit_bundle_ccd7c3de659f.zip`
  - sha256: `4d73c7e4135a48b7b08169814f1864d7590423c229a7b61ae5ddc3cdce073709`
- compatibility regression bundle:
  - path: `temps/coder_impl_bundle_global_route_only_audit_bundle_ccd7c3de659f.zip`
  - sha256: `241f15cc102491b6f7b385cea87165a38bdfc160cfffff7055712928b476c4dd`

## Operational Notes

- route behavior was not changed by this hardening
- Coder Handoff remains paused
- raw live transcript files required for audit must be included inside audit bundles, not referenced only from `runtime/`
- no secrets exposed
