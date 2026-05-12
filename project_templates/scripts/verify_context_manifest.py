#!/usr/bin/env python3
"""Verify generated context manifest references existing files."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "governance" / "context" / "context_manifest.json"
def sha256_file(path: Path) -> str: return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()
def fail(msg: str) -> None:
    print(f"FAIL: {msg}"); raise SystemExit(1)
def main() -> None:
    if not MANIFEST.exists(): fail(f"manifest missing: {MANIFEST}")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    snap = manifest.get("snapshot", {})
    snap_path = ROOT / snap.get("path", "")
    if not snap_path.exists(): fail(f"snapshot missing: {snap_path}")
    if sha256_file(snap_path) != snap.get("sha256"): fail(f"snapshot hash mismatch: {snap_path}")
    for role, info in manifest.get("role_contexts", {}).items():
        path = ROOT / info.get("path", "")
        if not path.exists(): fail(f"role context missing for {role}: {path}")
        if sha256_file(path) != info.get("sha256"): fail(f"role context hash mismatch for {role}: {path}")
    print("PASS: context manifest verifies")
if __name__ == "__main__": main()
