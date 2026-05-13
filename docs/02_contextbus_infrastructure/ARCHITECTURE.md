# Architecture

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## System overview

Arqon ContextOS connects GPT role agents to repo-backed context and artifact storage.

```text
PM / Coder / Auditor GPTs
  -> GPT Action
  -> Cloudflare Worker broker
  -> GitHub App installation token
  -> private project repos
  -> generated context files and run artifacts
```

## Main components

### 1. Cloudflare Worker broker

The broker authenticates GPT Action calls, enforces role permissions, maps projects to repos, and reads/writes only allowlisted governance paths.

### 2. GitHub App

The GitHub App provides scoped repository access. It should be installed only on repos in the same security domain.

### 3. Project context package

Each project repo contains:

- `governance/context/`
- `governance/runs/`
- `governance/messages/`
- `governance/notes/`
- `governance/ledger/`
- `scripts/build_gpt_context.py`
- `.github/workflows/build-gpt-context.yml`

### 4. GPT commands

The GPTs use instruction-level commands that map to broker endpoints:

- `/sync-constitution`
- `/sync-context`
- `/save-context`
- `/send-message`
- `/inbox`
- `/open-message`
- `/create-run`
- `/load-run`
- `/write-artifact`
- `/checkpoint`

## Authority model

PM proposes.  
Coder implements.  
Helper executes.  
Auditor verifies.  
Human promotes.

No AI self-certifies.
