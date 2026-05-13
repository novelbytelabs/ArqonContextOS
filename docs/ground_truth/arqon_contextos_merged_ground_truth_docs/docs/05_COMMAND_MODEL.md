# 05 — Command Model

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Command design principles

Commands must be short, role-aware, and defaulted.

Normal users should not need to provide:

- `project=ArqonZero`
- `role=PM_AI`
- long flow IDs
- separate artifact-write commands after every major command

## Existing working commands

### `/sync-context`

Loads current role context.

Preferred usage:

```text
/sync-context
```

Explicit usage still allowed:

```text
/sync-context project=ArqonZero role=PM_AI
```

### `/sync-constitution`

Loads current role constitution/governance context.

### `/save-context`

Saves non-official context note.

Example:

```text
/save-context title="Coder deception-resistance suggestions" tags=contextos,deception,governance
```

### `/send-message`

Sends non-official directed message.

Example:

```text
/send-message to=PM_AI subject="Review saved suggestions"
```

The `from` role should be inferred from the broker key.

### `/inbox`

Lists messages for the authenticated role.

### `/open-message`

Opens a message by ID.

### `/archive-message`

Archives a message. Current v0.2 behavior is safe copy-to-archive.

## Planned flow commands

### `/create-flow`

Creates official flow container.

Preferred:

```text
/create-flow type=audit name="flow00"
```

Rules:

- PM GPT only
- `type` not `flow-type`
- `name` is required and human-friendly
- project defaults to ArqonZero
- role inferred
- PM artifacts should be written automatically

### `/load-flow`

Loads flow by name or ID.

Preferred:

```text
/load-flow name="flow00"
```

### `/flow-status`

Shows stage, next actor, blockers, gate state, evidence state, and human action required.

### `/adv-flow`

Advances flow after criteria/human decision.

Preferred:

```text
/adv-flow name="flow00" decision="milestone-1-approved"
```

### `/write-flow`

Manual/backend primitive for official artifact writes.

Users should rarely need this because role-specific commands should auto-write the proper artifacts.

## Planned Spec Kit-aware commands

PM:

- `/dossier`
- `/constitution`
- `/specify`
- `/plan`

Auditor:

- `/clarify`
- `/checklists`
- `/analyze`
- `/audit`

Coder:

- `/tasks`
- `/implement`

Helper:

- `/execute`

## Command compatibility notes

The GPT Action OpenAPI schema should be GPT-compatible:

- OpenAPI `3.0.3`
- no `bearerAuth` security block
- bearer keys configured in GPT Builder UI
- inbox endpoint path is `/v1/messages/inbox`
- send message endpoint remains `POST /v1/messages`
