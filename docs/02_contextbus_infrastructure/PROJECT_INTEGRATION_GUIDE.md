# Project Integration Guide

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Goal

Integrate a project repo with ArqonMonkeyOS ContextBus.

## Steps

1. Copy `project_templates/` contents into the project repo.
2. Edit `governance/context/project_context.yaml`.
3. Run `python3 scripts/build_gpt_context.py`.
4. Run `python3 scripts/verify_context_manifest.py`.
5. Commit generated context files.
6. Enable `.github/workflows/build-gpt-context.yml`.
7. Add the repo to the ContextBus broker project map.
8. Test `/sync-context`.

## Required project files

- `governance/context/current_context_snapshot.json`
- `governance/context/context_manifest.json`
- `governance/context/context_ledger.jsonl`
- `governance/context/pm_gpt_context.json`
- `governance/context/coder_gpt_context.json`
- `governance/context/auditor_gpt_context.json`
