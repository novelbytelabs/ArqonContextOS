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
- ArqonMonkeyOS public infrastructure repo
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

- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/README.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/README.md)

## Doctrine shift (active, docs-level)

- MonkeyOS / Arqon MonkeyOS is now treated as the umbrella platform.
- ContextBus is the infrastructure layer formerly called ContextOS.
- Science Monkeys represent explore workflow.
- Code Monkeys represent exploit workflow.
- Arqon Zero remains the first project/product using this system.
- GitHub repository rename is complete: `ArqonContextOS` -> `ArqonMonkeyOS`.
- Local directory rename is complete: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS`.
- ContextOS remains legacy terminology.
- ContextBus remains the infrastructure layer.
- Historical and archival docs intentionally preserve legacy ContextOS references for traceability.
- Runtime and API behavior have NOT changed in this migration step.
- Science Monkeys and Code Monkeys are doctrine/planned workflow layers and are not fully implemented broker capabilities yet.

## Flow Core v0.3 implementation status

Flow Core v0.3 implementation is now being introduced as the first official flow container layer for ArqonMonkeyOS / ContextBus.

The implementation target adds broker routes for:

- `POST /v1/flows`
- `GET /v1/flows`
- `GET /v1/flows/{flow_ref}`
- `GET /v1/flows/{flow_ref}/status`
- `POST /v1/flows/{flow_ref}/artifacts`
- `POST /v1/flows/{flow_ref}/advance`

Flow Core v0.3 supports the flow families:

- `science_flow`
- `code_flow`
- `audit_flow`
- `governance_flow`

The existing v0.2 context, constitution, notes, and messages capabilities remain in place.

Required status remains:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## ArqonMonkeyOS Orchestration Doctrine 001

ArqonMonkeyOS Orchestration Doctrine 001 is now the active alignment layer before Science Monkeys v0.1 Routes 001.

Current accepted status:

- Role/Auth Foundation 001 offline evidence: PASS
- Role/Auth Foundation 001 live deployed Worker evidence: PASS
- Role/Auth Foundation Audit 001: PASS_WITH_WARNINGS, score 86/100
- Next implementation milestone: Science Monkeys v0.1 Routes 001

The doctrine clarifies:

- Spec Kit belongs to the Code Monkeys exploit lifecycle.
- Science Monkeys produce audited findings and Human-approved share packets.
- `/share` is the bridge into PM context, not Spec Kit itself.
- /share is the bridge into PM context.
- ContextBus remains the source of truth.
- metaswarm/Horizons-style ideas may inspire orchestration and gates, but their runtimes/datastores are not adopted.
- Routes 001 must preserve Role/Auth Foundation denials and keep generic science `share_packet` blocked pending `/v1/science/share`.

Required status remains:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
