# Auditor Panel Mode 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Define a stronger audit protocol for ArqonMonkeyOS without immediately creating four permanent Auditor GPTs.

The near-term design uses one Auditor GPT running a mandatory four-role panel protocol. A second independent Red Auditor GPT can be added for high-risk gates.

## Required Audit Roles

### Primary Auditor

Checks whether the submitted route, artifact, or milestone does what it claims.

### Bypass Auditor

Looks for alternate paths around the claimed boundary, including generic endpoints, route-only bypasses, role bypasses, stale deployment behavior, malformed records, source-chain mutation, idempotency misuse, missing evidence, and promotion or execution-language laundering.

### Prover

Builds or demands a minimal reproducible harness that proves the critical boundary.

No proof harness means no clean PASS.

### Boundary Judge

Makes the final pass/fail recommendation from evidence only.

The Boundary Judge must separate source behavior, offline smoke behavior, live deployment behavior, evidence quality, and certification claims.

## Independence Rule

One GPT with multiple audit roles is structured review, not true independence.

For high-risk gates, use a second independent Red Auditor GPT with a clean handoff packet.

## Future Upgrade Path

Later, split the roles into a team:

- Auditor
- Red Auditor
- Prover
- Boundary Judge

Do not create this full team until orchestration overhead is justified.

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
