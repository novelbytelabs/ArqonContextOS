# 15 — User Stories and Acceptance Criteria

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Story 1 — Daily context continuity

As the human operator, I want each GPT to load current Arqon Zero state from the repo through a simple command, so I do not rebuild context manually every day.

Acceptance criteria:

- PM loads PM context.
- Coder loads Coder context.
- Auditor loads Auditor context.
- role isolation works.
- repo state is durable memory.

## Story 2 — Human-orchestrated operation

As the human operator, I want to manually open and command each GPT while state persists through ContextOS, so I keep control without copy/paste overhead.

Acceptance criteria:

- no always-on GPT push requirement.
- Cloudflare stores/serves state.
- GitHub stores artifacts.
- human final authority preserved.

## Story 3 — Notes and messages are informal

As the human operator, I want Coder/Auditor suggestions saved and sent to PM without turning them into official artifacts.

Acceptance criteria:

- `/save-context` marks `official_artifact: false`.
- `/send-message` marks `official_artifact: false`.
- PM must explicitly promote ideas into official specs/plans.

## Story 4 — Flows replace runs

As the human operator, I want named flows instead of isolated runs, so a sprint/milestone/audit sequence has one durable home.

Acceptance criteria:

- `/create-flow`, `/load-flow`, `/flow-status`, `/adv-flow` exist.
- flow holds PM, Coder, Helper, Auditor, and Human artifacts.
- name alias maps to canonical flow ID.

## Story 5 — Short command defaults

As the human operator, I want commands to infer project and role, so I can type `/load-flow name="flow00"` instead of long boilerplate.

Acceptance criteria:

- project defaults to ArqonZero.
- role inferred from broker key.
- conflicting role requests fail closed.

## Story 6 — PM sprint planning

As the human operator, I want PM GPT to turn vision/objectives into a flow-ready sprint with phases, milestones, definitions of done, and audit points.

Acceptance criteria:

- PM creates dossier/spec/plan.
- PM defines audit points.
- PM defines gate criteria.
- PM writes flow artifacts automatically.

## Story 7 — Coder + Helper fast iteration

As the human operator, I want Coder and Helper to iterate quickly while Auditor receives evidence for gates.

Acceptance criteria:

- Coder loads flow.
- Coder writes tasks/implementation/Helper packet.
- Helper executes packet.
- Helper report goes to Coder.
- Helper evidence available to Auditor.

## Story 8 — Auditor at logical audit points

As the human operator, I want Auditor to gate milestones, claims, risky subsystems, and deception-sensitive work without slowing every small iteration.

Acceptance criteria:

- PM plan includes audit points.
- Auditor can clarify early.
- Auditor can generate checklists.
- Auditor can audit milestone evidence.
- Auditor uses logical gates, not arbitrary score.

## Story 9 — Spec Kit-aware development

As the system designer, I want ContextOS flows to store Spec Kit-compatible artifacts, so the workflow is specification-driven and compatible with VS Code/Codex Spec Kit use.

Acceptance criteria:

- `/constitution`, `/specify`, `/plan`, `/tasks`, `/implement` map to Spec Kit lifecycle.
- `/dossier`, `/execute`, `/audit` complete the ContextOS-specific lifecycle.
- artifacts stored in flow folders.

## Story 10 — Multi-user operation

As a team, both human users should operate the GPT swarm without specifying user identity in every command.

Acceptance criteria:

- current role identity still works.
- future user identity layer is planned.
- artifacts record actor role and eventually actor user.

## Story 11 — Multi-repo swarms

As the system owner, I want to replicate the GPT team for any repo from a config file.

Acceptance criteria:

- `contextos.swarm.yaml` defines repo/team variables.
- setup packs can be generated.
- commands and roles remain consistent across repos.

## Story 12 — Evidence-bound advancement

As the human operator, I want `/adv-flow` to advance only when required artifacts/gates exist.

Acceptance criteria:

- missing evidence blocks advancement.
- human decision recorded.
- promotion-level advancement requires human authority.
- audit pass does not equal promotion.
