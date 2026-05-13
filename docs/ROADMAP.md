# Roadmap

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Phase 0

Create ArqonContextOS repo and docs.

## Phase 1

Create project-side context templates.

## Phase 2

Install templates into ArqonZero.

## Phase 3

Deploy Cloudflare Worker read broker.

## Phase 4

Update GPT Actions to use broker.

## Phase 5

Add notes and message boxes.

v0.2 broker endpoints now cover `POST /v1/notes`, `GET /v1/notes`, `POST /v1/messages`, `GET /v1/messages/inbox`, `GET /v1/messages/{message_id}`, and `POST /v1/messages/{message_id}/archive`.

## Phase 6

Add official run artifact writes.

## Phase 7

Add KV cache and GitHub webhook refresh.

## Phase 8

Add hardening: role permission tests, claim-language guard, hash-chain guard, evidence completeness score, and forbidden path tests.

## Current priority

Flow Core v0.3 remains the next implementation milestone.

Flow Core should support generic flow families:

- `science_flow`
- `code_flow`
- `audit_flow`
- `governance_flow`
