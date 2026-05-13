# 09 — Security and Governance

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Non-negotiables

- No AI self-certification.
- No AI auto-promotion.
- No hidden side channels.
- No arbitrary repo read/write.
- No sealed/holdout contamination.
- No benchmark gaming.
- No claim laundering.
- No weakening of required status labels.
- No secrets in docs, GPT Knowledge, chat, or repo files.

## Required status labels

Every governance-sensitive output must preserve:

REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Secrets

Never commit or paste:

- GitHub App private key
- broker keys
- Cloudflare tokens
- installation tokens
- personal access tokens
- webhook secrets
- client secrets

Safe-ish config values such as app IDs may be documented only when useful, but do not confuse them with secrets.

## Role boundary controls

Broker must enforce:

- role inferred from bearer key
- non-HUMAN roles can read only their own context/inbox unless explicitly authorized
- Coder cannot read PM inbox
- PM cannot read Coder context with PM key
- Auditor cannot write implementation artifacts
- Helper cannot write audit reports

## Notes/messages controls

Notes and messages must be marked:

```text
official_artifact: false
```

They are not specs, audit reports, implementation bundles, or human decisions.

## Flow artifact controls

Official artifacts must be written into flow paths and must specify:

- flow_id
- flow name
- artifact type
- source role
- actor identity where available
- created_at
- status labels
- related gate or phase

## Audit gates

Use logical gate levels instead of single numeric score.

- PLAN_READY
- DEV_EVIDENCE_READY
- INTEGRITY_GATE_PASSED
- CLAIM_OR_PROMOTION_CANDIDATE

A gate pass is not production certification unless a separate human-controlled promotion process says so.

## Known hardening items

- GitHub Contents 409 retry with fresh SHA
- hash-chain manifests for artifacts
- claim-language guard
- evidence completeness scoring
- context rebuild after broker writes
- flow advancement precondition checks
- multi-user identity/OAuth
- archive true move/delete safety
