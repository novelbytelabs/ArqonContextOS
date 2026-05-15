declare const process: { exitCode?: number };

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
    files.set(path, content);
    writeCount += 1;
    return { path, sha: `sha-write-${writeCount}` };
  }
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function token(role: "PM" | "CODER" | "HELPER"): string {
  if (role === "PM") return env.BROKER_KEY_PM;
  if (role === "CODER") return env.BROKER_KEY_CODER;
  return env.BROKER_KEY_HELPER;
}

function seed(flowId: string, type: "code_flow" | "governance_flow"): void {
  files.clear();
  writeCount = 0;
  files.set(`governance/flows/${flowId}/flow_manifest.json`, JSON.stringify({
    schema_version: "flow_manifest.v0.3",
    official_artifact: true,
    project: "ArqonZero",
    flow_id: flowId,
    name: `${type}-route-only-global`,
    type,
    title: "Route-only global tripwire flow",
    summary: "",
    status: "active",
    current_gate: "DRAFT",
    created_at: "2026-01-01T00:00:00.000Z",
    created_by_role: "PM_AI",
    updated_at: "2026-01-01T00:00:00.000Z",
    updated_by_role: "PM_AI",
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
      name: `${type}-route-only-global`,
      type,
      title: "Route-only global tripwire flow",
      status: "active",
      current_gate: "DRAFT",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      source_path: `governance/flows/${flowId}/flow_manifest.json`
    }]
  }));
}

async function post(flowId: string, role: "PM" | "CODER" | "HELPER"): Promise<{ status: number; body: any }> {
  const response = await handleWorkerFetch(new Request(`https://offline.local/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token(role)}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      artifact_type: "implementation_bundle",
      title: `${role} raw implementation_bundle attempt`,
      body: "raw generic implementation_bundle creation must not be allowed"
    })
  }), env, { flowRepoStore: store });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}

async function main(): Promise<void> {
  seed("FLOW-2026-9998", "code_flow");
  const codeCoder = await post("FLOW-2026-9998", "CODER");
  assert(codeCoder.status === 403, `code_flow CODER raw implementation_bundle must return 403, got ${codeCoder.status}`);
  assert(codeCoder.body.error.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `code_flow CODER expected FLOW_ARTIFACT_ROUTE_REQUIRED, got ${codeCoder.body?.error?.code}`);

  seed("FLOW-2026-9999", "governance_flow");
  const governanceCoder = await post("FLOW-2026-9999", "CODER");
  assert(governanceCoder.status === 403, `governance_flow CODER raw implementation_bundle must return 403, got ${governanceCoder.status}`);
  assert(governanceCoder.body.error.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `governance_flow CODER expected FLOW_ARTIFACT_ROUTE_REQUIRED, got ${governanceCoder.body?.error?.code}`);

  seed("FLOW-2026-1000", "governance_flow");
  const governancePm = await post("FLOW-2026-1000", "PM");
  assert(governancePm.status === 403, `governance_flow PM raw implementation_bundle must remain denied, got ${governancePm.status}`);

  seed("FLOW-2026-1001", "governance_flow");
  const governanceHelper = await post("FLOW-2026-1001", "HELPER");
  assert(governanceHelper.status === 403, `governance_flow HELPER raw implementation_bundle must remain denied, got ${governanceHelper.status}`);

  console.log(JSON.stringify({
    ok: true,
    code_flow_coder_status: codeCoder.status,
    code_flow_coder_code: codeCoder.body.error.code,
    governance_flow_coder_status: governanceCoder.status,
    governance_flow_coder_code: governanceCoder.body.error.code,
    governance_flow_pm_status: governancePm.status,
    governance_flow_pm_code: governancePm.body?.error?.code,
    governance_flow_helper_status: governanceHelper.status,
    governance_flow_helper_code: governanceHelper.body?.error?.code
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
