#!/usr/bin/env python3
"""
Build a self-contained Share Integration audit evidence bundle.

Run from repo root:

  python3 worker/test_support/build_share_integration_audit_bundle.py

Output:
  temps/share_integration_audit_bundle_<commit>.zip

This is packaging-only. It does not execute tests, access network, or read secrets.
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import zipfile
from pathlib import Path
from typing import Iterable

REQUIRED_STATUS_LABELS = [
    "REQUIRES_HUMAN_REVIEW",
    "development diagnostic only",
    "NOT SEALED-TEST CERTIFIED",
    "not promotable",
]

AUDIT_BUNDLE_FILES = [
    "worker/src/auth.ts",
    "worker/src/flow_policy.ts",
    "worker/src/flows.ts",
    "worker/src/index.ts",
    "worker/src/notes.ts",
    "worker/src/policy.ts",
    "worker/src/projects.ts",
    "worker/src/repo_store.ts",
    "worker/src/response.ts",
    "worker/src/science.ts",
    "worker/src/science_share.ts",
    "worker/src/types.ts",
    "worker/test_support/science_monkeys_v01_share_policy_unit.ts",
    "worker/test_support/science_monkeys_v01_share_offline_smoke.ts",
    "worker/test_support/science_monkeys_v01_share_live_smoke.ts",
    "worker/test_support/science_monkeys_v01_share_tripwire.py",
    "worker/test_support/share_integration_strict_tripwire.py",
    "worker/test_support/build_share_integration_audit_bundle.py",
    "worker/tsconfig.smoke.json",
    "worker/package.json",
    "openapi/arqon_contextos.openapi.yaml",
    "docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_SHARE_INTEGRATION_001.md",
    "docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_SHARE_SOURCE_ARTIFACT_BOUNDARY_001.md",
    "docs/04_flows_and_spec_kit/SCIENCE_MONKEYS_V01_SHARE_SOURCE_ARTIFACT_BOUNDARY_001_EVIDENCE.md",
]

def run(args: list[str]) -> str:
    result = subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.stdout.strip()

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def ensure_files(root: Path, rels: Iterable[str]) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    missing: list[str] = []
    for rel in rels:
        path = root / rel
        if not path.exists() or not path.is_file():
            missing.append(rel)
            continue
        records.append({
            "path": rel,
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        })
    if missing:
        raise SystemExit(json.dumps({"ok": False, "error": "missing audit bundle files", "missing": missing}, indent=2))
    return records

def main() -> None:
    root = Path.cwd()
    git_commit = run(["git", "rev-parse", "HEAD"])
    branch = run(["git", "branch", "--show-current"])
    status = run(["git", "status", "--short"])

    records = ensure_files(root, AUDIT_BUNDLE_FILES)

    manifest = {
        "schema_version": "share_integration_audit_bundle.v0.1",
        "purpose": "Self-contained source/test/doc evidence bundle for Share Integration audit replay.",
        "branch": branch,
        "commit": git_commit,
        "working_tree_status": status,
        "required_status_labels": REQUIRED_STATUS_LABELS,
        "files": records,
        "replay_commands": [
            "cd worker && npm run typecheck && cd ..",
            "cd worker && npx tsc -p tsconfig.smoke.json && cd ..",
            "node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_share_policy_unit.js",
            "node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_share_offline_smoke.js",
            "python3 worker/test_support/science_monkeys_v01_share_tripwire.py",
            "python3 worker/test_support/share_integration_strict_tripwire.py .",
            "node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_routes_policy_unit.js",
            "node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/science_monkeys_v01_role_auth_foundation_smoke.js",
        ],
        "claim_boundary": {
            "not_sealed_test_certified": True,
            "not_promotable": True,
            "development_diagnostic_only": True,
        },
    }

    out_dir = root / "temps"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"share_integration_audit_bundle_{git_commit[:12]}.zip"

    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("AUDIT_BUNDLE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
        z.writestr("REPLAY_README.md", "\n".join([
            "# Share Integration Audit Bundle Replay",
            "",
            "Status:",
            "",
            *REQUIRED_STATUS_LABELS,
            "",
            "This bundle is development diagnostic evidence only.",
            "",
            "## Replay Commands",
            "",
            *[f"- `{cmd}`" for cmd in manifest["replay_commands"]],
            "",
        ]) + "\n")
        for rec in records:
            rel = rec["path"]
            z.write(root / rel, rel)

    print(json.dumps({
        "ok": True,
        "bundle_path": str(out_path),
        "commit": git_commit,
        "branch": branch,
        "file_count": len(records),
        "bundle_sha256": sha256_file(out_path),
        "required_status_labels": REQUIRED_STATUS_LABELS,
    }, indent=2))

if __name__ == "__main__":
    main()
