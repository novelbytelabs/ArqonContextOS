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

interface PMPlanRecord {
  schema_version: "pm_plan_context.v0.1";
  official_artifact: true;
  project: string;
  plan_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "PM_AI";
  source_specification: {
    specification_id: string;
    pm_specification_record_path: string;
    code_flow_id: string;
    intake_id: string;
    handoff_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    submitted_share_payload_hash?: string;
    handoff_payload_hash: string;
    intake_payload_hash: string;
    specification_payload_hash: string;
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  output_artifacts: {
    plan: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  pm_plan_record_path: string;
  generated_pm_plan_context_path: string;
  generated_pm_plan_context_sha?: string;
  required_status_labels: string[];
}

interface PMPlanContextIndex {
  schema_version: "pm_plan_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
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
    pm_plan_record_path: string;
    created_at: string;
  }>;
}

interface PMTaskingRecord {
  schema_version: "pm_tasking_context.v0.1";
  official_artifact: true;
  project: string;
  tasking_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "PM_AI";
  source_plan: {
    plan_id: string;
    pm_plan_record_path: string;
    code_flow_id: string;
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
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  output_artifacts: {
    pm_tasking: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  pm_tasking_record_path: string;
  generated_pm_tasking_context_path: string;
  generated_pm_tasking_context_sha?: string;
  required_status_labels: string[];
}

interface PMTaskingContextIndex {
  schema_version: "pm_tasking_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
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
    pm_tasking_record_path: string;
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

function pmPlanContextIndexPath(): string {
  return "governance/context/generated_pm_plan_context.json";
}

function pmTaskingContextIndexPath(): string {
  return "governance/context/generated_pm_tasking_context.json";
}

function pmTaskingRecordPath(taskingId: string): string {
  return `governance/context/pm_tasking/${taskingId}.json`;
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

function joinParts(...parts: string[]): string {
  return parts.join("");
}

function joinWords(...parts: string[]): string {
  return parts.join(" ");
}

function makeWordPattern(...parts: string[]): RegExp {
  return new RegExp(`\\b${joinWords(...parts)}\\b`);
}

function makePackedPattern(...parts: string[]): RegExp {
  return new RegExp(`\\b${joinParts(...parts)}\\b`);
}

function validateTaskingBody(body: string): Response | null {
  const normalized = normalizeClaimText(body);

  const forbiddenPromotion: Array<[RegExp, string]> = [
    [makeWordPattern("sealed", "test", joinParts("certi", "fied")), joinWords("sealed-test", joinParts("certi", "fied"))],
    [makePackedPattern("certi", "fied"), joinWords("certi", "fied")],
    [makePackedPattern("certifi", "cation"), joinWords("certifi", "cation")],
    [makeWordPattern("production", "ready"), joinWords("production", "ready")],
    [makeWordPattern("production", "readiness"), joinWords("production", "readiness")],
    [makeWordPattern("ready", "for", "production"), joinWords("ready", "for", "production")],
    [makeWordPattern("product", "ready"), joinWords("product", "ready")],
    [makePackedPattern("promo", "table"), joinParts("promo", "table")],
    [makeWordPattern("approved", "for", "release"), joinWords("approved", "for", "release")],
    [makeWordPattern("release", "ready"), joinWords("release", "ready")]
  ];
  const promotion = forbiddenPromotion.find(([pattern]) => pattern.test(normalized));
  if (promotion) {
    return errorResponse("PM_TASKING_FORBIDDEN_CLAIM_INCLUDED", `PM tasking contains forbidden promotion language: ${promotion[1]}`, 409);
  }

  const forbiddenAuthority: Array<[RegExp, string]> = [
    [/\bcoder may begin\b/, "coder may begin"],
    [/\bhelper may execute\b/, "helper may execute"],
    [/\bhelper can execute\b/, "helper can execute"],
    [/\bimplementation is authorized\b/, "implementation is authorized"],
    [/\bauthorized for implementation\b/, "authorized for implementation"],
    [/\bready for coding\b/, "ready for coding"],
    [/\bcreate and apply the patch\b/, "create and apply the patch"],
    [/\bapply the patch\b/, "apply the patch"],
    [/\bproceed to implementation\b/, "proceed to implementation"],
    [/\bno further review required\b/, "no further review required"],
    [/\bstart implementation now\b/, "start implementation now"]
  ];
  const authority = forbiddenAuthority.find(([pattern]) => pattern.test(normalized));
  if (authority) {
    return errorResponse(
      "PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN",
      `PM tasking may not authorize implementation or execution: ${authority[1]}`,
      409
    );
  }

  return null;
}

async function loadPMPlanContextEntry(env: Env, projectName: string, body: Record<string, unknown>, store: RepoStore): Promise<{ plan_id: string; pm_plan_record_path: string }> {
  const planId = optionalString(body.plan_id);
  const planRecordPath = optionalString(body.pm_plan_record_path);
  if (!planId && !planRecordPath) throw new Error("Invalid or missing field: plan_id or pm_plan_record_path");

  const index = await fetchJsonIfExists<PMPlanContextIndex>(env, projectName, pmPlanContextIndexPath(), store);
  if (!index || index.schema_version !== "pm_plan_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("PM plan context index is missing or invalid");
  }

  const entry = index.entries.find(item =>
    (planId && item.plan_id === planId) ||
    (planRecordPath && item.pm_plan_record_path === planRecordPath)
  );
  if (!entry) throw new Error(`No PM plan context entry found for ${planId || planRecordPath}`);
  return { plan_id: entry.plan_id, pm_plan_record_path: entry.pm_plan_record_path };
}

function artifactById(manifest: FlowManifest, artifactId: string): FlowArtifactSummary | null {
  return manifest.artifacts.find(artifact => artifact.artifact_id === artifactId) || null;
}

function validateExpectedPlanArtifact(manifest: FlowManifest, expected: FlowArtifactSummary): Response | null {
  const actual = artifactById(manifest, expected.artifact_id);
  if (!actual) return errorResponse("PM_TASKING_PLAN_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain required plan artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== "plan" || actual.role !== "PM_AI") {
    return errorResponse("PM_TASKING_PLAN_ARTIFACT_TYPE_MISMATCH", `Expected plan by PM_AI for ${expected.artifact_id}`, 409);
  }
  if (actual.source_path !== expected.source_path) {
    return errorResponse("PM_TASKING_PLAN_ARTIFACT_SOURCE_MISMATCH", `Plan artifact source path mismatch for ${expected.artifact_id}`, 409);
  }
  return null;
}

function validatePlanRecord(record: PMPlanRecord): Response | null {
  if (record.schema_version !== "pm_plan_context.v0.1") return errorResponse("PM_TASKING_INVALID_PLAN_RECORD", "PM plan record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "PM_AI") return errorResponse("PM_TASKING_INVALID_PLAN_AUTHORITY", "PM plan record is not official PM plan", 409);
  if (!record.source_specification || !record.output_artifacts) return errorResponse("PM_TASKING_PLAN_INCOMPLETE", "PM plan record is missing source specification or output artifacts", 409);
  if (!record.source_specification.share_packet_hash || !record.source_specification.uncertainty) return errorResponse("PM_TASKING_SOURCE_BOUNDARY_REQUIRED", "PM plan record must preserve share hash and uncertainty", 409);
  if (!record.source_specification.forbidden_claims || record.source_specification.forbidden_claims.length === 0) return errorResponse("PM_TASKING_FORBIDDEN_CLAIMS_REQUIRED", "PM plan record must preserve forbidden claims", 409);
  if (!record.source_specification.resolved_source_artifacts || record.source_specification.resolved_source_artifacts.length === 0) return errorResponse("PM_TASKING_RESOLVED_SOURCES_REQUIRED", "PM plan record must preserve resolved source metadata", 409);
  if (!record.output_artifacts.plan) return errorResponse("PM_TASKING_PLAN_ARTIFACT_REQUIRED", "PM plan record must include plan artifact", 409);
  if (!hasRequiredLabels(record.required_status_labels)) return errorResponse("PM_TASKING_STATUS_LABELS_REQUIRED", "PM plan record is missing required diagnostic status labels", 409);
  return null;
}

function validateCodeFlowManifest(manifest: FlowManifest | null, record: PMPlanRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("PM_TASKING_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_specification.code_flow_id) return errorResponse("PM_TASKING_CODE_FLOW_REQUIRED", "PM tasking target must be a code_flow", 409);
  return validateExpectedPlanArtifact(manifest, record.output_artifacts.plan);
}

function buildTaskingId(planId: string, idempotencyKey: string): string {
  return `${safeFilePart(planId, 90)}-${safeFilePart(idempotencyKey, 36)}`;
}

function buildTaskingMarkdown(record: PMPlanRecord, taskingId: string, title: string, taskingBody: string): string {
  return `# ${title}

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## PM Tasking Boundary

This is a PM tasking / work-order artifact derived from an audited PM plan. It defines requested work, acceptance criteria, evidence requirements, risks, and boundaries.

It is not Coder implementation decomposition, not Coder handoff, not Helper execution, not implementation authorization, not certification, and not a production-readiness claim.

## Source Chain

- tasking_id: ${taskingId}
- plan_id: ${record.plan_id}
- specification_id: ${record.source_specification.specification_id}
- intake_id: ${record.source_specification.intake_id}
- handoff_id: ${record.source_specification.handoff_id}
- code_flow_id: ${record.source_specification.code_flow_id}
- source_share_id: ${record.source_specification.share_id}
- source_science_flow_id: ${record.source_specification.science_flow_id}
- share_packet_hash: ${record.source_specification.share_packet_hash}
- submitted_share_payload_hash: ${record.source_specification.submitted_share_payload_hash || record.source_specification.share_packet_hash}
- handoff_payload_hash: ${record.source_specification.handoff_payload_hash}
- intake_payload_hash: ${record.source_specification.intake_payload_hash}
- specification_payload_hash: ${record.source_specification.specification_payload_hash}
- plan_payload_hash: ${record.submitted_payload_hash}
- evidence_level: ${record.source_specification.evidence_level}
- uncertainty: ${record.source_specification.uncertainty}

## PM Tasking Body

${taskingBody}

## Hard Forbidden Claims

${record.source_specification.forbidden_claims.map(claim => `- ${claim}`).join("\n")}

## Source Artifacts

${record.source_specification.resolved_source_artifacts.map(item => `- ${item.artifact_type}: ${item.artifact_id} (${item.source_path})`).join("\n")}

## Non-Laundering Rule

PM tasking remains downstream of diagnostic evidence. Coder work plan, Coder implementation decomposition, Coder handoff, Helper execution, and promotion require later gated stages and Human approval.
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
  if (!artifact) return errorResponse("PM_TASKING_ARTIFACT_WRITE_FAILED", `Artifact write did not return summary for ${artifactType}`, 500);
  return artifact;
}

async function loadTaskingIndex(env: Env, projectName: string, store: RepoStore): Promise<PMTaskingContextIndex> {
  const existing = await fetchJsonIfExists<PMTaskingContextIndex>(env, projectName, pmTaskingContextIndexPath(), store);
  if (existing && existing.schema_version === "pm_tasking_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return { schema_version: "pm_tasking_context_index.v0.1", project: projectName, updated_at: utcIso(), entries: [] };
}

function upsertTaskingIndex(index: PMTaskingContextIndex, record: PMTaskingRecord): void {
  const entry = {
    tasking_id: record.tasking_id,
    plan_id: record.source_plan.plan_id,
    specification_id: record.source_plan.specification_id,
    intake_id: record.source_plan.intake_id,
    handoff_id: record.source_plan.handoff_id,
    code_flow_id: record.source_plan.code_flow_id,
    share_id: record.source_plan.share_id,
    science_flow_id: record.source_plan.science_flow_id,
    share_packet_hash: record.source_plan.share_packet_hash,
    evidence_level: record.source_plan.evidence_level,
    uncertainty: record.source_plan.uncertainty,
    pm_tasking_record_path: record.pm_tasking_record_path,
    created_at: record.created_at
  };
  const existing = index.entries.findIndex(item => item.tasking_id === record.tasking_id);
  if (existing >= 0) index.entries[existing] = entry;
  else index.entries.push(entry);
  index.updated_at = utcIso();
  index.entries.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handlePmTaskingRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "PM_AI") return errorResponse("PM_TASKING_ROLE_FORBIDDEN", "Only PM_AI may create PM tasking artifacts", 403);
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
    const taskingTitle = requireString(body.tasking_title, "tasking_title");
    const taskingBody = requireString(body.tasking_body, "tasking_body");
    const bodyError = validateTaskingBody(taskingBody);
    if (bodyError) return bodyError;

    const planEntry = await loadPMPlanContextEntry(env, projectName, body, repoStore);
    const planRecord = await fetchJsonIfExists<PMPlanRecord>(env, projectName, planEntry.pm_plan_record_path, repoStore);
    if (!planRecord) return errorResponse("PM_TASKING_PLAN_RECORD_NOT_FOUND", `No PM plan record found for ${planEntry.plan_id}`, 404);
    if (planRecord.plan_id !== planEntry.plan_id || planRecord.pm_plan_record_path !== planEntry.pm_plan_record_path) {
      return errorResponse("PM_TASKING_PLAN_CONTEXT_MISMATCH", "PM plan record does not match generated PM plan context", 409);
    }

    const planError = validatePlanRecord(planRecord);
    if (planError) return planError;

    const codeFlowManifest = await fetchJsonIfExists<FlowManifest>(env, projectName, flowManifestPath(planRecord.source_specification.code_flow_id), repoStore);
    const codeFlowError = validateCodeFlowManifest(codeFlowManifest, planRecord);
    if (codeFlowError) return codeFlowError;

    const taskingId = buildTaskingId(planRecord.plan_id, idempotencyKey);
    const payloadHash = await sha256Hex(JSON.stringify({
      project: projectName,
      idempotency_key: idempotencyKey,
      plan_id: planRecord.plan_id,
      pm_plan_record_path: planRecord.pm_plan_record_path,
      plan_payload_hash: planRecord.submitted_payload_hash,
      share_packet_hash: planRecord.source_specification.share_packet_hash,
      tasking_title: taskingTitle,
      tasking_body: taskingBody
    }));

    const recordPath = pmTaskingRecordPath(taskingId);
    const existingRecord = await fetchJsonIfExists<PMTaskingRecord>(env, projectName, recordPath, repoStore);
    if (existingRecord && existingRecord.schema_version === "pm_tasking_context.v0.1") {
      if (existingRecord.submitted_payload_hash !== payloadHash) {
        return errorResponse("PM_TASKING_IDEMPOTENCY_CONFLICT", "Existing PM tasking idempotency record exists but submitted payload hash does not match", 409);
      }
      return jsonResponse({ ok: true, idempotent_replay: true, tasking: existingRecord, required_status_labels: requiredStatusLabels() }, 200);
    }

    const taskingArtifact = await writeCodeFlowArtifact(
      request,
      env,
      planRecord.source_specification.code_flow_id,
      projectName,
      "pm_tasking",
      taskingTitle,
      buildTaskingMarkdown(planRecord, taskingId, taskingTitle, taskingBody),
      repoStore
    );
    if (taskingArtifact instanceof Response) return taskingArtifact;

    const createdAt = utcIso();
    const record: PMTaskingRecord = {
      schema_version: "pm_tasking_context.v0.1",
      official_artifact: true,
      project: projectName,
      tasking_id: taskingId,
      idempotency_key: idempotencyKey,
      created_at: createdAt,
      created_by_role: "PM_AI",
      source_plan: {
        plan_id: planRecord.plan_id,
        pm_plan_record_path: planRecord.pm_plan_record_path,
        code_flow_id: planRecord.source_specification.code_flow_id,
        specification_id: planRecord.source_specification.specification_id,
        intake_id: planRecord.source_specification.intake_id,
        handoff_id: planRecord.source_specification.handoff_id,
        share_id: planRecord.source_specification.share_id,
        science_flow_id: planRecord.source_specification.science_flow_id,
        share_packet_hash: planRecord.source_specification.share_packet_hash,
        submitted_share_payload_hash: planRecord.source_specification.submitted_share_payload_hash,
        handoff_payload_hash: planRecord.source_specification.handoff_payload_hash,
        intake_payload_hash: planRecord.source_specification.intake_payload_hash,
        specification_payload_hash: planRecord.source_specification.specification_payload_hash,
        plan_payload_hash: planRecord.submitted_payload_hash,
        evidence_level: planRecord.source_specification.evidence_level,
        uncertainty: planRecord.source_specification.uncertainty,
        source_artifacts: planRecord.source_specification.source_artifacts,
        resolved_source_artifacts: planRecord.source_specification.resolved_source_artifacts,
        allowed_claims: planRecord.source_specification.allowed_claims,
        forbidden_claims: planRecord.source_specification.forbidden_claims
      },
      output_artifacts: { pm_tasking: taskingArtifact },
      submitted_payload_hash: payloadHash,
      pm_tasking_record_path: recordPath,
      generated_pm_tasking_context_path: pmTaskingContextIndexPath(),
      required_status_labels: requiredStatusLabels()
    };

    const index = await loadTaskingIndex(env, projectName, repoStore);
    upsertTaskingIndex(index, record);
    const indexWrite = await writeJson(env, projectName, pmTaskingContextIndexPath(), index, `Update PM tasking context ${taskingId}`, repoStore);
    record.generated_pm_tasking_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, projectName, recordPath, record, `Write PM tasking record ${taskingId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project: projectName, tasking: { ...record, pm_tasking_record_sha: recordWrite.sha }, required_status_labels: requiredStatusLabels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("No PM plan context entry")) return errorResponse("PM_TASKING_PLAN_CONTEXT_NOT_FOUND", message, 404);
    if (message.includes("PM plan context index is missing")) return errorResponse("PM_TASKING_PLAN_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
