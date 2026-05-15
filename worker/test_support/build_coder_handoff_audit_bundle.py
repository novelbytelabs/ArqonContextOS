#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,subprocess,zipfile
FILES=["worker/src/coder_handoff.ts","worker/src/coder_implementation_bundle.ts","worker/src/index.ts","worker/src/flows.ts","worker/src/flow_policy.ts","worker/test_support/code_monkeys_coder_handoff_policy_unit.ts","worker/test_support/code_monkeys_coder_handoff_offline_smoke.ts","worker/test_support/code_monkeys_coder_handoff_live_smoke.ts","worker/test_support/code_monkeys_coder_handoff_tripwire.py","worker/test_support/build_coder_handoff_audit_bundle.py","worker/test_support/compile_smoke_runtime.py","worker/test_support/check_no_tmp_critical_paths.py","openapi/arqon_contextos.openapi.yaml","docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_HANDOFF_001.md","docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_HANDOFF_001_EVIDENCE.md"]
def run(a): return subprocess.run(a,check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout.strip()
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1048576),b""): h.update(c)
 return h.hexdigest()
def main():
 r=Path.cwd(); commit=run(["git","rev-parse","HEAD"]); miss=[p for p in FILES if not (r/p).is_file()]
 if miss: raise SystemExit(json.dumps({"ok":False,"missing":miss},indent=2))
 rec=[{"path":p,"bytes":(r/p).stat().st_size,"sha256":sha(r/p)} for p in FILES]
 out=r/"temps"/f"coder_handoff_audit_bundle_{commit[:12]}.zip"; out.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
  z.writestr("AUDIT_BUNDLE_MANIFEST.json",json.dumps({"schema_version":"coder_handoff_audit_bundle.v0.1","commit":commit,"purpose":"verify Coder Handoff 001 boundary without Helper execution","required_status_labels":["REQUIRES_HUMAN_REVIEW","development diagnostic only","NOT SEALED-TEST CERTIFIED","not promotable"],"files":rec},indent=2)+"\n")
  for x in rec: z.write(r/x["path"],x["path"])
 print(json.dumps({"ok":True,"bundle_path":str(out),"bundle_sha256":sha(out),"file_count":len(rec)},indent=2))
if __name__=="__main__": main()
