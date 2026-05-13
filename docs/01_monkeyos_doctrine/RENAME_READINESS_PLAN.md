# 18 RENAME READINESS PLAN

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Authorization Boundary

- Repo rename is NOT authorized yet.
- Runtime behavior, routes, auth model, broker keys, and deployment behavior remain unchanged in this phase.

## Required Inventory Scope

Before any rename proposal is approved, inventory all references to:

- `ContextOS`
- `ArqonContextOS`
- `contextos`
- `context_os`
- run terminology when superseded by flow terminology

## Required Review Scope

Review and map rename impact across:

- README
- docs
- ground-truth docs
- OpenAPI
- Worker source
- schemas
- project templates
- GitHub workflows
- GitHub Pages/docs site
- GPT Action URLs
- Cloudflare Worker routes/deployment references

## Compatibility Language Requirement

All transition documents must preserve this compatibility sentence:

- “ContextOS is the legacy name for the infrastructure now called ContextBus inside MonkeyOS.”

## Rollback and Quarantine Requirements

- Maintain a rollback plan for docs, URLs, and naming layers.
- Quarantine partial rename branches until full impact review is complete.
- Do not merge rename-path changes without explicit human approval.

## Human Approval Gate

- Human approval is required before any actual repo rename.
- Human approval is required before changing public endpoint names or route paths.

