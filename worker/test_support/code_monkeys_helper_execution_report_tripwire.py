#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
required = [
  "worker/src/helper_execution_report.ts",
  "worker/src/helper_execution_intake.ts",
  "worker/src/index.ts",
  "worker/src/flows.ts",
  "worker/test_support/code_monkeys_helper_execution_report_offline_smoke.ts",
  "docs/04_flows_and_spec_kit/HELPER_EXECUTION_BOUNDARY_001.md"
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2)); sys.exit(1)

handler = (ROOT / "worker/src/helper_execution_report.ts").read_text()
index = (ROOT / "worker/src/index.ts").read_text()
flows = (ROOT / "worker/src/flows.ts").read_text()
smoke = (ROOT / "worker/test_support/code_monkeys_helper_execution_report_offline_smoke.ts").read_text()
doc = (ROOT / "docs/04_flows_and_spec_kit/HELPER_EXECUTION_BOUNDARY_001.md").read_text()

checks = [
  ("route mounted", "/v1/helper/execution-report" in index and "handleHelperExecutionReportRequest" in index),
  ("helper only", 'role !== "HELPER_AI"' in handler and "HELPER_EXECUTION_REPORT_ROLE_FORBIDDEN" in handler),
  ("source context consumed", "generated_helper_execution_intake_context.json" in handler and "helper_execution_intake_record_path" in handler),
  ("official intake schema", "helper_execution_intake_context.v0.1" in handler),
  ("route-only artifacts", all(a in flows for a in ["execution_report", "command_log", "evidence_manifest"]) and "FLOW_ARTIFACT_ROUTE_REQUIRED" in flows and "isRouteOnlyArtifactForFlow" in flows and 'execution_report: ["code_flow"]' in flows),
  ("writes three evidence artifacts", all(a in handler for a in ['"execution_report"', '"command_log"', '"evidence_manifest"'])),
  ("idempotency conflict", "HELPER_EXECUTION_REPORT_IDEMPOTENCY_CONFLICT" in handler and "submitted_payload_hash" in handler),
  ("forbidden claim guard", "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED" in handler and "validateCommandEvidence" in handler),
  ("secret material guard", "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN" in handler and "secretMaterialText" in handler and "titleSecretError" in handler and "summarySecretError" in handler),
  ("source sha guard", "HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_SHA_MISMATCH" in handler),
  ("no server command execution", "child_process" not in handler and "exec(" not in handler and "spawn(" not in handler),
  ("offline smoke raw route-only", 'for (const artifact_type of ["execution_report","command_log","evidence_manifest"])' in smoke and "raw generic ${artifact_type} must be route-only" in smoke),
  ("offline science regression", "science executor raw execution_report should not be route-only blocked" in smoke and "science raw_result_index should succeed" in smoke),
  ("offline command guard coverage", all(marker in smoke for marker in ["bad command", "bad purpose", "bad stdout", "bad stderr"])),
  ("offline secret guard coverage", all(marker in smoke for marker in ["secret title", "secret summary", "secret command", "secret purpose", "secret stdout", "secret stderr"])),
  ("status labels", all(label in doc for label in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]))
]
failures = [name for name, ok in checks if not ok]
print(json.dumps({"ok": not failures, "result": "PASS" if not failures else "FAIL", "failures": failures, "checks": [name for name, _ in checks]}, indent=2))
sys.exit(1 if failures else 0)
