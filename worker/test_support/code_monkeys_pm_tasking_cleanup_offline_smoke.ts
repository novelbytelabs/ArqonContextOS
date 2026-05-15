declare const process: { exitCode?: number };

import { handleWorkerFetch } from "../src/index.js";
import type { Env } from "../src/types.js";

const env: Env = {
  BROKER_VERSION: "test",
  DEFAULT_BRANCH: "main",
  GITHUB_APP_ID: "test-app",
  GITHUB_APP_INSTALLATION_ID: "test-installation",
  GITHUB_APP_PRIVATE_KEY: "test-private-key",
  BROKER_KEY_PM: "pm-token",
  BROKER_KEY_CODER: "coder-token",
  BROKER_KEY_AUDITOR: "auditor-token",
  BROKER_KEY_HELPER: "helper-token",
  BROKER_KEY_EXPLORER: "explorer-token",
  BROKER_KEY_HYPOTHESIZER: "hypothesizer-token",
  BROKER_KEY_DESIGNER: "designer-token",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor-token",
  BROKER_KEY_SCIENCE_EXECUTOR: "science-executor-token",
  BROKER_KEY_HUMAN: "human-token"
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function requestJson(path: string, token?: string): Promise<{ status: number; body: any }> {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");
  const response = await handleWorkerFetch(new Request(`https://offline.local${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      plan_id: "FLOW-TEST-plan",
      idempotency_key: "retired-route-probe-0001",
      tasks_title: "Should not work",
      tasks_body: "This route is retired."
    })
  }), env);
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}

async function main(): Promise<void> {
  const noAuth = await requestJson("/v1/pm/tasks");
  assert(noAuth.status === 500 || noAuth.status === 401 || noAuth.status === 410, "retired route should not succeed without auth");

  const pm = await requestJson("/v1/pm/tasks", env.BROKER_KEY_PM);
  assert(pm.status === 410, `expected retired route 410, got ${pm.status}`);
  assert(pm.body.error.code === "PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING", "expected PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING");

  const taskingNoAuth = await requestJson("/v1/pm/tasking");
  assert(taskingNoAuth.status === 401 || taskingNoAuth.status === 404 || taskingNoAuth.status === 400, "tasking route should remain routed separately and not return retired-route code");

  console.log(JSON.stringify({
    ok: true,
    retired_pm_tasks_status: pm.status,
    retired_pm_tasks_code: pm.body.error.code,
    required_status_labels: [
      "REQUIRES_HUMAN_REVIEW",
      "development diagnostic only",
      "NOT SEALED-TEST CERTIFIED",
      "not promotable"
    ]
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
