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

interface ScienceShareRecord {
  schema_version: "science_share_packet.v0.1";
  official_artifact: true;
  project: string;
  flow_id: string;
  share_id: string;
  idempotency_key: string;
  created_at: string;
  created_by_role: "HUMAN";
  human_authority: "server_authenticated_human";
  evidence_level: string;
  uncertainty: string;
  source_artifacts: string[];
  resolved_source_artifacts: ResolvedShareSourceArtifact[];
  allowed_claims: string[];
  forbidden_claims: string[];
  share_packet_hash: string;
  submitted_payload_hash?: string;
  share_packet_path: string;
  share_packet_sha?: string;
  pm_message_path: string;
  pm_message_sha?: string;
  pm_context_path: string;
  pm_context_sha?: string;
  pm_context_index_path: string;
  pm_context_index_sha?: string;
  outbox_path: string;
  outbox_sha?: string;
  required_status_labels: string[];
}

interface PMShareContextEntry {
  share_id: string;
  flow_id: string;
  project: string;
  evidence_level: string;
  uncertainty: string;
  source_artifacts: string[];
  resolved_source_artifacts?: ResolvedShareSourceArtifact[];
  allowed_claims: string[];
  forbidden_claims: string[];
  share_packet_hash: string;
  share_packet_path: string;
  pm_context_path: string;
  created_at: string;
}

interface PMShareContextIndex {
  schema_version: "pm_share_context_index.v0.1";
  project: string;
  updated_at: string;
  entries: PMShareContextEntry[];
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

const FINDING_ARTIFACTS = new Set(["finding_record", "negative_finding_record", "inconclusive_finding_record", "finding_boundary_record"]);

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

function pmShareContextIndexPath(): string {
  return "governance/context/generated_pm_share_context.json";
}

function pmHandoffContextIndexPath(): string {
  return "governance/context/generated_pm_handoff_context.json";
}

function handoffRecordPath(handoffId: string): string {
  return `governance/context/pm_handoff/${handoffId}.json`;
}

function scienceShareRecordPath(flowId: string, shareId: string): string {
  return `governance/flows/${flowId}/share/${shareId}/share_record.json`;
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

async function loadPMShareContextEntry(env: Env, projectName: string, body: Record<string, unknown>, store: RepoStore): Promise<PMShareContextEntry> {
  const shareId = optionalString(body.share_id);
  const sharePacketPath = optionalString(body.share_packet_path);
  if (!shareId && !sharePacketPath) {
    throw new Error("Invalid or missing field: share_id or share_packet_path");
  }

  const index = await fetchJsonIfExists<PMShareContextIndex>(env, projectName, pmShareContextIndexPath(), store);
  if (!index || index.schema_version !== "pm_share_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("PM share context index is missing or invalid");
  }

  const entry = index.entries.find(item =>
    (shareId && item.share_id === shareId) ||
    (sharePacketPath && item.share_packet_path === sharePacketPath)
  );
  if (!entry) throw new Error(`No PM share context entry found for ${shareId || sharePacketPath}`);
  return entry;
}

function hasRequiredLabels(labels: string[] | undefined): boolean {
  return requiredStatusLabels().every(label => Array.isArray(labels) && labels.includes(label));
}

function validateShareRecord(record: ScienceShareRecord, entry: PMShareContextEntry): Response | null {
  if (record.schema_version !== "science_share_packet.v0.1") {
    return errorResponse("PM_HANDOFF_INVALID_SHARE_RECORD", "Share record schema is invalid", 409);
  }
  if (record.official_artifact !== true || record.created_by_role !== "HUMAN" || record.human_authority !== "server_authenticated_human") {
    return errorResponse("PM_HANDOFF_INVALID_SHARE_AUTHORITY", "Share record is not a Human-approved official share packet", 409);
  }
  if (record.share_id !== entry.share_id || record.flow_id !== entry.flow_id || record.project !== entry.project) {
    return errorResponse("PM_HANDOFF_SHARE_CONTEXT_MISMATCH", "Share record does not match PM share context entry", 409);
  }
  if (record.share_packet_hash !== entry.share_packet_hash) {
    return errorResponse("PM_HANDOFF_SHARE_HASH_MISMATCH", "Share packet hash does not match PM share context entry", 409);
  }
  if (!hasRequiredLabels(record.required_status_labels)) {
    return errorResponse("PM_HANDOFF_STATUS_LABELS_REQUIRED", "Share record is missing required diagnostic status labels", 409);
  }
  if (!record.forbidden_claims || record.forbidden_claims.length === 0) {
    return errorResponse("PM_HANDOFF_FORBIDDEN_CLAIMS_REQUIRED", "Share record must preserve forbidden claims before PM handoff", 409);
  }
  if (!record.resolved_source_artifacts || record.resolved_source_artifacts.length === 0) {
    return errorResponse("PM_HANDOFF_RESOLVED_SOURCES_REQUIRED", "Share record must preserve resolved source artifact metadata", 409);
  }

  const types = new Set(record.resolved_source_artifacts.map(item => item.artifact_type));
  const missing: string[] = [];
  if (!types.has("audit_report")) missing.push("audit_report");
  if (!types.has("share_recommendation")) missing.push("share_recommendation");
  if (![...FINDING_ARTIFACTS].some(type => types.has(type))) missing.push("finding_record");
  if (missing.length > 0) {
    return errorResponse("PM_HANDOFF_SOURCE_BOUNDARY_REQUIRED", `Share record is missing source evidence classes: ${missing.join(", ")}`, 409);
  }

  return null;
}

function buildHandoffId(shareId: string, idempotencyKey: string): string {
  return `${safeFilePart(shareId, 80)}-${safeFilePart(idempotencyKey, 40)}`;
}

async function createCodeFlow(
  request: Request,
  env: Env,
  projectName: string,
  shareRecord: ScienceShareRecord,
  handoffId: string,
  body: Record<string, unknown>,
  store: RepoStore
): Promise<{ flow_id: string; name: string; created: boolean } | Response> {
  const explicitRef = optionalString(body.code_flow_ref);
  if (explicitRef) {
    const url = new URL(request.url);
    const loadRequest = new Request(`${url.origin}/v1/flows/${encodeURIComponent(explicitRef)}?project=${encodeURIComponent(projectName)}`, {
      method: "GET",
      headers: jsonHeaders(request)
    });
    const response = await handleFlowsRequest(loadRequest, env, explicitRef, "item", store);
    const parsed = await parseJsonResponse(response);
    if (!response.ok) return jsonResponse(parsed, response.status);
    const manifest = (parsed as { manifest?: FlowManifest }).manifest;
    if (!manifest || manifest.type !== "code_flow") {
      return errorResponse("PM_HANDOFF_CODE_FLOW_REQUIRED", "code_flow_ref must refer to a code_flow", 409);
    }
    return { flow_id: manifest.flow_id, name: manifest.name, created: false };
  }

  const flowName = optionalString(body.code_flow_name) || `code-handoff-${(await sha256Hex(handoffId)).slice(0, 16)}`;
  const flowTitle = optionalString(body.code_flow_title) || `Code flow from science share ${shareRecord.share_id}`;
  const createBody = {
    project: projectName,
    name: flowName,
    type: "code_flow",
    title: flowTitle,
    summary: `PM code handoff from Human-approved science share ${shareRecord.share_id}.`,
    initial_gate: "DRAFT"
  };

  const url = new URL(request.url);
  const createRequest = new Request(`${url.origin}/v1/flows`, {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify(createBody)
  });
  const createResponse = await handleFlowsRequest(createRequest, env, undefined, "collection", store);
  const createParsed = await parseJsonResponse(createResponse);
  if (createResponse.status === 201) {
    const created = createParsed as { flow_id: string; name: string };
    return { flow_id: created.flow_id, name: created.name, created: true };
  }
  if (createResponse.status === 409) {
    const loadRequest = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowName)}?project=${encodeURIComponent(projectName)}`, {
      method: "GET",
      headers: jsonHeaders(request)
    });
    const response = await handleFlowsRequest(loadRequest, env, flowName, "item", store);
    const parsed = await parseJsonResponse(response);
    if (response.ok) {
      const manifest = (parsed as { manifest?: FlowManifest }).manifest;
      if (manifest && manifest.type === "code_flow") return { flow_id: manifest.flow_id, name: manifest.name, created: false };
    }
  }
  return jsonResponse(createParsed, createResponse.status);
}

function buildHandoffIntakeMarkdown(record: ScienceShareRecord, handoffId: string, pmNotes: string): string {
  return `# Science to Code Handoff Intake

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Handoff Boundary

This artifact imports a Human-approved Science Monkeys share into PM context. It does not certify, promote, or convert scientific evidence into product requirements automatically.

## Source Share

- handoff_id: ${handoffId}
- share_id: ${record.share_id}
- science_flow_id: ${record.flow_id}
- evidence_level: ${record.evidence_level}
- uncertainty: ${record.uncertainty}
- share_packet_path: ${record.share_packet_path}
- share_packet_hash: ${record.share_packet_hash}
- submitted_payload_hash: ${record.submitted_payload_hash || record.share_packet_hash}

## Resolved Source Artifacts

${record.resolved_source_artifacts.map(item => `- ${item.artifact_type}: ${item.artifact_id} (${item.source_path})`).join("\n")}

## Allowed Claims

${record.allowed_claims.map(claim => `- ${claim}`).join("\n")}

## Forbidden Claims

${record.forbidden_claims.map(claim => `- ${claim}`).join("\n")}

## PM Notes

${pmNotes || "No additional PM notes supplied."}

## Non-Laundering Rule

PM_AI may convert this share into candidate dossier/spec context only. Any product claim, implementation requirement, or promotion decision must preserve uncertainty, source links, forbidden claims, and required labels.
`;
}

function buildDossierSeedMarkdown(record: ScienceShareRecord, handoffId: string): string {
  return `# PM Dossier Seed from Science Share

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Purpose

Seed a PM dossier from a Human-approved Science Monkeys share without laundering evidence.

## Candidate Context

- handoff_id: ${handoffId}
- source_share_id: ${record.share_id}
- source_science_flow_id: ${record.flow_id}
- evidence_level: ${record.evidence_level}
- uncertainty: ${record.uncertainty}

## Candidate Allowed Claims

${record.allowed_claims.map(claim => `- ${claim}`).join("\n")}

## Hard Forbidden Claims

${record.forbidden_claims.map(claim => `- ${claim}`).join("\n")}

## Required Preservation

Any downstream PM specification, plan, tasks, or Code Monkey handoff must preserve:

- source share id
- source artifact references
- share_packet_hash
- submitted_payload_hash
- uncertainty
- forbidden claims
- required diagnostic status labels

## Explicit Boundary

This dossier seed is not a specification, not a task packet, not a promotion decision, and not certification.
`;
}

async function writeCodeFlowArtifact(
  request: Request,
  env: Env,
  flowId: string,
  projectName: string,
  artifactType: string,
  title: string,
  body: string,
  store: RepoStore
): Promise<FlowArtifactSummary | Response> {
  const url = new URL(request.url);
  const artifactRequest = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify({
      project: projectName,
      artifact_type: artifactType,
      title,
      body
    })
  });
  const response = await handleFlowsRequest(artifactRequest, env, flowId, "artifacts", store);
  const parsed = await parseJsonResponse(response);
  if (!response.ok) return jsonResponse(parsed, response.status);
  const artifact = (parsed as { artifact?: FlowArtifactSummary }).artifact;
  if (!artifact) return errorResponse("PM_HANDOFF_ARTIFACT_WRITE_FAILED", `Artifact write did not return summary for ${artifactType}`, 500);
  return artifact;
}

async function loadHandoffIndex(env: Env, projectName: string, store: RepoStore): Promise<HandoffContextIndex> {
  const existing = await fetchJsonIfExists<HandoffContextIndex>(env, projectName, pmHandoffContextIndexPath(), store);
  if (existing && existing.schema_version === "pm_handoff_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return {
    schema_version: "pm_handoff_context_index.v0.1",
    project: projectName,
    updated_at: utcIso(),
    entries: []
  };
}

function upsertHandoffIndex(index: HandoffContextIndex, record: HandoffRecord): void {
  const entry = {
    handoff_id: record.handoff_id,
    share_id: record.source_share.share_id,
    science_flow_id: record.source_share.science_flow_id,
    code_flow_id: record.code_flow.flow_id,
    share_packet_hash: record.source_share.share_packet_hash,
    evidence_level: record.source_share.evidence_level,
    uncertainty: record.source_share.uncertainty,
    handoff_record_path: record.handoff_record_path,
    created_at: record.created_at
  };
  const found = index.entries.findIndex(item => item.handoff_id === record.handoff_id);
  if (found >= 0) index.entries[found] = entry;
  else index.entries.push(entry);
  index.updated_at = utcIso();
  index.entries.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handlePmHandoffRequest(
  request: Request,
  env: Env,
  repoStore: RepoStore = githubRepoStore
): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "PM_AI") {
      return errorResponse("PM_HANDOFF_ROLE_FORBIDDEN", "Only PM_AI may create Science to Code handoff intake", 403);
    }
    if (request.method !== "POST") {
      return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    }

    const url = new URL(request.url);
    const body = await readJsonBody(request);
    const projectName = projectNameFrom(url, body);
    const project = getProject(projectName);
    if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

    const idempotencyKey = requireString(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(idempotencyKey)) {
      return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    }

    const entry = await loadPMShareContextEntry(env, projectName, body, repoStore);
    const shareRecord = await fetchJsonIfExists<ScienceShareRecord>(env, projectName, scienceShareRecordPath(entry.flow_id, entry.share_id), repoStore);
    if (!shareRecord) return errorResponse("PM_HANDOFF_SHARE_RECORD_NOT_FOUND", `No share record found for ${entry.share_id}`, 404);
    const shareError = validateShareRecord(shareRecord, entry);
    if (shareError) return shareError;

    const pmNotes = optionalString(body.pm_notes);
    const handoffId = buildHandoffId(shareRecord.share_id, idempotencyKey);
    const payloadHash = await sha256Hex(JSON.stringify({
      project: projectName,
      idempotency_key: idempotencyKey,
      share_id: shareRecord.share_id,
      share_packet_hash: shareRecord.share_packet_hash,
      submitted_payload_hash: shareRecord.submitted_payload_hash || shareRecord.share_packet_hash,
      code_flow_ref: optionalString(body.code_flow_ref),
      code_flow_name: optionalString(body.code_flow_name),
      code_flow_title: optionalString(body.code_flow_title),
      pm_notes: pmNotes
    }));

    const recordPath = handoffRecordPath(handoffId);
    const existingRecord = await fetchJsonIfExists<HandoffRecord>(env, projectName, recordPath, repoStore);
    if (existingRecord && existingRecord.schema_version === "science_to_code_handoff.v0.1") {
      if (existingRecord.submitted_payload_hash !== payloadHash) {
        return errorResponse("PM_HANDOFF_IDEMPOTENCY_CONFLICT", "Existing PM handoff idempotency record exists but submitted payload hash does not match", 409);
      }
      return jsonResponse({
        ok: true,
        idempotent_replay: true,
        handoff: existingRecord,
        required_status_labels: requiredStatusLabels()
      }, 200);
    }

    const codeFlow = await createCodeFlow(request, env, projectName, shareRecord, handoffId, body, repoStore);
    if (codeFlow instanceof Response) return codeFlow;

    const intake = await writeCodeFlowArtifact(
      request,
      env,
      codeFlow.flow_id,
      projectName,
      "handoff_intake",
      "Science to Code Handoff Intake",
      buildHandoffIntakeMarkdown(shareRecord, handoffId, pmNotes),
      repoStore
    );
    if (intake instanceof Response) return intake;

    const dossierSeed = await writeCodeFlowArtifact(
      request,
      env,
      codeFlow.flow_id,
      projectName,
      "dossier_seed",
      "PM Dossier Seed from Science Share",
      buildDossierSeedMarkdown(shareRecord, handoffId),
      repoStore
    );
    if (dossierSeed instanceof Response) return dossierSeed;

    const createdAt = utcIso();
    const record: HandoffRecord = {
      schema_version: "science_to_code_handoff.v0.1",
      official_artifact: true,
      project: projectName,
      handoff_id: handoffId,
      idempotency_key: idempotencyKey,
      created_at: createdAt,
      created_by_role: "PM_AI",
      source_share: {
        share_id: shareRecord.share_id,
        science_flow_id: shareRecord.flow_id,
        share_packet_path: shareRecord.share_packet_path,
        share_packet_hash: shareRecord.share_packet_hash,
        submitted_payload_hash: shareRecord.submitted_payload_hash || shareRecord.share_packet_hash,
        evidence_level: shareRecord.evidence_level,
        uncertainty: shareRecord.uncertainty,
        source_artifacts: shareRecord.source_artifacts,
        resolved_source_artifacts: shareRecord.resolved_source_artifacts,
        allowed_claims: shareRecord.allowed_claims,
        forbidden_claims: shareRecord.forbidden_claims
      },
      code_flow: {
        flow_id: codeFlow.flow_id,
        name: codeFlow.name,
        created_by_handoff: codeFlow.created
      },
      output_artifacts: {
        handoff_intake: intake,
        dossier_seed: dossierSeed
      },
      submitted_payload_hash: payloadHash,
      handoff_record_path: recordPath,
      generated_handoff_context_path: pmHandoffContextIndexPath(),
      required_status_labels: requiredStatusLabels()
    };

    const index = await loadHandoffIndex(env, projectName, repoStore);
    upsertHandoffIndex(index, record);
    const indexWrite = await writeJson(env, projectName, pmHandoffContextIndexPath(), index, `Update PM handoff context ${handoffId}`, repoStore);
    record.generated_handoff_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, projectName, recordPath, record, `Write PM handoff record ${handoffId}`, repoStore);

    return jsonResponse({
      ok: true,
      idempotent_replay: false,
      project: projectName,
      handoff: {
        ...record,
        handoff_record_sha: recordWrite.sha
      },
      required_status_labels: requiredStatusLabels()
    }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) {
      return errorResponse("BAD_REQUEST", message, 400);
    }
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("No PM share context entry")) return errorResponse("PM_HANDOFF_SHARE_CONTEXT_NOT_FOUND", message, 404);
    if (message.includes("PM share context index is missing")) return errorResponse("PM_HANDOFF_SHARE_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
