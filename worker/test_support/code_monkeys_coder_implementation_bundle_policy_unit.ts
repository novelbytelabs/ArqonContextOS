declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("implementation_bundle"), "code_flow must allow implementation_bundle");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("implementation_bundle") === true, "CODER_AI must write implementation_bundle");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("implementation_bundle") !== true, "PM_AI must not write implementation_bundle");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("implementation_bundle") !== true, "HELPER_AI must not write implementation_bundle");
  assert(validateFlowArtifactRole("code_flow", "PM_AI", "implementation_bundle") !== null, "PM_AI must be denied implementation_bundle");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "implementation_bundle") !== null, "HELPER_AI must be denied implementation_bundle");
  assert(validateFlowArtifactRole("science_flow", "CODER_AI", "implementation_bundle") !== null, "implementation_bundle must not be a science_flow artifact");
  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
