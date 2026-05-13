# MonkeyOS / ContextBus Doctrine and Rename Readiness PM Spec

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## 1. Purpose

This document captures the doctrine shift from treating **Arqon ContextOS** as the whole system to treating it as the infrastructure layer inside a larger platform called **MonkeyOS**.

The immediate goal is not to rename files blindly. The goal is to establish the canonical language, system boundaries, migration rules, and readiness gates so the repo and docs can be renamed cleanly without breaking meaning, governance, commands, or future development.

## 2. Doctrine Decision

The current project has evolved beyond a context broker and beyond a Code Monkeys-only workflow.

The system now has two major operating modes:

1. **Explore** — discover, test, audit, record, and share knowledge.
2. **Exploit** — convert validated knowledge into specifications, tasks, code, evidence, and governed products.

Therefore the old name **ContextOS** is too broad and too narrow at the same time:

- Too broad because it was being used to mean the whole AI-team operating system.
- Too narrow because the system now needs science/exploration workflows, not only context persistence.

The new doctrine is:

> **MonkeyOS is the governed AI-team operating system. ContextBus is its repo-backed infrastructure layer. Science Monkeys explore uncertain knowledge. Code Monkeys exploit validated knowledge into products. Arqon Zero is the first project running on the platform.**

## 3. Canonical Taxonomy

| Name | Canonical Meaning |
|---|---|
| **MonkeyOS** | Overall platform / umbrella operating system for governed AI teams |
| **ContextBus** | Infrastructure layer formerly called ContextOS: context, messages, flows, artifacts, gates, governance, repo persistence |
| **Science Monkeys** | Explore team: research, hypothesize, design experiments, execute, audit, record, share |
| **Code Monkeys** | Exploit team: dossier, constitution, specification, plan, tasks, implementation, execution, audit |
| **Arqon Zero** | First project/product using MonkeyOS |

## 4. System Model

```text
MonkeyOS
├── ContextBus
│   ├── context snapshots
│   ├── constitutions
│   ├── messages
│   ├── notes
│   ├── flows
│   ├── artifacts
│   ├── gate states
│   ├── governance records
│   └── evidence references
│
├── Science Monkeys
│   ├── Explorer GPT
│   ├── Hypothesizer GPT
│   ├── Designer GPT
│   ├── Executor AI
│   └── Auditor GPT
│
├── Code Monkeys
│   ├── PM GPT
│   ├── Coder GPT
│   ├── Helper/Codex AI
│   └── Auditor GPT
│
└── Projects
    └── Arqon Zero
```

## 5. Core Operating Principle

```text
Science Monkeys explore truth.
ContextBus preserves and governs truth.
Code Monkeys exploit validated truth.
Human operators control advancement and promotion.
MonkeyOS is the whole operating system.
```

## 6. Explore vs. Exploit Boundary

### Science Monkeys: Explore

Science Monkeys transform uncertainty into audited knowledge.

Science flow:

```text
Explore → Hypothesize → Design → Execute → Audit → Interpret/Iterate → Record → Share
```

Science Monkeys produce:

- Research dossiers
- Hypothesis cards
- Experiment protocols
- Execution reports
- Audit reports
- Finding records
- Share packets

### Code Monkeys: Exploit

Code Monkeys transform shared findings or product direction into governed software/product work.

Code flow:

```text
Dossier → Constitution → Specification → Plan → Tasks → Implementation → Execute → Audit
```

Code Monkeys produce:

- Product dossiers
- Constitutions
- Specifications
- Plans
- Task bundles
- Implementation bundles
- Execution evidence
- Audit reports

### Bridge

The bridge is:

```text
/share → PM context → /dossier
```

A Science Monkeys `/share` does not mean the finding is certified, promoted, or product-ready. It means the audited finding is now available as governed context for PM consideration.

## 7. Role Doctrine

### Science Monkeys

| Role | Owns | Forbidden |
|---|---|---|
| Explorer GPT | Research, source gathering, contradiction discovery, problem framing, prior art | Declaring proof, designing final tests alone, executing, auditing itself, cherry-picking |
| Hypothesizer GPT | Falsifiable hypotheses, null hypotheses, predictions, interpretation, iteration proposals | Changing hypotheses after results, certifying, promoting, hiding failed hypotheses |
| Designer GPT | Experiment protocols, controls, metrics, thresholds, sealed/holdout rules, execution packet | Executing, changing gates after results, certifying, promoting |
| Executor AI | Running protocols, command logs, raw evidence capture, deviation reporting | Redesigning, interpreting final meaning, changing thresholds, fabricating evidence |
| Auditor GPT | Checklists, critique, evidence review, claim-scope review, audit gates | Executing, promoting, self-certifying, rewriting results |

### Code Monkeys

| Role | Owns | Forbidden |
|---|---|---|
| PM GPT | Vision, dossier, constitution, specification, plan, milestones, definitions of done, gate criteria | Coding implementation, executing local tooling, certifying, promoting |
| Coder GPT | Tasks, implementation bundles, code-level plans within PM constraints | Owning doctrine, changing gates, executing as proof, certifying, promoting |
| Helper/Codex AI | Local execution, tests, commands, evidence capture | Planning, substantive redesign, unauthorized schema fixes, certifying, promoting |
| Auditor GPT | Clarification, checklists, analysis, audit gates, integrity review | Implementing, promoting, self-certifying |
| Human | Advancement, acceptance, promotion authority | N/A as final authority |

No AI may certify or promote.

## 8. Command Doctrine Impact

### Existing ContextOS v0.2 commands remain legacy-compatible

Working commands remain:

```text
/sync-context
/sync-constitution
/save-context
/send-message
/inbox
/open-message
/archive-message
```

These should not be broken during the rename.

### Flow Core v0.3 remains the next build milestone

Flow Core commands remain required:

```text
/create-flow
/load-flow
/flow-status
/adv-flow
/write-flow
```

But Flow Core must now be generic enough to support both Science Monkeys and Code Monkeys.

### Future Science Monkeys command family

Candidate command family:

```text
/research
/hypothesize
/design-experiment
/execute-experiment
/audit-experiment
/interpret
/iterate
/record-finding
/share
```

### Future Code Monkeys command family

Spec Kit-aware lifecycle commands:

```text
/dossier
/constitution
/specify
/clarify
/plan
/checklists
/tasks
/analyze
/implement
/execute
/audit
```

### Future team/admin commands

```text
/whoami
/team-status
/create-swarm
/load-swarm
/sync-swarm
/repo-status
```

## 9. Flow Core v0.3 Naming Requirement

Flow Core must not assume every flow is a Code Monkeys flow.

Minimum supported flow families should be:

| Flow Family | Purpose |
|---|---|
| `science_flow` | Explore / hypothesis / experiment / audit / share |
| `code_flow` | Dossier / spec / plan / tasks / implement / execute / audit |
| `audit_flow` | Independent integrity review |
| `governance_flow` | Constitution, doctrine, policy, role, gate, or naming changes |

Flow Core v0.3 should preserve:

- project defaulting to `ArqonZero`
- role inferred from GPT/broker key
- human-friendly flow `name`
- canonical `flow_id`
- `type` replacing `flow-type`
- no requirement to type project or role in normal use

## 10. Rename Doctrine

### Proposed renames

| Old | New | Notes |
|---|---|---|
| Arqon ContextOS / ContextOS as whole platform | MonkeyOS | Umbrella platform name |
| ContextOS infrastructure layer | ContextBus | Broker/context/flow/governance bus |
| ArqonContextOS repo | candidate: `MonkeyOS` or `ContextBus` | Requires human decision |
| ContextOS docs | MonkeyOS + ContextBus docs | Split platform doctrine from infrastructure docs |

### Conservative naming rule

Do not delete or rewrite all old naming at once.

Use a compatibility transition:

```text
Arqon ContextOS / ContextOS = legacy name for what is now split into MonkeyOS + ContextBus.
```

Then migrate docs, APIs, schemas, and repo names in controlled stages.

## 11. Repo Rename Readiness Gates

Before renaming the repo, the PM spec should require:

1. Inventory of all `ContextOS`, `ArqonContextOS`, and contextos references.
2. Decision on final repo name:
   - `MonkeyOS`
   - `ArqonMonkeyOS`
   - `ContextBus`
   - `ArqonContextBus`
   - other human-approved name
3. Decision on whether public infrastructure repo should be umbrella repo or infrastructure-only repo.
4. Compatibility note added to docs.
5. New architecture doctrine document added.
6. README updated without breaking existing command truth.
7. OpenAPI naming reviewed.
8. Worker route naming reviewed.
9. Schema naming reviewed.
10. Project templates naming reviewed.
11. GitHub Pages / docs site naming reviewed.
12. External URLs and GPT Action URLs reviewed before any repo rename.
13. Human approval required before actual GitHub repo rename.

## 12. Recommended Conservative Migration Sequence

### Step 1 — Doctrine capture

Create a canonical doctrine document defining:

- MonkeyOS
- ContextBus
- Science Monkeys
- Code Monkeys
- Arqon Zero
- Explore vs Exploit
- Share boundary
- role authority
- anti-deception rules

### Step 2 — Rename readiness spec

Create a PM spec for a safe rename/migration.

The spec should not rename code yet. It should define inventory, acceptance criteria, rollback plan, and required human decision points.

### Step 3 — Documentation migration

Update docs first:

- README
- architecture docs
- command docs
- roadmap docs
- ground-truth docs
- glossary

Mark old ContextOS terminology as legacy.

### Step 4 — Flow Core v0.3 under new doctrine

Implement Flow Core as MonkeyOS/ContextBus-aware, not Code Monkeys-only.

### Step 5 — API/schema/source rename

Only after docs and Flow Core doctrine are stable, migrate internal names carefully.

### Step 6 — Repo rename

Only after URLs, GPT Actions, OpenAPI servers, GitHub Pages, and broker deployment references are checked.

## 13. Anti-Deception Rules Preserved by Rename

The rename must not weaken governance.

Required rules:

- notes and messages remain non-official
- flow artifacts are official
- no arbitrary repo writes
- no secrets in bundles
- no private keys in docs
- no broker keys in GPT Instructions or Knowledge
- no sealed/holdout contamination
- no benchmark gaming
- no claim laundering
- no hidden side channels
- no AI promotion
- failed science remains valuable evidence
- negative findings must not be erased
- share does not equal promotion
- human advancement authority remains mandatory

## 14. Open Decisions

1. Should the infrastructure repo be renamed to `MonkeyOS` or `ContextBus`?
2. Should `MonkeyOS` be a new umbrella repo while the current repo becomes `ContextBus`?
3. Should Science Monkeys and Code Monkeys live in the same repo initially?
4. Should Auditor GPT be shared across Science and Code, with modes, or split into Science Auditor and Code Auditor?
5. What is the first official Science Monkeys flow type?
6. Should `/share` create PM inbox messages, official flow artifacts, or both?
7. What evidence level is required before a finding can be shared to PM?
8. How should Mike and Ash identity be represented before OAuth exists?
9. Should the first rename step be docs-only, or docs plus OpenAPI labels?

## 15. Next Logical Step

The next logical step is:

> **Create the MonkeyOS / ContextBus Doctrine Update PM Spec and Rename Readiness PM Spec.**

This is a governance/doc/spec milestone, not direct implementation.

It should produce:

1. canonical doctrine document
2. rename inventory requirements
3. acceptance criteria
4. rollback/quarantine plan
5. Coder AI documentation update packet
6. Helper/Codex execution packet
7. Auditor AI audit request
8. explicit human approval checkpoint before repo rename

## 16. Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

