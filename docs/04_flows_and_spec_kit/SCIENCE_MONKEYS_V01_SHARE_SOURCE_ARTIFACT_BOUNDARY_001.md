# Science Monkeys v0.1 Share Source Artifact Boundary 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Patch the blocking audit defect from Share Integration Audit 001:

`source_artifacts` was syntactically required but not semantically enforced as the evidence boundary.

## Required Fixes

This slice requires:

- non-empty `source_artifacts`
- all source references resolve to actual flow artifacts by `artifact_id` or `source_path`
- cited source references include at least one `audit_report`
- cited source references include at least one `share_recommendation`
- cited source references include at least one allowed finding record
- resolved source metadata is preserved in share record and PM context
- empty source artifact adversarial tests
- unrelated source artifact adversarial tests
- stricter tripwire harness
- narrowed outbox write allowlist to `governance/outbox/science_share/`
- stale OpenAPI share operation naming cleanup

## Required Status Labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
