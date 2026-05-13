# 00 — Arqon ContextOS Ground Truth

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## One-sentence summary

Arqon ContextOS is a repo-backed, Cloudflare-served, GitHub App-powered operating layer that lets PM, Coder, Auditor, Helper/Codex, and human operators share persistent project context, messages, notes, flows, Spec Kit-compatible artifacts, execution evidence, and gate decisions without manual copy/paste or daily context reconstruction.

## Core problem

The real problem is not that GPTs need files. The real problem is that every new GPT session starts without the working state of the project. The human has had to rebuild context every day by manually choosing which decisions, specs, reports, logs, policies, and current-state facts to paste into each AI.

ContextOS fixes this by making the repository the durable memory and Cloudflare the controlled broker. GPTs do not rely on chat memory. GPTs pull current state through role-bound Actions.

## Current architecture

```text
PM / Coder / Auditor GPTs
  -> GPT Actions with role-specific bearer keys
  -> Cloudflare Worker broker
  -> GitHub App installation token
  -> private project repo such as ArqonZero
  -> generated context, notes, messages, future flows, and evidence artifacts
```

## Current repos

| Repo | Current role |
|---|---|
| `ArqonContextOS` | Public infrastructure repo: Worker, OpenAPI, docs, schemas, templates |
| `ArqonZero` | Private project repo: generated context, messages, notes, future flows, evidence |

## Current live broker

```text
https://arqon-contextos-broker.sonarum.workers.dev
```

## Current implemented capability

Working v0.2 capabilities:

- `/sync-context`
- `/sync-constitution`
- `/save-context`
- `/send-message`
- `/inbox`
- `/open-message`
- `/archive-message` as safe copy-to-archive
- PM/Coder/Auditor role isolation
- private ArqonZero context loading through Cloudflare/GitHub App
- note writes into ArqonZero through broker
- message writes into ArqonZero through broker

## Current not-yet-implemented capability

Next capabilities:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`
- Spec Kit-aware commands: `/dossier`, `/constitution`, `/specify`, `/clarify`, `/plan`, `/checklists`, `/tasks`, `/analyze`, `/implement`, `/execute`, `/audit`
- multi-user identity
- multi-repo swarm generator
- context rebuild after broker writes
- GitHub Contents `409` retry hardening
- claim/status/evidence hardening

## Correct abstraction

The old “run” model is superseded.

Use:

```text
flow
```

not:

```text
run
```

Reason:

A run sounds like one task or one execution. A flow can hold a sprint, milestone, phase group, audit point, Coder/Helper loop, Auditor gate, and human advancement decision.

## Command defaults

Commands must be short.

Normal use should not require:

- `project=ArqonZero`
- `role=CODER_AI`
- a long `flow_id`
- repeated `/write-artifact` calls after every GPT response

Defaults:

| Field | Default behavior |
|---|---|
| project | ArqonZero |
| role | inferred from broker key / GPT identity |
| flow reference | `name` alias preferred, `flow_id` optional |
| flow type | audit unless user specifies phase or milestone |

## Human-friendly flow names

The `name` field in `/create-flow` is a short alias.

Example:

```text
/create-flow type=audit name="flow00"
```

The system may create:

```text
FLOW-2026-0001
```

but the human should usually load it with:

```text
/load-flow name="flow00"
```

The broker must maintain a name-to-ID index and reject duplicate active aliases.

## Authority doctrine

PM specifies and plans.  
Coder tasks and implements.  
Helper executes and captures evidence.  
Auditor clarifies, analyzes, audits, and gates.  
Human advances and controls promotion.

No AI self-certifies.  
No AI auto-promotes.  
No AI silently changes another role’s authority.

## Natural-flow doctrine

Do not force every step through Auditor.

Fast path:

```text
PM creates sprint/flow plan
Coder implements milestone chunk
Helper executes and reports
Coder repairs/iterates with Helper
Auditor receives evidence stream and audits at audit points
Human advances flow
```

Auditor is critical, but should be invoked at logical audit points, risk triggers, milestone boundaries, tripwire failures, claim/promotion requests, and high-risk subsystem boundaries.

## Spec Kit integration doctrine

ContextOS should not replace GitHub Spec Kit.

ContextOS wraps and governs it.

```text
Spec Kit = specification-driven development lifecycle
ContextOS = role/team/repo/flow/artifact/message/evidence bus
```

## Required status

Every governance-sensitive artifact must preserve:

REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable
