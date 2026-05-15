import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { getProject } from "./projects";
import { STATUS_LABELS } from "./policy";
import { handleFlowsRequest } from "./flows";
import type { Env } from "./types";

type JsonObject = Record<string, any>;

function requiredStatusLabels(): string[] { return [...STATUS_LABELS]; }
function optionalString(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid or missing field: ${field}`);
  return value.trim();
}
function projectNameFrom(url: URL, body: JsonObject): string {
  return optionalString(body.project) || optionalString(url.searchParams.get("project")) || "ArqonZero";
}
function utcIso(): string { return new Date().toISOString(); }
function safeFilePart(value: string, max = 96): string { return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max); }
function formatJson(value: unknown): string { return `${JSON.stringify(value, null, 2)}\n`; }
function contextIndexPath(): string { return "governance/context/generated_pm_tasking_context.json"; }
function workPlanIndexPath(): string { return "governance/context/generated_coder_work_plan_context.json"; }
function recordPath(id: string): string { return `governance/context/coder_work_plan/${id}.json`; }
function manifestPath(flowId: string): string { return `governance/flows/${flowId}/flow_manifest.json`; }
function labelsOk(labels: unknown): boolean { return Array.isArray(labels) && requiredStatusLabels().every(label => labels.includes(label)); }

async function readBody(request: Request): Promise<JsonObject> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Missing or invalid JSON body");
  return body as JsonObject;
}
async function readJson<T = JsonObject>(env: Env, projectName: string, path: string, store: RepoStore): Promise<T | null> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  try {
    const file = await store.fetchFile(env, project, path);
    return JSON.parse(file.content) as T;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}
async function writeJson(env: Env, projectName: string, path: string, value: unknown, message: string, store: RepoStore): Promise<{ path: string; sha: string }> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  return await store.writeFile(env, project, path, formatJson(value), message);
}
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}
function jsonHeaders(request: Request): Headers {
  const headers = new Headers();
  const auth = request.headers.get("authorization") || "";
  if (auth) headers.set("authorization", auth);
  headers.set("content-type", "application/json");
  return headers;
}
function normalizeClaimText(value: string): string { return value.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim(); }
function validateWorkPlanBody(body: string): Response | null {
  const normalized = normalizeClaimText(body);
  const promotion: Array<[RegExp, string]> = [
    [/\bsealed test certified\b/, "sealed-test certified"], [/\bcertified\b/, "certified"], [/\bcertification\b/, "certification"],
    [/\bproduction ready\b/, "production ready"], [/\bproduction readiness\b/, "production readiness"], [/\bready for production\b/, "ready for production"],
    [/\bproduct ready\b/, "product ready"], [/\bpromotable\b/, "promotable"], [/\bapproved for release\b/, "approved for release"], [/\brelease ready\b/, "release ready"]
  ];
  const foundPromotion = promotion.find(([pattern]) => pattern.test(normalized));
  if (foundPromotion) return errorResponse("CODER_WORK_PLAN_FORBIDDEN_CLAIM_INCLUDED", `Coder work plan contains forbidden promotion language: ${foundPromotion[1]}`, 409);
  const execution: Array<[RegExp, string]> = [
    [/\bhelper may execute\b/, "helper may execute"], [/\bhelper can execute\b/, "helper can execute"], [/\bexecution is authorized\b/, "execution is authorized"],
    [/\bauthorized for execution\b/, "authorized for execution"], [/\bapply the patch\b/, "apply the patch"], [/\bcreate and apply the patch\b/, "create and apply the patch"],
    [/\bdeploy now\b/, "deploy now"], [/\bno further review required\b/, "no further review required"], [/\bimplementation complete\b/, "implementation complete"],
    [/\bready for helper execution\b/, "ready for helper execution"]
  ];
  const foundExecution = execution.find(([pattern]) => pattern.test(normalized));
  if (foundExecution) return errorResponse("CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN", `Coder work plan may not authorize Helper execution or completion: ${foundExecution[1]}`, 409);
  return null;
}
async function loadTaskingEntry(env: Env, projectName: string, body: JsonObject, store: RepoStore): Promise<{ tasking_id: string; pm_tasking_record_path: string }> {
  const taskingId = optionalString(body.tasking_id);
  const taskingPath = optionalString(body.pm_tasking_record_path);
  if (!taskingId && !taskingPath) throw new Error("Invalid or missing field: tasking_id or pm_tasking_record_path");
  const index = await readJson<JsonObject>(env, projectName, contextIndexPath(), store);
  if (!index || index.schema_version !== "pm_tasking_context_index.v0.1" || !Array.isArray(index.entries)) throw new Error("PM tasking context index is missing or invalid");
  const entry = index.entries.find((item: JsonObject) => (taskingId && item.tasking_id === taskingId) || (taskingPath && item.pm_tasking_record_path === taskingPath));
  if (!entry) throw new Error(`No PM tasking context entry found for ${taskingId || taskingPath}`);
  return { tasking_id: entry.tasking_id, pm_tasking_record_path: entry.pm_tasking_record_path };
}
function validateTaskingRecord(record: JsonObject): Response | null {
  if (record.schema_version !== "pm_tasking_context.v0.1") return errorResponse("CODER_WORK_PLAN_INVALID_TASKING_RECORD", "PM tasking record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "PM_AI") return errorResponse("CODER_WORK_PLAN_INVALID_TASKING_AUTHORITY", "PM tasking record is not official PM tasking", 409);
  if (!record.source_plan || !record.output_artifacts?.pm_tasking) return errorResponse("CODER_WORK_PLAN_TASKING_INCOMPLETE", "PM tasking record is incomplete", 409);
  if (!record.source_plan.share_packet_hash || !record.source_plan.uncertainty) return errorResponse("CODER_WORK_PLAN_SOURCE_BOUNDARY_REQUIRED", "PM tasking record must preserve share hash and uncertainty", 409);
  if (!Array.isArray(record.source_plan.forbidden_claims) || record.source_plan.forbidden_claims.length === 0) return errorResponse("CODER_WORK_PLAN_FORBIDDEN_CLAIMS_REQUIRED", "PM tasking record must preserve forbidden claims", 409);
  if (!Array.isArray(record.source_plan.resolved_source_artifacts) || record.source_plan.resolved_source_artifacts.length === 0) return errorResponse("CODER_WORK_PLAN_RESOLVED_SOURCES_REQUIRED", "PM tasking record must preserve resolved source metadata", 409);
  if (!labelsOk(record.required_status_labels)) return errorResponse("CODER_WORK_PLAN_STATUS_LABELS_REQUIRED", "PM tasking record is missing required diagnostic status labels", 409);
  return null;
}
function validateManifest(manifest: JsonObject | null, record: JsonObject): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("CODER_WORK_PLAN_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_plan.code_flow_id) return errorResponse("CODER_WORK_PLAN_CODE_FLOW_REQUIRED", "Coder work plan target must be a code_flow", 409);
  const expected = record.output_artifacts.pm_tasking;
  const actual = (manifest.artifacts || []).find((artifact: JsonObject) => artifact.artifact_id === expected.artifact_id);
  if (!actual) return errorResponse("CODER_WORK_PLAN_TASKING_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain required pm_tasking artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== "pm_tasking" || actual.role !== "PM_AI") return errorResponse("CODER_WORK_PLAN_TASKING_ARTIFACT_TYPE_MISMATCH", `Expected pm_tasking by PM_AI for ${expected.artifact_id}`, 409);
  if (actual.source_path !== expected.source_path) return errorResponse("CODER_WORK_PLAN_TASKING_ARTIFACT_SOURCE_MISMATCH", `PM tasking artifact source path mismatch for ${expected.artifact_id}`, 409);
  return null;
}
function buildMarkdown(record: JsonObject, id: string, title: string, workPlanBody: string): string {
  const sourceArtifacts = record.source_plan.resolved_source_artifacts.map((item: JsonObject) => `- ${item.artifact_type}: ${item.artifact_id} (${item.source_path})`).join("\n");
  const forbiddenClaims = record.source_plan.forbidden_claims.map((claim: string) => `- ${claim}`).join("\n");
  return `# ${title}\n\nRequired status:\n\nREQUIRES_HUMAN_REVIEW  \ndevelopment diagnostic only  \nNOT SEALED-TEST CERTIFIED  \nnot promotable\n\n## Coder Work Plan Boundary\n\nThis is a Coder-owned engineering interpretation and decomposition proposal derived from PM tasking. It is not an implementation bundle, not a patch, not a Coder handoff, not Helper execution authorization, not certification, and not a production-readiness claim.\n\n## Source Chain\n\n- coder_work_plan_id: ${id}\n- tasking_id: ${record.tasking_id}\n- plan_id: ${record.source_plan.plan_id}\n- specification_id: ${record.source_plan.specification_id}\n- intake_id: ${record.source_plan.intake_id}\n- handoff_id: ${record.source_plan.handoff_id}\n- code_flow_id: ${record.source_plan.code_flow_id}\n- source_share_id: ${record.source_plan.share_id}\n- source_science_flow_id: ${record.source_plan.science_flow_id}\n- share_packet_hash: ${record.source_plan.share_packet_hash}\n- tasking_payload_hash: ${record.submitted_payload_hash}\n- evidence_level: ${record.source_plan.evidence_level}\n- uncertainty: ${record.source_plan.uncertainty}\n\n## Coder Work Plan Body\n\n${workPlanBody}\n\n## Hard Forbidden Claims\n\n${forbiddenClaims}\n\n## Source Artifacts\n\n${sourceArtifacts}\n\n## Non-Laundering Rule\n\nCoder work plan remains downstream of diagnostic evidence and PM tasking. Implementation bundle, Coder handoff, Helper execution, and promotion require later gated stages and Human approval.\n`;
}
async function writeArtifact(request: Request, env: Env, flowId: string, projectName: string, title: string, content: string, store: RepoStore): Promise<JsonObject | Response> {
  const url = new URL(request.url);
  const response = await handleFlowsRequest(new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify({ project: projectName, artifact_type: "coder_work_plan", title, body: content })
  }), env, flowId, "artifacts", store);
  const parsed = await parseJsonResponse(response) as JsonObject;
  if (!response.ok) return jsonResponse(parsed, response.status);
  if (!parsed.artifact) return errorResponse("CODER_WORK_PLAN_ARTIFACT_WRITE_FAILED", "Artifact write did not return summary for coder_work_plan", 500);
  return parsed.artifact;
}
async function loadIndex(env: Env, projectName: string, store: RepoStore): Promise<JsonObject> {
  const existing = await readJson<JsonObject>(env, projectName, workPlanIndexPath(), store);
  if (existing?.schema_version === "coder_work_plan_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return { schema_version: "coder_work_plan_context_index.v0.1", project: projectName, updated_at: utcIso(), entries: [] };
}

export async function handleCoderWorkPlanRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "CODER_AI") return errorResponse("CODER_WORK_PLAN_ROLE_FORBIDDEN", "Only CODER_AI may create Coder work plan artifacts", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);

    const url = new URL(request.url);
    const body = await readBody(request);
    const projectName = projectNameFrom(url, body);
    if (!getProject(projectName)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

    const idempotencyKey = requireString(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(idempotencyKey)) return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    const title = requireString(body.work_plan_title, "work_plan_title");
    const workPlanBody = requireString(body.work_plan_body, "work_plan_body");
    const bodyError = validateWorkPlanBody(workPlanBody);
    if (bodyError) return bodyError;

    const entry = await loadTaskingEntry(env, projectName, body, repoStore);
    const tasking = await readJson<JsonObject>(env, projectName, entry.pm_tasking_record_path, repoStore);
    if (!tasking) return errorResponse("CODER_WORK_PLAN_TASKING_RECORD_NOT_FOUND", `No PM tasking record found for ${entry.tasking_id}`, 404);
    if (tasking.tasking_id !== entry.tasking_id || tasking.pm_tasking_record_path !== entry.pm_tasking_record_path) return errorResponse("CODER_WORK_PLAN_TASKING_CONTEXT_MISMATCH", "PM tasking record does not match generated PM tasking context", 409);

    const taskingError = validateTaskingRecord(tasking);
    if (taskingError) return taskingError;
    const manifestError = validateManifest(await readJson<JsonObject>(env, projectName, manifestPath(tasking.source_plan.code_flow_id), repoStore), tasking);
    if (manifestError) return manifestError;

    const workPlanId = `${safeFilePart(tasking.tasking_id, 90)}-${safeFilePart(idempotencyKey, 36)}`;
    const submittedPayloadHash = await sha256Hex(JSON.stringify({ project: projectName, idempotency_key: idempotencyKey, tasking_id: tasking.tasking_id, pm_tasking_record_path: tasking.pm_tasking_record_path, tasking_payload_hash: tasking.submitted_payload_hash, share_packet_hash: tasking.source_plan.share_packet_hash, work_plan_title: title, work_plan_body: workPlanBody }));
    const existing = await readJson<JsonObject>(env, projectName, recordPath(workPlanId), repoStore);
    if (existing?.schema_version === "coder_work_plan_context.v0.1") {
      if (existing.submitted_payload_hash !== submittedPayloadHash) return errorResponse("CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT", "Existing Coder work plan idempotency record exists but submitted payload hash does not match", 409);
      return jsonResponse({ ok: true, idempotent_replay: true, coder_work_plan: existing, required_status_labels: requiredStatusLabels() }, 200);
    }

    const artifact = await writeArtifact(request, env, tasking.source_plan.code_flow_id, projectName, title, buildMarkdown(tasking, workPlanId, title, workPlanBody), repoStore);
    if (artifact instanceof Response) return artifact;

    const createdAt = utcIso();
    const record: JsonObject = {
      schema_version: "coder_work_plan_context.v0.1",
      official_artifact: true,
      project: projectName,
      coder_work_plan_id: workPlanId,
      idempotency_key: idempotencyKey,
      created_at: createdAt,
      created_by_role: "CODER_AI",
      source_tasking: {
        tasking_id: tasking.tasking_id,
        pm_tasking_record_path: tasking.pm_tasking_record_path,
        code_flow_id: tasking.source_plan.code_flow_id,
        plan_id: tasking.source_plan.plan_id,
        specification_id: tasking.source_plan.specification_id,
        intake_id: tasking.source_plan.intake_id,
        handoff_id: tasking.source_plan.handoff_id,
        share_id: tasking.source_plan.share_id,
        science_flow_id: tasking.source_plan.science_flow_id,
        share_packet_hash: tasking.source_plan.share_packet_hash,
        submitted_share_payload_hash: tasking.source_plan.submitted_share_payload_hash,
        handoff_payload_hash: tasking.source_plan.handoff_payload_hash,
        intake_payload_hash: tasking.source_plan.intake_payload_hash,
        specification_payload_hash: tasking.source_plan.specification_payload_hash,
        plan_payload_hash: tasking.source_plan.plan_payload_hash,
        tasking_payload_hash: tasking.submitted_payload_hash,
        evidence_level: tasking.source_plan.evidence_level,
        uncertainty: tasking.source_plan.uncertainty,
        source_artifacts: tasking.source_plan.source_artifacts,
        resolved_source_artifacts: tasking.source_plan.resolved_source_artifacts,
        allowed_claims: tasking.source_plan.allowed_claims,
        forbidden_claims: tasking.source_plan.forbidden_claims
      },
      output_artifacts: { coder_work_plan: artifact },
      submitted_payload_hash: submittedPayloadHash,
      coder_work_plan_record_path: recordPath(workPlanId),
      generated_coder_work_plan_context_path: workPlanIndexPath(),
      required_status_labels: requiredStatusLabels()
    };

    const index = await loadIndex(env, projectName, repoStore);
    const entryOut = { coder_work_plan_id: workPlanId, tasking_id: tasking.tasking_id, plan_id: tasking.source_plan.plan_id, specification_id: tasking.source_plan.specification_id, intake_id: tasking.source_plan.intake_id, handoff_id: tasking.source_plan.handoff_id, code_flow_id: tasking.source_plan.code_flow_id, share_id: tasking.source_plan.share_id, science_flow_id: tasking.source_plan.science_flow_id, share_packet_hash: tasking.source_plan.share_packet_hash, evidence_level: tasking.source_plan.evidence_level, uncertainty: tasking.source_plan.uncertainty, coder_work_plan_record_path: record.coder_work_plan_record_path, created_at: createdAt };
    const pos = index.entries.findIndex((item: JsonObject) => item.coder_work_plan_id === workPlanId);
    if (pos >= 0) index.entries[pos] = entryOut; else index.entries.push(entryOut);
    index.updated_at = utcIso();
    index.entries.sort((a: JsonObject, b: JsonObject) => Date.parse(b.created_at) - Date.parse(a.created_at));
    const indexWrite = await writeJson(env, projectName, workPlanIndexPath(), index, `Update Coder work plan context ${workPlanId}`, repoStore);
    record.generated_coder_work_plan_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, projectName, record.coder_work_plan_record_path, record, `Write Coder work plan record ${workPlanId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project: projectName, coder_work_plan: { ...record, coder_work_plan_record_sha: recordWrite.sha }, required_status_labels: requiredStatusLabels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("No PM tasking context entry") || message.includes("PM tasking context index is missing")) return errorResponse("CODER_WORK_PLAN_TASKING_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
