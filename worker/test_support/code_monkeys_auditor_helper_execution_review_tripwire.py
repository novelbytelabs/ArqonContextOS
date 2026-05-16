#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
required = [
  "worker/src/auditor_helper_execution_review.ts",
  "worker/src/helper_execution_report.ts",
  "worker/src/index.ts",
  "worker/src/flows.ts",
  "worker/src/flow_policy.ts",
  "worker/test_support/code_monkeys_auditor_helper_execution_review_offline_smoke.ts",
  "docs/04_flows_and_spec_kit/AUDITOR_REVIEW_HELPER_EXECUTION_001.md"
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

handler = (ROOT / "worker/src/auditor_helper_execution_review.ts").read_text()
index = (ROOT / "worker/src/index.ts").read_text()
flows = (ROOT / "worker/src/flows.ts").read_text()
policy = (ROOT / "worker/src/flow_policy.ts").read_text()
smoke = (ROOT / "worker/test_support/code_monkeys_auditor_helper_execution_review_offline_smoke.ts").read_text()
doc = (ROOT / "docs/04_flows_and_spec_kit/AUDITOR_REVIEW_HELPER_EXECUTION_001.md").read_text()

checks = [
  ("route mounted", "/v1/auditor/helper-execution-review" in index and "handleAuditorHelperExecutionReviewRequest" in index),
  ("auditor only", 'role !== "AUDITOR_AI"' in handler and "AUDITOR_HELPER_EXECUTION_REVIEW_ROLE_FORBIDDEN" in handler),
  ("source context consumed", "generated_helper_execution_report_context.json" in handler and "helper_execution_report_record_path" in handler),
  ("official report schema", "helper_execution_report_context.v0.1" in handler),
  ("validates three Helper artifacts", all(s in handler for s in ["execution_report", "command_log", "evidence_manifest"])),
  ("embedded report role guard", 'expected.role !== "HELPER_AI"' in handler),
  ("route-only review artifact", "helper_execution_review" in flows and "FLOW_ARTIFACT_ROUTE_REQUIRED" in flows),
  ("auditor policy ownership", '"helper_execution_review"' in policy and "AUDITOR_AI" in policy),
  ("idempotency conflict", "AUDITOR_HELPER_EXECUTION_REVIEW_IDEMPOTENCY_CONFLICT" in handler and "submitted_payload_hash" in handler),
  ("forbidden guard", "AUDITOR_HELPER_EXECUTION_REVIEW_FORBIDDEN_CLAIM_INCLUDED" in handler),
  ("secret guard", "AUDITOR_HELPER_EXECUTION_REVIEW_SECRET_MATERIAL_FORBIDDEN" in handler),
  ("no human advancement artifacts", "advancement_approval" not in handler and "promotion_decision" not in handler and "human_decision" not in handler),
  ("offline smoke raw route-only", "raw generic helper_execution_review must be route-only" in smoke),
  ("offline smoke execution_report role mutation", "execution_report embedded role mismatch" in smoke),
  ("offline smoke command_log role mutation", "command_log embedded role mismatch" in smoke),
  ("offline smoke evidence_manifest role mutation", "evidence_manifest embedded role mismatch" in smoke),
  ("offline smoke no advancement", "no Human/promotion artifacts" in smoke),
  ("status labels", all(label in doc for label in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]))
]
failures = [name for name, ok in checks if not ok]
print(json.dumps({"ok": not failures, "result": "PASS" if not failures else "FAIL", "failures": failures, "checks": [name for name, _ in checks]}, indent=2))
sys.exit(1 if failures else 0)
