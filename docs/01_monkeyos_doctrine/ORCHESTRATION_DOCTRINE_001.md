# ArqonMonkeyOS Orchestration Doctrine 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## 1. Purpose

This document aligns ArqonMonkeyOS orchestration doctrine before implementing Science Monkeys v0.1 Routes 001.

The system has already integrated Spec Kit conceptually into the Code Monkeys exploit lifecycle. This doctrine clarifies how Spec Kit, Science Monkeys, Code Monkeys, ContextBus, role separation, approval gates, and event/artifact durability fit together.

This is a doctrine alignment document, not an implementation report and not certification.

## 2. Canonical Stack

```text
ArqonMonkeyOS
    governed AI-team operating system

ContextBus
    repo-backed truth, context, message, flow, artifact, gate, and event layer

Science Monkeys
    explore uncertain knowledge

Code Monkeys
    exploit shared findings into governed product/code work

Spec Kit
    Code Monkeys specification lifecycle for dossier/constitution/spec/plan/tasks/implementation

Cloudflare Worker + GitHub App
    broker, auth, route, and write-authority layer
```

## 3. Source-of-Truth Rule

ContextBus remains the operational source of truth.

External agent/orchestration systems may inspire patterns, but must not replace:

- repo-backed flow manifests
- official artifacts
- gate transitions
- Human approvals
- audit reports
- generated context
- broker role/auth boundaries

Any runtime, memory model, or external orchestration framework that bypasses ContextBus is not part of the trusted platform.

## 4. Spec Kit Role

Spec Kit belongs primarily to the Code Monkeys exploit lifecycle.

Spec Kit covers:

```text
/dossier
/constitution
/specify
/plan
/tasks
/implement
/execute
/audit
```

Spec Kit begins after PM_AI receives approved context from Science Monkeys or after a Human initiates product work directly.

Spec Kit must not be used to launder unreviewed Science Monkeys exploration into implementation tasks.

## 5. Science-to-Code Handoff

Science Monkeys do not directly create implementation tasks.

Science Monkeys produce official science records:

```text
research_dossier
hypothesis_card
experiment_protocol
execution_report
audit_report
finding_record
negative_finding_record
inconclusive_finding_record
share_recommendation
share_packet
```

Only a Human-approved official `share_packet` is consumable by PM_AI.

The handoff is:

```text
Science Monkeys finding
→ Science Auditor review
→ Human-approved share_packet
→ PM-visible message/context notification
→ generated PM context update
→ PM_AI considers dossier/constitution/spec/plan
→ Spec Kit / Code Monkeys lifecycle begins
```

`/share` is not Spec Kit.

`/share` is the bridge into possible Spec Kit work.

## 6. Patterns Borrowed from Metaswarm

ArqonMonkeyOS may borrow these patterns:

- recursive orchestration
- explicit specialist roles
- parallel review gates
- adversarial review lanes
- durable records of what was learned
- hard separation between planning, execution, review, and commit

These map to:

```text
Explorer
Hypothesizer
Designer
Science Executor
Science Auditor
Human

PM
Coder
Helper
Code Auditor
Human
```

ArqonMonkeyOS must not copy metaswarm runtime/state wholesale if it duplicates ContextBus or weakens repo-backed governance.

## 7. Patterns Borrowed from Horizons

ArqonMonkeyOS may borrow these patterns:

- declarative agent definitions
- approval gates before execution
- append-only audit logging
- durable per-project/per-organization context
- event-driven orchestration instead of ad hoc chat-only coordination

These map to:

```text
flow manifests
flow artifacts
gate transitions
role permissions
Human approvals
ContextBus records
event/outbox records
generated context snapshots
```

ArqonMonkeyOS must not copy Horizons datastore/runtime as the source of truth.

## 8. Agent Definition Doctrine

Every operational agent identity must be declarative.

At minimum, an agent definition must specify:

- canonical role name
- team membership
- allowed flow types
- allowed artifact types
- forbidden artifact types
- allowed routes
- forbidden routes
- whether it may advance gates
- whether it may execute
- whether it may audit
- whether it may approve
- whether it may create share packets
- context path
- status labels

For Science Monkeys v0.1, required identities are:

```text
EXPLORER_AI
HYPOTHESIZER_AI
DESIGNER_AI
SCIENCE_EXECUTOR_AI
SCIENCE_AUDITOR_AI
HUMAN
```

For Code Monkeys, required identities are:

```text
PM_AI
CODER_AI
HELPER_AI
AUDITOR_AI
HUMAN
```

`HELPER_CODEX` is legacy terminology and must not be used as a new doctrine term.

## 9. Event and Artifact Doctrine

ArqonMonkeyOS should treat official state changes as events plus artifacts.

Official record types include:

- flow creation
- artifact write
- gate transition
- audit result
- Human approval
- share recommendation
- share packet
- PM notification
- generated context update
- quarantine
- rollback
- exception

Events should be append-only or reconstructable from append-only artifacts.

Reports must not pretend that informal chat, notes, or messages are official artifacts unless they are written through approved ContextBus paths.

## 10. Gate Doctrine

Gate transitions are explicit events.

Gate transitions must be:

- role-gated
- precondition-checked
- auditable
- recorded
- Human-controlled where advancement authority is required

Science gate preconditions must remain conjunctive where the PM spec says conjunctive.

Permissive OR-gate language must not be introduced for critical Science gates.

## 11. Approval Doctrine

Human approval is the final authority for advancement and official share.

Client-supplied request-body fields must not grant authority.

For official Human actions, authority must come from authenticated Human credentials or trusted middleware.

Server-derived Human fields include:

```text
human_identity
human_decision_status
approved_by
approved_at
```

## 12. Share Doctrine

`/v1/science/share` is a separate implementation milestone.

Until `/v1/science/share` exists, generic `science_flow` writes of `share_packet` must remain blocked with:

```text
SCIENCE_SHARE_ROUTE_REQUIRED
```

When implemented, `/v1/science/share` must:

1. write official `share_packet`,
2. produce PM-visible notification/context update,
3. preserve source artifact references,
4. preserve share packet hash,
5. preserve evidence level,
6. preserve uncertainty,
7. preserve allowed claims,
8. preserve forbidden claims,
9. prevent duplicate PM context entries through idempotency,
10. fail without silent partial success.

## 13. Testing Doctrine

Every implementation bundle after this doctrine must include:

- unit tests
- integration tests
- end-to-end/live smoke plan when runtime behavior changes
- regression tests
- adversarial tests
- tripwire checks
- guardrail/policy checks
- secret-leak checks
- evidence report template

Offline/injected-store tests are allowed only as integration or policy tests.

Offline/injected-store tests must not be represented as deployed runtime proof.

Live runtime claims require live deployed Worker evidence.

## 14. Audit Timing Doctrine

Audits happen at promotion boundaries, not after every small edit.

Current pattern:

```text
PM bundle
→ Helper/Executor applies and tests
→ live smoke when runtime behavior changed
→ Auditor checkpoint
→ next milestone
```

Current milestone path:

```text
Role/Auth Foundation 001
→ Role/Auth Foundation Audit 001
→ Orchestration Doctrine 001
→ Science Monkeys v0.1 Routes 001
→ Routes Audit 001
→ Science Monkeys v0.1 Share Integration 001
→ Share Audit 001
→ Science Monkeys v0.1 Release-Candidate Evidence Review
```

## 15. Current Role/Auth Foundation Status

Role/Auth Foundation 001 is accepted as development diagnostic evidence.

Current accepted evidence:

- offline Flow Core smoke: PASS
- offline Flow Core policy smoke: PASS
- offline Science role/auth smoke: PASS
- live deployed Worker role/auth smoke: PASS
- Role/Auth Foundation audit: PASS_WITH_WARNINGS, score 86/100

Accepted proof includes:

```text
PM_AI denied Science artifacts
HELPER_AI denied science execution_report
SCIENCE_EXECUTOR_AI execution write proven
SCIENCE_AUDITOR_AI share_recommendation proven
SCIENCE_AUDITOR_AI share_packet denied
generic HUMAN share_packet blocked pending /v1/science/share
code_flow HELPER_AI compatibility proven
v0.2 route compatibility narrowly proven
```

Warnings to carry into Routes 001:

- broker-key uniqueness validation is not enforced yet
- HELPER_CODEX live denial is policy-oracle evidence only unless legacy auth can still produce HELPER_CODEX
- flow creation authority for science_flow must be explicitly decided and tested
- live reports should include raw redacted request/response transcript format
- v0.2 compatibility evidence is narrow
- PM_AI denial tests should expand across Science artifact families

## 16. Routes 001 Doctrine

Science Monkeys v0.1 Routes 001 must implement dedicated Science command routes:

```text
POST /v1/science/research
POST /v1/science/hypothesize
POST /v1/science/design-experiment
POST /v1/science/execute-experiment
POST /v1/science/audit-experiment
POST /v1/science/interpret
POST /v1/science/iterate
POST /v1/science/record-finding
```

Routes 001 must not implement `/v1/science/share`.

Routes 001 must preserve:

- existing role/auth denials
- `SCIENCE_SHARE_ROUTE_REQUIRED`
- code_flow compatibility
- v0.2 route compatibility
- Human-only gate advancement
- no AI certification
- no AI promotion

## 17. Routes 001 Required Guardrails

Routes 001 must include:

- broker-key uniqueness validation or diagnostic endpoint/check
- role/route matrix tests
- route-level denials for Code Monkey roles acting as Science roles
- PM_AI denial across all Science exploration artifact families
- HELPER_AI denial for Science execution evidence
- SCIENCE_EXECUTOR_AI-only execution evidence
- SCIENCE_AUDITOR_AI-only audit evidence and share recommendation
- spoofed body-role denial
- spoofed human_identity denial
- raw redacted HTTP evidence format for live smoke
- tripwire checks for stale Helper/CodeX/OR-gate/self-certification language
- no placeholders, shims, stubs, simulations, fake passes, or bypass flags

## 18. Do-Not-Copy Rule

Do not adopt external frameworks as runtime truth.

Allowed:

- borrow patterns
- write docs
- implement compatible orchestration ideas inside ContextBus

Forbidden:

- replacing ContextBus with external memory
- delegating gate authority to external agent runtime
- bypassing GitHub-backed artifacts
- letting chat history become official source of truth
- letting Spec Kit create Code work from unapproved Science findings

## 19. Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
