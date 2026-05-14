# Spec Kit and ArqonMonkeyOS Orchestration Alignment

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

This document clarifies how Spec Kit fits into ArqonMonkeyOS.

Spec Kit is already part of the ArqonMonkeyOS idea, but it belongs to the **Code Monkeys exploit lifecycle**, not the Science Monkeys explore lifecycle.

## Layer Map

| Layer | Role |
|---|---|
| Science Monkeys | Explore uncertain knowledge |
| ContextBus | Preserve official records, messages, flows, artifacts, events, context, and gates |
| PM_AI | Receives Human-approved share packets and decides whether Code work should begin |
| Spec Kit | Structures Code Monkey product/spec/planning work |
| Code Monkeys | Implement, execute, and audit governed product/code work |

## Spec Kit Entry Point

Spec Kit begins only after one of these:

1. Human directly requests product/spec work.
2. PM_AI receives a Human-approved `share_packet`.
3. PM_AI receives approved governance context that justifies a dossier/spec/plan.

Science Monkeys do not directly create Spec Kit tasks.

## Science-to-Spec Boundary

Science output:

```text
finding_record
negative_finding_record
inconclusive_finding_record
share_recommendation
share_packet
pm_context_seed
share_notification
```

Spec Kit input:

```text
dossier
constitution
specification
plan
tasks
```

Bridge:

```text
/v1/science/share
```

## Commands

Science Monkeys:

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

Code Monkeys / Spec Kit:

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

## Guardrail

`/share` does not automatically create:

```text
dossier
constitution
specification
plan
tasks
implementation
```

PM_AI must decide whether a shared finding is usable for Code Monkeys work.

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
