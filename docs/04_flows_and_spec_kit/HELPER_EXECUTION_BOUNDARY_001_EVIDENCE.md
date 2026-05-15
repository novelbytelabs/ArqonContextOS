# Actual Helper Execution Boundary 001 Evidence

- branch: `main`
- commit before: `9990da32ed86ebd7be235dd1b8da5383d6624e55`
- source remediation commit: `a340ec5baecb631e6238ebc342df453489b9cbe9`
- current HEAD: `5deb717ba2a1b219c609907b2ce32b978e922a7b`
- push status (source): `PASS`
- deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`

## Bundle Transfer / Apply Gates
- bundle: `temps/arqonmonkeyos_helper_execution_boundary_001_pm_bundle.zip`
- SHA256 verified: `72d3cf4a3cdd14c8f1ca9ccfe59dddd4606a864b09232fe04fc97bab24b1f980` (PASS)
- apply script: `runtime/helper_execution_boundary_001_bundle/pm_apply_helper_execution_boundary_001.py` (present)
- apply result: `PASS` (`Applied Actual Helper Execution Boundary 001.`)

## Validation Table
- `cd worker && npm run typecheck && cd ..` PASS
- `python3 worker/test_support/compile_smoke_runtime.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_helper_execution_report_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_helper_execution_report_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_helper_execution_report_tripwire.py` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/code_monkeys_helper_execution_intake_offline_smoke.js` PASS
- `python3 worker/test_support/check_no_tmp_critical_paths.py` PASS
- `python3 worker/test_support/check_no_tmp_critical_paths_selftest.py` PASS
- `python3 worker/test_support/build_helper_execution_report_audit_bundle.py` PASS

## Bounded Micro-Edits Applied
- `worker/src/flows.ts`: route-only evidence artifact blocking is now scoped by flow type, so Helper evidence artifacts are route-only on `code_flow` without blocking valid Science executor writes on `science_flow`.
- `worker/src/helper_execution_report.ts`: forbidden-claim validation now covers command evidence fields, and secret-like markers in stdout/stderr excerpts are rejected with `HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN`.
- `worker/test_support/code_monkeys_helper_execution_report_offline_smoke.ts`: added science regression, command-field forbidden-claim, and secret-marker probes.
- `worker/test_support/code_monkeys_helper_execution_report_live_smoke.ts`: added live command-field forbidden-claim and secret-marker probes.
- `worker/test_support/code_monkeys_helper_execution_report_tripwire.py`: updated to require flow-scoped route-only logic plus command-field and secret-marker coverage.
- No changes to Helper-only authority, idempotency semantics, or source validation behavior beyond the scoped route-only fix.

## Remediation 001 Targets
- scope raw generic route-only blocking for `execution_report`, `command_log`, and `evidence_manifest` to `code_flow` so `science_flow` executor evidence is not blocked
- extend forbidden-claim checks to `commands[].command`, `commands[].purpose`, `commands[].stdout_excerpt`, and `commands[].stderr_excerpt`
- reject secret-like excerpt material with `HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN`

## Remediation 002 Targets
- reject secret-like material in all official Helper execution report text fields:
  - `execution_title`
  - `execution_summary`
  - `commands[].command`
  - `commands[].purpose`
  - `commands[].stdout_excerpt`
  - `commands[].stderr_excerpt`

## Live Verification
- no-auth denied: `PASS` (`401`)
- all non-Helper roles denied: `PASS`
- HELPER_AI succeeds from audited helper_execution_intake: `PASS` (`201`)
- `execution_report`, `command_log`, `evidence_manifest` created: `PASS`
- raw generic HELPER write for each route-only artifact blocked: `PASS` (`403 FLOW_ARTIFACT_ROUTE_REQUIRED`)
- duplicate report idempotent: `PASS` (`200`)
- changed payload conflict: `PASS` (`409`)
- forbidden command-field claim phrases denied: `PASS` (`409 HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED`)
- secret-like stdout/stderr markers denied: `PASS` (`409 HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN`)
- Coder/PM raw writes denied: `PASS`
- no deployment behavior: `PASS`
- no Science behavior changes: `PASS`
- no secrets exposed: `PASS`

### Science Regression Live Verification
- fresh science flow created: `PASS` (`FLOW-2026-0038`)
- raw `SCIENCE_EXECUTOR_AI` write of `execution_report` on `science_flow`: `PASS` (`201`, not `FLOW_ARTIFACT_ROUTE_REQUIRED`)
- raw `SCIENCE_EXECUTOR_AI` write of `raw_result_index` on `science_flow`: `PASS` (`201`)

### Live Helper Inputs Used
- fresh `coder_handoff_id` created through the live Coder handoff route:
  - `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--coder-handoff-live-1778886762863`
- fresh `helper_execution_intake_id` created for this remediation verification:
  - `FLOW-2026-0035-share-8811894980-handoff-8811894980-intake-8811894980-spec-8811894980-plan--helper-intake-live-capture-177888680`
- code flow used:
  - `FLOW-2026-0036`

### Live Freshness Gate
- deploy trigger commit: `NOT REQUIRED`
- note: first live run hit transient GitHub contents write SHA conflict (`409 expected sha ...`); second run passed with same source and route behavior.

## Audit Bundle (Final HEAD)
- path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/helper_execution_report_audit_bundle_5deb717ba2a1.zip`
- SHA256: `66c74a559ebf3eb7dff21da6e5a7ccbee53da8ba78771064d91b1a1a429cd3e7`

## Non-Scope Confirmation
- no Worker-side command execution
- no deployment
- no certification
- no promotion
- no Science behavior
- no Skill/Memory/Preference runtime

## Required Status Labels
REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
