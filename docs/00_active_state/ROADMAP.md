# Roadmap

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Baseline

ContextBus (legacy name: ContextOS) v0.2 is operational for:

- context sync
- constitution sync
- notes
- role messages/inbox/archive copy

## Current phase

MonkeyOS doctrine reset and docs hierarchy migration are underway.

## Next implementation milestone

Flow Core v0.3 is now implementation in progress as the first official implementation slice.
Status remains diagnostic only and not certified/promoted.

Required Flow Core command family:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

Flow Core must support generic flow families:

- `science_flow`
- `code_flow`
- `audit_flow`
- `governance_flow`

## After Flow Core foundation

1. Spec Kit-aware Code Monkeys command layers.
2. Science Monkeys lifecycle command layers.
3. 409 retry hardening for GitHub Contents write conflicts.
4. Context rebuild automation after broker writes.
5. Multi-user identity progression (temporary labels to OAuth).
6. Multi-repo swarm replication support.

## Orchestration Alignment Before Routes 001

Before implementing Science Monkeys v0.1 Routes 001, ArqonMonkeyOS now has a doctrine alignment step:

1. Role/Auth Foundation 001
2. Role/Auth Foundation Audit 001
3. ArqonMonkeyOS Orchestration Doctrine 001
4. Science Monkeys v0.1 Routes 001
5. Routes Audit 001
6. Science Monkeys v0.1 Share Integration 001
7. Share Audit 001

Routes 001 must implement the Science command layer without implementing `/v1/science/share`.

Routes 001 must carry forward:

- broker-key uniqueness warning
- expanded PM_AI denial coverage
- raw redacted HTTP transcript format
- no placeholders/shims/stubs/simulations
- tripwire checks
- guardrail/policy checks
- adversarial tests
- regression tests
