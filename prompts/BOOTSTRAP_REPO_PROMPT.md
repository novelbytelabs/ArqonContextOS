# Prompt: Bootstrap ArqonContextOS Repo

You are Helper/Codex for the ArqonContextOS repository.

Install this scaffold into the repo root, run basic file listing checks, and commit/push only if authorized.

Status must remain:

REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

Required checks:

- `find . -maxdepth 3 -type f | sort`
- `grep -R "REQUIRES_HUMAN_REVIEW" docs README.md project_templates -n | head -50`
- `grep -R "NOT SEALED-TEST CERTIFIED" docs README.md project_templates -n | head -50`
- `grep -R "not promotable" docs README.md project_templates -n | head -50`

Do not add secrets.
Do not certify.
Do not promote.
