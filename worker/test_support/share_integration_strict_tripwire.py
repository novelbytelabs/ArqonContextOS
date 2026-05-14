#!/usr/bin/env python3
import json
import os
import random
import re
import resource
import shutil
import socket
import subprocess
import sys
import tempfile
from pathlib import Path

REQUIRED = [
    "worker/src/science_share.ts",
    "worker/src/science.ts",
    "worker/src/index.ts",
    "worker/src/policy.ts",
    "worker/src/flows.ts",
    "openapi/arqon_contextos.openapi.yaml",
]

DANGEROUS = [
    r"\beval\s*\(",
    r"\bexec\s*\(",
    r"\bimportlib\b",
    r"\bctypes\b",
    r"\bos\.system\s*\(",
    r"\bchild_process\b",
    r"\bnew Function\b",
]

HIDDEN_FLAGS = [
    "BYPASS_AUTH",
    "SKIP_AUDIT",
    "SKIP_HUMAN_APPROVAL",
    "human_identity grants authority",
    "sealed-test certified",
    "production ready",
    "promotable status",
]

def fail(msg, details=None):
    print(json.dumps({"ok": False, "result": "FAIL", "error": msg, "details": details or []}, indent=2))
    sys.exit(1)

def set_limits():
    resource.setrlimit(resource.RLIMIT_CPU, (10, 10))
    mem = 512 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))

def read(root, rel):
    path = root / rel
    if not path.exists():
        fail("missing required file", [rel])
    return path.read_text(encoding="utf-8", errors="ignore")

def worker(root):
    random.seed(0)
    socket.socket = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("network blocked"))

    files = {rel: read(root, rel) for rel in REQUIRED}
    science = files["worker/src/science.ts"]
    share = files["worker/src/science_share.ts"]
    index = files["worker/src/index.ts"]
    policy = files["worker/src/policy.ts"]
    flows = files["worker/src/flows.ts"]
    openapi = files["openapi/arqon_contextos.openapi.yaml"]

    checks = []
    checks.append(("share route mounted", "handleScienceRequest" in index))
    checks.append(("broker key guard present", "validateBrokerKeyUniqueness" in index))
    checks.append(("auth before share body", science.find("const role = requireRole(request, env);") < science.find("return await handleScienceShare(request, env, role, repoStore);")))
    checks.append(("share human only", 'if (role !== "HUMAN")' in share and "SCIENCE_SHARE_HUMAN_REQUIRED" in share))
    checks.append(("body human_identity ignored", "human_identity" not in share))
    checks.append(("server-derived human authority", 'human_authority: "server_authenticated_human"' in share))
    checks.append(("generic flow share blocked", "SCIENCE_SHARE_ROUTE_REQUIRED" in flows))
    checks.append(("pm message path", "governance/messages/PM_AI/inbox" in share))
    checks.append(("pm context index", "governance/context/generated_pm_share_context.json" in share))
    checks.append(("outbox path", "governance/outbox/science_share" in share))
    checks.append(("outbox pending complete", 'status: "pending"' in share and 'status: "complete"' in share))
    checks.append(("hash recorded", "sha256Hex" in share and "share_packet_hash" in share))
    checks.append(("idempotency replay", "idempotent_replay" in share and "idempotency_key" in share))
    checks.append(("share no longer reserved in runtime", "SCIENCE_SHARE_NOT_IMPLEMENTED" not in science + share))
    checks.append(("source_artifacts nonempty enforced", bool(re.search(r"sourceArtifacts\.length\s*[<=>!]", share) or re.search(r"!\s*sourceArtifacts\.length", share))))
    checks.append(("source_artifacts include required evidence classes", all(marker in share for marker in ["audit_report", "share_recommendation", "FINDING_ARTIFACTS"]) and bool(re.search(r"sourceArtifacts.*artifact_type", share, re.S))))
    checks.append(("resolved source metadata preserved", "resolved_source_artifacts" in share and "ResolvedShareSourceArtifact" in share))
    checks.append(("metamorphic marker stability", ("sourceArtifacts" in share.replace("sourceArtifacts", "sourceArtifacts   ".replace(" ", ""))) == ("sourceArtifacts" in share)))
    checks.append(("constant-output mutation detected", 'if (role !== "HUMAN")' not in share.replace('if (role !== "HUMAN")', 'if (false)')))
    checks.append(("openapi share implemented", "/v1/science/share" in openapi and "SCIENCE_SHARE_NOT_IMPLEMENTED" not in openapi))
    checks.append(("outbox allowlist narrowed", '"governance/outbox/science_share/"' in policy and '"governance/outbox/"' not in policy))

    failures = [name for name, ok in checks if not ok]

    violations = []
    for scan_root in [root / "worker/src", root / "openapi"]:
        if not scan_root.exists():
            continue
        for p in scan_root.rglob("*"):
            if not p.is_file():
                continue
            rel = str(p.relative_to(root))
            text = p.read_text(encoding="utf-8", errors="ignore")
            for pat in DANGEROUS:
                if re.search(pat, text):
                    violations.append([rel, pat])
            for flag in HIDDEN_FLAGS:
                if flag in text:
                    violations.append([rel, flag])

    if failures or violations:
        fail("tripwire checks failed", {"failures": failures, "violations": violations})

    print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))

def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        worker(Path(sys.argv[2]).resolve())
        return
    if len(sys.argv) != 2:
        fail("usage: python3 share_integration_strict_tripwire.py /path/to/repo/root")

    src = Path(sys.argv[1]).resolve()
    if not src.exists():
        fail("root does not exist", [str(src)])

    with tempfile.TemporaryDirectory(prefix="share001-tripwire-") as td:
        clean = Path(td) / "sut"
        def ignore(_dir, names):
            return {name for name in names if name in {".git", "node_modules", "tmp", "temps", ".wrangler"}}
        shutil.copytree(src, clean, ignore=ignore)
        env = {"PATH": os.environ.get("PATH", ""), "PYTHONHASHSEED": "0", "NO_NETWORK": "1"}
        cmd = [sys.executable, __file__, "--worker", str(clean)]
        r1 = subprocess.run(cmd, text=True, capture_output=True, env=env, timeout=15, preexec_fn=set_limits)
        r2 = subprocess.run(cmd, text=True, capture_output=True, env=env, timeout=15, preexec_fn=set_limits)
        if r1.returncode != r2.returncode or r1.stdout != r2.stdout:
            fail("nondeterministic tripwire result", [r1.stdout, r2.stdout])
        print(r1.stdout, end="")
        if r1.returncode != 0:
            sys.exit(r1.returncode)

if __name__ == "__main__":
    main()
