# Science Monkeys GPT Action Route Matrix 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define the future GPT Action route, token, and artifact authority matrix for Science Monkeys custom GPTs without authorizing GPT Action creation in this stage.

This document is planning/configuration governance only.

It does not create GPT Actions.  
It does not create GPTs.  
It does not modify OpenAPI.  
It does not modify Worker routes.  
It does not authorize deployment, certification, promotion, production-readiness claims, or autonomous Science operation.

## Action Base URL

Use the currently validated ArqonMonkeyOS Worker base URL.

The exact base URL must be taken from the repo/deployment context at configuration time.

Do not hardcode a stale URL in GPT instructions unless it is verified against current Worker deployment evidence.

## OpenAPI Schema Source

The GPT Action schema must be copied from the current committed repo source only:

```text
openapi/arqon_contextos.openapi.yaml
```

If the OpenAPI schema does not include the required Science routes or does not match deployed Worker behavior, stop and classify the issue as a blocker.

Do not edit the OpenAPI schema in this stage.

## Secret Sources

Deployment secrets live in Worker/Cloudflare environment configuration.

Local Helper workflows may source role keys from:

```text
~/secrets/arqonmonkeyos_code_keys.env
~/secrets/arqonmonkeyos_science_keys.env
```

These files may be referenced by path only.

Secret values must never be printed, copied into docs, uploaded as GPT knowledge, committed, pasted into chat, or included in audit bundles.

## Token Environment Variable Matrix

| Role | Environment variable |
|---|---|
| `EXPLORER_AI` | `BROKER_KEY_EXPLORER` |
| `HYPOTHESIZER_AI` | `BROKER_KEY_HYPOTHESIZER` |
| `DESIGNER_AI` | `BROKER_KEY_DESIGNER` |
| `SCIENCE_AUDITOR_AI` | `BROKER_KEY_SCIENCE_AUDITOR` |
| `SCIENCE_EXECUTOR_AI` | `BROKER_KEY_SCIENCE_EXECUTOR` |
| `HUMAN` | Human bearer key path only; not a GPT token |

Do not assign Human or Executor token values to a custom GPT.

## Route Authority Matrix

| Route | Authorized role | GPT authorized? |
|---|---|---|
| `/v1/science/research` | `EXPLORER_AI` | Yes, Explorer only |
| `/v1/science/hypothesize` | `HYPOTHESIZER_AI` | Yes, Hypothesizer only |
| `/v1/science/interpret` | `HYPOTHESIZER_AI` | Yes, Hypothesizer only |
| `/v1/science/design-experiment` | `DESIGNER_AI` | Yes, Designer only |
| `/v1/science/iterate` | `HYPOTHESIZER_AI` / `DESIGNER_AI` by artifact subset | Yes, bounded by artifact subset |
| `/v1/science/execute-experiment` | `SCIENCE_EXECUTOR_AI` | No custom GPT |
| `/v1/science/audit-experiment` | `SCIENCE_AUDITOR_AI` | Yes, Auditor only |
| `/v1/science/record-finding` | `SCIENCE_AUDITOR_AI` | Yes, Auditor only |
| `/v1/science/share` | `HUMAN` | No custom GPT |

## Artifact Authority Matrix

| Artifact | Authorized role |
|---|---|
| `research_dossier` | `EXPLORER_AI` |
| `source_map` | `EXPLORER_AI` |
| `contradiction_map` | `EXPLORER_AI` |
| `open_questions` | `EXPLORER_AI` |
| `hypothesis_card` | `HYPOTHESIZER_AI` |
| `null_hypothesis` | `HYPOTHESIZER_AI` |
| `prediction_record` | `HYPOTHESIZER_AI` |
| `interpretation_draft` | `HYPOTHESIZER_AI` |
| `alternative_explanation_review` | `HYPOTHESIZER_AI` |
| `iteration_proposal` | `HYPOTHESIZER_AI` |
| `revised_hypothesis_card` | `HYPOTHESIZER_AI` |
| `experiment_protocol` | `DESIGNER_AI` |
| `metric_plan` | `DESIGNER_AI` |
| `control_plan` | `DESIGNER_AI` |
| `execution_packet` | `DESIGNER_AI` |
| `sealed_boundary_plan` | `DESIGNER_AI` |
| `revised_experiment_protocol` | `DESIGNER_AI` |
| `execution_report` | `SCIENCE_EXECUTOR_AI` |
| `evidence_manifest` | `SCIENCE_EXECUTOR_AI` |
| `command_log` | `SCIENCE_EXECUTOR_AI` |
| `raw_result_index` | `SCIENCE_EXECUTOR_AI` |
| `deviation_report` | `SCIENCE_EXECUTOR_AI` |
| `science_checklist` | `SCIENCE_AUDITOR_AI` |
| `protocol_audit` | `SCIENCE_AUDITOR_AI` |
| `evidence_audit` | `SCIENCE_AUDITOR_AI` |
| `claim_scope_audit` | `SCIENCE_AUDITOR_AI` |
| `audit_report` | `SCIENCE_AUDITOR_AI` |
| `quarantine_recommendation` | `SCIENCE_AUDITOR_AI` |
| `claim_scope_review` | `SCIENCE_AUDITOR_AI` |
| `finding_record` | `SCIENCE_AUDITOR_AI` |
| `negative_finding_record` | `SCIENCE_AUDITOR_AI` |
| `inconclusive_finding_record` | `SCIENCE_AUDITOR_AI` |
| `finding_boundary_record` | `SCIENCE_AUDITOR_AI` |
| `share_recommendation` | `SCIENCE_AUDITOR_AI` |
| `share_packet` | `HUMAN` only |

## Forbidden GPT Action Assignments

Do not configure any custom GPT with:

- `HUMAN` bearer key
- `SCIENCE_EXECUTOR_AI` bearer key
- `/v1/science/share` write authority
- `/v1/science/execute-experiment` write authority
- generic artifact write authority for route-only artifacts
- deployment authority
- source-edit authority
- route-edit authority
- OpenAPI-edit authority

## Server-Side Enforcement Requirement

The Worker must remain the enforcement authority.

GPT instructions are not security controls.

Required server-side expectations:

- bearer token maps to one role,
- bearer-token role is authoritative,
- request-body role spoofing is ignored or rejected,
- route-only artifacts remain route-only,
- Human-only share remains Human-only,
- Executor-only execution remains non-GPT,
- unauthorized routes return denial,
- stale ID/write conflicts are classified explicitly.

## Future Action Configuration Procedure

Only after Human approval:

1. Open the GPT editor for the specific GPT.
2. Configure its instructions from the approved packet.
3. Upload approved knowledge docs only.
4. Configure only the approved Worker Action schema.
5. Add the correct role bearer token.
6. Do not expose token value in chat or docs.
7. Run startup checks before any live write.
8. Run route-boundary refusal checks.
9. Run fresh live smoke only if separately authorized.
10. Record evidence for Auditor.

## Route Boundary Tests Required After Configuration

Each GPT must be tested for:

- allowed route success,
- forbidden route rejection,
- request-body role spoofing rejection,
- generic route-only artifact write rejection,
- Human-only share rejection,
- Executor-only execution rejection,
- status label preservation,
- no certification/promotion/deployment claims.

## Blockers

Stop and require PM/Human review if:

- OpenAPI schema is missing routes,
- deployed Worker behavior differs from schema,
- role token is ambiguous,
- any GPT has access to Human or Executor token,
- any GPT can write `/v1/science/share`,
- any GPT can write `/v1/science/execute-experiment`,
- route-only policy is bypassed,
- secrets are printed or committed,
- GPT tries to self-certify or claim operational status.

## Stage Exit Criteria

This matrix is accepted for planning only if:

- it defines exact route/role/artifact boundaries,
- it preserves Human-only share,
- it preserves non-GPT Executor execution,
- it references secret locations without exposing values,
- it does not authorize GPT Action creation,
- it does not authorize source/OpenAPI/route/deployment changes.
