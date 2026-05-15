declare const process: { exitCode?: number };
import { ROLE_FLOW_ARTIFACTS, FLOW_ARTIFACT_SLOTS } from "../src/flow_policy.js";
function assert(x: boolean, m: string) { if (!x) throw new Error(m); }
try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("coder_handoff"), "code_flow must include coder_handoff slot");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("coder_handoff") === true, "CODER_AI owns coder_handoff");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("coder_handoff") !== true, "PM_AI must not own coder_handoff");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("coder_handoff") !== true, "HELPER_AI must not own coder_handoff");
  console.log(JSON.stringify({ ok: true, result: "PASS" }, null, 2));
} catch (err) { console.error(err); process.exitCode = 1; }
