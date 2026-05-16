# Science Monkeys GPT Creation Audit Request 001

Status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Audit Objective

Verify that the committed Science Monkeys GPT Creation/Configuration Planning Packet 001 defines a safe, bounded future GPT creation plan without authorizing GPT creation, GPT Actions creation, source edits, route edits, OpenAPI edits, Worker deployment, certification, promotion, production-readiness claims, or autonomous Science operation.

## Evidence To Inspect

- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_GPT_CREATION_CONFIG_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_GPT_ACTION_ROUTE_MATRIX_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_GPT_STARTUP_CHECKS_001.md`
- `docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_GPT_CREATION_AUDIT_REQUEST_001.md`

## Ground Truth Expected From Helper

Helper should report:

- branch,
- commit before,
- commit after/current HEAD,
- push status,
- files changed,
- source changed YES/NO,
- route files changed YES/NO,
- OpenAPI changed YES/NO,
- GPTs created YES/NO,
- GPT Actions created YES/NO,
- deployment performed YES/NO,
- smoke executed YES/NO,
- secrets exposed YES/NO,
- required labels present in every doc YES/NO,
- bundle SHA matched YES/NO,
- deviations.

## Required Audit Questions

### Required labels

1. Are these labels present in all packet docs?

```text
REQUIRES_HUMAN_REVIEW
development diagnostic only
NOT SEALED-TEST CERTIFIED
not promotable
```

### Planning-only boundary

2. Does the packet remain planning/configuration governance only?
3. Does it avoid authorizing GPT creation?
4. Does it avoid authorizing GPT Action creation?
5. Does it avoid authorizing source edits?
6. Does it avoid authorizing route edits?
7. Does it avoid authorizing OpenAPI edits?
8. Does it avoid authorizing Worker deployment?
9. Does it avoid certification, promotion, production-readiness, or autonomous Science claims?

### Role separation

10. Does the packet create four separate GPT roles rather than one combined GPT?
11. Does Explorer remain research-only?
12. Does Hypothesizer remain hypothesis/interpretation-only?
13. Does Designer remain experiment-design-only?
14. Does Science Auditor remain audit-only?
15. Does Science Executor remain non-GPT/local execution-only?
16. Does Human retain official share and advancement authority?

### Action and token boundaries

17. Does the packet preserve one role token per GPT?
18. Does it forbid assigning Human tokens to GPTs?
19. Does it forbid assigning Executor tokens to GPTs?
20. Does it preserve server-authenticated bearer-token role authority?
21. Does it treat request-body role labels as non-authoritative?
22. Does it preserve Human-only `/v1/science/share`?
23. Does it preserve Executor-only `/v1/science/execute-experiment`?
24. Does it preserve route-only artifact policy?

### Secret hygiene

25. Does the packet reference local env files only by path?
26. Does it avoid printing or committing secret values?
27. Does it forbid uploading `.env` files as GPT knowledge?
28. Does it forbid including bearer-token values in docs, logs, GPT knowledge, or chat transcripts?

### Startup/smoke integrity

29. Does the packet require startup identity checks?
30. Does it require refusal checks?
31. Does it require route-boundary checks?
32. Does it require fresh live smoke before operational claims?
33. Does it reject stale fixtures or copied historical passes as live evidence?
34. Does it require Auditor review before operational use?
35. Does it require Human decision before operational use?

### Anti-deception

36. Does the packet preserve “No harness = No truth”?
37. Does it reject raw GPT output as evidence?
38. Does it require allowed claims, forbidden claims, uncertainty, evidence level, and source artifacts?
39. Does it block fake experiments, fake logs, fake IDs, fake hashes, hidden failed runs, and evidence laundering?

## Blocker Conditions

Return BLOCKED if any of the following are found:

- GPT creation is authorized by the packet,
- GPT Action creation is authorized by the packet,
- deployment is authorized,
- certification/promotion/production-readiness is claimed,
- source/route/OpenAPI edits are authorized,
- Human-only share is weakened,
- Executor is converted into a GPT,
- one combined Science GPT is authorized,
- Human or Executor token can be assigned to a custom GPT,
- secret values are present,
- raw GPT output is accepted as evidence,
- startup/live checks are missing,
- role boundaries are ambiguous enough to permit self-certification or evidence laundering.

## Warning Conditions

Return PASS WITH WARNINGS if:

- packet is safe but missing helpful operational detail,
- bundle evidence does not independently prove commit state,
- route/OpenAPI non-change facts are Helper-reported only,
- startup checks are adequate but could be more specific,
- token setup remains manual and therefore error-prone,
- future smoke evidence requirements need stronger transcript details.

## Expected Return Format

```text
Verdict:
Score:
Blockers:
Warnings:
Required remediations:
Recommended remediations:
Allowed next step:
Forbidden next steps:
Per-file verdicts:
Required status labels:
```

## Allowed Next Step If Audit Passes

If the audit passes with no blockers, the allowed next step is:

```text
Human may decide whether to authorize manual GPT creation/configuration exactly according to the audited packet.
```

This is a Human decision only.

## Forbidden Next Steps Even If Audit Passes

- automatic GPT creation,
- automatic GPT Action creation,
- source edits,
- route edits,
- OpenAPI edits,
- Worker deployment,
- certification,
- promotion,
- production-readiness claims,
- autonomous Science operation,
- treating planning audit as live smoke evidence,
- treating GPT startup checks as sealed-test certification.
