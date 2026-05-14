# FLOW CORE V0.3 LIVE HARDENING SMOKE 001

Status:
REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Run metadata

- branch: `main`
- commit before: `ee4c8556904ef5f648647d4fc3713a3b1070ec15`
- commit after: pending at report creation time
- deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`

## Secret presence summary

- PM bearer key: PRESENT
- Coder bearer key: PRESENT
- Auditor bearer key: PRESENT
- Helper bearer key: PRESENT
- Human bearer key: PRESENT

No secret values are included in this report.

## Scenario table

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | health route | 200 | PASS (`200`) |
| 2 | create `code_flow` as PM | 201 | PASS (`201`) |
| 3 | valid `pm_spec` artifact write as PM | 201 | PASS (`201`) |
| 4 | invalid `share_review` on `code_flow` denied | 403 + `ARTIFACT_SLOT_FORBIDDEN` | PASS (`403`, `ARTIFACT_SLOT_FORBIDDEN`) |
| 5 | non-HUMAN advancement denied | 403 + `HUMAN_ADVANCEMENT_REQUIRED` | PASS (`403`, `HUMAN_ADVANCEMENT_REQUIRED`) |
| 6 | HUMAN advance to `PLAN_READY` | 200 | PASS (`200`) |
| 7 | HUMAN jump to `INTEGRITY_GATE_PASSED` pre-evidence denied | 409 + `FLOW_ADVANCEMENT_PRECONDITION_FAILED` | PASS (`409`, `FLOW_ADVANCEMENT_PRECONDITION_FAILED`) |
| 8 | Helper writes `execution_report` | 201 | PASS (`201`) |
| 9 | HUMAN advance to `DEV_EVIDENCE_READY` | 200 | PASS (`200`) |
| 10 | HUMAN advance to `INTEGRITY_GATE_PASSED` without audit denied | 409 + precondition fail | PASS (`409`, `FLOW_ADVANCEMENT_PRECONDITION_FAILED`) |
| 11 | Auditor writes `audit_report` | 201 | PASS (`201`) |
| 12 | HUMAN advance to `INTEGRITY_GATE_PASSED` | 200 | PASS (`200`) |
| 13 | final status `INTEGRITY_GATE_PASSED` | 200 + final gate | PASS (`200`, `INTEGRITY_GATE_PASSED`) |
| 14 | `/v1/runs` legacy fallback intact | 501 + not-implemented | PASS (`501`, `NOT_IMPLEMENTED`) |

## Created flow

- flow_id: `FLOW-2026-0002`
- flow name: `flowcore-v03-live-hardening-smoke-001`

## GitHub paths written

- `governance/flows/FLOW-2026-0002/flow_manifest.json`
- `governance/flows/FLOW-2026-0002/artifacts/ART-2026-05-14-74f57efa-Hardening_Live_Smoke_PM_Spec.md`
- `governance/flows/FLOW-2026-0002/artifacts/ART-2026-05-14-91f096c3-Execution_report.md`
- `governance/flows/FLOW-2026-0002/artifacts/ART-2026-05-14-a9227986-Audit_report.md`

## Governance proofs

- slot denial proof: `ARTIFACT_SLOT_FORBIDDEN` on `share_review` for `code_flow`
- gate precondition denial proof: `FLOW_ADVANCEMENT_PRECONDITION_FAILED` before required evidence/audit
- Human-only advancement proof: PM denied with `HUMAN_ADVANCEMENT_REQUIRED`, HUMAN accepted
- v0.2 compatibility proof: `/v1/runs` returned legacy not-implemented response (`501`, `NOT_IMPLEMENTED`)

## Micro-edits

- None

## Required status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
