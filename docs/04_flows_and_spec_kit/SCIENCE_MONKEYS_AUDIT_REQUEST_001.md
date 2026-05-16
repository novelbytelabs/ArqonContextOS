# Science Monkeys Audit Request 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Objective

Define the Auditor AI review request for the Science Monkeys Operational Bring-Up 002 planning bundle.

The audit must verify that the planning bundle preserves Science role separation, Helper/Executor execution boundaries, Human authority, route-only policy, anti-deception requirements, and non-certification status.

This document is an audit request only.

It does not perform the audit.  
It does not create GPTs.  
It does not implement routes.  
It does not deploy.  
It does not certify or promote Science Monkeys.

## Audit Task

Run Science Monkeys Operational Bring-Up 002 Planning Bundle Audit.

## Audit Objective

Verify that the PM-authored planning bundle is aligned with the committed Science Monkeys Operational Bring-Up 001 plan and does not authorize implementation, GPT creation, route changes, deployment, certification, promotion, production-readiness claims, or autonomous science execution.

## Required Status

The audit must preserve:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Evidence To Inspect

Primary planning docs:

- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_OPERATIONAL_BRINGUP_001_PLAN.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_ROLE_CONSTITUTIONS_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_GPT_ACTIONS_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_EXECUTOR_BOUNDARY_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_E2E_SMOKE_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_AUDIT_REQUEST_001.md`

Helper execution evidence:

- branch
- commit before
- commit after/current HEAD
- push status
- files changed
- source changed YES/NO
- route files changed YES/NO
- GPTs created YES/NO
- GPT Actions created YES/NO
- deployment performed YES/NO
- secrets exposed YES/NO
- required labels present YES/NO
- deviations

Optional codebase reference files if needed:

- `worker/src/science.ts`
- `worker/src/science_share.ts`
- `worker/src/flow_policy.ts`
- `worker/src/types.ts`
- `worker/src/auth.ts`
- `worker/src/index.ts`
- `openapi/arqon_contextos.openapi.yaml`

The audit should not require source changes.

## Questions Auditor Must Answer

### Planning Scope

1. Does the bundle remain planning/configuration governance only?
2. Does any document authorize implementation?
3. Does any document authorize route changes?
4. Does any document authorize Worker deployment?
5. Does any document authorize GPT creation in this stage?
6. Does any document authorize GPT Action creation in this stage?
7. Does any document authorize certification?
8. Does any document authorize promotion?
9. Does any document authorize production-readiness claims?
10. Does any document authorize autonomous science execution?

### Role Separation

11. Are Explorer, Hypothesizer, Designer, Executor, Auditor, and Human boundaries clearly separated?
12. Is Explorer blocked from hypothesis/design/execution/audit claims?
13. Is Hypothesizer blocked from design/execution/audit approval?
14. Is Designer blocked from execution and audit claims?
15. Is Executor kept non-GPT and execution-only?
16. Is Auditor blocked from producing the evidence it audits?
17. Is Human retained as official share and advancement authority?

### Helper / Executor Boundary

18. Does the bundle prevent Helper/Executor from planning?
19. Does it prevent Helper/Executor from designing experiments?
20. Does it prevent Helper/Executor from auditing its own evidence?
21. Does it define safe micro-edits narrowly?
22. Does it require deviations to be reported?
23. Does it require secrets not to be printed?

### GPT Actions Boundary

24. Does the GPT Actions doc preserve role-token isolation?
25. Does it make server-authenticated bearer role authoritative?
26. Does it reject request-body role spoofing as authority?
27. Does it preserve `/v1/science/share` as Human-only?
28. Does it preserve route-only artifact enforcement?
29. Does it avoid inventing new routes or schemas?

### Evidence / Smoke Boundary

30. Does the E2E smoke spec require fresh live data?
31. Does it reject stale fixture IDs?
32. Does it preserve allowed/forbidden claims?
33. Does it define pass/fail criteria clearly?
34. Does it classify persistent SHA conflicts as possible product bugs?
35. Does it avoid treating offline smoke as sufficient for live operational status?

### Anti-Deception

36. Does the bundle preserve "No harness = No truth"?
37. Does it reject raw GPT output as evidence?
38. Does it define fake science clearly?
39. Does it require claim boundaries?
40. Does it prevent evidence laundering?
41. Does it preserve required status labels?
42. Does it prevent certification/promotion/deployment wording?

### Source / Route / Secret Safety

43. Did Helper change only approved docs?
44. Were source files unchanged?
45. Were route files unchanged?
46. Were OpenAPI files unchanged unless separately authorized?
47. Were secrets exposed?
48. Were local env file paths referenced without values?

## Expected Audit Output

Auditor should return:

- verdict: `PASS`, `PASS_WITH_WARNINGS`, or `FAIL`
- score out of 100
- blocking issues
- warnings
- evidence inspected
- role-boundary assessment
- Helper/Executor-boundary assessment
- GPT Action-boundary assessment
- smoke-boundary assessment
- anti-deception assessment
- source/route/secret assessment
- required status label assessment
- go/no-go recommendation for next PM planning stage

## Passing Criteria

The audit may pass only if:

- all required status labels are preserved
- no implementation is authorized
- no GPT creation is authorized
- no route/source changes are authorized
- no deployment/certification/promotion is authorized
- Science role boundaries are clear
- Helper/Executor is execution-only
- Human share authority is preserved
- anti-deception guardrails are preserved
- secret values are not exposed
- evidence is sufficient to verify the planning bundle

## Failing Criteria

The audit must fail if:

- any document authorizes GPT creation in this stage
- any document authorizes implementation in this stage
- any document authorizes route/source changes in this stage
- any document authorizes deployment/certification/promotion
- Human share authority is weakened
- Helper/Executor is allowed to plan or design
- Auditor is allowed to produce the evidence it audits
- route-token isolation is weakened
- raw GPT output is treated as evidence
- forbidden claims are dropped
- secret values are exposed
- required status labels are missing

## Non-Certification Boundary

Even if this audit passes, the result is not certification.

A pass means only that the planning bundle is aligned enough to proceed to the next Human-approved stage.

It does not mean Science Monkeys are operational.

It does not mean Science GPTs exist.

It does not mean live smokes passed.

It does not mean Science outputs are ready for Code Monkeys exploitation.
