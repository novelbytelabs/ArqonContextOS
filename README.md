# Arqon ContextOS

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

Arqon ContextOS is a repo-backed context bus for role-bound GPT teams.

It provides:

- live constitution sync
- live project context sync
- context notes
- role message boxes
- run artifact storage
- PM/Coder/Helper/Auditor handoff persistence
- Cloudflare Worker broker scaffold
- GitHub App private-repo bridge scaffold
- OpenAPI schema for GPT Actions
- per-project context generation templates

## Core idea

GPTs do not maintain persistent connections. Instead:

1. Project repos generate current context snapshots.
2. Arqon ContextOS broker reads approved context files through a GitHub App.
3. PM/Coder/Auditor GPTs call GPT Actions to sync context and write role artifacts.
4. GitHub remains the durable memory and audit trail.

## Current boundary

This repo is infrastructure scaffolding. It is not certification, not release approval, and not a production security assessment.

Status remains:

REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable
