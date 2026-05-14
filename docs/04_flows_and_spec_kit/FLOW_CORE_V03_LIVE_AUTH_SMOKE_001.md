# FLOW CORE V0.3 LIVE AUTH SMOKE 001

Status:
REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Run context

- branch: `main`
- commit: `01412982e15439cfac79442af0211fa01f412cf1`
- smoke method: live authenticated HTTP smoke against deployed Worker route layer
- Worker URL used: `https://arqon-contextos-broker.sonarum.workers.dev`

## Secret presence summary (names omitted, values omitted)

- PM/CODER/AUDITOR/HELPER/HUMAN bearer keys: PRESENT in local environment at execution time.
- GitHub App secrets: not required on workstation for this smoke method because the deployed Worker already holds runtime secrets server-side.
- No secret values were printed, stored in docs, or committed.

## Commands run (sanitized)

1. Preflight:
   - `pwd`
   - `git rev-parse HEAD`
   - `git branch --show-current`
   - `git status --short`
   - `git remote -v`
   - `cd worker && npm run typecheck && cd ..`
2. Smoke request sequence A-L using `curl` with bearer auth headers against the Worker URL.
3. Evidence extraction from response files under `tmp/live_smoke/`.

## Scenario results (A-L)

| Scenario | Route | Result | Evidence |
|---|---|---|---|
| A | `GET /v1/health` | PASS (200) | status labels returned |
| B | `POST /v1/flows` (PM) | PASS (201) | flow created, `project=ArqonZero`, `current_gate=DRAFT` |
| C | `GET /v1/flows` | PASS (200) | created flow present |
| D | `GET /v1/flows/{flow_id}` | PASS (200) | manifest returned |
| E | `GET /v1/flows/{alias}` | PASS (200) | alias resolved to same flow_id |
| F | `GET /v1/flows/{flow_id}/status` | PASS (200) | `status=active`, `current_gate=DRAFT` |
| G | `POST /v1/flows/{flow_id}/artifacts` (PM, `pm_spec`) | PASS (201) | artifact path under `governance/flows/<flow_id>/artifacts/` |
| H | `POST /v1/flows/{flow_id}/artifacts` (HELPER, `pm_spec`) | PASS (expected deny, 403) | error code `ARTIFACT_TYPE_FORBIDDEN` |
| I | `POST /v1/flows/{flow_id}/advance` (PM) | PASS (expected deny, 403) | error code `HUMAN_ADVANCEMENT_REQUIRED` |
| J | `POST /v1/flows/{flow_id}/advance` (HUMAN) | PASS (200) | gate moved to `PLAN_READY` |
| K | `GET /v1/flows/{flow_id}/status` | PASS (200) | `current_gate=PLAN_READY` |
| L | `GET /v1/runs` | PASS (501) | legacy fallback intact, `NOT_IMPLEMENTED` |

## Created flow

- flow_id: `FLOW-2026-0001`
- flow name: `flowcore-v03-live-smoke-001`

## GitHub-backed paths written

- `governance/flows/FLOW-2026-0001/flow_manifest.json`
- `governance/flows/flow_index.json`
- `governance/flows/FLOW-2026-0001/artifacts/ART-2026-05-14-3b247415-Live_Smoke_PM_Artifact.md`

## Governance checks proven

- Invalid Helper artifact write denied: PROVEN (`403`, `ARTIFACT_TYPE_FORBIDDEN`)
- Non-HUMAN advancement denied: PROVEN (`403`, `HUMAN_ADVANCEMENT_REQUIRED`)
- HUMAN advancement succeeded: PROVEN (`200`, gate advanced to `PLAN_READY`)
- Existing v0.2 route dispatch not broken: PROVEN (`/v1/health`=200, `/v1/runs`=501 fallback)

## Micro-edits

- None in this task.

## Required status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
