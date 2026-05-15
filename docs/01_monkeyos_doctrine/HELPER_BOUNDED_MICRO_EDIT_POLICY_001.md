# Helper Bounded Micro-Edit Policy 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Allow workflow continuity without giving Helper broad implementation authority.

## Allowed Micro-Edits

Helper may make bounded mechanical micro-edits only when validation exposes a narrow compatibility issue, such as:

- adding `export {}` to a smoke file to avoid TypeScript script-scope collisions
- narrowing a TypeScript type annotation without changing behavior
- fixing an evidence sequencing issue
- updating a test success string that collides with a guard while preserving the guard
- rebuilding generated smoke JavaScript through the approved runtime compiler

## Forbidden Micro-Edits

Helper may not change role gates, route authority, route-only artifact policy, source-chain validation, SHA validation, forbidden-language guards, idempotency semantics, execution/deployment/promotion boundaries, architecture, or product behavior.

## Failure Rule

If a PM bundle apply script fails, Helper must stop.

Helper may not manually complete source after apply failure unless the PM explicitly authorizes a new bounded repair.

## Reporting Rule

Every micro-edit must be reported before commit with file changed, exact reason, why it is mechanical, and validation rerun result.

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
