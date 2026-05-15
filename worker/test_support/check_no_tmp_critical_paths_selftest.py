#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess, sys, tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().with_name("check_no_tmp_critical_paths.py")
def run(root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run([sys.executable, str(SCRIPT), str(root), "--scan", "docs/04_flows_and_spec_kit"], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
def main() -> None:
    with tempfile.TemporaryDirectory(prefix="tmp-critical-path-selftest-") as td:
        root = Path(td)
        d = root / "docs/04_flows_and_spec_kit"
        d.mkdir(parents=True)
        (d / "BAD.md").write_text("Run: node --experimental-specifier-resolution=node tmp/flow-core-smoke-dist/test_support/bad.js\n", encoding="utf-8")
        bad = run(root)
        if bad.returncode == 0:
            print(json.dumps({"ok": False, "result": "FAIL", "error": "guard accepted injected critical tmp reference", "stdout": bad.stdout}, indent=2)); sys.exit(1)
        (d / "BAD.md").write_text("`tmp/` is scratch only and should never be required by validation.\n", encoding="utf-8")
        good = run(root)
        if good.returncode != 0:
            print(json.dumps({"ok": False, "result": "FAIL", "error": "guard rejected allowed policy context", "stdout": good.stdout, "stderr": good.stderr}, indent=2)); sys.exit(1)
    print(json.dumps({"ok": True, "result": "PASS", "checks": ["injected critical tmp command fails", "scratch-only policy context passes"]}, indent=2))
if __name__ == "__main__":
    main()
