import { requireRole } from "./auth";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { getProject } from "./projects";
import { errorResponse, jsonResponse } from "./response";
import { STATUS_LABELS, isKnownProject } from "./policy";
import type { FlowType, FlowStatus, GateState } from "./flow_policy";
import { assertFlowType, assertFlowStatus, assertGateState, validateArtifactSlot, validateGateAdvance, validateFlowArtifactRole } from "./flow_policy";
import type { Env, Role } from "./types";
import { buildFrontMatter, shortId } from "./notes";

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

function getParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value && value.trim() ? value.trim() : null;
}

function requiredStatusLabels(): string[] {
  return [...STATUS_LABELS];
}

function utcIso(): string {
  return new Date().toISOString();
}

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => null).then(body => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Missing or invalid JSON body");
    }
    return body as Record<string, unknown>;
  });
}

function projectNameFrom(url: URL, body?: Record<string, unknown>): string {
  const fromBody = body ? optionalString(body.project) : "";
  const fromQuery = getParam(url, "project") || "";
  return fromBody || fromQuery || "ArqonZero";
}

function assertKnownProjectName(projectName: string): void {
  if (!isKnownProject(projectName) || !getProject(projectName)) {
    throw new Error(`Unknown project: ${projectName}`);
  }
}

function assertFlowName(name: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(name)) {
    throw new Error("Flow name must start with a letter or number and contain only letters, numbers, dot, underscore, or dash; max length 64");
  }
}

function safeFilePart(input: string): string {
  return input.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
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

function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function emptyIndex(projectName: string): FlowIndex {
  return {
    schema_version: "flow_index.v0.3",
    project: projectName,
    updated_at: utcIso(),
    flows: []
  };
}

async function loadFlowIndex(env: Env, projectName: string, store: RepoStore): Promise<FlowIndex> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  try {
    const file = await store.fetchFile(env, project, flowIndexPath());
    const parsed = JSON.parse(file.content) as FlowIndex;
    if (parsed.schema_version !== "flow_index.v0.3" || !Array.isArray(parsed.flows)) {
      throw new Error("Invalid flow index schema");
    }
    return parsed;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return emptyIndex(projectName);
    }
    throw err;
  }
}

async function writeFlowIndex(env: Env, projectName: string, index: FlowIndex, message: string, store: RepoStore): Promise<void> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  index.updated_at = utcIso();
  await store.writeFile(env, project, flowIndexPath(), formatJson(index), message);
}

async function loadFlowManifest(env: Env, projectName: string, flowId: string, store: RepoStore): Promise<FlowManifest> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  const file = await store.fetchFile(env, project, flowManifestPath(flowId));
  const parsed = JSON.parse(file.content) as FlowManifest;
  if (parsed.schema_version !== "flow_manifest.v0.3" || parsed.flow_id !== flowId) {
    throw new Error(`Invalid flow manifest schema for ${flowId}`);
  }
  return parsed;
}

async function writeFlowManifest(env: Env, projectName: string, manifest: FlowManifest, message: string, store: RepoStore): Promise<{ path: string; sha: string }> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  manifest.updated_at = utcIso();
  return await store.writeFile(env, project, flowManifestPath(manifest.flow_id), formatJson(manifest), message);
}

function nextFlowId(index: FlowIndex): string {
  const year = utcDate().slice(0, 4);
  let max = 0;
  for (const entry of index.flows) {
    const match = entry.flow_id.match(new RegExp(`^FLOW-${year}-(\\d{4})$`));
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return `FLOW-${year}-${String(max + 1).padStart(4, "0")}`;
}

function indexEntryFromManifest(manifest: FlowManifest): FlowIndexEntry {
  return {
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
}

function upsertIndexEntry(index: FlowIndex, manifest: FlowManifest): void {
  const next = indexEntryFromManifest(manifest);
  const existingIndex = index.flows.findIndex(entry => entry.flow_id === manifest.flow_id);
  if (existingIndex >= 0) {
    index.flows[existingIndex] = next;
  } else {
    index.flows.push(next);
  }
  index.flows.sort((a, b) => {
    const timeDiff = Date.parse(b.updated_at) - Date.parse(a.updated_at);
    if (timeDiff !== 0) return timeDiff;
    return a.flow_id.localeCompare(b.flow_id);
  });
}

function resolveFlowId(index: FlowIndex, flowRef: string): string | null {
  const direct = index.flows.find(entry => entry.flow_id === flowRef);
  if (direct) return direct.flow_id;
  const byName = index.flows.find(entry => entry.name === flowRef);
  return byName?.flow_id || null;
}

function buildHistory(eventType: string, role: Role, note: string): FlowHistoryEvent {
  return {
    event_id: `EVT-${utcDate()}-${shortId()}`,
    event_type: eventType,
    role,
    created_at: utcIso(),
    note
  };
}

function buildArtifactDocument(artifact: {
  artifactId: string;
  flowId: string;
  project: string;
  role: Role;
  artifactType: string;
  title: string;
  createdAt: string;
  body: string;
}): string {
  const frontMatter = buildFrontMatter([
    ["artifact_id", artifact.artifactId],
    ["flow_id", artifact.flowId],
    ["project", artifact.project],
    ["role", artifact.role],
    ["artifact_type", artifact.artifactType],
    ["title", artifact.title],
    ["official_artifact", true],
    ["created_at", artifact.createdAt],
    ["required_status_labels", requiredStatusLabels()]
  ]);
  return `${frontMatter}\n\n${artifact.body.trimEnd()}\n`;
}

async function handleCreateFlow(request: Request, env: Env, store: RepoStore): Promise<Response> {
  const role = requireRole(request, env);
  const url = new URL(request.url);
  const body = await readJsonBody(request);
  const projectName = projectNameFrom(url, body);
  assertKnownProjectName(projectName);

  const name = requireString(body.name, "name");
  assertFlowName(name);
  const typeValue = requireString(body.type, "type");
  assertFlowType(typeValue);
  const title = requireString(body.title, "title");
  const summary = optionalString(body.summary);
  const initialGate = optionalString(body.initial_gate) || "DRAFT";
  assertGateState(initialGate);

  const index = await loadFlowIndex(env, projectName, store);
  const duplicate = index.flows.find(entry => entry.name === name && ["active", "blocked"].includes(entry.status));
  if (duplicate) {
    return errorResponse("FLOW_NAME_CONFLICT", `Active flow name already exists: ${name}`, 409);
  }

  const now = utcIso();
  const flowId = nextFlowId(index);
  const manifest: FlowManifest = {
    schema_version: "flow_manifest.v0.3",
    official_artifact: true,
    project: projectName,
    flow_id: flowId,
    name,
    type: typeValue,
    title,
    summary,
    status: "active",
    current_gate: initialGate,
    created_at: now,
    created_by_role: role,
    updated_at: now,
    updated_by_role: role,
    required_status_labels: requiredStatusLabels(),
    artifacts: [],
    history: [buildHistory("create_flow", role, "Flow created")]
  };

  const written = await writeFlowManifest(env, projectName, manifest, `Create flow ${flowId}`, store);
  upsertIndexEntry(index, manifest);
  await writeFlowIndex(env, projectName, index, `Update flow index for ${flowId}`, store);

  return jsonResponse({
    ok: true,
    project: projectName,
    flow_id: flowId,
    name,
    type: typeValue,
    status: manifest.status,
    current_gate: manifest.current_gate,
    source_path: written.path,
    source_sha: written.sha,
    required_status_labels: requiredStatusLabels()
  }, 201);
}

async function handleListFlows(request: Request, env: Env, store: RepoStore): Promise<Response> {
  requireRole(request, env);
  const url = new URL(request.url);
  const projectName = projectNameFrom(url);
  assertKnownProjectName(projectName);
  const typeFilter = getParam(url, "type");
  const statusFilter = getParam(url, "status");
  if (typeFilter) assertFlowType(typeFilter);
  if (statusFilter) assertFlowStatus(statusFilter);

  const index = await loadFlowIndex(env, projectName, store);
  let flows = [...index.flows];
  if (typeFilter) flows = flows.filter(flow => flow.type === typeFilter);
  if (statusFilter) flows = flows.filter(flow => flow.status === statusFilter);
  return jsonResponse({
    ok: true,
    project: projectName,
    count: flows.length,
    flows,
    required_status_labels: requiredStatusLabels()
  });
}

async function flowIdOrError(env: Env, projectName: string, flowRef: string, store: RepoStore): Promise<{ index: FlowIndex; flowId: string } | Response> {
  const index = await loadFlowIndex(env, projectName, store);
  const flowId = resolveFlowId(index, flowRef);
  if (!flowId) return errorResponse("FLOW_NOT_FOUND", `No flow found for ref: ${flowRef}`, 404);
  return { index, flowId };
}

async function handleLoadFlow(request: Request, env: Env, flowRef: string, store: RepoStore): Promise<Response> {
  requireRole(request, env);
  const url = new URL(request.url);
  const projectName = projectNameFrom(url);
  assertKnownProjectName(projectName);
  const resolved = await flowIdOrError(env, projectName, flowRef, store);
  if (resolved instanceof Response) return resolved;
  const manifest = await loadFlowManifest(env, projectName, resolved.flowId, store);
  return jsonResponse({
    ok: true,
    project: projectName,
    flow_ref: flowRef,
    flow_id: resolved.flowId,
    manifest,
    required_status_labels: requiredStatusLabels()
  });
}

async function handleFlowStatus(request: Request, env: Env, flowRef: string, store: RepoStore): Promise<Response> {
  requireRole(request, env);
  const url = new URL(request.url);
  const projectName = projectNameFrom(url);
  assertKnownProjectName(projectName);
  const resolved = await flowIdOrError(env, projectName, flowRef, store);
  if (resolved instanceof Response) return resolved;
  const entry = resolved.index.flows.find(flow => flow.flow_id === resolved.flowId);
  if (!entry) return errorResponse("FLOW_NOT_FOUND", `No flow found for ref: ${flowRef}`, 404);
  return jsonResponse({
    ok: true,
    project: projectName,
    flow_ref: flowRef,
    flow_id: entry.flow_id,
    name: entry.name,
    type: entry.type,
    title: entry.title,
    status: entry.status,
    current_gate: entry.current_gate,
    updated_at: entry.updated_at,
    required_status_labels: requiredStatusLabels()
  });
}

async function handleWriteFlowArtifact(request: Request, env: Env, flowRef: string, store: RepoStore): Promise<Response> {
  const role = requireRole(request, env);
  const url = new URL(request.url);
  const body = await readJsonBody(request);
  const projectName = projectNameFrom(url, body);
  assertKnownProjectName(projectName);
  const artifactType = requireString(body.artifact_type, "artifact_type");
  const title = requireString(body.title, "title");
  const artifactBody = requireString(body.body, "body");

  const resolved = await flowIdOrError(env, projectName, flowRef, store);
  if (resolved instanceof Response) return resolved;
  const manifest = await loadFlowManifest(env, projectName, resolved.flowId, store);
  if (["completed", "archived"].includes(manifest.status)) {
    return errorResponse("FLOW_CLOSED", `Cannot write artifacts to ${manifest.status} flow`, 409);
  }
  const slotError = validateArtifactSlot(manifest.type, artifactType);
  if (slotError) {
    return errorResponse("ARTIFACT_SLOT_FORBIDDEN", slotError, 403);
  }
  const roleError = validateFlowArtifactRole(manifest.type, role, artifactType);
  if (roleError) {
    return errorResponse("ARTIFACT_ROLE_FORBIDDEN", roleError, 403);
  }
  if (manifest.type === "science_flow" && artifactType === "share_packet") {
    return errorResponse(
      "SCIENCE_SHARE_ROUTE_REQUIRED",
      "Official science share_packet must be created through /v1/science/share so Human approval, outbox, PM notification, and context update can be enforced",
      403
    );
  }

  const createdAt = utcIso();
  const artifactId = `ART-${utcDate()}-${shortId()}`;
  const path = flowArtifactPath(manifest.flow_id, artifactId, title);
  const document = buildArtifactDocument({
    artifactId,
    flowId: manifest.flow_id,
    project: projectName,
    role,
    artifactType,
    title,
    createdAt,
    body: artifactBody
  });
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  const written = await store.writeFile(env, project, path, document, `Write flow artifact ${artifactId} for ${manifest.flow_id}`);

  const summary: FlowArtifactSummary = {
    artifact_id: artifactId,
    artifact_type: artifactType,
    title,
    role,
    created_at: createdAt,
    source_path: written.path,
    source_sha: written.sha
  };
  manifest.artifacts.push(summary);
  manifest.updated_by_role = role;
  manifest.history.push(buildHistory("write_artifact", role, `Wrote ${artifactType}: ${artifactId}`));
  const manifestWrite = await writeFlowManifest(env, projectName, manifest, `Update flow manifest for ${artifactId}`, store);
  upsertIndexEntry(resolved.index, manifest);
  await writeFlowIndex(env, projectName, resolved.index, `Update flow index for ${manifest.flow_id}`, store);

  return jsonResponse({
    ok: true,
    project: projectName,
    flow_id: manifest.flow_id,
    flow_ref: flowRef,
    artifact: summary,
    manifest_path: manifestWrite.path,
    manifest_sha: manifestWrite.sha,
    required_status_labels: requiredStatusLabels()
  }, 201);
}

async function handleAdvanceFlow(request: Request, env: Env, flowRef: string, store: RepoStore): Promise<Response> {
  const role = requireRole(request, env);
  if (role !== "HUMAN") {
    return errorResponse("HUMAN_ADVANCEMENT_REQUIRED", "Only HUMAN may advance flow gates or status in Flow Core v0.3", 403);
  }
  const url = new URL(request.url);
  const body = await readJsonBody(request);
  const projectName = projectNameFrom(url, body);
  assertKnownProjectName(projectName);
  const gateState = requireString(body.gate_state, "gate_state");
  assertGateState(gateState);
  const status = optionalString(body.status) || "active";
  assertFlowStatus(status);
  const note = optionalString(body.note) || `Advanced to ${gateState}`;

  const resolved = await flowIdOrError(env, projectName, flowRef, store);
  if (resolved instanceof Response) return resolved;
  const manifest = await loadFlowManifest(env, projectName, resolved.flowId, store);
  const advanceError = validateGateAdvance(
    manifest.current_gate,
    gateState,
    status,
    manifest.artifacts.map(artifact => artifact.artifact_type),
    manifest.type
  );
  if (advanceError) {
    return errorResponse("FLOW_ADVANCEMENT_PRECONDITION_FAILED", advanceError, 409);
  }
  manifest.current_gate = gateState;
  manifest.status = status;
  manifest.updated_by_role = role;
  manifest.history.push(buildHistory("advance_flow", role, note));
  const written = await writeFlowManifest(env, projectName, manifest, `Advance flow ${manifest.flow_id}`, store);
  upsertIndexEntry(resolved.index, manifest);
  await writeFlowIndex(env, projectName, resolved.index, `Update flow index for ${manifest.flow_id}`, store);

  return jsonResponse({
    ok: true,
    project: projectName,
    flow_ref: flowRef,
    flow_id: manifest.flow_id,
    status: manifest.status,
    current_gate: manifest.current_gate,
    source_path: written.path,
    source_sha: written.sha,
    required_status_labels: requiredStatusLabels()
  });
}

export async function handleFlowsRequest(
  request: Request,
  env: Env,
  flowRef?: string,
  action: "collection" | "item" | "status" | "artifacts" | "advance" = "collection",
  repoStore: RepoStore = githubRepoStore
): Promise<Response> {
  try {
    if (action === "collection") {
      if (request.method === "POST") return await handleCreateFlow(request, env, repoStore);
      if (request.method === "GET") return await handleListFlows(request, env, repoStore);
      return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    }
    if (!flowRef) return errorResponse("INVALID_REQUEST", "Missing flow ref", 400);
    if (action === "item") {
      if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
      return await handleLoadFlow(request, env, flowRef, repoStore);
    }
    if (action === "status") {
      if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
      return await handleFlowStatus(request, env, flowRef, repoStore);
    }
    if (action === "artifacts") {
      if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
      return await handleWriteFlowArtifact(request, env, flowRef, repoStore);
    }
    if (action === "advance") {
      if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
      return await handleAdvanceFlow(request, env, flowRef, repoStore);
    }
    return errorResponse("NOT_FOUND", "Unknown flow action", 404);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) {
      return errorResponse("BAD_REQUEST", message, 400);
    }
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("not allowlisted") || message.includes("Forbidden path")) return errorResponse("POLICY_DENIED", message, 403);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
