# Helper/Codex Prompt — Install Merged Ground Truth Docs

You are Helper/Codex for the ArqonContextOS repository.

TARGET REPO: ArqonContextOS  
TARGET PATH: `/home/irbsurfer/Projects/arqon/ArqonContextOS`  
PURPOSE: install the merged ground-truth documentation bundle.

Current status must remain:

REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Authorized target path

Copy the merged docs into:

```text
docs/ground_truth/
```

## Forbidden

- Do not modify ArqonZero.
- Do not modify Worker code.
- Do not modify Cloudflare secrets.
- Do not add broker keys, private keys, `.env`, `.dev.vars`, or credentials.
- Do not certify or promote anything.

## Required validation

Run:

```bash
cd /home/irbsurfer/Projects/arqon/ArqonContextOS
pwd
git status --short
git rev-parse HEAD
find docs/ground_truth -type f | sort
grep -R "REQUIRES_HUMAN_REVIEW" docs/ground_truth -n | head -50
grep -R "NOT SEALED-TEST CERTIFIED" docs/ground_truth -n | head -50
grep -R "not promotable" docs/ground_truth -n | head -50
git diff --stat
git diff -- docs/ground_truth
```

## Commit/push authorization

Commit authorized: no  
Push authorized: no

Report first.

## Final report

Include:

- PASS/FAIL/STOPPED
- base commit
- files installed
- status label checks
- diff summary
- secrets committed: no
- deviations
- required status labels
