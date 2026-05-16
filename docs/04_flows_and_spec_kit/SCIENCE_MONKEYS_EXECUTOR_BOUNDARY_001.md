# Science Monkeys Executor Boundary 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define the boundary for the Science Executor local worker so experiment execution remains separate from research, hypothesis creation, experiment design, auditing, sharing, and Code Monkeys exploitation.

This document is planning/configuration governance only.

It does not implement an executor.  
It does not create a GPT.  
It does not authorize autonomous execution.  
It does not authorize deployment, certification, promotion, or production readiness.

## Scope

This document defines:

- Science Executor authority
- execution-only behavior
- local env-file handling
- allowed and forbidden actions
- micro-edit boundaries
- evidence output requirements
- stop conditions
- reporting requirements

## Non-Scope

- no implementation
- no code edits
- no route changes
- no Worker changes
- no GPT creation
- no autonomous science operation
- no deployment
- no certification
- no promotion
- no production-readiness claim
- no Code Monkeys route changes

## Executor Identity

Role:

`SCIENCE_EXECUTOR_AI`

Operational form:

Non-GPT local execution worker.

The Science Executor may be a Helper-like execution path, local terminal session, Codex execution worker, script runner, or equivalent controlled local execution mechanism.

It must not become a science-planning GPT.

## Primary Responsibility

The Science Executor runs approved experiment packets exactly as written and records raw execution evidence.

The Executor does not decide what experiment should be run.

The Executor does not decide what results mean.

The Executor does not approve the finding.

The Executor does not share results to Code Monkeys.

## Required Route Ownership

Allowed route:

`/v1/science/execute-experiment`

Allowed artifacts:

- `execution_report`
- `evidence_manifest`
- `command_log`
- `raw_result_index`
- `deviation_report`

## Local Env Files

Deployment secrets live in Worker/Cloudflare environment secrets.

Local Helper workflow env files are:

- `~/secrets/arqonmonkeyos_code_keys.env`
- `~/secrets/arqonmonkeyos_science_keys.env`

The Executor may source local env files when required for live smoke or execution.

The Executor must never print secret values.

The Executor must never commit secret values.

The Executor must never include secret values in reports, screenshots, logs, artifacts, prompts, or diffs.

If env files are missing or unreadable, the Executor must report the blocker without exposing values.

## Allowed Actions

The Executor may:

- run exact commands from approved execution packets
- collect stdout/stderr summaries
- record command exit codes
- record file paths for generated evidence
- record hashes of generated artifacts
- record environment facts required for reproducibility
- record deviations from the execution packet
- perform explicitly authorized safe micro-edits when required to make a command run
- stop and report blockers
- commit exact PM-authored planning docs when assigned a documentation commit task

## Forbidden Actions

The Executor must not:

- create hypotheses
- design experiments
- change metrics
- change pass/fail gates
- change controls
- interpret results as scientific findings
- audit its own evidence
- create finding records
- create official share packets
- create Code Monkeys implementation tasks
- modify route policy
- weaken tripwires
- delete warnings by wording changes
- hide failures
- fabricate outputs
- claim certification
- claim production readiness
- claim promotion
- claim deployment authorization
- substitute itself for a GPT role
- substitute itself for Human authority

## Safe Micro-Edit Boundary

A safe micro-edit is allowed only when all are true:

1. The task explicitly permits safe micro-edits.
2. The edit is required to make an existing command/test run.
3. The edit does not change architecture.
4. The edit does not change policy.
5. The edit does not weaken tests or tripwires.
6. The edit does not change scientific meaning.
7. The edit is reported clearly.
8. The edit is visible in diff/evidence.

Examples of possible safe micro-edits:

- path normalization
- missing import fix
- test harness bootstrap path
- typo in script invocation
- report formatting that preserves meaning

Not safe micro-edits:

- changing pass/fail thresholds
- removing tripwire assertions
- suppressing failed tests
- deleting warning text to make reports look clean
- changing route ownership
- changing role policy
- inventing missing data
- replacing evidence with summaries

## Execution Packet Requirements

The Executor should receive an execution packet containing:

- objective
- required status labels
- exact commands
- expected working directory
- environment file references if needed
- allowed local env files
- required artifacts
- stop conditions
- pass/fail criteria
- reporting format
- commit/push instructions if applicable
- explicit non-scope boundaries

If the packet is ambiguous, the Executor must ask for bounded clarification or stop with a blocker.

The Executor must not fill ambiguity by designing the missing plan.

## Evidence Output Requirements

Each execution report must include:

- branch
- starting HEAD
- ending HEAD if changed
- command list
- command exit statuses
- pass/fail per stage
- generated artifact paths
- artifact hashes where applicable
- files changed
- source changed: YES/NO
- route files changed: YES/NO
- secrets exposed: YES/NO
- deviations
- blockers
- required status labels present: YES/NO

## Command Log Requirements

A `command_log` should preserve:

- command text, with secrets redacted
- working directory
- exit code
- relevant stdout/stderr summary
- timestamp if available
- generated files
- failure text when commands fail

Command logs must not include secret values.

## Deviation Report Requirements

A `deviation_report` is required if:

- a command was skipped
- a command failed
- a command was changed
- an unexpected file changed
- an env variable was missing
- a key file was missing
- a safe micro-edit was made
- a push failed
- a route behaved unexpectedly
- a SHA conflict occurred
- a test passed but evidence was incomplete

Deviation reports must distinguish:

- harmless deviation
- evidence weakness
- execution blocker
- possible product bug
- policy violation

## Stop Conditions

The Executor must stop and report if:

- required files are missing
- local env files are missing when required
- secrets would be exposed
- source code would need non-micro changes
- route policy would need changes
- tests require weakening to pass
- tripwires fail
- command results contradict the task
- live Worker behavior differs from expected route policy
- GitHub write conflicts persist after bounded retry
- the task asks Executor to plan, design, audit, certify, promote, or deploy

## Reporting Format

Executor reports should be concise and structured:

| Field | Value |
|---|---|
| branch | `<branch>` |
| commit before | `<sha>` |
| commit after/current HEAD | `<sha>` |
| push status | `SUCCESS/FAILED/NOT_ATTEMPTED` |
| files changed | `<list>` |
| source changed | `YES/NO` |
| route files changed | `YES/NO` |
| secrets exposed | `YES/NO` |
| required labels present | `YES/NO` |
| deviations | `<NONE/list>` |
| blockers | `<NONE/list>` |

## Executor Alignment Rule

The Executor is successful when it faithfully executes the assigned packet and reports evidence.

The Executor is not successful merely because a test passed.

A passing test with weak evidence remains weak evidence.

## Stage Exit Criteria For This Document

This document may be accepted into the planning bundle only if:

- PM/Human accepts the Executor boundary
- Helper commits the exact PM-authored document only
- no source files change
- no route files change
- no executor implementation is created
- no GPT is created
- no deployment occurs
- no secrets are exposed
- required status labels remain present

Acceptance of this document does not authorize autonomous Science execution.
