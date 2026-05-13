# 06 — Flow Model

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Why flows replaced runs

The original `/create-run`, `/load-run`, and `/write-artifact` model was too narrow. The user’s real work is not a single task. It is a natural pipeline of planning, phases, milestones, Coder/Helper iterations, audits, and human advancement decisions.

Use flows instead of runs.

## Flow types

### Phase flow

Use when PM should stay closely involved after each phase.

Pattern:

```text
PM plans phase
Coder implements
Helper executes
Coder repairs
PM advances or replans
```

### Milestone flow

Use when speed matters and PM has already planned the milestone chunk.

Pattern:

```text
PM creates milestone plan
Coder implements phases in chunk
Helper iterates with Coder
Auditor only invoked if requested or triggered
PM receives completion report
```

### Audit flow

Use as safest default for governance, RSI, deception-sensitive, evidence-sensitive, and claim-sensitive work.

Pattern:

```text
PM creates phased plan + audit points
Coder implements milestone chunk
Helper executes and reports to Coder + Auditor evidence stream
Auditor gates at milestone/audit point
Human advances or sends back for repair
```

## Flow aliases

Each flow has:

- a canonical `flow_id`
- a human-friendly `name`

Example:

```text
name = flow00
flow_id = FLOW-2026-0001
```

Users should be able to load by either.

Duplicate active names must fail closed.

## Flow repository structure

Planned structure:

```text
governance/flows/
  flow_index.json

  FLOW-2026-0001/
    flow_manifest.json

    contextos/
      flow_status.json
      gate_state.json
      human_decision.md

    speckit/
      dossier.md
      constitution.md
      spec.md
      clarification.md
      plan.md
      checklists.md
      tasks.md
      analysis.md

    artifacts/
      coder_implementation_bundle.md
      coder_handoff_to_helper.md
      helper_execution_report.md
      evidence_manifest.json
      auditor_audit_blueprint.md
      auditor_gate_report.md
      auditor_repair_request.md
      human_decision.md

    messages/
```

## Flow gate levels

Do not use a numeric auditor score as the primary advancement mechanism.

Use logical gates:

### Gate 0 — PLAN_READY

The plan is scoped enough to start.

Requires:

- objective
- phases
- milestones
- definition of done
- allowed/forbidden paths
- risks
- audit points
- gate criteria

### Gate 1 — DEV_EVIDENCE_READY

Coder + Helper produced runnable development evidence.

Requires:

- Coder bundle
- Helper report
- command logs
- exit codes
- tests/results
- no obvious forbidden path mutation

### Gate 2 — INTEGRITY_GATE_PASSED

Auditor found milestone evidence coherent enough to advance.

Requires:

- audit report
- evidence manifest
- tripwire/guardrail checks
- claim/evidence alignment
- no unresolved deception/gaming hard fail

### Gate 3 — CLAIM_OR_PROMOTION_CANDIDATE

The result may support a stronger claim or promotion decision.

Requires:

- strict audit
- replayable evidence
- sealed/holdout boundary respected if relevant
- human review
- promotion/claim manifest
- no unresolved hard fails

Gate 3 still does not mean automatic promotion.
