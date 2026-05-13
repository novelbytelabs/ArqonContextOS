# Cloudflare Deployment

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Prerequisites

- Cloudflare account
- Wrangler installed
- GitHub App created and installed on target repo/security domain
- ArqonMonkeyOS ContextBus Worker configured

## Worker secrets

Set these as Cloudflare Worker secrets, not repo files:

- `GITHUB_APP_ID`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `BROKER_KEY_PM`
- `BROKER_KEY_CODER`
- `BROKER_KEY_AUDITOR`
- `BROKER_KEY_HELPER`
- `BROKER_KEY_HUMAN`

## Local commands

From `worker/`:

```bash
npm install
npm run typecheck
npm run dev
npm run deploy
```

## Notes

The initial Worker is a v0.1 broker scaffold. Review and test thoroughly before using it on private repos.

No secrets should be committed.
