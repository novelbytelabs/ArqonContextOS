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

Flow Core v0.3 remains the next implementation target.

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
