# 01 — Vision, Mission, and Objectives

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Vision

Arqon ContextOS is the persistent operating layer for governed AI development teams. It turns isolated GPT sessions into role-bound project operators that can share current repo-backed context, communicate through controlled message boxes, save non-official notes, manage official flows, preserve evidence, and advance work through explicit human-governed gates.

## Long-term vision

A human should be able to instantiate a reusable AI team for any repo:

- PM AI for constitution, dossier, specification, planning, milestones, and definitions of done
- Coder AI for tasks, implementation bundles, tests, docs, and Helper packets
- Helper/Codex for local execution, command runs, evidence capture, reports, commits, and pushes when authorized
- Auditor AI for clarification, checklists, analysis, tripwire requirements, milestone audits, integrity gates, and claim review
- Human for flow selection, advancement, exceptions, and final promotion authority

A new GPT session should load the current project state with one command and stop depending on manually pasted history.

## Mission

Arqon ContextOS exists to make AI team workflows persistent, auditable, role-separated, multi-user, multi-repo, and specification-driven.

## Mission commitments

ContextOS must:

- remove daily context reconstruction
- preserve role boundaries
- persist useful context without laundering notes into official artifacts
- support official flow artifacts and gate decisions
- integrate GitHub Spec Kit lifecycle artifacts
- support multi-user operation without forcing every command to name the user
- support multi-repo swarm replication
- keep the human in control of advancement and promotion
- make unsafe or deceptive workflows fail closed

## Primary objectives

### Objective 1 — Daily continuity

A user opens a GPT and runs:

```text
/sync-context
```

The GPT knows current project state, active flows, inbox items, recent decisions, and role authority.

### Objective 2 — Shared but controlled memory

Use notes and messages for non-official saved context and communication.

Rules:

- notes are informal
- messages are informal
- official artifacts must live in flows
- PM must explicitly promote useful ideas into specs/plans

### Objective 3 — Official flow system

Implement and use:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

Flows replace runs at the user level.

### Objective 4 — Spec Kit-aware lifecycle

Support:

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

### Objective 5 — Natural flows, not bottlenecks

Coder and Helper should iterate quickly. Auditor should receive evidence and gate at audit points, not slow every minor iteration.

### Objective 6 — Multi-user support

Both the user and partner must be able to use the same GPT team without every command requiring a user name.

Near-term:

- record actor_role
- optionally record actor_user_label
- add `/whoami` or profile binding later

Long-term:

- OAuth into the ContextOS broker
- per-human identity and audit trail

### Objective 7 — Multi-repo swarms

A config file should define a repo-specific GPT team and generate setup packs for PM, Coder, Auditor, and Helper.

Example future file:

```text
contextos.swarm.yaml
```

## Success definition

ContextOS succeeds when the user can:

1. Start PM GPT and load current state.
2. Create an audit/milestone/phase flow with a short name.
3. Have PM generate Spec Kit-aware docs.
4. Have Coder load the flow and produce tasks/implementation bundle.
5. Have Helper execute in VS Code and write evidence.
6. Have Auditor audit at milestone/risk points.
7. Advance the flow through human-controlled gates.
8. Repeat this across repos without rebuilding the GPT team from scratch.
