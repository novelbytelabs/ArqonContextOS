export {};

import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";

const labels = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"];
const env: Env = {
  BROKER_VERSION: "test", DEFAULT_BRANCH: "main", GITHUB_APP_ID: "x", GITHUB_APP_INSTALLATION_ID: "x", GITHUB_APP_PRIVATE_KEY: "x",
  BROKER_KEY_PM: "pm-token", BROKER_KEY_CODER: "coder-token", BROKER_KEY_AUDITOR: "auditor-token", BROKER_KEY_HELPER: "helper-token",
  BROKER_KEY_EXPLORER: "explorer-token", BROKER_KEY_HYPOTHESIZER: "hypothesizer-token", BROKER_KEY_DESIGNER: "designer-token",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor-token", BROKER_KEY_SCIENCE_EXECUTOR: "science-executor-token", BROKER_KEY_HUMAN: "human-token"
};

const files = new Map<string, string>();
let writes = 0;
const store: RepoStore = {
  async fetchFile(_env: Env, _project: ProjectConfig, path: string): Promise<RepoFileRef> {
    const content = files.get(path);
    if (content === undefined) throw new Error(`GitHub file fetch failed for ${path}: 404 offline missing`);
    return { path, sha: `sha-${path}`, content };
  },
  async writeFile(_env: Env, _project: ProjectConfig, path: string, content: string, _message: string): Promise<RepoWriteResult> {
    writes += 1;
    files.set(path, content);
    return { path, sha: `sha-write-${writes}` };
  }
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
function token(role: "HUMAN" | "SCIENCE_EXECUTOR"): string {
  return role === "HUMAN" ? env.BROKER_KEY_HUMAN : env.BROKER_KEY_SCIENCE_EXECUTOR;
}
async function post(flowId: string, role: "HUMAN" | "SCIENCE_EXECUTOR", artifactType: string): Promise<{ status: number; code?: string }> {
  const response = await handleWorkerFetch(new Request(`https://offline.local/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: `Bearer ${token(role)}`, "content-type": "application/json" },
    body: JSON.stringify({ artifact_type: artifactType, title: `Raw ${artifactType}`, body: `raw ${artifactType}` })
  }), env, { flowRepoStore: store });
  const text = await response.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, code: parsed?.error?.code };
}

function seed(flowId: string, type: "code_flow" | "science_flow" | "audit_flow" | "governance_flow"): void {
  files.set(`governance/flows/${flowId}/flow_manifest.json`, JSON.stringify({
    schema_version: "flow_manifest.v0.3", official_artifact: true, project: "ArqonZero", flow_id: flowId,
    name: `${type}-flow`, type, title: "Cross-flow Human authority test flow", summary: "", status: "active",
    current_gate: "DRAFT", created_at: "2026-01-01T00:00:00.000Z", created_by_role: type === "science_flow" ? "EXPLORER_AI" : "PM_AI",
    updated_at: "2026-01-01T00:00:00.000Z", updated_by_role: type === "science_flow" ? "EXPLORER_AI" : "PM_AI",
    required_status_labels: labels, artifacts: [], history: []
  }));
}
function seedIndex(): void {
  const items: Array<[string, string]> = [["FLOW-2026-9401","code_flow"],["FLOW-2026-9402","governance_flow"],["FLOW-2026-9403","audit_flow"],["FLOW-2026-9404","science_flow"]];
  files.set("governance/flows/flow_index.json", JSON.stringify({
    schema_version: "flow_index.v0.3", project: "ArqonZero", updated_at: "2026-01-01T00:00:00.000Z",
    flows: items.map(([flow_id, type]) => ({ flow_id, name: `${type}-flow`, type, title: "Cross-flow Human authority test flow", status: "active", current_gate: "DRAFT", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", source_path: `governance/flows/${flow_id}/flow_manifest.json` }))
  }));
}
async function expectRouteOnly(flowId: string, artifactType: string, label: string, results: Record<string, string>): Promise<void> {
  const result = await post(flowId, "HUMAN", artifactType);
  assert(result.status === 403, `${label} expected 403, got ${result.status}`);
  assert(result.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `${label} expected FLOW_ARTIFACT_ROUTE_REQUIRED, got ${result.code}`);
  results[label] = result.code ?? "";
}
async function main(): Promise<void> {
  seed("FLOW-2026-9401", "code_flow");
  seed("FLOW-2026-9402", "governance_flow");
  seed("FLOW-2026-9403", "audit_flow");
  seed("FLOW-2026-9404", "science_flow");
  seedIndex();

  const results: Record<string, string> = {};
  for (const a of ["human_decision", "advancement_approval", "promotion_decision", "human_advancement_decision"]) await expectRouteOnly("FLOW-2026-9401", a, `code_flow:${a}`, results);
  for (const a of ["human_decision", "advancement_approval", "promotion_decision"]) await expectRouteOnly("FLOW-2026-9402", a, `governance_flow:${a}`, results);
  for (const a of ["human_decision", "advancement_approval"]) {
    await expectRouteOnly("FLOW-2026-9403", a, `audit_flow:${a}`, results);
    await expectRouteOnly("FLOW-2026-9404", a, `science_flow:${a}`, results);
  }

  const scienceExecution = await post("FLOW-2026-9404", "SCIENCE_EXECUTOR", "execution_report");
  const scienceRaw = await post("FLOW-2026-9404", "SCIENCE_EXECUTOR", "raw_result_index");
  assert(scienceExecution.status === 201, `science execution_report should remain writable, got ${scienceExecution.status}`);
  assert(scienceRaw.status === 201, `science raw_result_index should remain writable, got ${scienceRaw.status}`);

  console.log(JSON.stringify({ ok: true, result: "PASS", route_only_results: results, science_execution_report_status: scienceExecution.status, science_raw_result_index_status: scienceRaw.status }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
