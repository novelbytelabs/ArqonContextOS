# 10 — Updated Roadmap, Plan, and Milestones

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Roadmap principle

Build in layers:

1. Preserve the working v0.2 system.
2. Add official flows.
3. Make flows Spec Kit-aware.
4. Add Helper/Codex execution bridge.
5. Add multi-user identity.
6. Add multi-repo swarm replication.
7. Harden evidence and advancement.

Do not jump straight to full autonomy.

## Milestone 0 — ContextOS v0.2 Baseline Stabilized

Status:

Complete.

Includes:

- Cloudflare Worker broker live
- GitHub App connected to ArqonZero
- PM/Coder/Auditor role keys working
- `/sync-context` working
- notes/messages working
- role isolation tested
- OpenAPI 3.0.3 compatibility understood

Exit criteria:

- Do not regress any v0.2 endpoint.
- Do not reintroduce invalid OpenAPI auth schema blocks.
- Do not break role isolation.

## Milestone 1 — Ground Truth Documentation Consolidation

Status:

This bundle.

Purpose:

Merge older docs, user stories, newer design, roadmap, and Spec Kit/multi-user direction into one current ground truth.

Deliverables:

- ground truth doc
- V/M/O doc
- architecture doc
- role authority model
- command model
- flow model
- Spec Kit integration doc
- multi-user/multi-repo doc
- security/governance doc
- updated roadmap and milestones
- implementation plan
- runbook
- user stories

Exit criteria:

- docs reflect flows, not runs
- docs include Spec Kit full command list including `/checklists`
- docs include multi-user and swarm requirements
- docs preserve natural-flow doctrine

## Milestone 2 — Flow Core v0.3

Purpose:

Implement official flow containers.

Commands:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

Endpoints:

- `POST /v1/flows`
- `GET /v1/flows`
- `GET /v1/flows/{flow_ref}`
- `GET /v1/flows/{flow_ref}/status`
- `POST /v1/flows/{flow_ref}/artifacts`
- `POST /v1/flows/{flow_ref}/advance`

Required features:

- project default ArqonZero
- role inferred from bearer key
- name alias such as `flow00`
- canonical flow ID
- duplicate alias fail-closed
- flow_index.json
- flow_manifest.json
- phase/milestone/audit flow types
- basic gate state

Acceptance criteria:

- PM can create `flow00`
- Coder can load `flow00`
- Auditor can load `flow00`
- `/flow-status name="flow00"` works
- unauthorized role actions fail closed
- `/adv-flow` records advancement decision and checks minimum artifacts

## Milestone 3 — Spec Kit-Aware Flow Artifacts v0.4

Purpose:

Integrate Spec Kit lifecycle into flows.

Commands:

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

Artifact slots:

- `speckit/dossier.md`
- `speckit/constitution.md`
- `speckit/spec.md`
- `speckit/clarification.md`
- `speckit/plan.md`
- `speckit/checklists.md`
- `speckit/tasks.md`
- `speckit/analysis.md`
- `artifacts/coder_implementation_bundle.md`
- `artifacts/coder_handoff_to_helper.md`
- `artifacts/helper_execution_report.md`
- `artifacts/evidence_manifest.json`
- `artifacts/auditor_gate_report.md`

Acceptance criteria:

- PM can create dossier/spec/plan artifacts in a flow
- Auditor can write clarification/checklists/analysis/audit artifacts
- Coder can write tasks/implementation bundle
- Helper execution packet is generated for VS Code/Codex
- artifacts are role-bound

## Milestone 4 — Helper/Codex Execution Bridge v0.5

Purpose:

Make VS Code/Codex Helper read the repo, execute the latest flow packet, and report evidence.

Deliverables:

- Helper execution prompt template
- flow packet format
- evidence manifest schema
- command log convention
- commit/push authorization fields
- Coder+Helper iteration loop
- Auditor evidence stream notification

Acceptance criteria:

- Helper can resolve `flow00`
- Helper reads Coder handoff
- Helper executes authorized commands
- Helper writes report and evidence manifest
- Helper does not commit/push unless authorized
- Helper report is available to Coder and Auditor

## Milestone 5 — Context and Broker Hardening v0.6

Purpose:

Strengthen reliability and integrity.

Deliverables:

- retry-on-409 write logic
- context rebuild after broker writes
- archive true move/delete safety or explicit retained-copy semantics
- artifact schema validation
- status-label guard
- claim-language guard
- hash manifest
- evidence completeness score

Acceptance criteria:

- transient GitHub 409s handled safely
- role artifacts validate before write
- missing status labels fail closed
- forbidden claims are flagged
- flow context updates after writes

## Milestone 6 — Multi-User Identity v0.7

Purpose:

Support the user and partner using the same GPTs safely.

Near-term deliverables:

- user metadata schema
- actor_user_label field
- `/whoami` draft command
- explicit "identity unknown" fallback

Long-term deliverables:

- OAuth into ContextOS broker
- per-human user ID
- team membership
- per-user audit trail

Acceptance criteria:

- artifacts record actor_role and actor_user field
- system does not pretend to know identity when it does not
- future OAuth path is documented

## Milestone 7 — Multi-Repo Swarm Generator v0.8

Purpose:

Replicate PM/Coder/Auditor/Helper team for any repo.

Deliverables:

- `contextos.swarm.yaml`
- generator script
- PM GPT instruction pack
- Coder GPT instruction pack
- Auditor GPT instruction pack
- Helper/Codex instruction pack
- conversation starters
- action setup checklist
- repo integration template

Acceptance criteria:

- new repo can be configured from a single file
- generated docs include repo-specific variables
- generated setup pack reduces manual GPT creation friction

## Milestone 8 — Governance Gate Maturity v0.9

Purpose:

Make flow advancement evidence-bound.

Deliverables:

- gate criteria schemas
- Plan Ready gate
- Development Evidence Ready gate
- Integrity Gate Passed gate
- Claim/Promotion Candidate gate
- human decision artifact
- promotion/claim manifest template

Acceptance criteria:

- `/adv-flow` refuses advancement when required artifacts are missing
- high-risk gates require human decision
- audit pass does not equal promotion

## Milestone 9 — ContextOS v1.0

Purpose:

Reusable, stable, multi-user, multi-repo, Spec Kit-aware AI team operating layer.

Success target:

A user can instantiate a repo team, sync context, create flows, use Spec Kit lifecycle artifacts, execute via Helper/Codex, audit at gates, advance by human decision, and preserve all artifacts in GitHub without daily context rebuilding.
