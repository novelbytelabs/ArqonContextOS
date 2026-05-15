import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { getProject } from "./projects";
import { STATUS_LABELS } from "./policy";
import { handleFlowsRequest } from "./flows";
import type { Env, Role } from "./types";

interface FlowArtifactSummary {
  artifact_id: string;
  artifact_type: string;
  title: string;
  role: Role;
  created_at: string;
  source_path: string;
  source_sha?: string;
}

interface FlowManifest {
  schema_version: "flow_manifest.v0.3";
  official_artifact: true;
  project: string;
  flow_id: string;
  name: string;
  type: string;
  title: string;
  summary: string;
  status: string;
  current_gate: string;
  created_at: string;
  created_by_role: Role;
  updated_at: string;
  updated_by_role: Role;
  required_status_labels: string[];
  artifacts: FlowArtifactSummary[];
  history: unknown[];
}

interface ResolvedShareSourceArtifact {
  artifact_id: string;
  artifact_type: string;
  title: string;
  role: Role;
  created_at: string;
  source_path: string;
  source_sha?: string;
}

interface CoderWorkPlanRecord {
  schema_version: "coder_work_plan_context.v0.1";
  official_artifact: true;
  project: string;
  coder_work_plan_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "CODER_AI";
  source_tasking: {
    tasking_id: string;
    pm_tasking_record_path: string;
    code_flow_id: string;
    plan_id: string;
    specification_id: string;
    intake_id: string;
    handoff_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    submitted_share_payload_hash?: string;
    handoff_payload_hash: string;
    intake_payload_hash: string;
    specification_payload_hash: string;
    plan_payload_hash: string;
    tasking_payload_hash: string;
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  output_artifacts: {
    coder_work_plan: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  coder_work_plan_record_path: string;
  generated_coder_work_plan_context_path: string;
  generated_coder_work_plan_context_sha?: string;
  required_status_labels: string[];
}

interface CoderWorkPlanContextIndex {
  schema_version: "coder_work_plan_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
    coder_work_plan_id: string;
    tasking_id: string;
    plan_id: string;
    specification_id: string;
    intake_id: string;
    handoff_id: string;
    code_flow_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    evidence_level: string;
    uncertainty: string;
    coder_work_plan_record_path: string;
    created_at: string;
  }>;
}

interface CoderTasksRecord {
  schema_version: "coder_tasks_context.v0.1";
  official_artifact: true;
  project: string;
  coder_tasks_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "CODER_AI";
  source_coder_work_plan: {
    coder_work_plan_id: string;
    coder_work_plan_record_path: string;
    tasking_id: string;
    code_flow_id: string;
    plan_id: string;
    specification_id: string;
    intake_id: string;
    handoff_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    submitted_share_payload_hash?: string;
    handoff_payload_hash: string;
    intake_payload_hash: string;
    specification_payload_hash: string;
    plan_payload_hash: string;
    tasking_payload_hash: string;
    coder_work_plan_payload_hash: string;
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  output_artifacts: {
    coder_tasks: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  coder_tasks_record_path: string;
  generated_coder_tasks_context_path: string;
  generated_coder_tasks_context_sha?: string;
  required_status_labels: string[];
}

interface CoderTasksContextIndex {
  schema_version: "coder_tasks_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
    coder_tasks_id: string;
    coder_work_plan_id: string;
    tasking_id: string;
    plan_id: string;
    specification_id: string;
    intake_id: string;
    handoff_id: string;
    code_flow_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    evidence_level: string;
    uncertainty: string;
    coder_tasks_record_path: string;
    created_at: string;
  }>;
}

function requiredStatusLabels(): string[] {
  return [...STATUS_LABELS];
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid or missing field: ${field}`);
  return value.trim();
}

function getParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value && value.trim() ? value.trim() : null;
}

function projectNameFrom(url: URL, body?: Record<string, unknown>): string {
  const fromBody = body ? optionalString(body.project) : "";
  const fromQuery = getParam(url, "project") || "";
  return fromBody || fromQuery || "ArqonZero";
}

function utcIso(): string {
  return new Date().toISOString();
}

function safeFilePart(value: string, max = 96): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max);
}

function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function authorizationHeader(request: Request): string {
  return request.headers.get("authorization") || "";
}

function jsonHeaders(request: Request): Headers {
  const headers = new Headers();
  const auth = authorizationHeader(request);
  if (auth) headers.set("authorization", auth);
  headers.set("content-type", "application/json");
  return headers;
}

function coderWorkPlanContextIndexPath(): string {
  return "governance/context/generated_coder_work_plan_context.json";
}

function coderTasksContextIndexPath(): string {
  return "governance/context/generated_coder_tasks_context.json";
}

function coderTasksRecordPath(coderTasksId: string): string {
  return `governance/context/coder_tasks/${coderTasksId}.json`;
}

function flowManifestPath(flowId: string): string {
  return `governance/flows/${flowId}/flow_manifest.json`;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Missing or invalid JSON body");
  return body as Record<string, unknown>;
}

async function fetchJsonIfExists<T>(env: Env, projectName: string, path: string, store: RepoStore): Promise<T | null> {
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

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function hasRequiredLabels(labels: string[] | undefined): boolean {
  return requiredStatusLabels().every(label => Array.isArray(labels) && labels.includes(label));
}

function normalizeClaimText(value: string): string {
  return value.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
}

function validateCoderTasksBody(body: string): Response | null {
  const normalized = normalizeClaimText(body);

  const forbiddenPromotion: Array<[RegExp, string]> = [
    [/\bsealed test certified\b/, "sealed-test certified"],
    [/\bcertified\b/, "certified"],
    [/\bcertification\b/, "certification"],
    [/\bproduction ready\b/, "production ready"],
    [/\bproduction readiness\b/, "production readiness"],
    [/\bready for production\b/, "ready for production"],
    [/\bproduct ready\b/, "product ready"],
    [/\bpromotable\b/, "promotable"],
    [/\bapproved for release\b/, "approved for release"],
    [/\brelease ready\b/, "release ready"]
  ];
  const promotion = forbiddenPromotion.find(([pattern]) => pattern.test(normalized));
  if (promotion) {
    return errorResponse("CODER_TASKS_FORBIDDEN_CLAIM_INCLUDED", `Coder tasks contains forbidden promotion language: ${promotion[1]}`, 409);
  }

  const forbiddenExecutionAuthority: Array<[RegExp, string]> = [
    [/\bhelper may execute\b/, "helper may execute"],
    [/\bhelper can execute\b/, "helper can execute"],
    [/\bexecution is authorized\b/, "execution is authorized"],
    [/\bauthorized for execution\b/, "authorized for execution"],
    [/\bapply the patch\b/, "apply the patch"],
    [/\bcreate and apply the patch\b/, "create and apply the patch"],
    [/\bdeploy now\b/, "deploy now"],
    [/\bno further review required\b/, "no further review required"],
    [/\bimplementation complete\b/, "implementation complete"],
    [/\bready for helper execution\b/, "ready for helper execution"]
  ];
  const executionAuthority = forbiddenExecutionAuthority.find(([pattern]) => pattern.test(normalized));
  if (executionAuthority) {
    return errorResponse(
      "CODER_TASKS_EXECUTION_AUTHORITY_FORBIDDEN",
      `Coder tasks may not authorize Helper execution or completion: ${executionAuthority[1]}`,
      409
    );
  }

  return null;
}

async function loadCoderWorkPlanContextEntry(env: Env, projectName: string, body: Record<string, unknown>, store: RepoStore): Promise<{ coder_work_plan_id: string; coder_work_plan_record_path: string }> {
  const coderWorkPlanId = optionalString(body.coder_work_plan_id);
  const coderWorkPlanRecordPath = optionalString(body.coder_work_plan_record_path);
  if (!coderWorkPlanId && !coderWorkPlanRecordPath) throw new Error("Invalid or missing field: coder_work_plan_id or coder_work_plan_record_path");

  const index = await fetchJsonIfExists<CoderWorkPlanContextIndex>(env, projectName, coderWorkPlanContextIndexPath(), store);
  if (!index || index.schema_version !== "coder_work_plan_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("Coder work plan context index is missing or invalid");
  }

  const entry = index.entries.find(item =>
    (coderWorkPlanId && item.coder_work_plan_id === coderWorkPlanId) ||
    (coderWorkPlanRecordPath && item.coder_work_plan_record_path === coderWorkPlanRecordPath)
  );
  if (!entry) throw new Error(`No Coder work plan context entry found for ${coderWorkPlanId || coderWorkPlanRecordPath}`);
  return { coder_work_plan_id: entry.coder_work_plan_id, coder_work_plan_record_path: entry.coder_work_plan_record_path };
}

function artifactById(manifest: FlowManifest, artifactId: string): FlowArtifactSummary | null {
  return manifest.artifacts.find(artifact => artifact.artifact_id === artifactId) || null;
}

function validateExpectedCoderWorkPlanArtifact(manifest: FlowManifest, expected: FlowArtifactSummary): Response | null {
  const actual = artifactById(manifest, expected.artifact_id);
  if (!actual) return errorResponse("CODER_TASKS_WORK_PLAN_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain required coder_work_plan artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== "coder_work_plan" || actual.role !== "CODER_AI") {
    return errorResponse("CODER_TASKS_WORK_PLAN_ARTIFACT_TYPE_MISMATCH", `Expected coder_work_plan by CODER_AI for ${expected.artifact_id}`, 409);
  }
  if (actual.source_path !== expected.source_path) {
    return errorResponse("CODER_TASKS_WORK_PLAN_ARTIFACT_SOURCE_MISMATCH", `Coder work plan artifact source path mismatch for ${expected.artifact_id}`, 409);
  }
  return null;
}

function validateCoderWorkPlanRecord(record: CoderWorkPlanRecord): Response | null {
  if (record.schema_version !== "coder_work_plan_context.v0.1") return errorResponse("CODER_TASKS_INVALID_WORK_PLAN_RECORD", "Coder work plan record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "CODER_AI") return errorResponse("CODER_TASKS_INVALID_WORK_PLAN_AUTHORITY", "Coder work plan record is not official Coder work plan", 409);
  if (!record.source_tasking || !record.output_artifacts) return errorResponse("CODER_TASKS_WORK_PLAN_INCOMPLETE", "Coder work plan record is missing source tasking or output artifacts", 409);
  if (!record.source_tasking.share_packet_hash || !record.source_tasking.uncertainty) return errorResponse("CODER_TASKS_SOURCE_BOUNDARY_REQUIRED", "Coder work plan record must preserve share hash and uncertainty", 409);
  if (!record.source_tasking.forbidden_claims || record.source_tasking.forbidden_claims.length === 0) return errorResponse("CODER_TASKS_FORBIDDEN_CLAIMS_REQUIRED", "Coder work plan record must preserve forbidden claims", 409);
  if (!record.source_tasking.resolved_source_artifacts || record.source_tasking.resolved_source_artifacts.length === 0) return errorResponse("CODER_TASKS_RESOLVED_SOURCES_REQUIRED", "Coder work plan record must preserve resolved source metadata", 409);
  if (!record.output_artifacts.coder_work_plan) return errorResponse("CODER_TASKS_WORK_PLAN_ARTIFACT_REQUIRED", "Coder work plan record must include coder_work_plan artifact", 409);
  if (!hasRequiredLabels(record.required_status_labels)) return errorResponse("CODER_TASKS_STATUS_LABELS_REQUIRED", "Coder work plan record is missing required diagnostic status labels", 409);
  return null;
}

function validateCodeFlowManifest(manifest: FlowManifest | null, record: CoderWorkPlanRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("CODER_TASKS_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_tasking.code_flow_id) return errorResponse("CODER_TASKS_CODE_FLOW_REQUIRED", "Coder tasks target must be a code_flow", 409);
  return validateExpectedCoderWorkPlanArtifact(manifest, record.output_artifacts.coder_work_plan);
}

function buildCoderTasksId(coderWorkPlanId: string, idempotencyKey: string): string {
  return `${safeFilePart(coderWorkPlanId, 90)}-${safeFilePart(idempotencyKey, 36)}`;
}

function buildCoderTasksMarkdown(record: CoderWorkPlanRecord, coderTasksId: string, title: string, tasksBody: string): string {
  return `# ${title}

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Coder Tasks Boundary

This is Coder-owned implementation task decomposition derived from a Coder work plan.

It is not an implementation bundle, not a patch, not a Coder handoff, not Helper execution authorization, not certification, and not a production-readiness claim.

## Source Chain

- coder_tasks_id: ${coderTasksId}
- coder_work_plan_id: ${record.coder_work_plan_id}
- tasking_id: ${record.source_tasking.tasking_id}
- plan_id: ${record.source_tasking.plan_id}
- specification_id: ${record.source_tasking.specification_id}
- intake_id: ${record.source_tasking.intake_id}
- handoff_id: ${record.source_tasking.handoff_id}
- code_flow_id: ${record.source_tasking.code_flow_id}
- source_share_id: ${record.source_tasking.share_id}
- source_science_flow_id: ${record.source_tasking.science_flow_id}
- share_packet_hash: ${record.source_tasking.share_packet_hash}
- submitted_share_payload_hash: ${record.source_tasking.submitted_share_payload_hash || record.source_tasking.share_packet_hash}
- handoff_payload_hash: ${record.source_tasking.handoff_payload_hash}
- intake_payload_hash: ${record.source_tasking.intake_payload_hash}
- specification_payload_hash: ${record.source_tasking.specification_payload_hash}
- plan_payload_hash: ${record.source_tasking.plan_payload_hash}
- tasking_payload_hash: ${record.source_tasking.tasking_payload_hash}
- coder_work_plan_payload_hash: ${record.submitted_payload_hash}
- evidence_level: ${record.source_tasking.evidence_level}
- uncertainty: ${record.source_tasking.uncertainty}

## Coder Tasks Body

${tasksBody}

## Hard Forbidden Claims

${record.source_tasking.forbidden_claims.map(claim => `- ${claim}`).join("\n")}

## Source Artifacts

${record.source_tasking.resolved_source_artifacts.map(item => `- ${item.artifact_type}: ${item.artifact_id} (${item.source_path})`).join("\n")}

## Non-Laundering Rule

Coder tasks remain downstream of diagnostic evidence, PM tasking, and Coder work planning. Implementation bundle, Coder handoff, Helper execution, and promotion require later gated stages and Human approval.
`;
}

async function writeCodeFlowArtifact(request: Request, env: Env, flowId: string, projectName: string, artifactType: string, title: string, body: string, store: RepoStore): Promise<FlowArtifactSummary | Response> {
  const url = new URL(request.url);
  const artifactRequest = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify({ project: projectName, artifact_type: artifactType, title, body })
  });
  const response = await handleFlowsRequest(artifactRequest, env, flowId, "artifacts", store);
  const parsed = await parseJsonResponse(response);
  if (!response.ok) return jsonResponse(parsed, response.status);
  const artifact = (parsed as { artifact?: FlowArtifactSummary }).artifact;
  if (!artifact) return errorResponse("CODER_TASKS_ARTIFACT_WRITE_FAILED", `Artifact write did not return summary for ${artifactType}`, 500);
  return artifact;
}

async function loadCoderTasksIndex(env: Env, projectName: string, store: RepoStore): Promise<CoderTasksContextIndex> {
  const existing = await fetchJsonIfExists<CoderTasksContextIndex>(env, projectName, coderTasksContextIndexPath(), store);
  if (existing && existing.schema_version === "coder_tasks_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return { schema_version: "coder_tasks_context_index.v0.1", project: projectName, updated_at: utcIso(), entries: [] };
}

function upsertCoderTasksIndex(index: CoderTasksContextIndex, record: CoderTasksRecord): void {
  const entry = {
    coder_tasks_id: record.coder_tasks_id,
    coder_work_plan_id: record.source_coder_work_plan.coder_work_plan_id,
    tasking_id: record.source_coder_work_plan.tasking_id,
    plan_id: record.source_coder_work_plan.plan_id,
    specification_id: record.source_coder_work_plan.specification_id,
    intake_id: record.source_coder_work_plan.intake_id,
    handoff_id: record.source_coder_work_plan.handoff_id,
    code_flow_id: record.source_coder_work_plan.code_flow_id,
    share_id: record.source_coder_work_plan.share_id,
    science_flow_id: record.source_coder_work_plan.science_flow_id,
    share_packet_hash: record.source_coder_work_plan.share_packet_hash,
    evidence_level: record.source_coder_work_plan.evidence_level,
    uncertainty: record.source_coder_work_plan.uncertainty,
    coder_tasks_record_path: record.coder_tasks_record_path,
    created_at: record.created_at
  };
  const existing = index.entries.findIndex(item => item.coder_tasks_id === record.coder_tasks_id);
  if (existing >= 0) index.entries[existing] = entry;
  else index.entries.push(entry);
  index.updated_at = utcIso();
  index.entries.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handleCoderTasksRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "CODER_AI") return errorResponse("CODER_TASKS_ROLE_FORBIDDEN", "Only CODER_AI may create coder tasks artifacts", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);

    const url = new URL(request.url);
    const body = await readJsonBody(request);
    const projectName = projectNameFrom(url, body);
    const project = getProject(projectName);
    if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

    const idempotencyKey = requireString(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(idempotencyKey)) {
      return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    }
    const tasksTitle = requireString(body.tasks_title, "tasks_title");
    const tasksBody = requireString(body.tasks_body, "tasks_body");
    const bodyError = validateCoderTasksBody(tasksBody);
    if (bodyError) return bodyError;

    const workPlanEntry = await loadCoderWorkPlanContextEntry(env, projectName, body, repoStore);
    const workPlanRecord = await fetchJsonIfExists<CoderWorkPlanRecord>(env, projectName, workPlanEntry.coder_work_plan_record_path, repoStore);
    if (!workPlanRecord) return errorResponse("CODER_TASKS_WORK_PLAN_RECORD_NOT_FOUND", `No Coder work plan record found for ${workPlanEntry.coder_work_plan_id}`, 404);
    if (workPlanRecord.coder_work_plan_id !== workPlanEntry.coder_work_plan_id || workPlanRecord.coder_work_plan_record_path !== workPlanEntry.coder_work_plan_record_path) {
      return errorResponse("CODER_TASKS_WORK_PLAN_CONTEXT_MISMATCH", "Coder work plan record does not match generated Coder work plan context", 409);
    }

    const workPlanError = validateCoderWorkPlanRecord(workPlanRecord);
    if (workPlanError) return workPlanError;

    const codeFlowManifest = await fetchJsonIfExists<FlowManifest>(env, projectName, flowManifestPath(workPlanRecord.source_tasking.code_flow_id), repoStore);
    const codeFlowError = validateCodeFlowManifest(codeFlowManifest, workPlanRecord);
    if (codeFlowError) return codeFlowError;

    const coderTasksId = buildCoderTasksId(workPlanRecord.coder_work_plan_id, idempotencyKey);
    const payloadHash = await sha256Hex(JSON.stringify({
      project: projectName,
      idempotency_key: idempotencyKey,
      coder_work_plan_id: workPlanRecord.coder_work_plan_id,
      coder_work_plan_record_path: workPlanRecord.coder_work_plan_record_path,
      coder_work_plan_payload_hash: workPlanRecord.submitted_payload_hash,
      share_packet_hash: workPlanRecord.source_tasking.share_packet_hash,
      tasks_title: tasksTitle,
      tasks_body: tasksBody
    }));

    const recordPath = coderTasksRecordPath(coderTasksId);
    const existingRecord = await fetchJsonIfExists<CoderTasksRecord>(env, projectName, recordPath, repoStore);
    if (existingRecord && existingRecord.schema_version === "coder_tasks_context.v0.1") {
      if (existingRecord.submitted_payload_hash !== payloadHash) {
        return errorResponse("CODER_TASKS_IDEMPOTENCY_CONFLICT", "Existing coder tasks idempotency record exists but submitted payload hash does not match", 409);
      }
      return jsonResponse({ ok: true, idempotent_replay: true, coder_tasks: existingRecord, required_status_labels: requiredStatusLabels() }, 200);
    }

    const tasksArtifact = await writeCodeFlowArtifact(
      request,
      env,
      workPlanRecord.source_tasking.code_flow_id,
      projectName,
      "coder_tasks",
      tasksTitle,
      buildCoderTasksMarkdown(workPlanRecord, coderTasksId, tasksTitle, tasksBody),
      repoStore
    );
    if (tasksArtifact instanceof Response) return tasksArtifact;

    const createdAt = utcIso();
    const record: CoderTasksRecord = {
      schema_version: "coder_tasks_context.v0.1",
      official_artifact: true,
      project: projectName,
      coder_tasks_id: coderTasksId,
      idempotency_key: idempotencyKey,
      created_at: createdAt,
      created_by_role: "CODER_AI",
      source_coder_work_plan: {
        coder_work_plan_id: workPlanRecord.coder_work_plan_id,
        coder_work_plan_record_path: workPlanRecord.coder_work_plan_record_path,
        tasking_id: workPlanRecord.source_tasking.tasking_id,
        code_flow_id: workPlanRecord.source_tasking.code_flow_id,
        plan_id: workPlanRecord.source_tasking.plan_id,
        specification_id: workPlanRecord.source_tasking.specification_id,
        intake_id: workPlanRecord.source_tasking.intake_id,
        handoff_id: workPlanRecord.source_tasking.handoff_id,
        share_id: workPlanRecord.source_tasking.share_id,
        science_flow_id: workPlanRecord.source_tasking.science_flow_id,
        share_packet_hash: workPlanRecord.source_tasking.share_packet_hash,
        submitted_share_payload_hash: workPlanRecord.source_tasking.submitted_share_payload_hash,
        handoff_payload_hash: workPlanRecord.source_tasking.handoff_payload_hash,
        intake_payload_hash: workPlanRecord.source_tasking.intake_payload_hash,
        specification_payload_hash: workPlanRecord.source_tasking.specification_payload_hash,
        plan_payload_hash: workPlanRecord.source_tasking.plan_payload_hash,
        tasking_payload_hash: workPlanRecord.source_tasking.tasking_payload_hash,
        coder_work_plan_payload_hash: workPlanRecord.submitted_payload_hash,
        evidence_level: workPlanRecord.source_tasking.evidence_level,
        uncertainty: workPlanRecord.source_tasking.uncertainty,
        source_artifacts: workPlanRecord.source_tasking.source_artifacts,
        resolved_source_artifacts: workPlanRecord.source_tasking.resolved_source_artifacts,
        allowed_claims: workPlanRecord.source_tasking.allowed_claims,
        forbidden_claims: workPlanRecord.source_tasking.forbidden_claims
      },
      output_artifacts: { coder_tasks: tasksArtifact },
      submitted_payload_hash: payloadHash,
      coder_tasks_record_path: recordPath,
      generated_coder_tasks_context_path: coderTasksContextIndexPath(),
      required_status_labels: requiredStatusLabels()
    };

    const index = await loadCoderTasksIndex(env, projectName, repoStore);
    upsertCoderTasksIndex(index, record);
    const indexWrite = await writeJson(env, projectName, coderTasksContextIndexPath(), index, `Update Coder tasks context ${coderTasksId}`, repoStore);
    record.generated_coder_tasks_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, projectName, recordPath, record, `Write Coder tasks record ${coderTasksId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project: projectName, coder_tasks: { ...record, coder_tasks_record_sha: recordWrite.sha }, required_status_labels: requiredStatusLabels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("No Coder work plan context entry")) return errorResponse("CODER_TASKS_WORK_PLAN_CONTEXT_NOT_FOUND", message, 404);
    if (message.includes("Coder work plan context index is missing")) return errorResponse("CODER_TASKS_WORK_PLAN_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
