declare const process: {
  exitCode?: number;
};

import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";
import { flowPolicySnapshot } from "../src/flow_policy.js";

const baseUrl = "https://offline.local";

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
  BROKER_KEY_HUMAN: "human-token"
};

const files = new Map<string, string>();

const memoryStore: RepoStore = {
  async fetchFile(_env: Env, _project: ProjectConfig, path: string): Promise<RepoFileRef> {
    const content = files.get(path);
    if (content === undefined) {
      throw new Error(`GitHub file fetch failed for ${path}: 404 offline missing`);
    }
    return { path, sha: `sha-${path}`, content };
  },
  async writeFile(_env: Env, _project: ProjectConfig, path: string, content: string, _message: string): Promise<RepoWriteResult> {
    files.set(path, content);
    return { path, sha: `sha-${files.size}` };
  }
};

function auth(role: "PM" | "CODER" | "AUDITOR" | "HELPER" | "HUMAN"): string {
  const tokens = {
    PM: env.BROKER_KEY_PM,
    CODER: env.BROKER_KEY_CODER,
    AUDITOR: env.BROKER_KEY_AUDITOR,
    HELPER: env.BROKER_KEY_HELPER,
    HUMAN: env.BROKER_KEY_HUMAN
  };
  return `Bearer ${tokens[role]}`;
}

async function requestJson(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await handleWorkerFetch(new Request(`${baseUrl}${path}`, { ...init, headers }), env, { flowRepoStore: memoryStore });
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const results: string[] = [];
  const record = (name: string, passed: boolean): void => {
    results.push(`${passed ? "PASS" : "FAIL"} ${name}`);
  };

  const health = await requestJson("/v1/health", { method: "GET" });
  assert(health.status === 200, "health should pass");
  record("health", true);

  const create = await requestJson("/v1/flows", {
    method: "POST",
    headers: { authorization: auth("PM") },
    body: JSON.stringify({
      name: "flowcore-v03-policy-smoke-001",
      type: "code_flow",
      title: "Flow Core v0.3 Policy Smoke 001",
      summary: "Offline policy hardening smoke."
    })
  });
  assert(create.status === 201, `create should pass: ${JSON.stringify(create.body)}`);
  const flowId = create.body.flow_id as string;
  assert(flowId === "FLOW-2026-0001", `unexpected flow id ${flowId}`);
  record("create code_flow", true);

  const pmSpec = await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("PM") },
    body: JSON.stringify({
      artifact_type: "pm_spec",
      title: "Policy Smoke PM Spec",
      body: "PM spec artifact.\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n"
    })
  });
  assert(pmSpec.status === 201, `PM spec should pass: ${JSON.stringify(pmSpec.body)}`);
  record("valid code_flow PM artifact", true);

  const scienceOnlySlotOnCodeFlow = await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("PM") },
    body: JSON.stringify({
      artifact_type: "share_review",
      title: "Forbidden Science Slot On Code Flow",
      body: "This should be denied by flow slot policy."
    })
  });
  assert(scienceOnlySlotOnCodeFlow.status === 403, "science-only slot should be denied on code_flow");
  assert(scienceOnlySlotOnCodeFlow.body.error.code === "ARTIFACT_SLOT_FORBIDDEN", "expected ARTIFACT_SLOT_FORBIDDEN");
  record("flow artifact slot deny", true);

  const nonHumanAdvance = await requestJson(`/v1/flows/${flowId}/advance`, {
    method: "POST",
    headers: { authorization: auth("PM") },
    body: JSON.stringify({ gate_state: "PLAN_READY", status: "active", note: "PM cannot advance." })
  });
  assert(nonHumanAdvance.status === 403, "PM advance should be denied");
  record("non-HUMAN advance deny", true);

  const humanPlanReady = await requestJson(`/v1/flows/${flowId}/advance`, {
    method: "POST",
    headers: { authorization: auth("HUMAN") },
    body: JSON.stringify({ gate_state: "PLAN_READY", status: "active", note: "Human advances to plan ready." })
  });
  assert(humanPlanReady.status === 200, `HUMAN PLAN_READY should pass: ${JSON.stringify(humanPlanReady.body)}`);
  record("HUMAN PLAN_READY", true);

  const prematureIntegrity = await requestJson(`/v1/flows/${flowId}/advance`, {
    method: "POST",
    headers: { authorization: auth("HUMAN") },
    body: JSON.stringify({ gate_state: "INTEGRITY_GATE_PASSED", status: "active", note: "Should fail: jump and missing audit." })
  });
  assert(prematureIntegrity.status === 409, "premature integrity advancement should fail");
  assert(prematureIntegrity.body.error.code === "FLOW_ADVANCEMENT_PRECONDITION_FAILED", "expected precondition failure");
  record("gate jump/precondition deny", true);

  const evidence = await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("HELPER") },
    body: JSON.stringify({
      artifact_type: "execution_report",
      title: "Policy Smoke Execution Report",
      body: "Execution evidence.\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n"
    })
  });
  assert(evidence.status === 201, "helper execution_report should pass");
  record("execution evidence artifact", true);

  const evidenceReady = await requestJson(`/v1/flows/${flowId}/advance`, {
    method: "POST",
    headers: { authorization: auth("HUMAN") },
    body: JSON.stringify({ gate_state: "DEV_EVIDENCE_READY", status: "active", note: "Evidence exists." })
  });
  assert(evidenceReady.status === 200, `DEV_EVIDENCE_READY should pass: ${JSON.stringify(evidenceReady.body)}`);
  record("DEV_EVIDENCE_READY precondition pass", true);

  const missingAudit = await requestJson(`/v1/flows/${flowId}/advance`, {
    method: "POST",
    headers: { authorization: auth("HUMAN") },
    body: JSON.stringify({ gate_state: "INTEGRITY_GATE_PASSED", status: "active", note: "Should fail without audit." })
  });
  assert(missingAudit.status === 409, "integrity should fail without audit");
  record("missing audit precondition deny", true);

  const audit = await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("AUDITOR") },
    body: JSON.stringify({
      artifact_type: "audit_report",
      title: "Policy Smoke Audit Report",
      body: "Audit evidence.\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n"
    })
  });
  assert(audit.status === 201, "audit_report should pass");
  record("audit artifact", true);

  const integrity = await requestJson(`/v1/flows/${flowId}/advance`, {
    method: "POST",
    headers: { authorization: auth("HUMAN") },
    body: JSON.stringify({ gate_state: "INTEGRITY_GATE_PASSED", status: "active", note: "Audit exists." })
  });
  assert(integrity.status === 200, "integrity advancement should pass");
  record("INTEGRITY_GATE_PASSED precondition pass", true);

  const snapshot = flowPolicySnapshot();
  assert(Array.isArray(snapshot.flow_types), "policy snapshot should expose flow types");
  record("policy snapshot", true);

  console.log(JSON.stringify({
    ok: true,
    flow_id: flowId,
    results,
    written_paths: [...files.keys()].sort()
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
