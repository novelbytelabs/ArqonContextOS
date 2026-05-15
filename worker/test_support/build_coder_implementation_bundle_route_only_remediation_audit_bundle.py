#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, subprocess, zipfile
FILES=["worker/src/flows.ts","worker/src/coder_implementation_bundle.ts","worker/src/coder_tasks.ts","worker/src/index.ts","worker/src/flow_policy.ts","worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.ts","worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_tripwire.py","worker/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.ts","worker/test_support/code_monkeys_coder_implementation_bundle_live_smoke.ts","worker/test_support/code_monkeys_coder_implementation_bundle_tripwire.py","openapi/arqon_contextos.openapi.yaml","docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_ROUTE_ONLY_REMEDIATION_001.md","docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_001_EVIDENCE.md"]
def run(a): return subprocess.run(a,check=True,text=True,stdout=subprocess.PIPE).stdout.strip()
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1048576),b""): h.update(c)
 return h.hexdigest()
r=Path.cwd(); commit=run(["git","rev-parse","HEAD"]); miss=[p for p in FILES if not (r/p).is_file()]
if miss: raise SystemExit(json.dumps({"ok":False,"missing":miss},indent=2))
records=[{"path":p,"sha256":sha(r/p),"bytes":(r/p).stat().st_size} for p in FILES]
out=r/"temps"/f"coder_impl_bundle_route_only_remediation_audit_bundle_{commit[:12]}.zip"; out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
 z.writestr("AUDIT_BUNDLE_MANIFEST.json",json.dumps({"schema_version":"coder_impl_bundle_route_only_remediation.v0.1","commit":commit,"files":records},indent=2)+"\n")
 for rec in records: z.write(r/rec["path"],rec["path"])
print(json.dumps({"ok":True,"bundle_path":str(out),"bundle_sha256":sha(out),"file_count":len(records)},indent=2))
