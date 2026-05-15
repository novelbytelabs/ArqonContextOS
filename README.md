# ArqonMonkeyOS

**ArqonMonkeyOS is a governed AI-team operating system for turning discovery into durable execution.**

It is not a chatbot workflow. It is not a loose swarm. It is a role-separated, repo-native operating layer where AI agents, human operators, and evidence artifacts move through governed gates instead of drifting through disposable conversations.

ArqonMonkeyOS gives an AI team a nervous system: memory, authority boundaries, handoffs, evidence, audits, and human-controlled advancement.

## The Core Idea

Modern AI systems can generate ideas, code, plans, experiments, and reviews.

The hard part is not generation.

The hard part is **continuity, truth, authority, and trust**.

ArqonMonkeyOS exists because serious work needs more than brilliant messages. It needs a system where:

- knowledge does not disappear when a chat ends,
- roles cannot silently grant themselves authority,
- every claim has an evidence trail,
- execution is separated from planning,
- audit is separated from creation,
- and humans retain final advancement power.

The repository becomes the shared operational memory.  
The flow becomes the unit of work.  
The artifact becomes the unit of truth.  
The audit becomes the boundary between confidence and self-deception.

## System Map

```text
                         ┌──────────────────────┐
                         │        HUMAN         │
                         │  approval / judgment │
                         └──────────┬───────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           ArqonMonkeyOS                             │
│              governed repo-native AI-team operating layer            │
│                                                                     │
│  ┌──────────────────────┐                 ┌──────────────────────┐  │
│  │   Science Monkeys    │                 │     Code Monkeys     │  │
│  │                      │                 │                      │  │
│  │  explore uncertainty │                 │  exploit validated   │  │
│  │  form hypotheses     │                 │  knowledge into      │  │
│  │  design experiments  │                 │  product execution   │  │
│  │  execute science     │                 │                      │  │
│  │  audit findings      │                 │  specify / plan      │  │
│  │  record knowledge    │                 │  task / implement    │  │
│  │  share evidence      │                 │  execute / audit     │  │
│  └──────────┬───────────┘                 └──────────┬───────────┘  │
│             │                                        │              │
│             └───────────────┬────────────────────────┘              │
│                             ▼                                       │
│                    ┌──────────────────┐                             │
│                    │    ContextBus    │                             │
│                    │ repo memory      │                             │
│                    │ role state       │                             │
│                    │ artifacts        │                             │
│                    │ evidence chains  │                             │
│                    │ audit trails     │                             │
│                    └──────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   GitHub + Worker    │
                         │ controlled writes    │
                         │ durable provenance   │
                         └──────────────────────┘
```

## Science Monkeys

**Science Monkeys are the exploration engine.**

They are built for uncertain knowledge, experimental thinking, and disciplined discovery. Their job is not to rush from idea to product. Their job is to make uncertainty visible, testable, and auditable.

Science Monkeys move through a governed research loop:

1. Explore the knowledge space.
2. Form hypotheses.
3. Design experiments.
4. Execute experiments.
5. Audit results.
6. Record findings.
7. Share only Human-approved evidence forward.

Science Monkeys are where the system learns what may be true.

They protect against fake discovery by separating research roles, preserving evidence boundaries, and requiring explicit Human-controlled sharing before knowledge can cross into product exploitation.

## Code Monkeys

**Code Monkeys are the exploitation engine.**

They are built for product execution, but only after knowledge has passed through governed context and evidence boundaries. Their job is to transform validated intent into implementation proposals, execution packets, evidence, and audit-ready delivery.

Code Monkeys move through a separate governed delivery ladder:

1. PM intake from approved handoff.
2. PM specification.
3. PM governance plan.
4. PM tasking.
5. Coder work plan.
6. Coder task decomposition.
7. Coder implementation bundle.
8. Coder handoff.
9. Helper/Codex execution.
10. Auditor review.
11. Human advancement.

Code Monkeys are where the system turns evidence into product work.

They protect against self-authorizing code by separating PM intent, Coder implementation design, Helper execution, Auditor review, and Human promotion.

## MonkeyOS

**MonkeyOS is the operating system that ties Science Monkeys and Code Monkeys together.**

Science without product execution becomes trapped in notebooks.  
Execution without science becomes confident guessing.  
Automation without governance becomes a liability.

MonkeyOS binds the two sides into one accountable system:

- Science Monkeys discover and validate.
- Code Monkeys build and operationalize.
- ContextBus preserves state and evidence.
- Auditor agents challenge claims and boundaries.
- Helper/Codex executes only after authorization.
- Humans control advancement.

The result is an AI team that can explore, build, remember, and improve without collapsing into hidden authority loops.

## Why It Matters

Most AI-team workflows fail because they are made of conversations.

Conversations are fragile. They are easy to forget, hard to audit, and dangerous to treat as operational truth.

ArqonMonkeyOS turns the workflow into a governed system:

- conversations become artifacts,
- artifacts become evidence,
- evidence becomes gated context,
- gated context becomes safe execution,
- and execution becomes auditable history.

The goal is not merely to make AI agents more autonomous.

The goal is to make AI collaboration **accountable enough to trust**.

## Authority Model

ArqonMonkeyOS is designed around separation of power.

```text
PM_AI        → intent, specification, plan, PM tasking
CODER_AI     → work plan, task decomposition, implementation bundle
HELPER_AI    → exact execution only after handoff
AUDITOR_AI   → independent integrity review
SCIENCE_*    → governed exploration and experimental evidence
HUMAN        → advancement, judgment, and promotion authority
```

No role should be able to define the work, implement it, execute it, audit it, and promote it alone.

That is the point.

## ContextBus

**ContextBus is the memory and evidence substrate of ArqonMonkeyOS.**

It keeps the operating system from becoming another pile of disconnected chats. It stores the durable state that agents need to resume, verify, and coordinate work across sessions.

ContextBus provides:

- repo-backed flow state,
- role-scoped artifacts,
- generated context packets,
- source hashes and provenance,
- idempotency records,
- inbox and handoff messages,
- audit-ready evidence trails.

ContextBus is where the team remembers.

## Platform Capabilities

- Governed multi-agent operating model for Science, PM, Coder, Helper, Auditor, and Human roles
- Science Monkeys research flows for exploration, hypothesis, experiment, audit, record, and share
- Code Monkeys delivery flows for specification, planning, tasking, implementation bundles, execution, and audit
- ContextBus-backed persistent memory across sessions and agents
- Cloudflare Worker broker for controlled command routing
- GitHub App bridge for private-repo read/write automation
- GPT Action-ready OpenAPI surface
- Role-scoped artifact permissions and authority gates
- Idempotent command behavior and payload-conflict protection
- Evidence-preserving handoffs between Science and Code
- Audit-first doctrine for claim boundaries, source chains, and promotion control
- Human-owned advancement model

## Current Diagnostic Chain

The current development chain reaches:

```text
Science research
  → Science audit
  → Human-approved Science share
  → Science-to-Code handoff
  → PM intake
  → PM specification
  → PM plan
  → PM tasking
  → Coder work plan
  → Coder tasks
  → Coder implementation bundle
```

The next planned boundary is:

```text
Coder Handoff 001
  → Helper Execution boundary
  → Auditor review
  → Human advancement
```

## Status Boundary

ArqonMonkeyOS is under active development.

Current status:

- `REQUIRES_HUMAN_REVIEW`
- `development diagnostic only`
- `NOT SEALED-TEST CERTIFIED`
- `not promotable`

No component should be represented as production-ready, certified, sealed-test validated, or promotable until the required gates, audits, and Human approvals say so.

## Outcome

ArqonMonkeyOS gives AI teams a way to work like an institution instead of a chat thread.

It turns exploration into evidence.  
It turns evidence into governed execution.  
It turns execution into audit trails.  
It turns audits into human-controlled advancement.

That is the foundation for serious AI-native product work.