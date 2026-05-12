# GitHub App Setup

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

## Recommended app model

Use one GitHub App per security domain.

For Arqon Zero private infrastructure, create:

`Arqon ContextOS Governance App`

## Repository permissions

Start with:

- Contents: Read-only for read broker
- Contents: Read/write only after write endpoints are enabled
- Metadata: Read-only

Optional later:

- Pull requests: Read/write
- Issues: Read/write

## Install target

Install only on selected repos, such as:

- `novelbytelabs/ArqonZero`

## Credentials

Store GitHub App credentials only as Cloudflare Worker secrets.

Do not commit private keys, installation tokens, webhook secrets, or personal access tokens.
