# 14 — Command Runbook Cheat Sheet

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Quick start

### PM GPT

```text
/sync-context
/inbox
/create-flow type=audit name="flow00"
/dossier
/constitution
/specify
/plan
/flow-status name="flow00"
```

### Coder GPT

```text
/sync-context
/load-flow name="flow00"
/tasks
/implement
```

### Auditor GPT

```text
/sync-context
/load-flow name="flow00"
/clarify
/checklists
/analyze
/audit
```

### Helper/Codex in VS Code

```text
/execute name="flow00"
```

or natural instruction:

```text
Load flow00 from ContextOS, read the latest Helper packet, execute it exactly, capture evidence, and write the Helper report.
```

### Human

```text
/flow-status name="flow00"
/adv-flow name="flow00" decision="milestone-1-approved"
```

## Implemented v0.2 commands

| Command | Status | Purpose |
|---|---|---|
| `/sync-context` | implemented | load role context |
| `/sync-constitution` | implemented | load constitution/governance context |
| `/save-context` | implemented | save non-official note |
| `/send-message` | implemented | send non-official message |
| `/inbox` | implemented | list role inbox |
| `/open-message` | implemented | open message |
| `/archive-message` | implemented as copy | archive message safely |

## Planned v0.3 flow commands

| Command | Owner | Purpose |
|---|---|---|
| `/create-flow` | PM | create official flow container |
| `/load-flow` | any role | load role-specific flow view |
| `/flow-status` | any role | show state/blockers/gates |
| `/adv-flow` | Human/PM with human instruction | advance flow |
| `/write-flow` | backend/manual | official artifact write primitive |

## Planned Spec Kit-aware commands

| Command | Owner | Purpose |
|---|---|---|
| `/dossier` | PM | gather context before spec |
| `/constitution` | PM | governing principles |
| `/specify` | PM | what/why requirements |
| `/clarify` | Auditor | resolve ambiguity |
| `/plan` | PM | technical plan and milestones |
| `/checklists` | Auditor/PM request | validate completeness/clarity/consistency |
| `/tasks` | Coder | actionable task list |
| `/analyze` | Auditor | consistency check |
| `/implement` | Coder | implementation bundle and Helper packet |
| `/execute` | Helper | run commands and capture evidence |
| `/audit` | Auditor | milestone/risk/claim gate |

## Defaults

| Parameter | Default |
|---|---|
| project | ArqonZero |
| role | inferred from GPT/broker key |
| flow reference | `name` alias preferred |
| flow type | audit if omitted |

## Examples

Create an audit flow:

```text
/create-flow type=audit name="flow00"
```

Load a flow:

```text
/load-flow name="flow00"
```

Check status:

```text
/flow-status name="flow00"
```

Advance a milestone:

```text
/adv-flow name="flow00" decision="milestone-1-approved"
```

Save a Coder idea:

```text
/save-context title="Improve broker retry logic" tags=contextos,hardening
```

Send PM a message:

```text
/send-message to=PM_AI subject="Review broker retry note"
```

Read inbox:

```text
/inbox
```

Open message:

```text
/open-message message_id="MSG-..."
```

## Troubleshooting

### ROLE_MISMATCH

The requested role does not match the authenticated GPT role. This is usually good.

### 403 from GPT Action but curl works

Likely GPT Builder auth problem. Recreate action, set API Key → Bearer, paste raw role key only.

### GPT Builder schema crash

Use OpenAPI 3.0.3. Do not include bearerAuth/securitySchemes in schema.

### GitHub 409

Concurrent write conflict. Retry sequentially for now. Add v0.6 retry-on-409 hardening.

### Archive leaves inbox copy

Expected v0.2 safe-copy behavior.

## Required status block

REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable
