# FLOW CORE V0.3 RUNTIME SMOKE 001

Status:
REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Context

- Repo: `novelbytelabs/ArqonMonkeyOS`
- Local path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS`
- Branch: `main`
- Commit: `c03bf5ce3f1ddff1b06ec63509ee102df52d1fe7`
- Smoke method used: **preflight + runtime feasibility inspection**

## Commands run

```bash
pwd
git rev-parse HEAD
git branch --show-current
git status --short
git remote -v
cd worker && npm run typecheck && cd ..
cat worker/package.json
ls -la worker
find worker/src -maxdepth 1 -type f | sort
cat worker/wrangler.toml
sed -n '1,260p' worker/src/types.ts
sed -n '1,260p' worker/src/auth.ts
sed -n '1,300p' worker/src/projects.ts
test -f worker/.dev.vars
```

## Runtime smoke feasibility result

`BLOCKED`

Reason:

- Local Worker runtime smoke requires auth and GitHub App env/secrets:
  - `GITHUB_APP_ID`
  - `GITHUB_APP_INSTALLATION_ID`
  - `GITHUB_APP_PRIVATE_KEY`
  - `BROKER_KEY_PM`
  - `BROKER_KEY_CODER`
  - `BROKER_KEY_AUDITOR`
  - `BROKER_KEY_HELPER`
  - `BROKER_KEY_HUMAN`
- `worker/.dev.vars` is missing.
- No existing local test harness was present that safely stubs GitHub bridge and auth layers for full route-runtime smoke without secrets.

## Scenario results

- A. Create flow: `BLOCKED` (missing runtime secrets/env for broker auth + GitHub write path)
- B. Load/list flow: `BLOCKED` (same constraint)
- C. Flow status: `BLOCKED` (same constraint)
- D. Role-gated artifact write: `BLOCKED` (cannot execute authenticated runtime route calls)
- E. Human-only advancement:
  - non-HUMAN deny check: `BLOCKED` (runtime request path not executable locally without secrets)
  - HUMAN allow check: `BLOCKED` (same)
- F. Existing v0.2 regression checks:
  - route presence in source: `PASS` (routes remain in Worker code)
  - live runtime route checks: `BLOCKED` (same constraint)

## Evidence from inspection

- `worker/package.json` scripts: `dev`, `deploy`, `typecheck` (no dedicated runtime smoke script)
- Worker typecheck: `PASS`
- `worker/wrangler.toml` contains only non-secret vars (`BROKER_VERSION`, `DEFAULT_BRANCH`)
- `worker/.dev.vars`: missing

## Flow/evidence outputs

- Generated flow name: none
- Generated flow_id: none
- Evidence paths written by runtime smoke: none

## Micro-edits made

- None

## Safety and governance notes

- Auth behavior unchanged.
- Role gates unchanged.
- Human-only advancement logic unchanged.
- No secrets/tokens/keys were viewed or modified.
- No source behavior changes were made in this smoke task.

## Required status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
