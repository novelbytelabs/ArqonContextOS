import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { getProject } from "./projects";
import { STATUS_LABELS } from "./policy";
import { writeRouteScopedFlowArtifact } from "./flows";
import type { Env, Role } from "./types";

type Obj = Record<string, any>;
interface FlowArtifactSummary { artifact_id: string; artifact_type: string; title: string; role: Role; created_at: string; source_path: string; source_sha?: string; }
interface FlowManifest { schema_version: "flow_manifest.v0.3"; flow_id: string; type: string; artifacts: FlowArtifactSummary[]; }

function labels(): string[] { return [...STATUS_LABELS]; }
function opt(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function req(v: unknown, f: string): string { if (typeof v !== "string" || !v.trim()) throw new Error(`Invalid or missing field: ${f}`); return v.trim(); }
function safe(v: string, max = 96): string { return v.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max); }
function now(): string { return new Date().toISOString(); }
function json(v: unknown): string { return `${JSON.stringify(v, null, 2)}\n`; }
function indexPath(): string { return "governance/context/generated_coder_implementation_bundle_context.json"; }
function handoffIndexPath(): string { return "governance/context/generated_coder_handoff_context.json"; }
function recordPath(id: string): string { return `governance/context/coder_handoff/${id}.json`; }
function manifestPath(id: string): string { return `governance/flows/${id}/flow_manifest.json`; }
function hasLabels(xs: string[] | undefined): boolean { return labels().every(x => Array.isArray(xs) && xs.includes(x)); }
function projectName(url: URL, body: Obj): string { return opt(body.project) || url.searchParams.get("project") || "ArqonZero"; }
function authHeaders(request: Request): Headers { const h = new Headers({ "content-type": "application/json" }); const a = request.headers.get("authorization"); if (a) h.set("authorization", a); return h; }

async function readBody(request: Request): Promise<Obj> { const b = await request.json().catch(() => null); if (!b || typeof b !== "object" || Array.isArray(b)) throw new Error("Missing or invalid JSON body"); return b as Obj; }
async function sha256Hex(value: string): Promise<string> { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, "0")).join(""); }
async function fetchJson<T>(env: Env, projectName: string, path: string, store: RepoStore): Promise<T | null> { const p = getProject(projectName); if (!p) throw new Error(`Unknown project: ${projectName}`); try { const f = await store.fetchFile(env, p, path); return JSON.parse(f.content) as T; } catch (e) { if (e instanceof Error && e.message.includes("404")) return null; throw e; } }
async function writeJson(env: Env, projectName: string, path: string, value: unknown, message: string, store: RepoStore): Promise<{ path: string; sha: string }> { const p = getProject(projectName); if (!p) throw new Error(`Unknown project: ${projectName}`); return store.writeFile(env, p, path, json(value), message); }
async function parseResponse(r: Response): Promise<any> { const t = await r.text(); if (!t) return null; try { return JSON.parse(t); } catch { return t; } }

function normalize(s: string): string { return s.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim(); }
function validateText(value: string): Response | null {
  const n = normalize(value);
  const promotion: Array<[RegExp, string]> = [[/\bsealed test certified\b/, "sealed-test certified"], [/\bcertified\b/, "certified"], [/\bcertification\b/, "certification"], [/\bproduction ready\b/, "production ready"], [/\bready for production\b/, "ready for production"], [/\bproduct ready\b/, "product ready"], [/\bpromotable\b/, "promotable"], [/\bapproved for release\b/, "approved for release"], [/\brelease ready\b/, "release ready"]];
  const p = promotion.find(([r]) => r.test(n));
  if (p) return errorResponse("CODER_HANDOFF_FORBIDDEN_CLAIM_INCLUDED", `Coder handoff contains forbidden promotion language: ${p[1]}`, 409);
  const exec: Array<[RegExp, string]> = [[/\bhelper may execute\b/, "helper may execute"], [/\bhelper can execute\b/, "helper can execute"], [/\bexecution is authorized\b/, "execution is authorized"], [/\bauthorized for execution\b/, "authorized for execution"], [/\bapply the patch\b/, "apply the patch"], [/\bdeploy now\b/, "deploy now"], [/\bno further review required\b/, "no further review required"], [/\bready for helper execution\b/, "ready for helper execution"], [/\bhelper should run\b/, "helper should run"], [/\brun the commands\b/, "run the commands"], [/\bexecute the bundle\b/, "execute the bundle"]];
  const e = exec.find(([r]) => r.test(n));
  if (e) return errorResponse("CODER_HANDOFF_EXECUTION_AUTHORITY_FORBIDDEN", `Coder handoff may not authorize Helper execution: ${e[1]}`, 409);
  return null;
}

async function loadBundleEntry(env: Env, projectName: string, body: Obj, store: RepoStore): Promise<{ implementation_bundle_id: string; implementation_bundle_record_path: string }> {
  const id = opt(body.implementation_bundle_id);
  const path = opt(body.implementation_bundle_record_path);
  if (!id && !path) throw new Error("Invalid or missing field: implementation_bundle_id or implementation_bundle_record_path");
  const idx = await fetchJson<Obj>(env, projectName, indexPath(), store);
  if (!idx || idx.schema_version !== "coder_implementation_bundle_context_index.v0.1" || !Array.isArray(idx.entries)) throw new Error("Coder implementation bundle context index is missing or invalid");
  const entry = idx.entries.find((x: Obj) => id && path ? x.implementation_bundle_id === id && x.implementation_bundle_record_path === path : (id && x.implementation_bundle_id === id) || (path && x.implementation_bundle_record_path === path));
  if (!entry && id && path) throw new Error("Coder implementation bundle context fields conflict: implementation_bundle_id and implementation_bundle_record_path do not resolve to the same generated context entry");
  if (!entry) throw new Error(`No Coder implementation bundle context entry found for ${id || path}`);
  return { implementation_bundle_id: entry.implementation_bundle_id, implementation_bundle_record_path: entry.implementation_bundle_record_path };
}

function validateBundleRecord(record: Obj): Response | null {
  if (record.schema_version !== "coder_implementation_bundle_context.v0.1") return errorResponse("CODER_HANDOFF_INVALID_IMPLEMENTATION_BUNDLE_RECORD", "Implementation bundle record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "CODER_AI") return errorResponse("CODER_HANDOFF_INVALID_IMPLEMENTATION_BUNDLE_AUTHORITY", "Implementation bundle record is not official Coder output", 409);
  if (!record.source_coder_tasks || !record.output_artifacts?.implementation_bundle) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_INCOMPLETE", "Implementation bundle record is missing source Coder tasks or implementation_bundle artifact", 409);
  if (!record.source_coder_tasks.share_packet_hash || !record.source_coder_tasks.uncertainty) return errorResponse("CODER_HANDOFF_SOURCE_BOUNDARY_REQUIRED", "Implementation bundle record must preserve share hash and uncertainty", 409);
  if (!Array.isArray(record.source_coder_tasks.forbidden_claims) || record.source_coder_tasks.forbidden_claims.length === 0) return errorResponse("CODER_HANDOFF_FORBIDDEN_CLAIMS_REQUIRED", "Implementation bundle record must preserve forbidden claims", 409);
  if (!Array.isArray(record.source_coder_tasks.resolved_source_artifacts) || record.source_coder_tasks.resolved_source_artifacts.length === 0) return errorResponse("CODER_HANDOFF_RESOLVED_SOURCES_REQUIRED", "Implementation bundle record must preserve resolved source metadata", 409);
  if (!hasLabels(record.required_status_labels)) return errorResponse("CODER_HANDOFF_STATUS_LABELS_REQUIRED", "Implementation bundle record is missing required diagnostic status labels", 409);
  return null;
}

function validateManifest(manifest: FlowManifest | null, record: Obj): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("CODER_HANDOFF_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_coder_tasks.code_flow_id) return errorResponse("CODER_HANDOFF_CODE_FLOW_REQUIRED", "Coder handoff target must be a code_flow", 409);
  const expected = record.output_artifacts.implementation_bundle as FlowArtifactSummary;
  const actual = manifest.artifacts.find(a => a.artifact_id === expected.artifact_id);
  if (!actual) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain required implementation_bundle artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== "implementation_bundle" || actual.role !== "CODER_AI") return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_ARTIFACT_TYPE_MISMATCH", `Expected implementation_bundle by CODER_AI for ${expected.artifact_id}`, 409);
  if (actual.source_path !== expected.source_path) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_ARTIFACT_SOURCE_MISMATCH", `Implementation bundle artifact source path mismatch for ${expected.artifact_id}`, 409);
  if (actual.source_sha !== expected.source_sha) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_ARTIFACT_SHA_MISMATCH", `Implementation bundle artifact source sha mismatch for ${expected.artifact_id}`, 409);
  return null;
}

function handoffId(implId: string, key: string): string { return `${safe(implId, 90)}-${safe(key, 36)}`; }
function markdown(record: Obj, id: string, title: string, body: string): string {
  return `# ${title}\n\nRequired status:\n\nREQUIRES_HUMAN_REVIEW  \ndevelopment diagnostic only  \nNOT SEALED-TEST CERTIFIED  \nnot promotable\n\n## Coder Handoff Boundary\n\nThis is a Coder-owned handoff package derived from an accepted implementation_bundle.\n\nIt is not Helper execution authorization, not an executed patch, not deployment, not audit certification, and not promotion.\n\n## Source Chain\n\n- coder_handoff_id: ${id}\n- implementation_bundle_id: ${record.implementation_bundle_id}\n- coder_tasks_id: ${record.source_coder_tasks.coder_tasks_id}\n- code_flow_id: ${record.source_coder_tasks.code_flow_id}\n- share_packet_hash: ${record.source_coder_tasks.share_packet_hash}\n- implementation_bundle_payload_hash: ${record.submitted_payload_hash}\n- evidence_level: ${record.source_coder_tasks.evidence_level}\n- uncertainty: ${record.source_coder_tasks.uncertainty}\n\n## Coder Handoff Body\n\n${body}\n\n## Non-Execution Rule\n\nHelper execution, patch application, deployment, audit, promotion, and Human advancement require later explicit gated stages.\n`;
}

async function writeArtifact(request: Request, env: Env, flowId: string, projectName: string, title: string, body: string, store: RepoStore): Promise<FlowArtifactSummary | Response> {
  const url = new URL(request.url);
  const r = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, { method: "POST", headers: authHeaders(request), body: JSON.stringify({ project: projectName, artifact_type: "coder_handoff", title, body }) });
  const response = await writeRouteScopedFlowArtifact(r, env, flowId, store);
  const parsed = await parseResponse(response);
  if (!response.ok) return jsonResponse(parsed, response.status);
  const artifact = (parsed as { artifact?: FlowArtifactSummary }).artifact;
  if (!artifact) return errorResponse("CODER_HANDOFF_ARTIFACT_WRITE_FAILED", "Artifact write did not return coder_handoff summary", 500);
  return artifact;
}

async function loadHandoffIndex(env: Env, projectName: string, store: RepoStore): Promise<Obj> {
  const existing = await fetchJson<Obj>(env, projectName, handoffIndexPath(), store);
  if (existing && existing.schema_version === "coder_handoff_context_index.v0.1" && Array.isArray(existing.entries)) return existing;
  return { schema_version: "coder_handoff_context_index.v0.1", project: projectName, updated_at: now(), entries: [] };
}

function upsertIndex(index: Obj, record: Obj): void {
  const entry = {
    coder_handoff_id: record.coder_handoff_id,
    implementation_bundle_id: record.source_implementation_bundle.implementation_bundle_id,
    coder_tasks_id: record.source_implementation_bundle.coder_tasks_id,
    code_flow_id: record.source_implementation_bundle.code_flow_id,
    share_packet_hash: record.source_implementation_bundle.share_packet_hash,
    evidence_level: record.source_implementation_bundle.evidence_level,
    uncertainty: record.source_implementation_bundle.uncertainty,
    coder_handoff_record_path: record.coder_handoff_record_path,
    created_at: record.created_at
  };
  const i = index.entries.findIndex((x: Obj) => x.coder_handoff_id === record.coder_handoff_id);
  if (i >= 0) index.entries[i] = entry; else index.entries.push(entry);
  index.updated_at = now();
  index.entries.sort((a: Obj, b: Obj) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function handleCoderHandoffRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "CODER_AI") return errorResponse("CODER_HANDOFF_ROLE_FORBIDDEN", "Only CODER_AI may create Coder handoff artifacts", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    const url = new URL(request.url);
    const body = await readBody(request);
    const project = projectName(url, body);
    if (!getProject(project)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${project}`, 404);
    const key = req(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(key)) return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    const title = req(body.handoff_title, "handoff_title");
    const handoffBody = req(body.handoff_body, "handoff_body");
    const titleError = validateText(title); if (titleError) return titleError;
    const bodyError = validateText(handoffBody); if (bodyError) return bodyError;

    const entry = await loadBundleEntry(env, project, body, repoStore);
    const bundle = await fetchJson<Obj>(env, project, entry.implementation_bundle_record_path, repoStore);
    if (!bundle) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_RECORD_NOT_FOUND", `No Coder implementation bundle record found for ${entry.implementation_bundle_id}`, 404);
    if (bundle.implementation_bundle_id !== entry.implementation_bundle_id || bundle.implementation_bundle_record_path !== entry.implementation_bundle_record_path) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_CONTEXT_MISMATCH", "Implementation bundle record does not match generated implementation bundle context", 409);
    const recordError = validateBundleRecord(bundle); if (recordError) return recordError;
    const manifest = await fetchJson<FlowManifest>(env, project, manifestPath(bundle.source_coder_tasks.code_flow_id), repoStore);
    const manifestError = validateManifest(manifest, bundle); if (manifestError) return manifestError;

    const id = handoffId(bundle.implementation_bundle_id, key);
    const payloadHash = await sha256Hex(JSON.stringify({ project, idempotency_key: key, implementation_bundle_id: bundle.implementation_bundle_id, implementation_bundle_record_path: bundle.implementation_bundle_record_path, implementation_bundle_payload_hash: bundle.submitted_payload_hash, share_packet_hash: bundle.source_coder_tasks.share_packet_hash, handoff_title: title, handoff_body: handoffBody }));
    const path = recordPath(id);
    const existing = await fetchJson<Obj>(env, project, path, repoStore);
    if (existing && existing.schema_version !== "coder_handoff_context.v0.1") return errorResponse("CODER_HANDOFF_EXISTING_RECORD_INVALID", "Existing Coder handoff idempotency record has invalid schema", 409);
    if (existing && existing.schema_version === "coder_handoff_context.v0.1") {
      if (existing.submitted_payload_hash !== payloadHash) return errorResponse("CODER_HANDOFF_IDEMPOTENCY_CONFLICT", "Existing Coder handoff idempotency record exists but submitted payload hash does not match", 409);
      return jsonResponse({ ok: true, idempotent_replay: true, coder_handoff: existing, required_status_labels: labels() }, 200);
    }

    const artifact = await writeArtifact(request, env, bundle.source_coder_tasks.code_flow_id, project, title, markdown(bundle, id, title, handoffBody), repoStore);
    if (artifact instanceof Response) return artifact;
    const created = now();
    const record: Obj = {
      schema_version: "coder_handoff_context.v0.1", official_artifact: true, project, coder_handoff_id: id, idempotency_key: key, created_at: created, created_by_role: "CODER_AI",
      source_implementation_bundle: { implementation_bundle_id: bundle.implementation_bundle_id, implementation_bundle_record_path: bundle.implementation_bundle_record_path, ...bundle.source_coder_tasks, pm_handoff_id: bundle.source_coder_tasks.handoff_id, implementation_bundle_payload_hash: bundle.submitted_payload_hash },
      output_artifacts: { coder_handoff: artifact }, submitted_payload_hash: payloadHash, coder_handoff_record_path: path, generated_coder_handoff_context_path: handoffIndexPath(), required_status_labels: labels()
    };
    const idx = await loadHandoffIndex(env, project, repoStore); upsertIndex(idx, record);
    const idxWrite = await writeJson(env, project, handoffIndexPath(), idx, `Update Coder handoff context ${id}`, repoStore);
    record.generated_coder_handoff_context_sha = idxWrite.sha;
    const recWrite = await writeJson(env, project, path, record, `Write Coder handoff record ${id}`, repoStore);
    return jsonResponse({ ok: true, idempotent_replay: false, project, coder_handoff: { ...record, coder_handoff_record_sha: recWrite.sha }, required_status_labels: labels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("Coder implementation bundle context fields conflict")) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_CONTEXT_MISMATCH", message, 409);
    if (message.includes("No Coder implementation bundle context entry")) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_CONTEXT_NOT_FOUND", message, 404);
    if (message.includes("Coder implementation bundle context index is missing")) return errorResponse("CODER_HANDOFF_IMPLEMENTATION_BUNDLE_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
