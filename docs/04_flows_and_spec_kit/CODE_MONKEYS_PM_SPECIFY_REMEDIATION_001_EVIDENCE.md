# Code Monkeys PM Specify Remediation 001 Evidence

- branch: `main`
- commit before: `b4f44451913d7383913cd6a1e9f2ae7597d39e91`
- commit after source patch: `5d8dd5a2c1a31b20f9f220b4b37e0b60920b1e1e`
- push status: PASS

## Files Created
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_REMEDIATION_001.md`
- `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_REMEDIATION_001_EVIDENCE.md`
- `worker/test_support/pm_specify_strict_audit_tripwire.py`

## Files Updated By The Remediation Patch
- `worker/src/pm_specify.ts`
- `worker/test_support/code_monkeys_pm_specify_offline_smoke.ts`
- `worker/test_support/code_monkeys_pm_specify_live_smoke.ts`
- `worker/test_support/code_monkeys_pm_specify_tripwire.py`
- `worker/test_support/build_pm_specify_audit_bundle.py`

## Validation Commands
- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_specify_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_specify_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_specify_tripwire.py` PASS
- `python3 worker/test_support/pm_specify_strict_audit_tripwire.py .` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_policy_unit.js` PASS
- `node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/code_monkeys_pm_intake_offline_smoke.js` PASS
- `python3 worker/test_support/code_monkeys_pm_intake_tripwire.py` PASS
- `python3 worker/test_support/share_integration_strict_tripwire.py .` PASS
- `python3 worker/test_support/build_pm_specify_audit_bundle.py` PASS
- `rg -n "normalizeClaimText|ready for production|approved for release|release ready|pm_specify_strict_audit_tripwire|PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED" worker/src worker/test_support docs` PASS

## Audit Bundle Builder
- bundle path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS/temps/pm_specify_audit_bundle_5395f947eff3.zip`
- zip SHA256: `e9f7973b131fdab43dc57302b37b17491bd29d4a498144d62952ac6f9792b46e`
- file count: `36`
- bundle contents include the PM report, the replay bundle inputs required by the PM, and the extra replay dependencies needed for an independent TypeScript check:
  - `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_001_PM_REPORT.md`
  - `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_REMEDIATION_001.md`
  - `docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_SPECIFY_REMEDIATION_001_EVIDENCE.md`
  - `worker/test_support/pm_specify_strict_audit_tripwire.py`
  - `worker/tsconfig.json`
  - `worker/src/messages.ts`
  - `worker/src/notes.ts`
- extracted replay bundle result:
  - `python3 tmp/pm_specify_replay_check/worker/test_support/code_monkeys_pm_specify_tripwire.py` PASS
  - `python3 worker/test_support/pm_specify_strict_audit_tripwire.py tmp/pm_specify_replay_check` PASS

## Strict Tripwire Result
- PASS
- the audit now checks the broadened guard by source structure and by normalized promotion probes.

## Offline Smoke Result
- PASS
- broad promotion probes are rejected:
  - certified
  - certification
  - production-ready
  - production readiness
  - ready for production
  - product-ready
  - promotable
  - approved for release
  - release-ready

## Live Smoke Result
- PASS
- deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- live evidence is current and no longer shows the stale `404` from the earlier deploy window

### Redacted Live Transcript Excerpt
```text
no-auth PM specify denied -> 401 UNAUTHORIZED
PM specify succeeds -> 201
duplicate PM specify idempotent -> 200
changed PM specify payload conflicts -> 409 PM_SPECIFY_IDEMPOTENCY_CONFLICT
promotion language denied 0 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 1 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 2 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 3 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 4 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 5 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 6 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
promotion language denied 7 -> 409 PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED
```

## Proofs
- all previous PM specify live smoke scenarios still pass: PASS
- broad promotion probes are rejected: PASS
- no secrets in report: PASS
- live evidence report records PASS, not stale 404: PASS
- no Science behavior added: PASS
- no plans/tasks/Coder handoff/Helper execution generated: PASS
- no Skill/Memory/Preference runtime: PASS

## Required Status Labels
- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
