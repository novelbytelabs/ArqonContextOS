# Science Monkeys GPT Configuration Checklist 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Provide a per-GPT configuration checklist for manual creation/configuration of Science Monkeys GPTs.

This checklist is not approval to create GPTs. It is used only after Human approval.

## Global Pre-Checks

Before configuring any GPT:

- Human approval record exists.
- Current audited packet is identified.
- Exact GPT names are known.
- Exact role-token variable names are known.
- Worker Action schema source is known.
- No secret values are printed.
- No Human token is assigned to a GPT.
- No Science Executor token is assigned to a GPT.
- No combined Science Monkeys GPT is created.

## Explorer GPT Checklist

| Check | Expected |
|---|---|
| Name | Arqon Science Explorer GPT |
| Role | `EXPLORER_AI` |
| Allowed route | `/v1/science/research` |
| Forbidden route | `/v1/science/share` |
| Forbidden route | `/v1/science/execute-experiment` |
| Token | Explorer role token only |
| Capabilities | Web OFF, Canvas OFF, Image OFF, Code Interpreter OFF, Actions ON only when configured |
| Knowledge | Shared + Explorer-relevant docs only |
| Startup check | Can explain research-only boundary |
| Refusal check | Refuses to design/execute/audit/certify |

## Hypothesizer GPT Checklist

| Check | Expected |
|---|---|
| Name | Arqon Science Hypothesizer GPT |
| Role | `HYPOTHESIZER_AI` |
| Allowed routes | `/v1/science/hypothesize`, `/v1/science/interpret`, limited `/v1/science/iterate` |
| Forbidden route | `/v1/science/share` |
| Forbidden route | `/v1/science/execute-experiment` |
| Token | Hypothesizer role token only |
| Capabilities | Web OFF, Canvas OFF, Image OFF, Code Interpreter OFF, Actions ON only when configured |
| Knowledge | Shared + Hypothesizer-relevant docs only |
| Startup check | Can explain falsifiable hypothesis boundary |
| Refusal check | Refuses to design protocols, execute, audit, certify, or share |

## Designer GPT Checklist

| Check | Expected |
|---|---|
| Name | Arqon Science Designer GPT |
| Role | `DESIGNER_AI` |
| Allowed routes | `/v1/science/design-experiment`, limited `/v1/science/iterate` |
| Forbidden route | `/v1/science/share` |
| Forbidden route | `/v1/science/execute-experiment` |
| Token | Designer role token only |
| Capabilities | Web OFF, Canvas OFF, Image OFF, Code Interpreter OFF, Actions ON only when configured |
| Knowledge | Shared + Designer-relevant docs only |
| Startup check | Can explain design-only boundary |
| Refusal check | Refuses to execute, audit, certify, or share |

## Science Auditor GPT Checklist

| Check | Expected |
|---|---|
| Name | Arqon Science Auditor GPT |
| Role | `SCIENCE_AUDITOR_AI` |
| Allowed routes | `/v1/science/audit-experiment`, `/v1/science/record-finding` |
| Forbidden route | `/v1/science/share` |
| Forbidden route | `/v1/science/execute-experiment` |
| Token | Science Auditor role token only |
| Capabilities | Web OFF, Canvas OFF, Image OFF, Code Interpreter OFF, Actions ON only when configured |
| Knowledge | Shared + Auditor-relevant docs only |
| Startup check | Can explain independent audit boundary |
| Refusal check | Refuses to produce evidence it audits, certify, deploy, or share |

## Configuration Evidence To Record

For each GPT record:

```text
GPT name:
role:
configured action base URL:
token variable name used:
knowledge files uploaded:
capabilities enabled:
startup check result:
refusal check result:
route-boundary check result:
secret exposure check:
deviations:
```

Do not record secret values.

## Stop Conditions

Stop configuration if:

- wrong role token is used
- Human token is requested
- Science Executor token is requested
- one GPT is configured for multiple Science roles
- GPT tries to claim certification, promotion, deployment, or production readiness
- GPT cannot refuse out-of-scope tasks
- Action schema exposes unexpected behavior not covered by the audited packet
- any secret value is exposed
