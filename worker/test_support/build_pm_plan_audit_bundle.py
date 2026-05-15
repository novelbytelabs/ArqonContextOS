#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,subprocess,zipfile
FILES=["worker/src/pm_plan.ts","worker/src/index.ts","worker/src/flow_policy.ts","worker/src/pm_specify.ts","worker/src/pm_intake.ts","worker/test_support/code_monkeys_pm_plan_policy_unit.ts","worker/test_support/code_monkeys_pm_plan_offline_smoke.ts","worker/test_support/code_monkeys_pm_plan_live_smoke.ts","worker/test_support/code_monkeys_pm_plan_tripwire.py","openapi/arqon_contextos.openapi.yaml","docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_PLAN_001.md"]
LABELS=["REQUIRES_HUMAN_REVIEW","development diagnostic only","NOT SEALED-TEST CERTIFIED","not promotable"]
def sha(p):
 h=hashlib.sha256(); h.update(Path(p).read_bytes()); return h.hexdigest()
def main():
 root=Path.cwd(); commit=subprocess.run(["git","rev-parse","HEAD"],text=True,stdout=subprocess.PIPE,check=True).stdout.strip(); missing=[p for p in FILES if not (root/p).is_file()]
 if missing: raise SystemExit(json.dumps({"ok":False,"missing":missing},indent=2))
 out=root/"temps"/f"pm_plan_audit_bundle_{commit[:12]}.zip"; out.parent.mkdir(exist_ok=True); manifest={"schema_version":"pm_plan_audit_bundle.v0.1","commit":commit,"required_status_labels":LABELS,"files":[{"path":p,"sha256":sha(root/p),"bytes":(root/p).stat().st_size} for p in FILES]}
 with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
  z.writestr("AUDIT_BUNDLE_MANIFEST.json",json.dumps(manifest,indent=2)+"\n")
  for p in FILES: z.write(root/p,p)
 print(json.dumps({"ok":True,"bundle_path":str(out),"bundle_sha256":sha(out),"file_count":len(FILES)},indent=2))
if __name__=="__main__": main()
