declare const process: { exitCode?: number };
import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";
function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("coder_work_plan"), "code_flow must allow coder_work_plan");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("coder_work_plan") === true, "CODER_AI must write coder_work_plan");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("coder_work_plan") !== true, "PM_AI must not write coder_work_plan");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("coder_work_plan") !== true, "HELPER_AI must not write coder_work_plan");
  assert(validateFlowArtifactRole("code_flow", "PM_AI", "coder_work_plan") !== null, "PM_AI must be denied coder_work_plan");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "coder_work_plan") !== null, "HELPER_AI must be denied coder_work_plan");
  assert(validateFlowArtifactRole("science_flow", "CODER_AI", "coder_work_plan") !== null, "Coder work plan must not be science_flow artifact");
  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) { console.error(err); process.exitCode = 1; }
