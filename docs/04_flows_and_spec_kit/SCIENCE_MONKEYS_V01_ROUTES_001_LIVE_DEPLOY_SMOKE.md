# Science Monkeys v0.1 Routes 001 Live Deploy Smoke

- branch: `main`
- commit before: `f8fe95b4e8912b5a1e1a8e0d7e46acf04057a08d`
- commit after: `971455ac28176d159d390e17f64056cd202032f9`
- push status: PASS
- deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`
- deployment/update status: PASS
- deployment/update method: Cloudflare GUI-connected GitHub deployment on `main`; latest build was triggered by commit `971455ac28176d159d390e17f64056cd202032f9` with no source behavior change in this turn
- deployed commit/build reference if visible: not exposed by the worker response; the visible deployment trigger is commit `971455ac28176d159d390e17f64056cd202032f9`

## Secret Presence Summary

Local secret source used for the live smoke: `~/secrets/arqonmonkeyos_science_keys.env`

Present in local secret source, names only:
- `BROKER_KEY_DESIGNER`
- `BROKER_KEY_EXPLORER`
- `BROKER_KEY_HYPOTHESIZER`
- `BROKER_KEY_SCIENCE_AUDITOR`
- `BROKER_KEY_SCIENCE_EXECUTOR`

Not present in that local source file, names only:
- `BROKER_KEY_PM`
- `BROKER_KEY_CODER`
- `BROKER_KEY_AUDITOR`
- `BROKER_KEY_HELPER`
- `BROKER_KEY_HUMAN`

## Live Smoke Command

```bash
set -a
source ~/secrets/arqonmonkeyos_science_keys.env
set +a
WORKER_URL="https://arqon-contextos-broker.sonarum.workers.dev" \
node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_live_smoke.js
```

## Scenario Table

| # | Scenario | Result | Evidence |
|---|---|---|---|
| 1 | health route | PASS | `GET /v1/health -> 200` |
| 2 | `/v1/science/research` | PASS | `POST /v1/science/research -> 201` |
| 3 | `/v1/science/hypothesize` | PASS | `POST /v1/science/hypothesize -> 201` |
| 4 | `/v1/science/design-experiment` | PASS | `POST /v1/science/design-experiment -> 201` |
| 5 | `/v1/science/execute-experiment` | PASS | `POST /v1/science/execute-experiment -> 201` |
| 6 | `/v1/science/audit-experiment` | PASS | `POST /v1/science/audit-experiment -> 201` |
| 7 | `/v1/science/interpret` | PASS | `POST /v1/science/interpret -> 201` |
| 8 | `/v1/science/iterate` | PASS | `POST /v1/science/iterate -> 201` |
| 9 | `/v1/science/record-finding` | PASS | `POST /v1/science/record-finding -> 201` |
| 10 | PM_AI denied Science route | PASS | `403 SCIENCE_ROUTE_ROLE_FORBIDDEN` on spoofed research request |
| 11 | HELPER_AI denied Science execution route | PASS | `403 SCIENCE_ROUTE_ROLE_FORBIDDEN` on `/v1/science/execute-experiment` |
| 12 | AUDITOR_AI denied Science audit route | PASS | `403 SCIENCE_ROUTE_ROLE_FORBIDDEN` on `/v1/science/audit-experiment` |
| 13 | `/v1/science/share` remains not implemented | PASS | `501 SCIENCE_SHARE_NOT_IMPLEMENTED` |
| 14 | generic Human `share_packet` remains blocked | PASS | `403 SCIENCE_SHARE_ROUTE_REQUIRED` |
| 15 | code_flow HELPER_AI compatibility | PASS | `POST /v1/flows/FLOW-2026-0009/artifacts -> 201` |
| 16 | v0.2 `/v1/runs` fallback | PASS | `501 NOT_IMPLEMENTED` |
| 17 | broker-key uniqueness | PASS | `ok: true`, `missing: []`, `duplicate_groups: []` |

## Created Flows

- science flow id: `FLOW-2026-0008`
- science flow name: `science-routes-v01-live-8784462650`
- code flow id: `FLOW-2026-0009`
- code flow name: `code-routes-v01-live-8784462650`

## GitHub Paths Written

- `governance/flows/FLOW-2026-0008/flow_manifest.json`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-84e85383-Research_dossier.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-eb74497a-Hypothesis_card.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-f244d2f0-Experiment_protocol.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-de60cdc6-Execution_report.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-937ce39b-Audit_report.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-fe08bc41-Interpretation_draft.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-91ea570d-Iteration_proposal.md`
- `governance/flows/FLOW-2026-0008/artifacts/ART-2026-05-14-be923e8c-Finding_record.md`
- `governance/flows/FLOW-2026-0009/flow_manifest.json`
- `governance/flows/FLOW-2026-0009/artifacts/ART-2026-05-14-de6e26aa-Code_flow_execution_report.md`

## Redacted Transcript Excerpt

The smoke client redacted bearer values in its transcript. Representative excerpt:

- `GET /v1/health -> 200`
- `POST /v1/science/research -> 201`
- `POST /v1/science/share -> 501 SCIENCE_SHARE_NOT_IMPLEMENTED`
- `POST /v1/flows/FLOW-2026-0008/artifacts -> 403 SCIENCE_SHARE_ROUTE_REQUIRED`
- `GET /v1/runs -> 501 NOT_IMPLEMENTED`

## Proof Notes

- PM_AI route denial: proven by `403 SCIENCE_ROUTE_ROLE_FORBIDDEN` on spoofed research request.
- HELPER_AI execution route denial: proven by `403 SCIENCE_ROUTE_ROLE_FORBIDDEN` on `/v1/science/execute-experiment`.
- SCIENCE_EXECUTOR_AI execute route allowed: proven by `201` on `/v1/science/execute-experiment`.
- SCIENCE_AUDITOR_AI audit route allowed: proven by `201` on `/v1/science/audit-experiment`.
- `/v1/science/share` remains not implemented: proven by `501 SCIENCE_SHARE_NOT_IMPLEMENTED`.
- generic share_packet remains blocked: proven by `403 SCIENCE_SHARE_ROUTE_REQUIRED`.
- code_flow compatibility: proven by `201` on HELPER_AI execution artifact write to `code_flow`.
- v0.2 route compatibility: proven by legacy `501 NOT_IMPLEMENTED` on `/v1/runs`.

## Validation Commands

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `cd worker && npx tsc -p tsconfig.smoke.json && cd ..` PASS
- `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_live_smoke.js` PASS
- `grep -R "BROKER_KEY\\|Authorization: Bearer\\|PRIVATE KEY" -n docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_ROUTES_001_LIVE_DEPLOY_SMOKE.md` PASS
- `git diff --stat` PASS
- `git diff -- docs worker/src worker/test_support openapi` PASS
- `git status --short` PASS

## Source / Secret Status

- source changed in this turn: NO
- secrets exposed in report: NO

## Required Status Labels

- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`
