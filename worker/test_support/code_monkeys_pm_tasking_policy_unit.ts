declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("pm_tasking"), "code_flow must allow pm_tasking");
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("tasks"), "code_flow must keep generic tasks for Coder-side task decomposition");
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("coder_work_plan"), "code_flow must allow coder_work_plan");
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("coder_tasks"), "code_flow must allow coder_tasks");

  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("pm_tasking") === true, "PM_AI must write pm_tasking");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("tasks") !== true, "PM_AI must not own generic tasks");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("tasks") === true, "CODER_AI must retain generic tasks");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("coder_work_plan") === true, "CODER_AI must own coder_work_plan");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("coder_tasks") === true, "CODER_AI must own coder_tasks");

  assert(validateFlowArtifactRole("code_flow", "CODER_AI", "pm_tasking") !== null, "CODER_AI must not write pm_tasking");
  assert(validateFlowArtifactRole("code_flow", "PM_AI", "tasks") !== null, "PM_AI must not write generic tasks");
  assert(validateFlowArtifactRole("science_flow", "PM_AI", "pm_tasking") !== null, "PM tasking must not be a science_flow artifact");

  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
