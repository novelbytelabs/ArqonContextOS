# Science Monkeys GPT Action Setup Checklist 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define manual GPT Action setup checks for Science Monkeys GPTs while preserving route-token isolation and server-side authority.

This document does not authorize Action creation by itself.

## Global Action Rules

- Use the current validated Worker Action base URL.
- Use the current validated OpenAPI schema source.
- Do not edit OpenAPI in this stage.
- Do not edit Worker routes in this stage.
- Do not deploy Worker changes in this stage.
- Configure one role token per GPT.
- Do not assign Human token to a GPT.
- Do not assign Science Executor token to a GPT.
- Do not print token values.
- Server-authenticated bearer role wins over request-body role claims.
- Generic route-only artifact writes must remain rejected where policy requires route-specific endpoints.

## Action Route Matrix

| GPT | Role Token | Allowed Routes | Forbidden Routes |
|---|---|---|---|
| Arqon Zero Explorer AI | Explorer token | `/v1/science/research` | `/v1/science/share`, `/v1/science/execute-experiment`, audit/design/hypothesis routes |
| Arqon Zero Hypothesizer AI | Hypothesizer token | `/v1/science/hypothesize`, `/v1/science/interpret`, limited `/v1/science/iterate` | `/v1/science/share`, `/v1/science/execute-experiment`, audit/design/research routes |
| Arqon Zero Designer AI | Designer token | `/v1/science/design-experiment`, limited `/v1/science/iterate` | `/v1/science/share`, `/v1/science/execute-experiment`, audit/hypothesis/research routes |
| Arqon Zero Science Auditor AI | Science Auditor token | `/v1/science/audit-experiment`, `/v1/science/record-finding` | `/v1/science/share`, `/v1/science/execute-experiment`, research/design/hypothesis routes |

## Local Secret File References

For local Helper workflows, role keys may be sourced from:

```text
~/secrets/arqonmonkeyos_code_keys.env
~/secrets/arqonmonkeyos_science_keys.env
```

These paths may be referenced.

Secret values must never be printed, pasted, committed, summarized, or exposed.

## Per-GPT Action Setup Steps

For each GPT:

1. Open GPT configuration manually.
2. Open Actions.
3. Import or paste the current validated Worker OpenAPI schema.
4. Configure authentication using only the GPT's assigned role token.
5. Do not use Human or Science Executor token.
6. Save Action configuration.
7. In Preview, run startup checks.
8. In Preview, run refusal checks.
9. In Preview, run route-boundary checks if safe and authorized.
10. Record evidence without secrets.

## Required Action Evidence

For each GPT:

```text
GPT name:
role:
Action schema source:
Worker base URL:
token variable name:
allowed route preview result:
forbidden route refusal result:
secret exposure check:
deviations:
```

## Live Action Smoke Boundary

Live Action smoke is not certification.

Live Action smoke must not be treated as production readiness.

Live Action smoke must use fresh flow names/IDs.

Live Action smoke must not reuse stale fixture IDs.

Live Action smoke must verify:

- allowed route works for assigned role
- forbidden route is rejected or refused
- `/v1/science/share` remains Human-only
- `/v1/science/execute-experiment` remains non-GPT Executor-only
- role spoofing in request body does not override bearer-token role
- route-only artifact policy remains enforced

## Stop Conditions

Stop Action setup if:

- schema differs unexpectedly from audited source
- role token is ambiguous
- wrong token is used
- Human token is requested
- Science Executor token is requested
- GPT can call `/v1/science/share`
- GPT can call `/v1/science/execute-experiment`
- GPT can call another role's route successfully
- secret value appears in logs or transcript
- GPT claims certification, promotion, deployment, or production readiness
