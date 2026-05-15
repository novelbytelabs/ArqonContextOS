#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, subprocess, zipfile
from pathlib import Path
FILES = [".gitignore", "worker/tsconfig.smoke.json", "worker/test_support/compile_smoke_runtime.py", "worker/test_support/check_no_tmp_critical_paths.py", "worker/test_support/check_no_tmp_critical_paths_selftest.py", "worker/test_support/build_operational_discipline_audit_bundle.py", "docs/01_monkeyos_doctrine/OPERATIONAL_WORKSPACE_POLICY_001.md", "docs/04_flows_and_spec_kit/OPERATIONAL_DISCIPLINE_HARDENING_001.md"]
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
    missing = [path for path in FILES if not (root / path).is_file()]
    if missing: raise SystemExit(json.dumps({"ok": False, "missing": missing}, indent=2))
    records = [{"path": path, "bytes": (root / path).stat().st_size, "sha256": sha(root / path)} for path in FILES]
    out = root / "temps" / f"operational_discipline_hardening_audit_bundle_{commit[:12]}.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    manifest = {"schema_version": "operational_discipline_hardening_audit_bundle.v0.1", "commit": commit, "purpose": "prove runtime workspace cutover and tmp critical path guardrails", "required_status_labels": LABELS, "files": records}
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("AUDIT_BUNDLE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
        for record in records: z.write(root / record["path"], record["path"])
    print(json.dumps({"ok": True, "bundle_path": str(out), "bundle_sha256": sha(out), "file_count": len(records)}, indent=2))
if __name__ == "__main__":
    main()
