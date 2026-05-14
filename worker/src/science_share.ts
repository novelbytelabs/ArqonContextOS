import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { getProject } from "./projects";
import { STATUS_LABELS } from "./policy";
import { buildFrontMatter } from "./notes";
import type { Env, Role } from "./types";
import type { RepoStore } from "./repo_store";
import type { FlowType, FlowStatus, GateState } from "./flow_policy";

interface FlowArtifactSummary {
  artifact_id: string;
  artifact_type: string;
  title: string;
  role: Role;
  created_at: string;
  source_path: string;
  source_sha?: string;
}

interface FlowHistoryEvent {
  event_id: string;
  event_type: string;
  role: Role;
  created_at: string;
  note: string;
}

interface FlowManifest {
  schema_version: "flow_manifest.v0.3";
  official_artifact: true;
  project: string;
  flow_id: string;
  name: string;
  type: FlowType;
  title: string;
  summary: string;
  status: FlowStatus;
  current_gate: GateState;
  created_at: string;
  created_by_role: Role;
  updated_at: string;
  updated_by_role: Role;
  required_status_labels: string[];
  artifacts: FlowArtifactSummary[];
  history: FlowHistoryEvent[];
}

interface FlowIndexEntry {
  flow_id: string;
  name: string;
  type: FlowType;
  title: string;
  status: FlowStatus;
  current_gate: GateState;
  created_at: string;
  updated_at: string;
  source_path: string;
}

interface FlowIndex {
  schema_version: "flow_index.v0.3";
  project: string;
  updated_at: string;
  flows: FlowIndexEntry[];
}

interface SharePacketRecord {
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
  allowed_claims: string[];
  forbidden_claims: string[];
  share_packet_hash: string;
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

const FINDING_ARTIFACTS = new Set(["finding_record", "negative_finding_record", "inconclusive_finding_record", "finding_boundary_record"]);
const SHARE_EVIDENCE_LEVELS = new Set([
  "SUPPORTED_REPLICATED",
  "SUPPORTED_SINGLE_RUN",
  "SUPPORTED_DIAGNOSTIC",
  "NEGATIVE_RESULT",
  "INCONCLUSIVE"
]);

function utcIso(): string {
  return new Date().toISOString();
}

function utcDate(): string {
  return utcIso().slice(0, 10);
}

function requiredStatusLabels(): string[] {
  return [...STATUS_LABELS];
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid or missing field: ${field}`);
  return value.trim();
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`Invalid or missing field: ${field}`);
  return value.map(item => {
    if (typeof item !== "string" || !item.trim()) throw new Error(`Invalid array item in ${field}`);
    return item.trim();
  });
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

function safeFilePart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 96);
}

function flowIndexPath(): string {
  return "governance/flows/flow_index.json";
}

function flowManifestPath(flowId: string): string {
  return `governance/flows/${flowId}/flow_manifest.json`;
}

function flowArtifactPath(flowId: string, artifactId: string, title: string): string {
  return `governance/flows/${flowId}/artifacts/${artifactId}-${safeFilePart(title)}.md`;
}

function shareRoot(flowId: string, shareId: string): string {
  return `governance/flows/${flowId}/share/${shareId}`;
}

function shareRecordPath(flowId: string, shareId: string): string {
  return `${shareRoot(flowId, shareId)}/share_record.json`;
}

function outboxPath(flowId: string, shareId: string): string {
  return `governance/outbox/science_share/${flowId}/${shareId}.json`;
}

function pmContextPath(shareId: string): string {
  return `governance/context/pm_share_context/${shareId}.json`;
}

function pmContextIndexPath(): string {
  return "governance/context/generated_pm_share_context.json";
}

function pmMessagePath(shareId: string): string {
  return `governance/messages/PM_AI/inbox/MSG-SHARE-${shareId}.md`;
}

function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
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

async function loadFlowIndex(env: Env, projectName: string, store: RepoStore): Promise<FlowIndex> {
  const index = await fetchJsonIfExists<FlowIndex>(env, projectName, flowIndexPath(), store);
  if (!index || index.schema_version !== "flow_index.v0.3" || !Array.isArray(index.flows)) {
    throw new Error("Invalid or missing flow index schema");
  }
  return index;
}

async function loadFlowManifest(env: Env, projectName: string, flowId: string, store: RepoStore): Promise<FlowManifest> {
  const manifest = await fetchJsonIfExists<FlowManifest>(env, projectName, flowManifestPath(flowId), store);
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3" || manifest.flow_id !== flowId) {
    throw new Error(`Invalid or missing flow manifest schema for ${flowId}`);
  }
  return manifest;
}

function resolveFlowId(index: FlowIndex, flowRef: string): string | null {
  const direct = index.flows.find(entry => entry.flow_id === flowRef);
  if (direct) return direct.flow_id;
  const byName = index.flows.find(entry => entry.name === flowRef);
  return byName?.flow_id || null;
}

function upsertIndexEntry(index: FlowIndex, manifest: FlowManifest): void {
  const entry: FlowIndexEntry = {
    flow_id: manifest.flow_id,
    name: manifest.name,
    type: manifest.type,
    title: manifest.title,
    status: manifest.status,
    current_gate: manifest.current_gate,
    created_at: manifest.created_at,
    updated_at: manifest.updated_at,
    source_path: flowManifestPath(manifest.flow_id)
  };
  const existing = index.flows.findIndex(item => item.flow_id === manifest.flow_id);
  if (existing >= 0) index.flows[existing] = entry;
  else index.flows.push(entry);
  index.updated_at = utcIso();
}

function artifactTypes(manifest: FlowManifest): Set<string> {
  return new Set(manifest.artifacts.map(artifact => artifact.artifact_type));
}

function sharePreconditionError(manifest: FlowManifest, sourceArtifacts: string[]): Response | null {
  if (manifest.type !== "science_flow") return errorResponse("SCIENCE_SHARE_FLOW_TYPE_REQUIRED", "Share requires a science_flow", 409);
  const types = artifactTypes(manifest);
  const missing: string[] = [];
  if (!types.has("audit_report")) missing.push("audit_report");
  if (!types.has("share_recommendation")) missing.push("share_recommendation");
  if (![...FINDING_ARTIFACTS].some(type => types.has(type))) {
    missing.push("finding_record|negative_finding_record|inconclusive_finding_record|finding_boundary_record");
  }
  for (const source of sourceArtifacts) {
    if (!manifest.artifacts.some(artifact => artifact.artifact_id === source || artifact.source_path === source)) {
      missing.push(`source_artifact:${source}`);
    }
  }
  if (missing.length > 0) return errorResponse("SCIENCE_SHARE_PRECONDITION_FAILED", `Share preconditions missing: ${missing.join(", ")}`, 409);
  return null;
}

function requireIdempotencyKey(value: unknown): string {
  const key = requireString(value, "idempotency_key");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(key)) {
    throw new Error("idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash");
  }
  return key;
}

function stableShareId(flowId: string, idempotencyKey: string): string {
  return `${safeFilePart(flowId)}-${safeFilePart(idempotencyKey)}`.slice(0, 140);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function buildShareMarkdown(input: {
  project: string;
  flowId: string;
  shareId: string;
  idempotencyKey: string;
  evidenceLevel: string;
  uncertainty: string;
  sourceArtifacts: string[];
  allowedClaims: string[];
  forbiddenClaims: string[];
  body: string;
  createdAt: string;
  shareHash: string;
}): string {
  const frontMatter = buildFrontMatter([
    ["share_id", input.shareId],
    ["project", input.project],
    ["flow_id", input.flowId],
    ["role", "HUMAN"],
    ["artifact_type", "share_packet"],
    ["official_artifact", true],
    ["idempotency_key", input.idempotencyKey],
    ["human_authority", "server_authenticated_human"],
    ["evidence_level", input.evidenceLevel],
    ["uncertainty", input.uncertainty],
    ["source_artifacts", input.sourceArtifacts],
    ["allowed_claims", input.allowedClaims],
    ["forbidden_claims", input.forbiddenClaims],
    ["share_packet_hash", input.shareHash],
    ["created_at", input.createdAt],
    ["required_status_labels", requiredStatusLabels()]
  ]);

  return `${frontMatter}

# Science Share Packet

## Evidence Level

${input.evidenceLevel}

## Uncertainty

${input.uncertainty}

## Source Artifacts

${input.sourceArtifacts.map(item => `- ${item}`).join("\n")}

## Allowed Claims

${input.allowedClaims.map(item => `- ${item}`).join("\n")}

## Forbidden Claims

${input.forbiddenClaims.map(item => `- ${item}`).join("\n")}

## Share Body

${input.body.trimEnd()}
`;
}

function buildPMMessage(input: {
  project: string;
  flowId: string;
  shareId: string;
  createdAt: string;
  sharePacketPath: string;
  pmContextPath: string;
  shareHash: string;
  body: string;
}): string {
  const frontMatter = buildFrontMatter([
    ["message_id", `MSG-SHARE-${input.shareId}`],
    ["project", input.project],
    ["from", "HUMAN"],
    ["to", "PM_AI"],
    ["subject", `Science share ready: ${input.flowId}`],
    ["priority", "high"],
    ["run_id", input.flowId],
    ["status", "unread"],
    ["official_artifact", false],
    ["created_at", input.createdAt],
    ["required_status_labels", requiredStatusLabels()]
  ]);

  return `${frontMatter}

# Science Share Notification

A Human-approved science share packet is ready for PM review.

- flow_id: ${input.flowId}
- share_id: ${input.shareId}
- share_packet_path: ${input.sharePacketPath}
- pm_context_path: ${input.pmContextPath}
- share_packet_hash: ${input.shareHash}

${input.body.trimEnd()}
`;
}

function buildOutbox(input: {
  project: string;
  flowId: string;
  shareId: string;
  idempotencyKey: string;
  status: "pending" | "complete";
  stage: string;
  createdAt: string;
  updatedAt: string;
  sharePacketPath?: string;
  pmMessagePath?: string;
  pmContextPath?: string;
  shareRecordPath?: string;
}): Record<string, unknown> {
  return {
    schema_version: "science_share_outbox.v0.1",
    project: input.project,
    flow_id: input.flowId,
    share_id: input.shareId,
    idempotency_key: input.idempotencyKey,
    status: input.status,
    stage: input.stage,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
    share_packet_path: input.sharePacketPath || null,
    pm_message_path: input.pmMessagePath || null,
    pm_context_path: input.pmContextPath || null,
    share_record_path: input.shareRecordPath || null,
    required_status_labels: requiredStatusLabels()
  };
}

async function loadPMShareContextIndex(env: Env, projectName: string, store: RepoStore): Promise<PMShareContextIndex> {
  const existing = await fetchJsonIfExists<PMShareContextIndex>(env, projectName, pmContextIndexPath(), store);
  if (existing && existing.schema_version === "pm_share_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return {
    schema_version: "pm_share_context_index.v0.1",
    project: projectName,
    updated_at: utcIso(),
    entries: []
  };
}

function upsertPMContextEntry(index: PMShareContextIndex, entry: PMShareContextEntry): void {
  const existing = index.entries.findIndex(item => item.share_id === entry.share_id);
  if (existing >= 0) index.entries[existing] = entry;
  else index.entries.push(entry);
  index.updated_at = utcIso();
  index.entries.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handleScienceShare(
  request: Request,
  env: Env,
  role: Role,
  repoStore: RepoStore
): Promise<Response> {
  if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
  if (role !== "HUMAN") {
    return errorResponse("SCIENCE_SHARE_HUMAN_REQUIRED", "Only authenticated HUMAN may create official science share packets", 403);
  }

  const url = new URL(request.url);
  const body = await readJsonBody(request);
  const projectName = projectNameFrom(url, body);
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const flowRef = optionalString(body.flow_ref) || getParam(url, "flow_ref") || "";
  if (!flowRef) return errorResponse("SCIENCE_FLOW_REF_REQUIRED", "/v1/science/share requires flow_ref", 400);

  const idempotencyKey = requireIdempotencyKey(body.idempotency_key);
  const evidenceLevel = requireString(body.evidence_level, "evidence_level");
  if (!SHARE_EVIDENCE_LEVELS.has(evidenceLevel)) {
    return errorResponse("SCIENCE_SHARE_EVIDENCE_LEVEL_INVALID", `Invalid evidence_level: ${evidenceLevel}`, 400);
  }
  const uncertainty = requireString(body.uncertainty, "uncertainty");
  const sourceArtifacts = requireStringArray(body.source_artifacts, "source_artifacts");
  const allowedClaims = requireStringArray(body.allowed_claims, "allowed_claims");
  const forbiddenClaims = requireStringArray(body.forbidden_claims, "forbidden_claims");
  const shareBody = requireString(body.body, "body");

  const index = await loadFlowIndex(env, projectName, repoStore);
  const flowId = resolveFlowId(index, flowRef);
  if (!flowId) return errorResponse("FLOW_NOT_FOUND", `No flow found for ref: ${flowRef}`, 404);

  const shareId = stableShareId(flowId, idempotencyKey);
  const recordPath = shareRecordPath(flowId, shareId);
  const existingRecord = await fetchJsonIfExists<SharePacketRecord>(env, projectName, recordPath, repoStore);
  if (existingRecord && existingRecord.schema_version === "science_share_packet.v0.1") {
    return jsonResponse({
      ok: true,
      idempotent_replay: true,
      share: existingRecord,
      required_status_labels: requiredStatusLabels()
    }, 200);
  }

  const manifest = await loadFlowManifest(env, projectName, flowId, repoStore);
  const preconditionError = sharePreconditionError(manifest, sourceArtifacts);
  if (preconditionError) return preconditionError;

  const createdAt = utcIso();
  const artifactId = `SHARE-${shareId}`;
  const sharePacketPath = flowArtifactPath(flowId, artifactId, "Science_share_packet");
  const messagePath = pmMessagePath(shareId);
  const contextPath = pmContextPath(shareId);
  const contextIndexPath = pmContextIndexPath();
  const shareOutboxPath = outboxPath(flowId, shareId);

  await repoStore.writeFile(env, project, shareOutboxPath, formatJson(buildOutbox({
    project: projectName,
    flowId,
    shareId,
    idempotencyKey,
    status: "pending",
    stage: "share_started",
    createdAt,
    updatedAt: utcIso(),
    sharePacketPath,
    pmMessagePath: messagePath,
    pmContextPath: contextPath,
    shareRecordPath: recordPath
  })), `Start science share ${shareId}`);

  const hashMaterial = JSON.stringify({
    project: projectName,
    flow_id: flowId,
    share_id: shareId,
    idempotency_key: idempotencyKey,
    evidence_level: evidenceLevel,
    uncertainty,
    source_artifacts: sourceArtifacts,
    allowed_claims: allowedClaims,
    forbidden_claims: forbiddenClaims,
    body: shareBody
  });
  const shareHash = await sha256Hex(hashMaterial);
  const sharePacketDocument = buildShareMarkdown({
    project: projectName,
    flowId,
    shareId,
    idempotencyKey,
    evidenceLevel,
    uncertainty,
    sourceArtifacts,
    allowedClaims,
    forbiddenClaims,
    body: shareBody,
    createdAt,
    shareHash
  });
  const shareWrite = await repoStore.writeFile(env, project, sharePacketPath, sharePacketDocument, `Write science share packet ${shareId}`);

  const artifactSummary: FlowArtifactSummary = {
    artifact_id: artifactId,
    artifact_type: "share_packet",
    title: "Science share packet",
    role: "HUMAN",
    created_at: createdAt,
    source_path: shareWrite.path,
    source_sha: shareWrite.sha
  };
  if (!manifest.artifacts.some(artifact => artifact.artifact_id === artifactSummary.artifact_id)) {
    manifest.artifacts.push(artifactSummary);
  }
  manifest.updated_at = utcIso();
  manifest.updated_by_role = "HUMAN";
  manifest.history.push({
    event_id: `EVT-${utcDate()}-${safeFilePart(idempotencyKey).slice(0, 12)}`,
    event_type: "science_share_packet",
    role: "HUMAN",
    created_at: utcIso(),
    note: `Created Human-approved science share packet ${shareId}`
  });
  const manifestWrite = await repoStore.writeFile(env, project, flowManifestPath(flowId), formatJson(manifest), `Update flow manifest for science share ${shareId}`);
  upsertIndexEntry(index, manifest);
  const indexWrite = await repoStore.writeFile(env, project, flowIndexPath(), formatJson(index), `Update flow index for science share ${shareId}`);

  const pmContext: PMShareContextEntry = {
    share_id: shareId,
    flow_id: flowId,
    project: projectName,
    evidence_level: evidenceLevel,
    uncertainty,
    source_artifacts: sourceArtifacts,
    allowed_claims: allowedClaims,
    forbidden_claims: forbiddenClaims,
    share_packet_hash: shareHash,
    share_packet_path: shareWrite.path,
    pm_context_path: contextPath,
    created_at: createdAt
  };
  const contextWrite = await repoStore.writeFile(env, project, contextPath, formatJson({
    schema_version: "pm_share_context_seed.v0.1",
    ...pmContext,
    required_status_labels: requiredStatusLabels()
  }), `Write PM share context seed ${shareId}`);

  const contextIndex = await loadPMShareContextIndex(env, projectName, repoStore);
  upsertPMContextEntry(contextIndex, pmContext);
  const contextIndexWrite = await repoStore.writeFile(env, project, contextIndexPath, formatJson(contextIndex), `Update generated PM share context ${shareId}`);

  const pmMessage = buildPMMessage({
    project: projectName,
    flowId,
    shareId,
    createdAt,
    sharePacketPath: shareWrite.path,
    pmContextPath: contextWrite.path,
    shareHash,
    body: shareBody
  });
  const messageWrite = await repoStore.writeFile(env, project, messagePath, pmMessage, `Notify PM_AI of science share ${shareId}`);

  const record: SharePacketRecord = {
    schema_version: "science_share_packet.v0.1",
    official_artifact: true,
    project: projectName,
    flow_id: flowId,
    share_id: shareId,
    idempotency_key: idempotencyKey,
    created_at: createdAt,
    created_by_role: "HUMAN",
    human_authority: "server_authenticated_human",
    evidence_level: evidenceLevel,
    uncertainty,
    source_artifacts: sourceArtifacts,
    allowed_claims: allowedClaims,
    forbidden_claims: forbiddenClaims,
    share_packet_hash: shareHash,
    share_packet_path: shareWrite.path,
    share_packet_sha: shareWrite.sha,
    pm_message_path: messageWrite.path,
    pm_message_sha: messageWrite.sha,
    pm_context_path: contextWrite.path,
    pm_context_sha: contextWrite.sha,
    pm_context_index_path: contextIndexPath,
    pm_context_index_sha: contextIndexWrite.sha,
    outbox_path: shareOutboxPath,
    required_status_labels: requiredStatusLabels()
  };
  const recordWrite = await repoStore.writeFile(env, project, recordPath, formatJson(record), `Finalize science share record ${shareId}`);

  const completeOutbox = buildOutbox({
    project: projectName,
    flowId,
    shareId,
    idempotencyKey,
    status: "complete",
    stage: "share_completed",
    createdAt,
    updatedAt: utcIso(),
    sharePacketPath: shareWrite.path,
    pmMessagePath: messageWrite.path,
    pmContextPath: contextWrite.path,
    shareRecordPath: recordWrite.path
  });
  const outboxWrite = await repoStore.writeFile(env, project, shareOutboxPath, formatJson(completeOutbox), `Complete science share outbox ${shareId}`);

  return jsonResponse({
    ok: true,
    idempotent_replay: false,
    project: projectName,
    flow_id: flowId,
    flow_ref: flowRef,
    share: {
      ...record,
      outbox_sha: outboxWrite.sha,
      share_record_path: recordWrite.path,
      share_record_sha: recordWrite.sha,
      flow_manifest_path: manifestWrite.path,
      flow_manifest_sha: manifestWrite.sha,
      flow_index_path: flowIndexPath(),
      flow_index_sha: indexWrite.sha
    },
    required_status_labels: requiredStatusLabels()
  }, 201);
}
