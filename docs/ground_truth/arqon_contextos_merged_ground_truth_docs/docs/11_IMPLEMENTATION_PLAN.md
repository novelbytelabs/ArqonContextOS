# 11 — Implementation Plan

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Immediate priority

Implement Flow Core v0.3 after this doc consolidation is installed.

## Step 1 — Install merged docs

Target repo:

`ArqonContextOS`

Install path:

`docs/ground_truth/`

Rules:

- no secrets
- no ArqonZero modification
- no Cloudflare deployment
- commit only after review/authorization

## Step 2 — Update runbook and public docs references

Update existing command docs so they point to flows, not runs.

Replace planned run commands:

- `/create-run`
- `/load-run`
- `/write-artifact`

with:

- `/create-flow`
- `/load-flow`
- `/flow-status`
- `/adv-flow`
- `/write-flow`

## Step 3 — Flow Core design packet

PM spec should define:

- endpoint contract
- path structure
- flow_index.json schema
- flow_manifest.json schema
- allowed flow types
- name alias rules
- artifact role permissions
- advancement preconditions
- status labels
- tests

## Step 4 — Implement Flow Core broker endpoints

Target repo:

`ArqonContextOS`

Likely files:

- `worker/src/flows.ts`
- `worker/src/index.ts`
- `worker/src/github_app.ts`
- `worker/src/policy.ts`
- `worker/src/types.ts`
- `openapi/arqon_contextos.openapi.yaml`
- `docs/GPT_COMMANDS.md`
- `docs/ROADMAP.md`

Do not modify ArqonZero manually. Broker tests may write smoke-test flow artifacts through Cloudflare/GitHub App.

## Step 5 — Live Flow Core smoke test

Test:

```text
/create-flow type=audit name="flow00"
/load-flow name="flow00"
/flow-status name="flow00"
/adv-flow name="flow00" decision="test-advance"
```

Expected:

- PM can create flow
- Coder can load flow
- Auditor can load flow
- role isolation works
- flow index maps name to ID
- ArqonZero contains flow folder

## Step 6 — Spec Kit artifact support

Add artifact types:

- dossier
- constitution
- spec
- clarification
- plan
- checklists
- tasks
- analysis
- implementation_bundle
- helper_packet
- execution_report
- evidence_manifest
- audit_report
- human_decision

## Step 7 — GPT instruction updates

PM GPT:

- add `/dossier`, `/constitution`, `/specify`, `/plan`

Auditor GPT:

- add `/clarify`, `/checklists`, `/analyze`, `/audit`

Coder GPT:

- add `/tasks`, `/implement`

Helper/Codex:

- add `/execute` packet pattern

## Step 8 — Helper/Codex bridge

Define exact Helper packet format:

- flow reference
- allowed paths
- forbidden paths
- commands to run
- expected evidence
- commit authorization
- push authorization
- stop conditions

## Step 9 — Hardening

Add:

- 409 retry
- schema validation
- hash manifests
- status/claim guards
- evidence completeness score
- context rebuild after writes

## Step 10 — Multi-user and swarm replication

Add:

- actor user fields
- `/whoami`
- contextos.swarm.yaml
- setup pack generator
- OAuth design

## Helper/Codex implementation discipline

Every Helper/Codex task packet must clearly state:

- TARGET REPO
- TARGET PATH
- PURPOSE
- authorized files
- forbidden files
- commit authorization
- push authorization
- deploy authorization
- required validation
- final report format

Default:

```text
Commit authorized: no
Push authorized: no
Deploy authorized: no
```

unless explicitly stated.
