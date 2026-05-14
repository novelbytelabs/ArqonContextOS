declare const process: {
  exitCode?: number;
};

import type { Env } from "../src/types.js";
import { validateBrokerKeyUniqueness } from "../src/auth.js";
import { SCIENCE_COMMANDS, validateScienceCommandRole } from "../src/science.js";
import { validateFlowCreateRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const baseEnv: Env = {
  BROKER_VERSION: "test",
  DEFAULT_BRANCH: "main",
  GITHUB_APP_ID: "app",
  GITHUB_APP_INSTALLATION_ID: "installation",
  GITHUB_APP_PRIVATE_KEY: "private",
  BROKER_KEY_PM: "pm",
  BROKER_KEY_CODER: "coder",
  BROKER_KEY_AUDITOR: "auditor",
  BROKER_KEY_HELPER: "helper",
  BROKER_KEY_EXPLORER: "explorer",
  BROKER_KEY_HYPOTHESIZER: "hypothesizer",
  BROKER_KEY_DESIGNER: "designer",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor",
  BROKER_KEY_SCIENCE_EXECUTOR: "science-executor",
  BROKER_KEY_HUMAN: "human"
};

function main(): void {
  const validation = validateBrokerKeyUniqueness(baseEnv);
  assert(validation.ok, `broker keys should be unique: ${JSON.stringify(validation)}`);

  const duplicateEnv = { ...baseEnv, BROKER_KEY_EXPLORER: baseEnv.BROKER_KEY_PM };
  const duplicateValidation = validateBrokerKeyUniqueness(duplicateEnv);
  assert(!duplicateValidation.ok, "duplicate broker key must fail validation");
  assert(
    duplicateValidation.duplicate_groups.some(group => group.includes("BROKER_KEY_PM") && group.includes("BROKER_KEY_EXPLORER")),
    `expected PM/EXPLORER duplicate group: ${JSON.stringify(duplicateValidation)}`
  );

  assert(SCIENCE_COMMANDS.research.allowed_roles.includes("EXPLORER_AI"), "research must be Explorer-owned");
  assert(SCIENCE_COMMANDS["execute-experiment"].allowed_roles.includes("SCIENCE_EXECUTOR_AI"), "execute-experiment must be Science Executor-owned");
  assert(SCIENCE_COMMANDS["audit-experiment"].allowed_roles.includes("SCIENCE_AUDITOR_AI"), "audit-experiment must be Science Auditor-owned");
  assert(SCIENCE_COMMANDS.share.allowed_roles.includes("HUMAN"), "share route must be Human-owned");
  assert(SCIENCE_COMMANDS.share.allowed_artifact_types.includes("share_packet"), "share route must target share_packet");

  assert(validateScienceCommandRole("research", "PM_AI") !== null, "PM_AI must not run research");
  assert(validateScienceCommandRole("execute-experiment", "HELPER_AI") !== null, "HELPER_AI must not run execute-experiment");
  assert(validateScienceCommandRole("execute-experiment", "SCIENCE_EXECUTOR_AI") === null, "SCIENCE_EXECUTOR_AI must run execute-experiment");
  assert(validateScienceCommandRole("audit-experiment", "AUDITOR_AI") !== null, "AUDITOR_AI must not run Science audit route");
  assert(validateScienceCommandRole("audit-experiment", "SCIENCE_AUDITOR_AI") === null, "SCIENCE_AUDITOR_AI must run Science audit route");

  assert(validateFlowCreateRole("science_flow", "EXPLORER_AI") === null, "EXPLORER_AI must be able to create science_flow");
  assert(validateFlowCreateRole("science_flow", "PM_AI") !== null, "PM_AI must not create science_flow");
  assert(validateFlowCreateRole("code_flow", "PM_AI") === null, "PM_AI must create code_flow");

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "broker key uniqueness pass",
      "broker key duplicate detection pass",
      "science route ownership matrix pass",
      "science share ownership pass",
      "science_flow creation authority pass"
    ]
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}

export {};
