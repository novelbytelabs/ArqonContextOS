#!/usr/bin/env python3
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

FILES = [
  "worker/src/flows.ts",
  "worker/src/coder_implementation_bundle.ts",
  "worker/src/flow_policy.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_offline_smoke.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_tripwire.py",
  "worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py",
  "worker/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_live_smoke.ts",
  "openapi/arqon_contextos.openapi.yaml",
  "docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_GLOBAL_ROUTE_ONLY_REMEDIATION_002.md",
  "docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_ROUTE_ONLY_REMEDIATION_001.md",
  "docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_ROUTE_ONLY_REMEDIATION_001_EVIDENCE.md",
  "docs/01_monkeyos_doctrine/AUDITOR_PANEL_MODE_001.md",
  "docs/01_monkeyos_doctrine/MDASH_IMPACT_ON_MONKEYOS_001.md",
  "docs/09_benchmarks/CYBERGYM_BENCHMARK_TRACK_001.md"
]

def run(args):
    return subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout.strip()

def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    root = Path.cwd()
    commit = run(["git", "rev-parse", "HEAD"])
    missing = [path for path in FILES if not (root / path).is_file()]
    if missing:
        raise SystemExit(json.dumps({"ok": False, "missing": missing}, indent=2))
    records = [{"path": path, "bytes": (root / path).stat().st_size, "sha256": sha(root / path)} for path in FILES]
    out = root / "temps" / f"coder_impl_bundle_global_route_only_audit_bundle_{commit[:12]}.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema_version": "coder_impl_bundle_global_route_only_audit_bundle.v0.1",
        "commit": commit,
        "purpose": "prove implementation_bundle is route-only across applicable flow types and preserve doctrine docs",
        "required_status_labels": ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"],
        "files": records
    }
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("AUDIT_BUNDLE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
        for record in records:
            z.write(root / record["path"], record["path"])
    print(json.dumps({"ok": True, "bundle_path": str(out), "bundle_sha256": sha(out), "file_count": len(records)}, indent=2))

if __name__ == "__main__":
    main()
