# 07 — Spec Kit Integration

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Purpose

GitHub Spec Kit provides the specification-driven development backbone. ContextOS provides the multi-agent, repo-backed, role-governed flow and artifact system.

The correct integration is:

```text
Spec Kit owns the development lifecycle.
ContextOS owns the team, flow, artifact, identity, and governance bus.
```

## Full command map

| Command | Source/concept | Owner | Purpose |
|---|---|---|---|
| `/dossier` | ContextOS custom | PM | collect facts before specification |
| `/constitution` | Spec Kit constitution | PM | governing principles |
| `/specify` | Spec Kit specify | PM | what/why requirements |
| `/clarify` | Spec Kit clarify | Auditor | resolve ambiguity |
| `/plan` | Spec Kit plan | PM | technical strategy, milestones, definitions |
| `/checklists` | Spec Kit optional checklists | Auditor primarily, PM request allowed | validate completeness/clarity/consistency |
| `/tasks` | Spec Kit tasks | Coder | task breakdown |
| `/analyze` | Spec Kit analyze | Auditor | cross-artifact consistency |
| `/implement` | Spec Kit implement | Coder | implementation bundle and Helper packet |
| `/execute` | ContextOS/Helper local execution | Helper/Codex | run commands/tests and capture evidence |
| `/audit` | ContextOS audit gate | Auditor | milestone/risk/claim audit |

## `/dossier`

`/dossier` is custom and should happen before `/specify` when the project context is complex.

It gathers:

- current repo context
- recent messages
- saved notes
- current risks
- open blockers
- prior decisions
- relevant docs
- current user intent

## PM-owned Spec Kit stages

PM owns:

- `/constitution`
- `/dossier`
- `/specify`
- `/plan`

PM should generate Spec Kit-compatible artifacts, but must not claim to run local Spec Kit tooling unless Helper/Codex evidence confirms it.

## Auditor-owned Spec Kit stages

Auditor owns:

- `/clarify`
- `/checklists`
- `/analyze`
- `/audit`

Auditor should reduce ambiguity early and gate evidence at audit points.

## Coder-owned Spec Kit stages

Coder owns:

- `/tasks`
- `/implement`

Coder should load PM/Auditor artifacts and produce tasks, implementation bundle, tests/docs patch instructions, and Helper packet.

## Helper/Codex stage

Helper owns:

- `/execute`

Helper executes locally in VS Code/Codex, captures evidence, and writes Helper reports.

## Artifact mapping

ContextOS flow paths:

```text
governance/flows/<FLOW_ID>/speckit/constitution.md
governance/flows/<FLOW_ID>/speckit/dossier.md
governance/flows/<FLOW_ID>/speckit/spec.md
governance/flows/<FLOW_ID>/speckit/clarification.md
governance/flows/<FLOW_ID>/speckit/plan.md
governance/flows/<FLOW_ID>/speckit/checklists.md
governance/flows/<FLOW_ID>/speckit/tasks.md
governance/flows/<FLOW_ID>/speckit/analysis.md
```

Possible local Spec Kit bridge paths:

```text
.specify/memory/constitution.md
specs/<feature>/spec.md
specs/<feature>/plan.md
specs/<feature>/tasks.md
```

## Integration doctrine

Do not let Spec Kit bypass ContextOS governance.

Do not let ContextOS bypass Spec Kit discipline.

The systems should reinforce each other.
