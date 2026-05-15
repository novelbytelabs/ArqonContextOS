# Operational Workspace Policy 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Define the workspace contract for ArqonMonkeyOS so disposable scratch paths do not become critical operational dependencies.

## Directory Contract

### `runtime/`

Active execution workspace.

Use for bundle apply directories, generated smoke JavaScript, run transcripts required by validation, and local execution inputs/outputs needed during a run.

`runtime/` is not source of truth and should not be committed.

### `temps/`

Archive and transfer workspace.

Use for audit bundles, replay packages, generated zip files, forensic diffs, and handoff packages.

`temps/` is not source of truth and should not be committed.

### `tmp/`

Scratch only.

`tmp/` is never required by prompts, scripts, CI, validation, audit evidence, or replay packages.

If a file is needed for audit, copy it into an audit bundle or durable evidence path.

## Evidence Rule

Audit evidence may not rely only on local workspace paths.

Bad:

- see `tmp/live_transcript.json`

Good:

- audit bundle includes `evidence/live_transcript.json`
- evidence report records the file SHA256

## Helper Rule

If an expected PM bundle is missing from `runtime/`, Helper must stop and report.

Helper may not infer or manually implement a missing PM bundle.

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
