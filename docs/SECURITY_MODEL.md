# Security Model

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Main security controls

1. No arbitrary repo browsing.
2. No arbitrary path writes.
3. Separate broker API keys per role.
4. GitHub App access scoped per security domain.
5. Generated context files are built inside project repos.
6. Broker reads/writes only allowlisted paths.
7. Status labels are mandatory.
8. Promotion remains human-only.

## Role keys

Recommended secrets:

- `BROKER_KEY_PM`
- `BROKER_KEY_CODER`
- `BROKER_KEY_AUDITOR`
- `BROKER_KEY_HELPER`
- `BROKER_KEY_HUMAN`

## Role write permissions

PM AI may write PM specs, PM task packets, PM notes, PM messages, and run creation events.

Coder AI may write coder patch bundles, coder handoffs, coder notes, and coder messages.

Helper/Codex may write helper reports, logs, and evidence manifests.

Auditor AI may write audit reports, audit scores, claim audits, and auditor notes/messages.

Human may write human decisions, exception manifests, and promotion manifests.

## Forbidden paths

The broker must never write or return these paths:

- `.env`
- `secrets/`
- `sealed/`
- `holdout/`
- `models/`
- `data/`
- `private/`
- `credentials/`

For v0.1, broker writes to `src/`, `tests/`, and `.github/` are forbidden.
