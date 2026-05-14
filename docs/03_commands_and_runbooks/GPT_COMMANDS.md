# GPT Commands

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

These are instruction-level commands routed through the ContextBus broker (legacy infrastructure name: ContextOS).

## Current v0.2 working commands

- `/sync-context`
- `/sync-constitution`
- `/save-context`
- `/send-message`
- `/inbox`
- `/open-message`
- `/archive-message` (safe copy-to-archive behavior in v0.2)

## Legacy/superseded run commands

- `/create-run` (legacy; superseded by planned flow model)
- `/load-run` (legacy; superseded by planned flow model)
- `/write-artifact` (legacy naming; superseded by planned `/write-flow`)
- `/checkpoint` (legacy wrapper behavior)

## Planned Flow Core v0.3 commands

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

Implementation mapping:

- `/create-flow` -> `POST /v1/flows`
- `/load-flow` -> `GET /v1/flows/{flow_ref}`
- `/flow-status` -> `GET /v1/flows/{flow_ref}/status`
- `/write-flow` -> `POST /v1/flows/{flow_ref}/artifacts`
- `/adv-flow` -> `POST /v1/flows/{flow_ref}/advance`

Flow Core v0.3 defaults and authority:

- project defaults to `ArqonZero`
- role is inferred from broker key
- Human role is required to advance flow gate/status in v0.3

## Future Science Monkeys commands

- `/research`
- `/hypothesize`
- `/design-experiment`
- `/execute-experiment`
- `/audit-experiment`
- `/interpret`
- `/iterate`
- `/record-finding`
- `/share`

## Future Code Monkeys commands

- `/dossier`
- `/constitution`
- `/specify`
- `/clarify`
- `/plan`
- `/checklists`
- `/tasks`
- `/analyze`
- `/implement`
- `/execute`
- `/audit`

## Doctrine guardrails

- Repo rename is not authorized in this phase.
- Runtime/API/auth behavior has not changed in this docs migration.
- No AI may certify or promote.

## Science-to-Code Orchestration Boundary

Science Monkeys commands:

```text
/research
/hypothesize
/design-experiment
/execute-experiment
/audit-experiment
/interpret
/iterate
/record-finding
/share
```

Code Monkeys / Spec Kit commands:

```text
/dossier
/constitution
/specify
/plan
/tasks
/implement
/execute
/audit
```

`/share` is the bridge into PM context. It does not automatically create Spec Kit artifacts.
