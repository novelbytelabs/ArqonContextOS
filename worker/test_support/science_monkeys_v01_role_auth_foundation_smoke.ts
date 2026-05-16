declare const process: {
  exitCode?: number;
};

import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig, Role } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";
import { canWriteFlowArtifactForFlow } from "../src/flow_policy.js";

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
  BROKER_KEY_EXPLORER: "explorer-token",
  BROKER_KEY_HYPOTHESIZER: "hypothesizer-token",
  BROKER_KEY_DESIGNER: "designer-token",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor-token",
  BROKER_KEY_SCIENCE_EXECUTOR: "science-executor-token",
  BROKER_KEY_HUMAN: "human-token"
};

const files = new Map<string, string>();

const memoryStore: RepoStore = {
  async fetchFile(_env: Env, _project: ProjectConfig, path: string): Promise<RepoFileRef> {
    const content = files.get(path);
    if (content === undefined) throw new Error(`GitHub file fetch failed for ${path}: 404 offline missing`);
    return { path, sha: `sha-${path}`, content };
  },
  async writeFile(_env: Env, _project: ProjectConfig, path: string, content: string, _message: string): Promise<RepoWriteResult> {
    files.set(path, content);
    return { path, sha: `sha-${files.size}` };
  }
};

const tokens = {
  PM_AI: env.BROKER_KEY_PM,
  CODER_AI: env.BROKER_KEY_CODER,
  AUDITOR_AI: env.BROKER_KEY_AUDITOR,
  HELPER_AI: env.BROKER_KEY_HELPER,
  EXPLORER_AI: env.BROKER_KEY_EXPLORER,
  HYPOTHESIZER_AI: env.BROKER_KEY_HYPOTHESIZER,
  DESIGNER_AI: env.BROKER_KEY_DESIGNER,
  SCIENCE_AUDITOR_AI: env.BROKER_KEY_SCIENCE_AUDITOR,
  SCIENCE_EXECUTOR_AI: env.BROKER_KEY_SCIENCE_EXECUTOR,
  HUMAN: env.BROKER_KEY_HUMAN
};

function auth(role: keyof typeof tokens): string {
  return `Bearer ${tokens[role]}`;
}

async function requestJson(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await handleWorkerFetch(new Request(`${baseUrl}${path}`, { ...init, headers }), env, { flowRepoStore: memoryStore });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function writeArtifact(flowId: string, role: keyof typeof tokens, artifactType: string, title: string): Promise<{ status: number; body: any }> {
  return await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth(role) },
    body: JSON.stringify({
      artifact_type: artifactType,
      title,
      body: `${title}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`
    })
  });
}

async function expectArtifactPass(flowId: string, role: keyof typeof tokens, artifactType: string): Promise<void> {
  const res = await writeArtifact(flowId, role, artifactType, `${role} ${artifactType}`);
  assert(res.status === 201, `${role} should write ${artifactType}; got ${res.status}: ${JSON.stringify(res.body)}`);
}

async function expectArtifactDeny(flowId: string, role: keyof typeof tokens, artifactType: string): Promise<void> {
  const res = await writeArtifact(flowId, role, artifactType, `${role} forbidden ${artifactType}`);
  assert(res.status === 403, `${role} should be denied ${artifactType}; got ${res.status}: ${JSON.stringify(res.body)}`);
}

async function main(): Promise<void> {
  const results: string[] = [];
  const record = (name: string): void => {
    results.push(`PASS ${name}`);
  };

  const create = await requestJson("/v1/flows", {
    method: "POST",
    headers: { authorization: auth("EXPLORER_AI") },
    body: JSON.stringify({
      name: "science-monkeys-v01-role-auth-foundation-001",
      type: "science_flow",
      title: "Science Monkeys v0.1 Role/Auth Foundation 001",
      summary: "Offline proof for separate Science Monkey identities and artifact policy."
    })
  });
  assert(create.status === 201, `science_flow create failed: ${create.status} ${JSON.stringify(create.body)}`);
  const flowId = create.body.flow_id as string;
  record("create science_flow as EXPLORER_AI");

  await expectArtifactPass(flowId, "EXPLORER_AI", "research_dossier");
  record("EXPLORER_AI research_dossier allowed");

  await expectArtifactPass(flowId, "HYPOTHESIZER_AI", "hypothesis_card");
  record("HYPOTHESIZER_AI hypothesis_card allowed");

  await expectArtifactPass(flowId, "DESIGNER_AI", "experiment_protocol");
  record("DESIGNER_AI experiment_protocol allowed");

  await expectArtifactPass(flowId, "SCIENCE_EXECUTOR_AI", "execution_report");
  record("SCIENCE_EXECUTOR_AI execution_report allowed");

  await expectArtifactPass(flowId, "SCIENCE_AUDITOR_AI", "audit_report");
  record("SCIENCE_AUDITOR_AI audit_report allowed");

  await expectArtifactPass(flowId, "SCIENCE_AUDITOR_AI", "share_recommendation");
  record("SCIENCE_AUDITOR_AI share_recommendation allowed");

  await expectArtifactDeny(flowId, "PM_AI", "research_dossier");
  record("PM_AI research_dossier denied");

  await expectArtifactDeny(flowId, "PM_AI", "hypothesis_card");
  record("PM_AI hypothesis_card denied");

  assert(canWriteFlowArtifactForFlow("science_flow", "HELPER_CODEX" as Role, "execution_report") === false, "legacy HELPER_CODEX must not write science execution_report");
  record("HELPER_CODEX execution_report denied by policy oracle");

  await expectArtifactDeny(flowId, "CODER_AI", "execution_report");
  record("CODER_AI execution_report denied");

  await expectArtifactDeny(flowId, "AUDITOR_AI", "audit_report");
  record("AUDITOR_AI audit_report denied for science_flow");

  await expectArtifactDeny(flowId, "SCIENCE_AUDITOR_AI", "share_packet");
  record("SCIENCE_AUDITOR_AI official share_packet denied");

  const humanSharePacket = await writeArtifact(flowId, "HUMAN", "share_packet", "Human share packet through generic route");
  assert(humanSharePacket.status === 403, `generic Human share_packet should be blocked pending /v1/science/share; got ${humanSharePacket.status}: ${JSON.stringify(humanSharePacket.body)}`);
  assert(humanSharePacket.body.error.code === "SCIENCE_SHARE_ROUTE_REQUIRED", "expected SCIENCE_SHARE_ROUTE_REQUIRED");
  record("generic Human share_packet blocked pending /v1/science/share");

  const codeCreate = await requestJson("/v1/flows", {
    method: "POST",
    headers: { authorization: auth("PM_AI") },
    body: JSON.stringify({
      name: "code-flow-helper-ai-compat-001",
      type: "code_flow",
      title: "Code flow Helper AI compatibility",
      summary: "Ensure BROKER_KEY_HELPER maps to HELPER_AI and code_flow execution artifact still works."
    })
  });
  assert(codeCreate.status === 201, `code_flow create failed: ${codeCreate.status} ${JSON.stringify(codeCreate.body)}`);
  const codeFlowId = codeCreate.body.flow_id as string;
  await expectArtifactDeny(codeFlowId, "HELPER_AI", "execution_report");
  record("HELPER_AI execution_report blocked by route-only policy on code_flow raw route");

  console.log(JSON.stringify({ ok: true, flow_id: flowId, code_flow_id: codeFlowId, results, written_paths: [...files.keys()].sort() }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
