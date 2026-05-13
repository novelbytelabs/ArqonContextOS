# 02 — Current System Status

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Operational state

ContextOS v0.2 is operational for context sync, non-official notes, and role messages.

## Proven working pieces

| Capability | Status |
|---|---|
| Cloudflare Worker health | Working |
| GitHub App private repo access | Working |
| ArqonZero project context generation | Working |
| PM/Coder/Auditor role keys | Working |
| Role isolation | Working |
| `/sync-context` | Working |
| `/sync-constitution` | Working as context/constitution route |
| `/save-context` | Working |
| `/send-message` | Working |
| `/inbox` | Working |
| `/open-message` | Working |
| `/archive-message` | Working as safe copy-to-archive |

## Repos

### ArqonContextOS

Public infrastructure repo.

Owns:

- Worker source
- OpenAPI schema
- docs
- schemas
- project templates
- GPT command docs

### ArqonZero

Private project repo.

Owns:

- generated role contexts
- context manifest
- notes
- messages
- future flows
- evidence artifacts

## Live broker

```text
https://arqon-contextos-broker.sonarum.workers.dev
```

## Important OpenAPI rule

Use OpenAPI `3.0.3` for GPT Action compatibility.

Do not put bearer auth blocks in the schema.

Correct model:

```text
OpenAPI schema = endpoint and parameter shape
GPT Builder UI = API Key / Bearer authentication
```

Do not paste `Bearer <key>` into GPT Builder.

Paste only the raw broker key.

## GitHub App current state

GitHub App is owned by `novelbytelabs` and installed on ArqonZero.

Needed permissions:

- Metadata: read-only
- Contents: read/write

Contents read/write is required for notes/messages and future flows.

Do not commit the GitHub App private key. Do not paste it into chat.

## Known limitations

| Limitation | Status |
|---|---|
| Flow commands not implemented | next |
| Spec Kit-aware artifact commands not implemented | planned after Flow Core |
| Multi-user identity not implemented | planned |
| Multi-repo swarm generator not implemented | planned |
| GitHub Contents 409 retry missing | hardening needed |
| Archive is safe copy, not true move/delete | acceptable v0.2 |
| Context rebuild after broker writes is incomplete | hardening needed |

## Do not regress

Do not reintroduce `/create-run`, `/load-run`, or `/write-artifact` as the primary user model.

User-facing official workflow commands should now be flow-based.
