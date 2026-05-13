# Arqon ContextOS Command Runbook Cheat Sheet

Status: REQUIRES_HUMAN_REVIEW | development diagnostic only | NOT SEALED-TEST CERTIFIED | not promotable

## 1. Quick Start
- **Load role context** — `/sync-context project=ArqonZero role=PM_AI` — Yes
- **Load constitution package** — `/sync-constitution project=ArqonZero role=PM_AI` — Yes
- **Get context manifest** — `/manifest project=ArqonZero` — Yes; may appear as getManifest
- **Save note** — `/save-context project=ArqonZero role=CODER_AI title="..." tags=...` — Yes
- **Send message** — `/send-message project=ArqonZero from=CODER_AI to=PM_AI subject="..."` — Yes
- **Read inbox** — `/inbox project=ArqonZero role=PM_AI` — Yes
- **Open message** — `/open-message project=ArqonZero role=PM_AI message_id=MSG-...` — Yes
- **Archive message** — `/archive-message project=ArqonZero role=PM_AI message_id=MSG-...` — Yes; safe copy in v0.2
- **Create task run** — `/create-run project=ArqonZero title="..." owner=PM_AI` — Planned Step 8
- **Load task run** — `/load-run project=ArqonZero run_id=AZ-... role=AUDITOR_AI` — Planned Step 8
- **Write artifact** — `/write-artifact project=ArqonZero run_id=AZ-... type=pm_spec` — Planned Step 8

## 2. Mental Model
Core rule: PM proposes. Coder implements. Helper executes. Auditor verifies. Human promotes. No AI self-certifies.

## 3. Role Access Rules

## 4. Implemented Commands — v0.2
### /sync-context
- Purpose: Load role-specific live project context.
- Example: `/sync-context project=ArqonZero role=CODER_AI`
- Notes: Use at start of each GPT session. Role key must match requested role.

### /sync-constitution
- Purpose: Load role-specific constitution/context package.
- Example: `/sync-constitution project=ArqonZero role=AUDITOR_AI`
- Notes: Use before governance-sensitive work or after constitution changes.

### /manifest
- Purpose: Load context manifest and hashes. GPT may expose as getManifest.
- Example: `/manifest project=ArqonZero`
- Notes: Diagnostic command. Use to verify context source/hash.

### /save-context
- Purpose: Save current/previous GPT response or specified body as a non-official note.
- Example: `/save-context project=ArqonZero role=CODER_AI title="Claim guard ideas" tags=contextos,deception,governance`
- Notes: official_artifact=false. Use for ideas and session notes.

### /send-message
- Purpose: Send directed non-official role message.
- Example: `/send-message project=ArqonZero from=CODER_AI to=PM_AI subject="Review saved note"`
- Notes: From role is enforced by broker auth. Message goes to target inbox.

### /inbox
- Purpose: List messages in current role inbox.
- Example: `/inbox project=ArqonZero role=PM_AI`
- Notes: A role can read only its own inbox. HUMAN can read any inbox.

### /open-message
- Purpose: Open one message by ID.
- Example: `/open-message project=ArqonZero role=PM_AI message_id=MSG-2026-05-12-65edd03c`
- Notes: Use exact message_id from /inbox.

### /archive-message
- Purpose: Copy message to role archive.
- Example: `/archive-message project=ArqonZero role=PM_AI message_id=MSG-...`
- Notes: v0.2 copies to archive; inbox deletion is deferred.

- `/create-run` — Create official run folder/manifest. Example: `/create-run project=ArqonZero title="Add claim-language guard" owner=PM_AI` Status: Planned
- `/load-run` — Load official run state and role-relevant artifacts. Example: `/load-run project=ArqonZero run_id=AZ-2026-0001 role=AUDITOR_AI` Status: Planned
- `/write-artifact` — Write official role artifact to a run. Example: `/write-artifact project=ArqonZero run_id=AZ-2026-0001 type=pm_spec` Status: Planned
- `/checkpoint` — Save current session as a context note. Example: `/checkpoint project=ArqonZero role=PM_AI title="End of morning PM session"` Status: Planned wrapper
- `/search-context` — Search notes/messages/runs. Example: `/search-context project=ArqonZero query="claim-language guard"` Status: Planned
- `/promote-note` — PM converts a context note into PM consideration/spec draft. Example: `/promote-note note_id=NOTE-... target=pm_spec_draft` Status: Planned; PM only
- `/supersede-context` — Mark note/message as superseded. Example: `/supersede-context note_id=NOTE-... reason="Replaced by PM spec AZ-..."` Status: Planned
- `/link-artifact` — Link note/message to a run. Example: `/link-artifact note_id=NOTE-... run_id=AZ-...` Status: Planned
- `/summarize-inbox` — Summarize unread role inbox messages. Example: `/summarize-inbox project=ArqonZero role=PM_AI` Status: Planned

## 6. Daily Operating Runbook
1. Open PM AI and run /sync-context project=ArqonZero role=PM_AI.
2. Run /inbox project=ArqonZero role=PM_AI and review new Coder/Auditor messages.
3. If a note/message is useful, PM turns it into a proper PM spec through the normal process; do not treat the note as official by itself.
4. Open Coder AI and run /sync-context project=ArqonZero role=CODER_AI before implementation discussions.
5. Use /save-context for useful Coder suggestions you may want PM to see later.
6. Use /send-message from Coder to PM or Auditor when role handoff is needed.
7. Open Auditor AI and run /sync-context project=ArqonZero role=AUDITOR_AI before reviewing evidence or risk notes.
8. Use notes/messages for context and communication only. Use run artifacts later for official PM/Coder/Helper/Auditor outputs.

## 7. Common Workflows
### 7.1 Save a Coder suggestion for PM
`/sync-context project=ArqonZero role=CODER_AI`
`Give me three suggestions to improve Arqon ContextOS deception resistance. Do not implement anything.`
`/save-context project=ArqonZero role=CODER_AI title="Coder deception-resistance suggestions" tags=contextos,deception,governance`
`/send-message project=ArqonZero from=CODER_AI to=PM_AI subject="Review saved deception-resistance suggestions"`

### 7.2 PM reads Coder message
`/sync-context project=ArqonZero role=PM_AI`
`/inbox project=ArqonZero role=PM_AI`
`/open-message project=ArqonZero role=PM_AI message_id=MSG-...`

## 8. Command Parameter Reference
## 9. Safety Rules
- Never place broker keys in GPT Instructions, Knowledge files, repo files, or chat messages.
- GPT Builder Action Authentication owns bearer keys. The OpenAPI schema should not contain secret values.
- Paste raw broker keys only; do not paste the word “Bearer” into the key field.
- A context note or message is non-official until PM incorporates it into a PM spec or a future official artifact flow writes it as such.
- Do not treat successful notes/messages as certification, promotion, sealed-test certification, or release approval.
- Role mismatch failures are expected and good when a GPT asks for another role’s context or inbox.

- **403 on /sync-context**: Wrong/missing/stale broker key or wrong role key. Fix: Recreate Action, set API Key -> Bearer, paste raw role key, save GPT, start fresh preview.
- **403 on /v1/health inside GPT but curl works**: GPT Action auth/config is stale or malformed. Fix: Delete duplicate actions, recreate action, verify schema and auth field.
- **ROLE_MISMATCH**: Authenticated role key does not match requested role. Fix: Use the matching role command or switch to the correct GPT.
- **/inbox hits wrong path**: Old schema still uses /v1/messages instead of /v1/messages/inbox. Fix: Update schema to OpenAPI 3.0.3 with /v1/messages/inbox.
- **GPT Builder crashes on schema**: Schema too fancy or incompatible auth block. Fix: Use OpenAPI 3.0.3 and keep auth in GPT Builder UI, not schema.
- **409 from GitHub Contents API**: Concurrent write conflict. Fix: Retry sequentially. Add v0.3 retry-on-409 hardening later.
- **Archive leaves inbox copy**: v0.2 safe copy-to-archive behavior. Fix: Accept limitation until v0.3 safe delete/move is implemented.

## 11. Required Status Block
`REQUIRES_HUMAN_REVIEW`
`development diagnostic only`
`NOT SEALED-TEST CERTIFIED`
`not promotable`

## 12. Version Notes
- **v0.1** — Read-only /sync-context and /sync-constitution through Cloudflare broker.
- **v0.2** — Notes/messages: /save-context, /send-message, /inbox, /open-message, /archive-message.
- **v0.3 planned** — Write conflict retry, archive move/delete safety, run artifact endpoints.
- **Step 8 planned** — /create-run, /load-run, /write-artifact for official role artifacts.
