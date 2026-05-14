import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoFileRef, RepoStore, RepoWriteResult } from "../src/repo_store.js";

declare const process: { exitCode?: number };

class MemoryRepoStore implements RepoStore {
  private files = new Map<string, RepoFileRef>();
  private counter = 0;

  async fetchFile(_env: Env, _project: ProjectConfig, path: string): Promise<RepoFileRef> {
    const file = this.files.get(path);
    if (!file) {
      throw new Error(`GitHub file fetch failed for ${path}: 404 TEST_NOT_FOUND`);
    }
    return file;
  }

  async writeFile(_env: Env, _project: ProjectConfig, path: string, content: string, _message: string): Promise<RepoWriteResult> {
    const sha = `test-sha-${String(++this.counter).padStart(4, "0")}`;
    this.files.set(path, { content, sha, path });
    return { path, sha };
  }

  has(path: string): boolean {
    return this.files.has(path);
  }

  paths(): string[] {
    return [...this.files.keys()].sort();
  }
}

const env: Env = {
  BROKER_VERSION: "test",
  DEFAULT_BRANCH: "main",
  GITHUB_APP_ID: "TEST_ONLY",
  GITHUB_APP_INSTALLATION_ID: "TEST_ONLY",
  GITHUB_APP_PRIVATE_KEY: "TEST_ONLY",
  BROKER_KEY_PM: "pm-token",
  BROKER_KEY_CODER: "coder-token",
  BROKER_KEY_AUDITOR: "auditor-token",
  BROKER_KEY_HELPER: "helper-token",
  BROKER_KEY_HUMAN: "human-token"
};

type ScenarioResult = {
  name: string;
  status: "PASS" | "FAIL";
  details: string;
};

const results: ScenarioResult[] = [];

function request(path: string, method: string, token: string, body?: unknown): Request {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(`https://contextbus.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Response was not JSON. status=${response.status} body=${text}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record(name: string, fn: () => Promise<string>): Promise<void> {
  return fn()
    .then(details => {
      results.push({ name, status: "PASS", details });
    })
    .catch(err => {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, status: "FAIL", details: message });
      return;
    });
}

async function main(): Promise<void> {
  const store = new MemoryRepoStore();

  let flowId = "";
  const flowName = "flowcore-v03-smoke-001";

  await record("A create science_flow with default ArqonZero project", async () => {
    const res = await handleWorkerFetch(
      request("/v1/flows", "POST", env.BROKER_KEY_PM, {
        name: flowName,
        type: "science_flow",
        title: "Flow Core v0.3 Offline Smoke",
        summary: "Secret-free route-layer smoke validation."
      }),
      env,
      { flowRepoStore: store }
    );
    const body = await readJson(res);
    assert(res.status === 201, `expected 201, got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.ok === true, "expected ok true");
    assert(body.project === "ArqonZero", `expected default project ArqonZero, got ${body.project}`);
    assert(typeof body.flow_id === "string" && body.flow_id.startsWith("FLOW-"), "expected generated flow_id");
    assert(body.name === flowName, "expected stored alias name");
    assert(body.type === "science_flow", "expected science_flow type");
    flowId = body.flow_id;
    assert(store.has("governance/flows/flow_index.json"), "expected flow_index.json written");
    assert(store.has(`governance/flows/${flowId}/flow_manifest.json`), "expected flow_manifest.json written");
    return `created ${flowId}/${flowName}`;
  });

  await record("B list/load by flow_id and alias", async () => {
    assert(flowId, "missing flowId from create scenario");
    const list = await readJson(await handleWorkerFetch(request("/v1/flows", "GET", env.BROKER_KEY_PM), env, { flowRepoStore: store }));
    assert(list.ok === true, "list ok false");
    assert(list.count === 1, `expected count 1, got ${list.count}`);

    const byId = await readJson(await handleWorkerFetch(request(`/v1/flows/${encodeURIComponent(flowId)}`, "GET", env.BROKER_KEY_PM), env, { flowRepoStore: store }));
    assert(byId.ok === true, "load by id ok false");
    assert(byId.flow_id === flowId, "load by id mismatch");

    const byName = await readJson(await handleWorkerFetch(request(`/v1/flows/${encodeURIComponent(flowName)}`, "GET", env.BROKER_KEY_PM), env, { flowRepoStore: store }));
    assert(byName.ok === true, "load by name ok false");
    assert(byName.flow_id === flowId, "load by name did not resolve alias");
    return "list, flow_id load, and alias load passed";
  });

  await record("C flow status returns gate state", async () => {
    const res = await handleWorkerFetch(request(`/v1/flows/${encodeURIComponent(flowName)}/status`, "GET", env.BROKER_KEY_PM), env, { flowRepoStore: store });
    const body = await readJson(res);
    assert(res.status === 200, `expected 200, got ${res.status}`);
    assert(body.ok === true, "status ok false");
    assert(body.current_gate === "DRAFT", `expected DRAFT, got ${body.current_gate}`);
    assert(body.status === "active", `expected active, got ${body.status}`);
    return "status active/DRAFT returned";
  });

  await record("D valid role-gated artifact write succeeds", async () => {
    const res = await handleWorkerFetch(
      request(`/v1/flows/${encodeURIComponent(flowName)}/artifacts`, "POST", env.BROKER_KEY_PM, {
        artifact_type: "pm_spec",
        title: "Offline Smoke PM Spec Artifact",
        body: "REQUIRES_HUMAN_REVIEW\n\ndevelopment diagnostic only\n\nNOT SEALED-TEST CERTIFIED\n\nnot promotable\n"
      }),
      env,
      { flowRepoStore: store }
    );
    const body = await readJson(res);
    assert(res.status === 201, `expected 201, got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.ok === true, "artifact write ok false");
    const artifact = body.artifact as Record<string, unknown>;
    assert(artifact.artifact_type === "pm_spec", "artifact type mismatch");
    assert(typeof artifact.source_path === "string" && artifact.source_path.includes("/artifacts/"), "artifact source path missing");
    return String(artifact.source_path);
  });

  await record("D invalid role-gated artifact write fails closed", async () => {
    const res = await handleWorkerFetch(
      request(`/v1/flows/${encodeURIComponent(flowName)}/artifacts`, "POST", env.BROKER_KEY_HELPER, {
        artifact_type: "pm_spec",
        title: "Forbidden Helper PM Spec",
        body: "This must not be accepted."
      }),
      env,
      { flowRepoStore: store }
    );
    const body = await readJson(res);
    assert(res.status === 403, `expected 403, got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.ok === false, "expected ok false");
    return "HELPER_CODEX forbidden from pm_spec as expected";
  });

  await record("E non-HUMAN advancement denied", async () => {
    const res = await handleWorkerFetch(
      request(`/v1/flows/${encodeURIComponent(flowName)}/advance`, "POST", env.BROKER_KEY_PM, {
        gate_state: "PLAN_READY",
        status: "active",
        note: "PM must not be allowed to advance in v0.3."
      }),
      env,
      { flowRepoStore: store }
    );
    const body = await readJson(res);
    assert(res.status === 403, `expected 403, got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.ok === false, "expected ok false");
    return "PM_AI advancement denied";
  });

  await record("E HUMAN advancement succeeds", async () => {
    const res = await handleWorkerFetch(
      request(`/v1/flows/${encodeURIComponent(flowName)}/advance`, "POST", env.BROKER_KEY_HUMAN, {
        gate_state: "PLAN_READY",
        status: "active",
        note: "Offline smoke human advancement."
      }),
      env,
      { flowRepoStore: store }
    );
    const body = await readJson(res);
    assert(res.status === 200, `expected 200, got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.ok === true, "expected ok true");
    assert(body.current_gate === "PLAN_READY", `expected PLAN_READY, got ${body.current_gate}`);
    return "HUMAN advancement accepted";
  });

  await record("F v0.2 route regression smoke: health and legacy runs fallback", async () => {
    const health = await handleWorkerFetch(request("/v1/health", "GET", env.BROKER_KEY_PM), env, { flowRepoStore: store });
    const healthBody = await readJson(health);
    assert(health.status === 200, `health expected 200, got ${health.status}`);
    assert(healthBody.ok === true, "health ok false");

    const runs = await handleWorkerFetch(request("/v1/runs", "GET", env.BROKER_KEY_PM), env, { flowRepoStore: store });
    const runsBody = await readJson(runs);
    assert(runs.status === 501, `runs fallback expected 501, got ${runs.status}`);
    assert(runsBody.ok === false, "runs fallback expected ok false");
    return "health ok and legacy /v1/runs fallback retained";
  });

  const failed = results.filter(r => r.status === "FAIL");
  const report = {
    status: failed.length === 0 ? "PASS" : "FAIL",
    created_flow_id: flowId || null,
    created_flow_name: flowName,
    memory_paths: store.paths(),
    results
  };

  console.log(JSON.stringify(report, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exitCode = 1;
});
