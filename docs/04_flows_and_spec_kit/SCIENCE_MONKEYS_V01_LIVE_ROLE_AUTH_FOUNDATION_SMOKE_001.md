# Science Monkeys v0.1 Live Role/Auth Foundation Smoke 001

## Status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Execution summary

- Branch: `main`
- Commit before: `f9d0722798d6a177d602626b81837e8ce3ccef8a`
- Commit after: pending commit in this task
- Push status: pending push in this task
- Deployed Worker URL: `https://arqon-contextos-broker.sonarum.workers.dev`

## Deployment / update status

- Live authenticated smoke: PASS
- Deployed worker update: not required; existing deployed worker accepted live requests
- Wrangler: not used

## Secret presence summary

Present in local secret source:
- `BROKER_KEY_PM`
- `BROKER_KEY_CODER`
- `BROKER_KEY_AUDITOR`
- `BROKER_KEY_HELPER`
- `BROKER_KEY_EXPLORER`
- `BROKER_KEY_HYPOTHESIZER`
- `BROKER_KEY_DESIGNER`
- `BROKER_KEY_SCIENCE_AUDITOR`
- `BROKER_KEY_SCIENCE_EXECUTOR`
- `BROKER_KEY_HUMAN`

Missing from local secret source:
- `GITHUB_APP_ID`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY`

## Scenario table

| # | Scenario | Result | Details |
| --- | --- | --- | --- |
| 1 | Health route | PASS | `200` from deployed worker |
| 2 | Create science_flow as EXPLORER_AI | PASS | `FLOW-2026-0006` created as `science-monkeys-v01-live-role-auth-foundation-001-rerun` |
| 3 | EXPLORER_AI writes research_dossier | PASS | `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-b3291d86-3_EXPLORER_AI_writes_research_dossier.md` |
| 4 | HYPOTHESIZER_AI writes hypothesis_card | PASS | `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-4cf2b028-4_HYPOTHESIZER_AI_writes_hypothesis_card.md` |
| 5 | DESIGNER_AI writes experiment_protocol | PASS | `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-ad654de2-5_DESIGNER_AI_writes_experiment_protocol.md` |
| 6 | SCIENCE_EXECUTOR_AI writes execution_report | PASS | `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-be5c14f1-6_SCIENCE_EXECUTOR_AI_writes_execution_report.md` |
| 7 | SCIENCE_AUDITOR_AI writes audit_report | PASS | `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-56ecf27f-7_SCIENCE_AUDITOR_AI_writes_audit_report.md` |
| 8 | SCIENCE_AUDITOR_AI writes share_recommendation | PASS | `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-b113d945-8_SCIENCE_AUDITOR_AI_writes_share_recommendation.md` |
| 9 | PM_AI attempts research_dossier | PASS | denied with `ARTIFACT_ROLE_FORBIDDEN` |
| 10 | PM_AI attempts hypothesis_card | PASS | denied with `ARTIFACT_ROLE_FORBIDDEN` |
| 11 | HELPER_AI attempts science_flow execution_report | PASS | denied with `ARTIFACT_ROLE_FORBIDDEN` |
| 12 | CODER_AI attempts science_flow execution_report | PASS | denied with `ARTIFACT_ROLE_FORBIDDEN` |
| 13 | AUDITOR_AI attempts science_flow audit_report | PASS | denied with `ARTIFACT_ROLE_FORBIDDEN` |
| 14 | SCIENCE_AUDITOR_AI attempts official share_packet | PASS | denied with `ARTIFACT_ROLE_FORBIDDEN` |
| 15 | HUMAN attempts generic science_flow share_packet | PASS | denied with `SCIENCE_SHARE_ROUTE_REQUIRED` |
| 16 | Code-flow compatibility regression | PASS | `FLOW-2026-0007` created as `sm-v01-code-compat-001` |
| 17 | Flow status check | PASS | science flow status `active` / `DRAFT` |
| 18 | v0.2 route regression | PASS | `/v1/runs` returned `501 NOT_IMPLEMENTED` |

## Flow ids / names

- Science flow: `FLOW-2026-0006` / `science-monkeys-v01-live-role-auth-foundation-001-rerun`
- Code flow: `FLOW-2026-0007` / `sm-v01-code-compat-001`

## GitHub paths written

- `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-b3291d86-3_EXPLORER_AI_writes_research_dossier.md`
- `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-4cf2b028-4_HYPOTHESIZER_AI_writes_hypothesis_card.md`
- `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-ad654de2-5_DESIGNER_AI_writes_experiment_protocol.md`
- `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-be5c14f1-6_SCIENCE_EXECUTOR_AI_writes_execution_report.md`
- `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-56ecf27f-7_SCIENCE_AUDITOR_AI_writes_audit_report.md`
- `governance/flows/FLOW-2026-0006/artifacts/ART-2026-05-14-b113d945-8_SCIENCE_AUDITOR_AI_writes_share_recommendation.md`
- `governance/flows/FLOW-2026-0006/flow_manifest.json`
- `governance/flows/FLOW-2026-0006/flow_index.json`
- `governance/flows/FLOW-2026-0007/artifacts/ART-2026-05-14-74a9af3b-Helper_code_flow_execution.md`
- `governance/flows/FLOW-2026-0007/flow_manifest.json`
- `governance/flows/FLOW-2026-0007/flow_index.json`

## Proof summary

- PM_AI science artifact denial: PROVEN
- HELPER_AI science execution denial: PROVEN
- SCIENCE_EXECUTOR_AI execution write: PROVEN
- SCIENCE_AUDITOR_AI share_recommendation: PROVEN
- SCIENCE_AUDITOR_AI share_packet denial: PROVEN
- generic HUMAN share_packet block pending `/v1/science/share`: PROVEN
- code_flow HELPER_AI compatibility: PROVEN
- v0.2 route compatibility: PROVEN

## Validation commands

- `pwd` PASS
- `git rev-parse HEAD` PASS
- `git branch --show-current` PASS
- `git status --short` PASS
- `git remote -v` PASS
- `cd worker && npm run typecheck && cd ..` PASS
- `git diff --stat` PASS
- `secret-leak grep on the report` PASS
- `git status --short` PASS

## Notes

- The smoke reran with a fresh science-flow alias because the original alias already existed in the live worker.
- The code-flow compatibility path used a shorter valid alias after the first overly long alias produced a 500 name-validation error.
- No source files were changed for this rerun; only this evidence report was updated.

