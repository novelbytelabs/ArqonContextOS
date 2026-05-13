# CURRENT STATE

Status labels:

- REQUIRES_HUMAN_REVIEW
- development diagnostic only
- NOT SEALED-TEST CERTIFIED
- not promotable

## Active system

Active doctrine treats MonkeyOS / Arqon MonkeyOS as the umbrella platform and ContextBus as the repo-backed infrastructure layer formerly called ContextOS.
Arqon Zero remains the first project/product using this system.

## Current architecture

- PM GPT / Coder GPT / Auditor GPT
- Helper/Codex in VS Code
- Cloudflare Worker broker
- GitHub App bridge
- ArqonContextOS public infrastructure repo (current repo name; rename not yet authorized)
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

- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/`](../ground_truth/arqon_contextos_merged_ground_truth_docs/)

## Doctrine shift (active, docs-level)

- MonkeyOS / Arqon MonkeyOS is now treated as the umbrella platform.
- ContextBus is the infrastructure layer formerly called ContextOS.
- Science Monkeys represent explore workflow.
- Code Monkeys represent exploit workflow.
- Arqon Zero remains the first project/product using this system.
- GitHub repository rename is complete: `ArqonContextOS` -> `ArqonMonkeyOS`.
- Local directory may still remain `ArqonContextOS` until a separate filesystem rename step is approved and executed.
- ContextOS remains legacy terminology.
- ContextBus remains the infrastructure layer.
- Runtime and API behavior have NOT changed in this migration step.
- Science Monkeys and Code Monkeys are doctrine/planned workflow layers and are not fully implemented broker capabilities yet.
