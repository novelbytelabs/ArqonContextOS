declare const process: {
  exitCode?: number;
};

import type { Env } from "../src/types.js";
import { validateBrokerKeyUniqueness } from "../src/auth.js";
import { SCIENCE_COMMANDS, validateScienceCommandRole } from "../src/science.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const env: Env = {
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
  assert(validateBrokerKeyUniqueness(env).ok, "unique broker keys must pass");
  assert(SCIENCE_COMMANDS.share.allowed_roles.length === 1, "share must have one owner");
  assert(SCIENCE_COMMANDS.share.allowed_roles[0] === "HUMAN", "share must be Human-owned");
  assert(SCIENCE_COMMANDS.share.reserved !== true, "share must not be reserved after Share Integration 001");
  assert(validateScienceCommandRole("share", "HUMAN") === null, "HUMAN must be allowed for share");
  assert(validateScienceCommandRole("share", "SCIENCE_AUDITOR_AI") !== null, "SCIENCE_AUDITOR_AI must not own share");
  assert(validateScienceCommandRole("share", "PM_AI") !== null, "PM_AI must not own share");
  assert(validateScienceCommandRole("share", "HELPER_AI") !== null, "HELPER_AI must not own share");

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "share route is Human-owned",
      "share route no longer reserved",
      "Science Auditor cannot share",
      "PM cannot share",
      "Helper cannot share"
    ]
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
