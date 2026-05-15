#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, subprocess, zipfile
from pathlib import Path

FILES = [
  "worker/src/auth.ts", "worker/src/flow_policy.ts", "worker/src/flows.ts", "worker/src/github_app.ts",
  "worker/src/index.ts", "worker/src/pm_handoff.ts", "worker/src/pm_intake.ts", "worker/src/pm_specify.ts", "worker/src/pm_plan.ts", "worker/src/pm_tasking.ts", "worker/src/coder_work_plan.ts", "worker/src/coder_tasks.ts", "worker/src/coder_implementation_bundle.ts",
  "worker/src/policy.ts", "worker/src/projects.ts", "worker/src/repo_store.ts", "worker/src/response.ts",
  "worker/src/science.ts", "worker/src/science_share.ts", "worker/src/types.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_policy_unit.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_live_smoke.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_tripwire.py",
  "worker/test_support/code_monkeys_coder_tasks_tripwire.py",
  "worker/test_support/code_monkeys_coder_work_plan_tripwire.py",
  "worker/test_support/code_monkeys_pm_tasking_tripwire.py",
  "worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py",
  "worker/tsconfig.smoke.json", "worker/package.json", "openapi/arqon_contextos.openapi.yaml",
  "docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_001.md",
]
LABELS = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]

def run(args: list[str]) -> str:
    return subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout.strip()
def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""): h.update(chunk)
    return h.hexdigest()
def main() -> None:
    root = Path.cwd()
    commit = run(["git", "rev-parse", "HEAD"])
    missing = [p for p in FILES if not (root / p).is_file()]
    if missing: raise SystemExit(json.dumps({"ok": False, "missing": missing}, indent=2))
    records = [{"path": p, "bytes": (root / p).stat().st_size, "sha256": sha(root / p)} for p in FILES]
    manifest = {"schema_version": "coder_implementation_bundle_audit_bundle.v0.1", "commit": commit, "required_status_labels": LABELS, "files": records}
    out = root / "temps" / f"coder_implementation_bundle_audit_bundle_{commit[:12]}.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("AUDIT_BUNDLE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
        for rec in records: z.write(root / rec["path"], rec["path"])
    print(json.dumps({"ok": True, "bundle_path": str(out), "bundle_sha256": sha(out), "file_count": len(records)}, indent=2))
if __name__ == "__main__": main()
