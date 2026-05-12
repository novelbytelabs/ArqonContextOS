# GPT Commands

Status:
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable

These are instruction-level commands. They trigger GPT Actions to the Arqon ContextOS broker.

## `/sync-constitution`

Load current shared and role constitution.

Example: `/sync-constitution project=ArqonZero role=PM_AI`

## `/sync-context`

Load current project context for the role.

Example: `/sync-context project=ArqonZero role=CODER_AI`

## `/save-context`

Save a GPT response or idea as a non-official context note.

Example: `/save-context project=ArqonZero role=CODER_AI title="Claim guard ideas" tags=governance,deception`

## `/send-message`

Send a message from one role inbox to another.

Example: `/send-message project=ArqonZero from=CODER_AI to=PM_AI subject="Review claim guard idea"`

## `/inbox`

List unread role messages.

Example: `/inbox project=ArqonZero role=PM_AI`

## `/open-message`

Open a message.

Example: `/open-message project=ArqonZero role=PM_AI message_id=MSG-2026-0001`

## `/create-run`

Create a run folder and manifest.

Example: `/create-run project=ArqonZero title="Add claim-language guard" owner=PM_AI`

## `/load-run`

Load current run state and role-relevant artifacts.

Example: `/load-run project=ArqonZero run_id=AZ-2026-0001 role=AUDITOR_AI`

## `/write-artifact`

Write an official role artifact.

Example: `/write-artifact project=ArqonZero run_id=AZ-2026-0001 type=pm_spec`

## `/checkpoint`

Save session state as a context note.

Example: `/checkpoint project=ArqonZero role=PM_AI title="End of morning PM session"`
