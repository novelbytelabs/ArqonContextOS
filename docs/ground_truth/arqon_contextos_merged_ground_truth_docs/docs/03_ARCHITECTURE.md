# 03 — Architecture

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## System architecture

```text
Human operator(s)
  -> PM / Coder / Auditor GPTs
  -> GPT Actions
  -> Cloudflare Worker broker
  -> GitHub App installation token
  -> project repo such as ArqonZero
  -> context, notes, messages, flows, artifacts, evidence
```

## Component responsibilities

### GPTs

Role-bound user interfaces.

They do not own durable state. They load and write through ContextOS.

### Cloudflare Worker broker

Owns:

- role authentication
- project mapping
- path allowlists
- endpoint routing
- GitHub App token usage
- safe writes to governance paths
- role isolation

### GitHub App

Owns scoped repo access.

The app should be installed only on approved repos in the security domain.

### Project repo

Owns durable state.

ArqonZero stores:

- generated context
- messages
- notes
- flows
- official artifacts
- evidence
- decisions

### ArqonContextOS repo

Owns reusable infrastructure and docs.

## Data object hierarchy

```text
Project
  Context
  Users / team metadata
  Notes
  Messages
  Flows
    Flow manifest
    Spec Kit artifacts
    Role artifacts
    Evidence artifacts
    Gate state
    Human decisions
```

## Object classes

| Object | Official? | Purpose |
|---|---:|---|
| Context snapshot | Yes, generated state | Load current role context |
| Note | No | Save idea/analysis/suggestion |
| Message | No | Directed role-to-role communication |
| Flow | Yes | Official workflow container |
| Flow artifact | Yes | Official role work product |
| Evidence manifest | Yes | Execution/audit evidence |
| Human decision | Yes | Advancement, exception, promotion decision |

## Path rules

Broker writes should be restricted to governance paths.

Allowed future roots:

- `governance/context/`
- `governance/notes/`
- `governance/messages/`
- `governance/flows/`
- `governance/ledger/`

Forbidden roots/components:

- `.env`
- `secrets/`
- `sealed/`
- `holdout/`
- `models/`
- `data/`
- `private/`
- `credentials/`
- private keys
- broker keys

## Broker auth

Role keys identify role. Future OAuth/user identity identifies the human.

Near-term identity:

```text
role = inferred from broker key
user = unknown/manual label
```

Target identity:

```text
role = GPT/broker role
user = OAuth identity
repo/team = project config
```
