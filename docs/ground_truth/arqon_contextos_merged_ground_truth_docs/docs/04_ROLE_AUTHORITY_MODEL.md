# 04 — Role Authority Model

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Role summary

| Role | Owns | Must not do |
|---|---|---|
| PM AI | constitution, dossier, specification, plan, milestones, definitions of done | implement, execute, audit, certify, promote |
| Coder AI | tasks, implementation bundle, tests/docs patch plan, Helper packet | define final gates, audit, certify, promote |
| Helper/Codex | local execution, command runs, logs, evidence, authorized micro-edits | design architecture, audit, plan, promote |
| Auditor AI | clarify, checklists, analyze, audit, tripwires, gate reports | implement, relax gates, promote |
| Human | choose flow, approve advancement, authorize commit/push/promotion | erase evidence or bypass required gates |

## PM AI

Allowed commands:

- `/sync-context`
- `/sync-constitution`
- `/inbox`
- `/save-context`
- `/send-message`
- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow` when carrying human instruction
- `/dossier`
- `/constitution`
- `/specify`
- `/plan`

Forbidden:

- `/tasks`
- `/implement`
- `/execute`
- `/audit` as final auditor
- certifying or promoting

## Coder AI

Allowed commands:

- `/sync-context`
- `/inbox`
- `/save-context`
- `/send-message`
- `/load-flow`
- `/flow-status`
- `/tasks`
- `/implement`

Forbidden:

- `/constitution`
- `/plan` as PM authority
- `/audit`
- `/adv-flow` unless explicitly authorized as a non-gate action
- promotion or certification

## Auditor AI

Allowed commands:

- `/sync-context`
- `/inbox`
- `/save-context`
- `/send-message`
- `/load-flow`
- `/flow-status`
- `/clarify`
- `/checklists`
- `/analyze`
- `/audit`

Forbidden:

- implementation patches
- Helper execution
- PM final planning authority
- promotion or certification

## Helper/Codex

Allowed:

- load Helper packet
- execute authorized commands
- apply authorized patches/micro-edits
- write execution report
- write evidence manifest
- commit/push only if explicitly authorized

Forbidden:

- self-directed architecture changes
- broad coding without Coder packet
- audit verdicts
- hidden helpful drift
- unauthorized path mutation

## Human

Owns:

- flow type decision
- human approval or rejection
- advancement through `/adv-flow`
- commit/push authorization when needed
- promotion/claim decisions

Human decisions should be recorded as artifacts, not implicit chat statements when the flow reaches a governance-sensitive gate.
