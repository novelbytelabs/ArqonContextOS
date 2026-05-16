#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, subprocess, zipfile
from pathlib import Path

FILES = [
  "worker/src/auditor_helper_execution_review.ts",
  "worker/src/helper_execution_report.ts",
  "worker/src/index.ts",
  "worker/src/flows.ts",
  "worker/src/flow_policy.ts",
  "worker/test_support/code_monkeys_auditor_helper_execution_review_policy_unit.ts",
  "worker/test_support/code_monkeys_auditor_helper_execution_review_offline_smoke.ts",
  "worker/test_support/code_monkeys_auditor_helper_execution_review_live_smoke.ts",
  "worker/test_support/code_monkeys_auditor_helper_execution_review_tripwire.py",
  "worker/test_support/build_auditor_helper_execution_review_audit_bundle.py",
  "docs/04_flows_and_spec_kit/AUDITOR_REVIEW_HELPER_EXECUTION_001.md",
  "docs/04_flows_and_spec_kit/AUDITOR_REVIEW_HELPER_EXECUTION_001_EVIDENCE.md",
]
LABELS = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]
def run(args): return subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout.strip()
def sha(path: Path):
  h = hashlib.sha256()
  with path.open("rb") as f:
    for chunk in iter(lambda: f.read(1024*1024), b""): h.update(chunk)
  return h.hexdigest()
def main():
  root = Path.cwd(); commit = run(["git","rev-parse","HEAD"])
  missing = [p for p in FILES if not (root/p).is_file()]
  if missing: raise SystemExit(json.dumps({"ok":False,"missing":missing}, indent=2))
  out = root/"temps"/f"auditor_helper_execution_review_audit_bundle_{commit[:12]}.zip"; out.parent.mkdir(exist_ok=True)
  records = [{"path":p,"bytes":(root/p).stat().st_size,"sha256":sha(root/p)} for p in FILES]
  manifest = {"schema_version":"auditor_helper_execution_review_audit_bundle.v0.1","commit":commit,"purpose":"verify Auditor Review of Helper Execution 001 boundary","required_status_labels":LABELS,"files":records}
  with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("AUDIT_BUNDLE_MANIFEST.json", json.dumps(manifest, indent=2)+"\n")
    for r in records: z.write(root/r["path"], r["path"])
  print(json.dumps({"ok":True,"bundle_path":str(out),"bundle_sha256":sha(out),"file_count":len(records)}, indent=2))
if __name__ == "__main__": main()
