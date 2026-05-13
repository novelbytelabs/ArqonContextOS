# 08 — Multi-User and Multi-Repo Model

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Requirement

ContextOS must support both the user and partner using the same system and GPTs concurrently.

The system must identify who acted without forcing every command to include a user name.

ContextOS must also support replicating a PM/Coder/Auditor/Helper GPT team for additional repos.

## Current limitation

Current broker keys identify role, not human user.

Example:

```text
BROKER_KEY_CODER -> authenticated role = CODER_AI
```

This does not identify whether Mike or a partner is operating the GPT.

## Target identity model

Long-term target:

```text
GPT Action -> OAuth -> ContextOS Broker -> user_id + role + project
```

This lets the broker record:

- actor_user_id
- actor_display_name
- actor_role
- source_gpt
- project
- timestamp

without the user typing identity in every command.

## Near-term identity model

Until OAuth exists:

- infer role from broker key
- record `actor_user_label: unknown` or manual label
- add `/whoami` later
- avoid pretending user identity is cryptographically known

## Multi-user command rules

Normal commands should not require:

```text
user=Mike
```

If the system cannot identify the user yet, the artifact should say so honestly.

## Multi-repo swarm requirement

The user wants to replicate the GPT team per repo.

A future repo config should define the swarm.

Proposed file:

```text
contextos.swarm.yaml
```

Example contents:

```yaml
swarm:
  name: ArqonZeroSwarm
  project: ArqonZero
  repo: novelbytelabs/ArqonZero

roles:
  pm:
    role: PM_AI
    gpt_name: Arqon Zero PM AI
    commands: [/sync-context, /create-flow, /dossier, /constitution, /specify, /plan]
  coder:
    role: CODER_AI
    gpt_name: Arqon Zero Coder AI
    commands: [/sync-context, /load-flow, /tasks, /implement]
  auditor:
    role: AUDITOR_AI
    gpt_name: Arqon Zero Auditor AI
    commands: [/sync-context, /load-flow, /clarify, /checklists, /analyze, /audit]
  helper:
    role: HELPER_CODEX
    name: VS Code Codex Helper
    commands: [/execute]

defaults:
  project_required_in_commands: false
  role_required_in_commands: false
  user_required_in_commands: false
  default_flow_type: audit
```

## Swarm generator target

Future tool:

```text
contextos init-swarm --config contextos.swarm.yaml
```

It should generate:

- PM GPT instruction pack
- Coder GPT instruction pack
- Auditor GPT instruction pack
- Helper/Codex instruction pack
- conversation starters
- OpenAPI action setup notes
- project context templates
- install checklist

Near-term limitation:

GPT creation/editing still happens in GPT Builder manually. The generator should produce setup packs, not claim to auto-create GPTs unless an official supported API exists.
