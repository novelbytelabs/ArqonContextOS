declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("coder_tasks"), "code_flow must allow coder_tasks");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("coder_tasks") === true, "CODER_AI must write coder_tasks");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("coder_tasks") !== true, "PM_AI must not write coder_tasks");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("coder_tasks") !== true, "HELPER_AI must not write coder_tasks");
  assert(validateFlowArtifactRole("code_flow", "PM_AI", "coder_tasks") !== null, "PM_AI must be denied coder_tasks");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "coder_tasks") !== null, "HELPER_AI must be denied coder_tasks");
  assert(validateFlowArtifactRole("science_flow", "CODER_AI", "coder_tasks") !== null, "Coder tasks must not be a science_flow artifact");
  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
