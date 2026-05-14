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

interface HandoffRecord {
  schema_version: "science_to_code_handoff.v0.1";
  official_artifact: true;
  project: string;
  handoff_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "PM_AI";
  source_share: {
    share_id: string;
    science_flow_id: string;
    share_packet_path: string;
    share_packet_hash: string;
    submitted_payload_hash?: string;
    evidence_level: string;
    uncertainty: string;
    source_artifacts: string[];
    resolved_source_artifacts: ResolvedShareSourceArtifact[];
    allowed_claims: string[];
    forbidden_claims: string[];
  };
  code_flow: {
    flow_id: string;
    name: string;
    created_by_handoff: boolean;
  };
  output_artifacts: {
    handoff_intake: FlowArtifactSummary;
    dossier_seed: FlowArtifactSummary;
  };
  submitted_payload_hash: string;
  handoff_record_path: string;
  generated_handoff_context_path: string;
  generated_handoff_context_sha?: string;
  required_status_labels: string[];
}

interface HandoffContextIndex {
  schema_version: "pm_handoff_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: Array<{
    handoff_id: string;
    share_id: string;
    science_flow_id: string;
    code_flow_id: string;
    share_packet_hash: string;
    evidence_level: string;
    uncertainty: string;
    handoff_record_path: string;
    created_at: string;
  }>;
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

function pmHandoffContextIndexPath(): string {
  return "governance/context/generated_pm_handoff_context.json";
}

function pmIntakeContextIndexPath(): string {
  return "governance/context/generated_pm_intake_context.json";
}

function pmIntakeRecordPath(intakeId: string): string {
  return `governance/context/pm_intake/${intakeId}.json`;
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

async function loadPMHandoffContextEntry(env: Env, projectName: string, body: Record<string, unknown>, store: RepoStore): Promise<{ handoff_id: string; handoff_record_path: string }> {
  const handoffId = optionalString(body.handoff_id);
  const handoffRecordPath = optionalString(body.handoff_record_path);
  if (!handoffId && !handoffRecordPath) throw new Error("Invalid or missing field: handoff_id or handoff_record_path");

  const index = await fetchJsonIfExists<HandoffContextIndex>(env, projectName, pmHandoffContextIndexPath(), store);
  if (!index || index.schema_version !== "pm_handoff_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("PM handoff context index is missing or invalid");
  }

  const entry = index.entries.find(item =>
    (handoffId && item.handoff_id === handoffId) ||
    (handoffRecordPath && item.handoff_record_path === handoffRecordPath)
  );
  if (!entry) throw new Error(`No PM handoff context entry found for ${handoffId || handoffRecordPath}`);
  return { handoff_id: entry.handoff_id, handoff_record_path: entry.handoff_record_path };
}

function validateHandoffRecord(record: HandoffRecord): Response | null {
  if (record.schema_version !== "science_to_code_handoff.v0.1") return errorResponse("PM_INTAKE_INVALID_HANDOFF_RECORD", "Handoff record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "PM_AI") return errorResponse("PM_INTAKE_INVALID_HANDOFF_AUTHORITY", "Handoff record is not an official PM handoff", 409);
  if (!record.source_share || !record.code_flow || !record.output_artifacts) return errorResponse("PM_INTAKE_HANDOFF_INCOMPLETE", "Handoff record is missing source share, code flow, or output artifacts", 409);
  if (!record.source_share.share_packet_hash || !record.source_share.uncertainty) return errorResponse("PM_INTAKE_HANDOFF_SOURCE_BOUNDARY_REQUIRED", "Handoff record must preserve share hash and uncertainty", 409);
  if (!record.source_share.forbidden_claims || record.source_share.forbidden_claims.length === 0) return errorResponse("PM_INTAKE_FORBIDDEN_CLAIMS_REQUIRED", "Handoff record must preserve forbidden claims", 409);
  if (!record.source_share.resolved_source_artifacts || record.source_share.resolved_source_artifacts.length === 0) return errorResponse("PM_INTAKE_RESOLVED_SOURCES_REQUIRED", "Handoff record must preserve resolved source metadata", 409);
  if (!record.output_artifacts.handoff_intake || !record.output_artifacts.dossier_seed) return errorResponse("PM_INTAKE_HANDOFF_ARTIFACTS_REQUIRED", "Handoff record must include handoff_intake and dossier_seed", 409);
  if (!hasRequiredLabels(record.required_status_labels)) return errorResponse("PM_INTAKE_STATUS_LABELS_REQUIRED", "Handoff record is missing required diagnostic status labels", 409);
  return null;
}

function validateCodeFlowManifest(manifest: FlowManifest | null, record: HandoffRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("PM_INTAKE_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.code_flow.flow_id) return errorResponse("PM_INTAKE_CODE_FLOW_REQUIRED", "PM intake target must be a code_flow", 409);
  const artifactIds = new Set(manifest.artifacts.map(artifact => artifact.artifact_id));
  if (!artifactIds.has(record.output_artifacts.handoff_intake.artifact_id) || !artifactIds.has(record.output_artifacts.dossier_seed.artifact_id)) {
    return errorResponse("PM_INTAKE_HANDOFF_ARTIFACTS_NOT_ON_CODE_FLOW", "Code flow does not contain the handoff intake and dossier seed artifacts", 409);
  }
  return null;
}

function buildIntakeId(handoffId: string, idempotencyKey: string): string {
  return `${safeFilePart(handoffId, 90)}-${safeFilePart(idempotencyKey, 36)}`;
}

function buildPMDossierMarkdown(record: HandoffRecord, intakeId: string, pmNotes: string): string {
  return `# Code Monkeys PM Dossier

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Intake Boundary

This dossier is a PM intake artifact produced from a previously audited Science to Code handoff. It is not a specification, not a plan, not a task packet, not certification, and not a production-readiness claim.

## Source Chain

- intake_id: ${intakeId}
- handoff_id: ${record.handoff_id}
- code_flow_id: ${record.code_flow.flow_id}
- source_share_id: ${record.source_share.share_id}
- source_science_flow_id: ${record.source_share.science_flow_id}
- share_packet_hash: ${record.source_share.share_packet_hash}
- submitted_share_payload_hash: ${record.source_share.submitted_payload_hash || record.source_share.share_packet_hash}
- handoff_payload_hash: ${record.submitted_payload_hash}
- evidence_level: ${record.source_share.evidence_level}
- uncertainty: ${record.source_share.uncertainty}

## Candidate Product Context

${record.source_share.allowed_claims.map(claim => `- ${claim}`).join("\n")}

## Hard Forbidden Claims

${record.source_share.forbidden_claims.map(claim => `- ${claim}`).join("\n")}

## Source Artifacts

${record.source_share.resolved_source_artifacts.map(item => `- ${item.artifact_type}: ${item.artifact_id} (${item.source_path})`).join("\n")}

## PM Notes

${pmNotes || "No additional PM notes supplied."}

## Non-Laundering Rule

This dossier may inform later specification work, but it does not itself authorize implementation, tasks, promotion, certification, or production deployment.
`;
}

function buildPMGateDefinitionMarkdown(record: HandoffRecord, intakeId: string): string {
  return `# PM Intake Gate Definition

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Define the minimum gates that must remain true before this PM intake may become a specification, plan, or Coder task packet.

## Source Chain Required

- intake_id: ${intakeId}
- handoff_id: ${record.handoff_id}
- code_flow_id: ${record.code_flow.flow_id}
- source_share_id: ${record.source_share.share_id}
- share_packet_hash: ${record.source_share.share_packet_hash}

## Required Gates

1. Preserve source share id, share hash, uncertainty, source references, and forbidden claims.
2. Keep all downstream artifacts labeled development diagnostic only.
3. Do not treat Science evidence as a certified product requirement.
4. Do not issue Coder tasks until a later PM specification/plan stage explicitly defines scope and Human approval gates.
5. Do not remove forbidden claims without Human review and audit evidence.
6. Do not claim sealed-test certification or production readiness.

## Current Advancement Status

PM intake only. Specification, plan, tasks, implementation, and promotion remain out of scope.
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
  if (!artifact) return errorResponse("PM_INTAKE_ARTIFACT_WRITE_FAILED", `Artifact write did not return summary for ${artifactType}`, 500);
  return artifact;
}

async function loadIntakeIndex(env: Env, projectName: string, store: RepoStore): Promise<PMIntakeContextIndex> {
  const existing = await fetchJsonIfExists<PMIntakeContextIndex>(env, projectName, pmIntakeContextIndexPath(), store);
  if (existing && existing.schema_version === "pm_intake_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return { schema_version: "pm_intake_context_index.v0.1", project: projectName, updated_at: utcIso(), entries: [] };
}

function upsertIntakeIndex(index: PMIntakeContextIndex, record: PMIntakeRecord): void {
  const entry = {
    intake_id: record.intake_id,
    handoff_id: record.source_handoff.handoff_id,
    code_flow_id: record.source_handoff.code_flow_id,
    share_id: record.source_handoff.share_id,
    science_flow_id: record.source_handoff.science_flow_id,
    share_packet_hash: record.source_handoff.share_packet_hash,
    evidence_level: record.source_handoff.evidence_level,
    uncertainty: record.source_handoff.uncertainty,
    pm_intake_record_path: record.pm_intake_record_path,
    created_at: record.created_at
  };
  const existing = index.entries.findIndex(item => item.intake_id === record.intake_id);
  if (existing >= 0) index.entries[existing] = entry;
  else index.entries.push(entry);
  index.updated_at = utcIso();
  index.entries.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handlePmIntakeRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "PM_AI") return errorResponse("PM_INTAKE_ROLE_FORBIDDEN", "Only PM_AI may create Code Monkeys PM intake", 403);
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

    const handoffEntry = await loadPMHandoffContextEntry(env, projectName, body, repoStore);
    const handoffRecord = await fetchJsonIfExists<HandoffRecord>(env, projectName, handoffEntry.handoff_record_path, repoStore);
    if (!handoffRecord) return errorResponse("PM_INTAKE_HANDOFF_RECORD_NOT_FOUND", `No handoff record found for ${handoffEntry.handoff_id}`, 404);
    if (handoffRecord.handoff_id !== handoffEntry.handoff_id || handoffRecord.handoff_record_path !== handoffEntry.handoff_record_path) {
      return errorResponse("PM_INTAKE_HANDOFF_CONTEXT_MISMATCH", "Handoff record does not match generated PM handoff context", 409);
    }

    const handoffError = validateHandoffRecord(handoffRecord);
    if (handoffError) return handoffError;

    const codeFlowManifest = await fetchJsonIfExists<FlowManifest>(env, projectName, flowManifestPath(handoffRecord.code_flow.flow_id), repoStore);
    const codeFlowError = validateCodeFlowManifest(codeFlowManifest, handoffRecord);
    if (codeFlowError) return codeFlowError;

    const pmNotes = optionalString(body.pm_notes);
    const intakeId = buildIntakeId(handoffRecord.handoff_id, idempotencyKey);
    const payloadHash = await sha256Hex(JSON.stringify({
      project: projectName,
      idempotency_key: idempotencyKey,
      handoff_id: handoffRecord.handoff_id,
      handoff_record_path: handoffRecord.handoff_record_path,
      handoff_payload_hash: handoffRecord.submitted_payload_hash,
      share_packet_hash: handoffRecord.source_share.share_packet_hash,
      pm_notes: pmNotes
    }));

    const recordPath = pmIntakeRecordPath(intakeId);
    const existingRecord = await fetchJsonIfExists<PMIntakeRecord>(env, projectName, recordPath, repoStore);
    if (existingRecord && existingRecord.schema_version === "code_monkeys_pm_intake.v0.1") {
      if (existingRecord.submitted_payload_hash !== payloadHash) {
        return errorResponse("PM_INTAKE_IDEMPOTENCY_CONFLICT", "Existing PM intake idempotency record exists but submitted payload hash does not match", 409);
      }
      return jsonResponse({ ok: true, idempotent_replay: true, intake: existingRecord, required_status_labels: requiredStatusLabels() }, 200);
    }

    const pmDossier = await writeCodeFlowArtifact(request, env, handoffRecord.code_flow.flow_id, projectName, "pm_dossier", "Code Monkeys PM Dossier", buildPMDossierMarkdown(handoffRecord, intakeId, pmNotes), repoStore);
    if (pmDossier instanceof Response) return pmDossier;

    const pmGateDefinition = await writeCodeFlowArtifact(request, env, handoffRecord.code_flow.flow_id, projectName, "pm_gate_definition", "PM Intake Gate Definition", buildPMGateDefinitionMarkdown(handoffRecord, intakeId), repoStore);
    if (pmGateDefinition instanceof Response) return pmGateDefinition;

    const createdAt = utcIso();
    const record: PMIntakeRecord = {
      schema_version: "code_monkeys_pm_intake.v0.1",
      official_artifact: true,
      project: projectName,
      intake_id: intakeId,
      idempotency_key: idempotencyKey,
      created_at: createdAt,
      created_by_role: "PM_AI",
      source_handoff: {
        handoff_id: handoffRecord.handoff_id,
        handoff_record_path: handoffRecord.handoff_record_path,
        code_flow_id: handoffRecord.code_flow.flow_id,
        share_id: handoffRecord.source_share.share_id,
        science_flow_id: handoffRecord.source_share.science_flow_id,
        share_packet_hash: handoffRecord.source_share.share_packet_hash,
        submitted_share_payload_hash: handoffRecord.source_share.submitted_payload_hash,
        handoff_payload_hash: handoffRecord.submitted_payload_hash,
        evidence_level: handoffRecord.source_share.evidence_level,
        uncertainty: handoffRecord.source_share.uncertainty,
        source_artifacts: handoffRecord.source_share.source_artifacts,
        resolved_source_artifacts: handoffRecord.source_share.resolved_source_artifacts,
        allowed_claims: handoffRecord.source_share.allowed_claims,
        forbidden_claims: handoffRecord.source_share.forbidden_claims
      },
      output_artifacts: { pm_dossier: pmDossier, pm_gate_definition: pmGateDefinition },
      submitted_payload_hash: payloadHash,
      pm_intake_record_path: recordPath,
      generated_pm_intake_context_path: pmIntakeContextIndexPath(),
      required_status_labels: requiredStatusLabels()
    };

    const index = await loadIntakeIndex(env, projectName, repoStore);
    upsertIntakeIndex(index, record);
    const indexWrite = await writeJson(env, projectName, pmIntakeContextIndexPath(), index, `Update PM intake context ${intakeId}`, repoStore);
    record.generated_pm_intake_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, projectName, recordPath, record, `Write PM intake record ${intakeId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project: projectName, intake: { ...record, pm_intake_record_sha: recordWrite.sha }, required_status_labels: requiredStatusLabels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("No PM handoff context entry")) return errorResponse("PM_INTAKE_HANDOFF_CONTEXT_NOT_FOUND", message, 404);
    if (message.includes("PM handoff context index is missing")) return errorResponse("PM_INTAKE_HANDOFF_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
