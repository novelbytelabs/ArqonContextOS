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

interface PMIntakeRecord {
  schema_version: "code_monkeys_pm_intake.v0.1";
  official_artifact: true;
  project: string;
  intake_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "PM_AI";
  source_handoff: {
    handoff_id: string;
    handoff_record_path: string;
    code_flow_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    submitted_share_payload_hash?: string;
    handoff_payload_hash: string;
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  output_artifacts: {
    pm_dossier: FlowArtifactSummary;
    pm_gate_definition: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  pm_intake_record_path: string;
  generated_pm_intake_context_path: string;
  generated_pm_intake_context_sha?: string;
  required_status_labels: string[];
}

interface PMIntakeContextIndex {
  schema_version: "pm_intake_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
    intake_id: string;
    handoff_id: string;
    code_flow_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    evidence_level: string;
    uncertainty: string;
    pm_intake_record_path: string;
    created_at: string;
  }>;
}

interface PMSpecifyRecord {
  schema_version: "pm_specification_context.v0.1";
  official_artifact: true;
  project: string;
  specification_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "PM_AI";
  source_intake: {
    intake_id: string;
    pm_intake_record_path: string;
    code_flow_id: string;
    handoff_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    submitted_share_payload_hash?: string;
    handoff_payload_hash: string;
    intake_payload_hash: string;
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  output_artifacts: {
    specification: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  pm_specification_record_path: string;
  generated_pm_specification_context_path: string;
  generated_pm_specification_context_sha?: string;
  required_status_labels: string[];
}

interface PMSpecificationContextIndex {
  schema_version: "pm_specification_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
    specification_id: string;
    intake_id: string;
    handoff_id: string;
    code_flow_id: string;
    share_id: string;
    science_flow_id: string;
    share_packet_hash: string;
    evidence_level: string;
    uncertainty: string;
    pm_specification_record_path: string;
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

function pmIntakeContextIndexPath(): string {
  return "governance/context/generated_pm_intake_context.json";
}

function pmSpecificationContextIndexPath(): string {
  return "governance/context/generated_pm_specification_context.json";
}

function pmSpecificationRecordPath(specificationId: string): string {
  return `governance/context/pm_specification/${specificationId}.json`;
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

async function loadPMIntakeContextEntry(env: Env, projectName: string, body: Record<string, unknown>, store: RepoStore): Promise<{ intake_id: string; pm_intake_record_path: string }> {
  const intakeId = optionalString(body.intake_id);
  const intakeRecordPath = optionalString(body.pm_intake_record_path);
  if (!intakeId && !intakeRecordPath) throw new Error("Invalid or missing field: intake_id or pm_intake_record_path");

  const index = await fetchJsonIfExists<PMIntakeContextIndex>(env, projectName, pmIntakeContextIndexPath(), store);
  if (!index || index.schema_version !== "pm_intake_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("PM intake context index is missing or invalid");
  }

  const entry = index.entries.find(item =>
    (intakeId && item.intake_id === intakeId) ||
    (intakeRecordPath && item.pm_intake_record_path === intakeRecordPath)
  );
  if (!entry) throw new Error(`No PM intake context entry found for ${intakeId || intakeRecordPath}`);
  return { intake_id: entry.intake_id, pm_intake_record_path: entry.pm_intake_record_path };
}

function artifactById(manifest: FlowManifest, artifactId: string): FlowArtifactSummary | null {
  return manifest.artifacts.find(artifact => artifact.artifact_id === artifactId) || null;
}

function validateExpectedIntakeArtifact(manifest: FlowManifest, expected: FlowArtifactSummary, expectedType: "pm_dossier" | "pm_gate_definition"): Response | null {
  const actual = artifactById(manifest, expected.artifact_id);
  if (!actual) return errorResponse("PM_SPECIFY_INTAKE_ARTIFACTS_NOT_ON_CODE_FLOW", `Code flow does not contain required intake artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== expectedType || actual.role !== "PM_AI") {
    return errorResponse("PM_SPECIFY_INTAKE_ARTIFACT_TYPE_MISMATCH", `Expected ${expectedType} by PM_AI for ${expected.artifact_id}`, 409);
  }
  if (actual.source_path !== expected.source_path) {
    return errorResponse("PM_SPECIFY_INTAKE_ARTIFACT_SOURCE_MISMATCH", `Intake artifact source path mismatch for ${expected.artifact_id}`, 409);
  }
  return null;
}

function validateIntakeRecord(record: PMIntakeRecord): Response | null {
  if (record.schema_version !== "code_monkeys_pm_intake.v0.1") return errorResponse("PM_SPECIFY_INVALID_INTAKE_RECORD", "PM intake record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "PM_AI") return errorResponse("PM_SPECIFY_INVALID_INTAKE_AUTHORITY", "PM intake record is not official PM intake", 409);
  if (!record.source_handoff || !record.output_artifacts) return errorResponse("PM_SPECIFY_INTAKE_INCOMPLETE", "PM intake record is missing source handoff or output artifacts", 409);
  if (!record.source_handoff.share_packet_hash || !record.source_handoff.uncertainty) return errorResponse("PM_SPECIFY_SOURCE_BOUNDARY_REQUIRED", "PM intake record must preserve share hash and uncertainty", 409);
  if (!record.source_handoff.forbidden_claims || record.source_handoff.forbidden_claims.length === 0) return errorResponse("PM_SPECIFY_FORBIDDEN_CLAIMS_REQUIRED", "PM intake record must preserve forbidden claims", 409);
  if (!record.source_handoff.resolved_source_artifacts || record.source_handoff.resolved_source_artifacts.length === 0) return errorResponse("PM_SPECIFY_RESOLVED_SOURCES_REQUIRED", "PM intake record must preserve resolved source metadata", 409);
  if (!record.output_artifacts.pm_dossier || !record.output_artifacts.pm_gate_definition) return errorResponse("PM_SPECIFY_INTAKE_ARTIFACTS_REQUIRED", "PM intake record must include pm_dossier and pm_gate_definition", 409);
  if (!hasRequiredLabels(record.required_status_labels)) return errorResponse("PM_SPECIFY_STATUS_LABELS_REQUIRED", "PM intake record is missing required diagnostic status labels", 409);
  return null;
}

function validateCodeFlowManifest(manifest: FlowManifest | null, record: PMIntakeRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("PM_SPECIFY_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_handoff.code_flow_id) return errorResponse("PM_SPECIFY_CODE_FLOW_REQUIRED", "PM specify target must be a code_flow", 409);

  const dossierError = validateExpectedIntakeArtifact(manifest, record.output_artifacts.pm_dossier, "pm_dossier");
  if (dossierError) return dossierError;

  const gateError = validateExpectedIntakeArtifact(manifest, record.output_artifacts.pm_gate_definition, "pm_gate_definition");
  if (gateError) return gateError;

  return null;
}

function validateSpecificationBody(body: string): Response | null {
  const lower = body.toLowerCase();
  const forbiddenMarkers = [
    ["sealed-test", "certified"].join(" "),
    ["production", "ready"].join(" "),
    ["promotable", "status"].join(" ")
  ];
  const found = forbiddenMarkers.find(marker => lower.includes(marker));
  if (found) return errorResponse("PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED", `Specification body contains forbidden promotion language: ${found}`, 409);
  return null;
}

function buildSpecificationId(intakeId: string, idempotencyKey: string): string {
  return `${safeFilePart(intakeId, 90)}-${safeFilePart(idempotencyKey, 36)}`;
}

function buildSpecificationMarkdown(record: PMIntakeRecord, specificationId: string, title: string, specificationBody: string): string {
  return `# ${title}

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Specification Boundary

This is a PM specification candidate derived from audited PM intake. It is not a plan, not a task packet, not implementation authorization, not certification, and not a production-readiness claim.

## Source Chain

- specification_id: ${specificationId}
- intake_id: ${record.intake_id}
- handoff_id: ${record.source_handoff.handoff_id}
- code_flow_id: ${record.source_handoff.code_flow_id}
- source_share_id: ${record.source_handoff.share_id}
- source_science_flow_id: ${record.source_handoff.science_flow_id}
- share_packet_hash: ${record.source_handoff.share_packet_hash}
- submitted_share_payload_hash: ${record.source_handoff.submitted_share_payload_hash || record.source_handoff.share_packet_hash}
- handoff_payload_hash: ${record.source_handoff.handoff_payload_hash}
- intake_payload_hash: ${record.submitted_payload_hash}
- evidence_level: ${record.source_handoff.evidence_level}
- uncertainty: ${record.source_handoff.uncertainty}

## Specification Body

${specificationBody}

## Hard Forbidden Claims

${record.source_handoff.forbidden_claims.map(claim => `- ${claim}`).join("\n")}

## Source Artifacts

${record.source_handoff.resolved_source_artifacts.map(item => `- ${item.artifact_type}: ${item.artifact_id} (${item.source_path})`).join("\n")}

## Non-Laundering Rule

This specification remains downstream of diagnostic evidence. Plan, task, Coder handoff, Helper execution, and promotion require later gated stages and Human approval.
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
  if (!artifact) return errorResponse("PM_SPECIFY_ARTIFACT_WRITE_FAILED", `Artifact write did not return summary for ${artifactType}`, 500);
  return artifact;
}

async function loadSpecificationIndex(env: Env, projectName: string, store: RepoStore): Promise<PMSpecificationContextIndex> {
  const existing = await fetchJsonIfExists<PMSpecificationContextIndex>(env, projectName, pmSpecificationContextIndexPath(), store);
  if (existing && existing.schema_version === "pm_specification_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return { schema_version: "pm_specification_context_index.v0.1", project: projectName, updated_at: utcIso(), entries: [] };
}

function upsertSpecificationIndex(index: PMSpecificationContextIndex, record: PMSpecifyRecord): void {
  const entry = {
    specification_id: record.specification_id,
    intake_id: record.source_intake.intake_id,
    handoff_id: record.source_intake.handoff_id,
    code_flow_id: record.source_intake.code_flow_id,
    share_id: record.source_intake.share_id,
    science_flow_id: record.source_intake.science_flow_id,
    share_packet_hash: record.source_intake.share_packet_hash,
    evidence_level: record.source_intake.evidence_level,
    uncertainty: record.source_intake.uncertainty,
    pm_specification_record_path: record.pm_specification_record_path,
    created_at: record.created_at
  };
  const existing = index.entries.findIndex(item => item.specification_id === record.specification_id);
  if (existing >= 0) index.entries[existing] = entry;
  else index.entries.push(entry);
  index.updated_at = utcIso();
  index.entries.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handlePmSpecifyRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "PM_AI") return errorResponse("PM_SPECIFY_ROLE_FORBIDDEN", "Only PM_AI may create PM specification artifacts", 403);
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
    const specificationTitle = requireString(body.specification_title, "specification_title");
    const specificationBody = requireString(body.specification_body, "specification_body");
    const bodyError = validateSpecificationBody(specificationBody);
    if (bodyError) return bodyError;

    const intakeEntry = await loadPMIntakeContextEntry(env, projectName, body, repoStore);
    const intakeRecord = await fetchJsonIfExists<PMIntakeRecord>(env, projectName, intakeEntry.pm_intake_record_path, repoStore);
    if (!intakeRecord) return errorResponse("PM_SPECIFY_INTAKE_RECORD_NOT_FOUND", `No PM intake record found for ${intakeEntry.intake_id}`, 404);
    if (intakeRecord.intake_id !== intakeEntry.intake_id || intakeRecord.pm_intake_record_path !== intakeEntry.pm_intake_record_path) {
      return errorResponse("PM_SPECIFY_INTAKE_CONTEXT_MISMATCH", "PM intake record does not match generated PM intake context", 409);
    }

    const intakeError = validateIntakeRecord(intakeRecord);
    if (intakeError) return intakeError;

    const codeFlowManifest = await fetchJsonIfExists<FlowManifest>(env, projectName, flowManifestPath(intakeRecord.source_handoff.code_flow_id), repoStore);
    const codeFlowError = validateCodeFlowManifest(codeFlowManifest, intakeRecord);
    if (codeFlowError) return codeFlowError;

    const specificationId = buildSpecificationId(intakeRecord.intake_id, idempotencyKey);
    const payloadHash = await sha256Hex(JSON.stringify({
      project: projectName,
      idempotency_key: idempotencyKey,
      intake_id: intakeRecord.intake_id,
      pm_intake_record_path: intakeRecord.pm_intake_record_path,
      intake_payload_hash: intakeRecord.submitted_payload_hash,
      share_packet_hash: intakeRecord.source_handoff.share_packet_hash,
      specification_title: specificationTitle,
      specification_body: specificationBody
    }));

    const recordPath = pmSpecificationRecordPath(specificationId);
    const existingRecord = await fetchJsonIfExists<PMSpecifyRecord>(env, projectName, recordPath, repoStore);
    if (existingRecord && existingRecord.schema_version === "pm_specification_context.v0.1") {
      if (existingRecord.submitted_payload_hash !== payloadHash) {
        return errorResponse("PM_SPECIFY_IDEMPOTENCY_CONFLICT", "Existing PM specify idempotency record exists but submitted payload hash does not match", 409);
      }
      return jsonResponse({ ok: true, idempotent_replay: true, specification: existingRecord, required_status_labels: requiredStatusLabels() }, 200);
    }

    const specificationArtifact = await writeCodeFlowArtifact(
      request,
      env,
      intakeRecord.source_handoff.code_flow_id,
      projectName,
      "specification",
      specificationTitle,
      buildSpecificationMarkdown(intakeRecord, specificationId, specificationTitle, specificationBody),
      repoStore
    );
    if (specificationArtifact instanceof Response) return specificationArtifact;

    const createdAt = utcIso();
    const record: PMSpecifyRecord = {
      schema_version: "pm_specification_context.v0.1",
      official_artifact: true,
      project: projectName,
      specification_id: specificationId,
      idempotency_key: idempotencyKey,
      created_at: createdAt,
      created_by_role: "PM_AI",
      source_intake: {
        intake_id: intakeRecord.intake_id,
        pm_intake_record_path: intakeRecord.pm_intake_record_path,
        code_flow_id: intakeRecord.source_handoff.code_flow_id,
        handoff_id: intakeRecord.source_handoff.handoff_id,
        share_id: intakeRecord.source_handoff.share_id,
        science_flow_id: intakeRecord.source_handoff.science_flow_id,
        share_packet_hash: intakeRecord.source_handoff.share_packet_hash,
        submitted_share_payload_hash: intakeRecord.source_handoff.submitted_share_payload_hash,
        handoff_payload_hash: intakeRecord.source_handoff.handoff_payload_hash,
        intake_payload_hash: intakeRecord.submitted_payload_hash,
        evidence_level: intakeRecord.source_handoff.evidence_level,
        uncertainty: intakeRecord.source_handoff.uncertainty,
        source_artifacts: intakeRecord.source_handoff.source_artifacts,
        resolved_source_artifacts: intakeRecord.source_handoff.resolved_source_artifacts,
        allowed_claims: intakeRecord.source_handoff.allowed_claims,
        forbidden_claims: intakeRecord.source_handoff.forbidden_claims
      },
      output_artifacts: { specification: specificationArtifact },
      submitted_payload_hash: payloadHash,
      pm_specification_record_path: recordPath,
      generated_pm_specification_context_path: pmSpecificationContextIndexPath(),
      required_status_labels: requiredStatusLabels()
    };

    const index = await loadSpecificationIndex(env, projectName, repoStore);
    upsertSpecificationIndex(index, record);
    const indexWrite = await writeJson(env, projectName, pmSpecificationContextIndexPath(), index, `Update PM specification context ${specificationId}`, repoStore);
    record.generated_pm_specification_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, projectName, recordPath, record, `Write PM specification record ${specificationId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project: projectName, specification: { ...record, pm_specification_record_sha: recordWrite.sha }, required_status_labels: requiredStatusLabels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("No PM intake context entry")) return errorResponse("PM_SPECIFY_INTAKE_CONTEXT_NOT_FOUND", message, 404);
    if (message.includes("PM intake context index is missing")) return errorResponse("PM_SPECIFY_INTAKE_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
