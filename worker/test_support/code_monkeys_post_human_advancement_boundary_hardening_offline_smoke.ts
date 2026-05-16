export {};

import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";

const labels = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"];

const env: Env = {
  BROKER_VERSION: "test",
  DEFAULT_BRANCH: "main",
  GITHUB_APP_ID: "x",
  GITHUB_APP_INSTALLATION_ID: "x",
  GITHUB_APP_PRIVATE_KEY: "x",
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

const files = new Map<string, string>();
let writeCount = 0;

const store: RepoStore = {
  async fetchFile(_env: Env, _project: ProjectConfig, path: string): Promise<RepoFileRef> {
    const content = files.get(path);
    if (content === undefined) throw new Error(`GitHub file fetch failed for ${path}: 404 offline missing`);
    return { path, sha: `sha-${path}`, content };
  },
  async writeFile(_env: Env, _project: ProjectConfig, path: string, content: string, _message: string): Promise<RepoWriteResult> {
    writeCount += 1;
    files.set(path, content);
    return { path, sha: `sha-write-${writeCount}` };
  }
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function token(role: "HUMAN" | "SCIENCE_EXECUTOR"): string {
  return role === "HUMAN" ? env.BROKER_KEY_HUMAN : env.BROKER_KEY_SCIENCE_EXECUTOR;
}

async function post(path: string, role: "HUMAN" | "SCIENCE_EXECUTOR", body: unknown): Promise<{ status: number; body: any }> {
  const response = await handleWorkerFetch(new Request(`https://offline.local${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token(role)}`, "content-type": "application/json" },
    body: JSON.stringify(body)
  }), env, { flowRepoStore: store });
  const text = await response.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, body: parsed };
}

function seedFlow(flowId: string, type: "code_flow" | "science_flow"): void {
  files.set(`governance/flows/${flowId}/flow_manifest.json`, JSON.stringify({
    schema_version: "flow_manifest.v0.3",
    official_artifact: true,
    project: "ArqonZero",
    flow_id: flowId,
    name: `${type}-flow`,
    type,
    title: "Boundary hardening test flow",
    summary: "",
    status: "active",
    current_gate: "DRAFT",
    created_at: "2026-01-01T00:00:00.000Z",
    created_by_role: type === "code_flow" ? "PM_AI" : "EXPLORER_AI",
    updated_at: "2026-01-01T00:00:00.000Z",
    updated_by_role: type === "code_flow" ? "PM_AI" : "EXPLORER_AI",
    required_status_labels: labels,
    artifacts: [],
    history: []
  }));
  files.set("governance/flows/flow_index.json", JSON.stringify({
    schema_version: "flow_index.v0.3",
    project: "ArqonZero",
    updated_at: "2026-01-01T00:00:00.000Z",
    flows: [{
      flow_id: flowId,
      name: `${type}-flow`,
      type,
      title: "Boundary hardening test flow",
      status: "active",
      current_gate: "DRAFT",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      source_path: `governance/flows/${flowId}/flow_manifest.json`
    }]
  }));
}

async function main(): Promise<void> {
  const codeFlow = "FLOW-2026-9301";
  seedFlow(codeFlow, "code_flow");

  for (const artifactType of ["human_decision", "advancement_approval", "promotion_decision", "human_advancement_decision"]) {
    const response = await post(`/v1/flows/${codeFlow}/artifacts`, "HUMAN", {
      artifact_type: artifactType,
      title: `Raw ${artifactType}`,
      body: `raw generic ${artifactType} must be route-only`
    });
    assert(response.status === 403, `${artifactType} must be route-only blocked`);
    assert(response.body?.error?.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `${artifactType} must return FLOW_ARTIFACT_ROUTE_REQUIRED`);
  }

  const scienceFlow = "FLOW-2026-9302";
  seedFlow(scienceFlow, "science_flow");

  const scienceExecution = await post(`/v1/flows/${scienceFlow}/artifacts`, "SCIENCE_EXECUTOR", {
    artifact_type: "execution_report",
    title: "Science execution report",
    body: "Science execution evidence remains writable."
  });
  assert(scienceExecution.status === 201, `science execution_report should remain writable, got ${scienceExecution.status}`);

  const scienceRaw = await post(`/v1/flows/${scienceFlow}/artifacts`, "SCIENCE_EXECUTOR", {
    artifact_type: "raw_result_index",
    title: "Science raw result index",
    body: "Science raw result index remains writable."
  });
  assert(scienceRaw.status === 201, `science raw_result_index should remain writable, got ${scienceRaw.status}`);

  console.log(JSON.stringify({
    ok: true,
    result: "PASS",
    code_flow_route_only_artifacts: ["human_decision", "advancement_approval", "promotion_decision", "human_advancement_decision"],
    science_execution_report_status: scienceExecution.status,
    science_raw_result_index_status: scienceRaw.status
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
