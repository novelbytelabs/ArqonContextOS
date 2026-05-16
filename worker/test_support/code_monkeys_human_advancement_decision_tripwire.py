#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
required = [
  "worker/src/human_advancement_decision.ts",
  "worker/src/auditor_helper_execution_review.ts",
  "worker/src/index.ts",
  "worker/src/flows.ts",
  "worker/src/flow_policy.ts",
  "worker/test_support/code_monkeys_human_advancement_decision_offline_smoke.ts",
  "docs/04_flows_and_spec_kit/HUMAN_ADVANCEMENT_GATE_001.md",
  "docs/04_flows_and_spec_kit/HUMAN_ADVANCEMENT_GATE_001_PLAN.md"
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

handler = (ROOT / "worker/src/human_advancement_decision.ts").read_text()
index = (ROOT / "worker/src/index.ts").read_text()
flows = (ROOT / "worker/src/flows.ts").read_text()
policy = (ROOT / "worker/src/flow_policy.ts").read_text()
smoke = (ROOT / "worker/test_support/code_monkeys_human_advancement_decision_offline_smoke.ts").read_text()
doc = (ROOT / "docs/04_flows_and_spec_kit/HUMAN_ADVANCEMENT_GATE_001.md").read_text()

checks = [
  ("route mounted", "/v1/human/advancement-decision" in index and "handleHumanAdvancementDecisionRequest" in index),
  ("human only", 'role !== "HUMAN"' in handler and "HUMAN_ADVANCEMENT_DECISION_ROLE_FORBIDDEN" in handler),
  ("source context consumed", "generated_auditor_helper_execution_review_context.json" in handler and "auditor_helper_execution_review_record_path" in handler),
  ("official review schema", "auditor_helper_execution_review_context.v0.1" in handler),
  ("route-only decision artifact", "human_advancement_decision" in flows and "FLOW_ARTIFACT_ROUTE_REQUIRED" in flows),
  ("human policy ownership", '"human_advancement_decision"' in policy and "HUMAN" in policy),
  ("outcomes enforced", "advance" in handler and "require_revision" in handler and "quarantine" in handler and "reject" in handler),
  ("advance requires pass", "HUMAN_ADVANCEMENT_DECISION_AUDITOR_REVIEW_NOT_PASS" in handler),
  ("unresolved blockers check", "HUMAN_ADVANCEMENT_DECISION_UNRESOLVED_BLOCKERS_PRESENT" in handler),
  ("idempotency conflict", "HUMAN_ADVANCEMENT_DECISION_IDEMPOTENCY_CONFLICT" in handler and "submitted_payload_hash" in handler),
  ("forbidden guard", "HUMAN_ADVANCEMENT_DECISION_FORBIDDEN_CLAIM_INCLUDED" in handler),
  ("secret guard", "HUMAN_ADVANCEMENT_DECISION_SECRET_MATERIAL_FORBIDDEN" in handler),
  ("embedded role validation", 'expected.role !== "AUDITOR_AI"' in handler and 'actual.role !== "AUDITOR_AI"' in handler),
  ("offline smoke raw route-only", "raw generic human_advancement_decision must be route-only" in smoke),
  ("offline smoke no promotion/deployment", "no promotion/deployment/certification artifacts" in smoke),
  ("status labels", all(label in doc for label in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]))
]
failures = [name for name, ok in checks if not ok]
print(json.dumps({"ok": not failures, "result": "PASS" if not failures else "FAIL", "failures": failures, "checks": [name for name, _ in checks]}, indent=2))
sys.exit(1 if failures else 0)
