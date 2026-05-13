# CURRENT STATE

Status labels:

- REQUIRES_HUMAN_REVIEW
- development diagnostic only
- NOT SEALED-TEST CERTIFIED
- not promotable

## Active system

Arqon ContextOS is the repo-backed context, flow, artifact, message, and governance bus for Arqon Zero GPT teams.

## Current architecture

- PM GPT / Coder GPT / Auditor GPT
- Helper/Codex in VS Code
- Cloudflare Worker broker
- GitHub App bridge
- ArqonContextOS public infrastructure repo
- ArqonZero private project repo

## Current deployed broker

- `https://arqon-contextos-broker.sonarum.workers.dev`

## Current GitHub App public/config facts

- Owner: `novelbytelabs`
- App ID: `3692366`
- Client ID: `Iv23livjRunPFouGGCHq`
- Installation ID: `131807356`
- Installed on: ArqonZero only
- Permissions: Contents read/write, Metadata read-only

## Current working capabilities

- `/sync-context`
- `/sync-constitution`
- `/save-context`
- `/send-message`
- `/inbox`
- `/open-message`
- `/archive-message` (safe copy-to-archive)
- role isolation
- private ArqonZero context fetch through broker
- notes/messages through broker

## Current not-yet-implemented capabilities

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`
- Spec Kit-aware commands:
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
- multi-user identity
- multi-repo swarm generator
- 409 retry hardening
- context rebuild after broker writes

## Next recommended milestone

Flow Core v0.3 is the next implementation target.

Required Flow Core commands:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

## Current transition instruction

The new PM AI instance must inspect merged ground-truth docs and this current state file before planning new work.

Ground-truth docs root:

- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/`](./ground_truth/arqon_contextos_merged_ground_truth_docs/)
