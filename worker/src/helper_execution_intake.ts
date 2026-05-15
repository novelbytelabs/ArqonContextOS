import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { getProject } from "./projects";
import { STATUS_LABELS } from "./policy";
import { writeRouteScopedFlowArtifact } from "./flows";
import type { Env, Role } from "./types";

type Artifact = { artifact_id: string; artifact_type: string; title: string; role: Role; created_at: string; source_path: string; source_sha?: string };
type Manifest = { schema_version: string; flow_id: string; type: string; artifacts: Artifact[]; required_status_labels?: string[] };
type AnyRecord = Record<string, any>;

function labels(): string[] { return [...STATUS_LABELS]; }
function opt(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function req(v: unknown, f: string): string { if (typeof v !== "string" || !v.trim()) throw new Error(`Invalid or missing field: ${f}`); return v.trim(); }
function projectName(url: URL, body: AnyRecord): string { return opt(body.project) || url.searchParams.get("project") || "ArqonZero"; }
function safe(v: string, max = 96): string { return v.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max); }
function now(): string { return new Date().toISOString(); }
function fmt(v: unknown): string { return `${JSON.stringify(v, null, 2)}\n`; }
function hasLabels(xs: unknown): boolean { return labels().every(label => Array.isArray(xs) && xs.includes(label)); }
function authHeaders(request: Request): Headers { const h = new Headers({ "content-type": "application/json" }); const a = request.headers.get("authorization"); if (a) h.set("authorization", a); return h; }
function normalize(s: string): string { return s.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim(); }

function validateText(value: string, field: string): Response | null {
  const x = normalize(value);
  const promo: Array<[RegExp,string]> = [[/\bsealed test certified\b/,"sealed-test certified"],[/\bcertified\b/,"certified"],[/\bcertification\b/,"certification"],[/\bproduction ready\b/,"production ready"],[/\bproduction readiness\b/,"production readiness"],[/\bready for production\b/,"ready for production"],[/\bproduct ready\b/,"product ready"],[/\bpromotable\b/,"promotable"],[/\bapproved for release\b/,"approved for release"],[/\brelease ready\b/,"release ready"],[/\bdeployed\b/,"deployed"],[/\bdeployment complete\b/,"deployment complete"]];
  const p = promo.find(([r]) => r.test(x));
  if (p) return errorResponse("HELPER_EXECUTION_INTAKE_FORBIDDEN_CLAIM_INCLUDED", `${field} contains forbidden promotion/deployment language: ${p[1]}`, 409);
  const exec: Array<[RegExp,string]> = [[/\bcommands were run\b/,"commands were run"],[/\bcommand executed\b/,"command executed"],[/\bpatch applied\b/,"patch applied"],[/\bapplied the patch\b/,"applied the patch"],[/\btests passed\b/,"tests passed"],[/\bexecution complete\b/,"execution complete"],[/\bhelper executed\b/,"helper executed"],[/\bno further review required\b/,"no further review required"],[/\bdeploy now\b/,"deploy now"]];
  const e = exec.find(([r]) => r.test(x));
  if (e) return errorResponse("HELPER_EXECUTION_INTAKE_EXECUTION_CLAIM_FORBIDDEN", `${field} may not claim execution or authorize deployment: ${e[1]}`, 409);
  return null;
}

async function bodyJson(request: Request): Promise<AnyRecord> { const b = await request.json().catch(() => null); if (!b || typeof b !== "object" || Array.isArray(b)) throw new Error("Missing or invalid JSON body"); return b as AnyRecord; }
async function fetchJson<T>(env: Env, project: string, path: string, store: RepoStore): Promise<T | null> { const p = getProject(project); if (!p) throw new Error(`Unknown project: ${project}`); try { return JSON.parse((await store.fetchFile(env, p, path)).content) as T; } catch (e) { if (e instanceof Error && e.message.includes("404")) return null; throw e; } }
async function writeJson(env: Env, project: string, path: string, value: unknown, message: string, store: RepoStore): Promise<{path:string; sha:string}> { const p = getProject(project); if (!p) throw new Error(`Unknown project: ${project}`); return store.writeFile(env, p, path, fmt(value), message); }
async function parseResponse(r: Response): Promise<unknown> { const t = await r.text(); if (!t) return null; try { return JSON.parse(t); } catch { return t; } }
async function sha(value: string): Promise<string> { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2,"0")).join(""); }

const handoffIndexPath = () => "governance/context/generated_coder_handoff_context.json";
const intakeIndexPath = () => "governance/context/generated_helper_execution_intake_context.json";
const intakeRecordPath = (id: string) => `governance/context/helper_execution_intake/${id}.json`;
const manifestPath = (flowId: string) => `governance/flows/${flowId}/flow_manifest.json`;

async function loadHandoffEntry(env: Env, project: string, body: AnyRecord, store: RepoStore): Promise<{coder_handoff_id:string; coder_handoff_record_path:string}> {
  const id = opt(body.coder_handoff_id), path = opt(body.coder_handoff_record_path);
  if (!id && !path) throw new Error("Invalid or missing field: coder_handoff_id or coder_handoff_record_path");
  const index = await fetchJson<AnyRecord>(env, project, handoffIndexPath(), store);
  if (!index || index.schema_version !== "coder_handoff_context_index.v0.1" || !Array.isArray(index.entries)) throw new Error("Coder handoff context index is missing or invalid");
  const entry = index.entries.find((item: AnyRecord) => id && path ? item.coder_handoff_id === id && item.coder_handoff_record_path === path : (id && item.coder_handoff_id === id) || (path && item.coder_handoff_record_path === path));
  if (!entry && id && path) throw new Error("Coder handoff context fields conflict: coder_handoff_id and coder_handoff_record_path do not resolve to the same generated context entry");
  if (!entry) throw new Error(`No Coder handoff context entry found for ${id || path}`);
  return { coder_handoff_id: entry.coder_handoff_id, coder_handoff_record_path: entry.coder_handoff_record_path };
}

function validateHandoffRecord(record: AnyRecord): Response | null {
  if (record.schema_version !== "coder_handoff_context.v0.1") return errorResponse("HELPER_EXECUTION_INTAKE_INVALID_HANDOFF_RECORD", "Coder handoff record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "CODER_AI") return errorResponse("HELPER_EXECUTION_INTAKE_INVALID_HANDOFF_AUTHORITY", "Coder handoff record is not official Coder output", 409);
  if (!record.source_implementation_bundle || !record.output_artifacts?.coder_handoff) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_INCOMPLETE", "Coder handoff record is missing source implementation bundle or output artifact", 409);
  if (!record.source_implementation_bundle.share_packet_hash || !record.source_implementation_bundle.uncertainty) return errorResponse("HELPER_EXECUTION_INTAKE_SOURCE_BOUNDARY_REQUIRED", "Coder handoff record must preserve share hash and uncertainty", 409);
  if (!Array.isArray(record.source_implementation_bundle.forbidden_claims) || record.source_implementation_bundle.forbidden_claims.length === 0) return errorResponse("HELPER_EXECUTION_INTAKE_FORBIDDEN_CLAIMS_REQUIRED", "Coder handoff record must preserve forbidden claims", 409);
  if (!Array.isArray(record.source_implementation_bundle.resolved_source_artifacts) || record.source_implementation_bundle.resolved_source_artifacts.length === 0) return errorResponse("HELPER_EXECUTION_INTAKE_RESOLVED_SOURCES_REQUIRED", "Coder handoff record must preserve resolved source metadata", 409);
  if (!hasLabels(record.required_status_labels)) return errorResponse("HELPER_EXECUTION_INTAKE_STATUS_LABELS_REQUIRED", "Coder handoff record is missing required diagnostic status labels", 409);
  return null;
}

function validateManifest(manifest: Manifest | null, record: AnyRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("HELPER_EXECUTION_INTAKE_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_implementation_bundle.code_flow_id) return errorResponse("HELPER_EXECUTION_INTAKE_CODE_FLOW_REQUIRED", "Helper execution intake target must be a code_flow", 409);
  const expected = record.output_artifacts.coder_handoff as Artifact;
  const actual = manifest.artifacts.find(a => a.artifact_id === expected.artifact_id);
  if (!actual) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain required coder_handoff artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== "coder_handoff" || actual.role !== "CODER_AI") return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_ARTIFACT_TYPE_MISMATCH", `Expected coder_handoff by CODER_AI for ${expected.artifact_id}`, 409);
  if (actual.source_path !== expected.source_path) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_ARTIFACT_SOURCE_MISMATCH", `Coder handoff artifact source path mismatch for ${expected.artifact_id}`, 409);
  if (actual.source_sha !== expected.source_sha) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_ARTIFACT_SHA_MISMATCH", `Coder handoff artifact source sha mismatch for ${expected.artifact_id}`, 409);
  return null;
}

function buildId(handoffId: string, key: string): string { return `${safe(handoffId, 90)}-${safe(key, 36)}`; }
function markdown(record: AnyRecord, id: string, title: string, text: string): string { const src = record.source_implementation_bundle; return `# ${title}\n\nRequired status:\n\nREQUIRES_HUMAN_REVIEW  \ndevelopment diagnostic only  \nNOT SEALED-TEST CERTIFIED  \nnot promotable\n\n## Helper Execution Intake Boundary\n\nThis is a Helper-owned intake artifact derived from an audited Coder handoff. It records receipt for later controlled work. It is not command execution, not patch application, not deployment, not audit certification, and not promotion.\n\n## Source Chain\n\n- helper_execution_intake_id: ${id}\n- coder_handoff_id: ${record.coder_handoff_id}\n- implementation_bundle_id: ${src.implementation_bundle_id}\n- code_flow_id: ${src.code_flow_id}\n- share_packet_hash: ${src.share_packet_hash}\n- coder_handoff_payload_hash: ${record.submitted_payload_hash}\n- evidence_level: ${src.evidence_level}\n- uncertainty: ${src.uncertainty}\n\n## Intake Body\n\n${text}\n\n## Non-Execution Rule\n\nActual commands, patch application, deployment, audit, promotion, and Human advancement require later explicit gated stages.\n`; }

async function writeArtifact(request: Request, env: Env, flowId: string, project: string, type: string, title: string, body: string, store: RepoStore): Promise<Artifact | Response> { const url = new URL(request.url); const req = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, { method: "POST", headers: authHeaders(request), body: JSON.stringify({ project, artifact_type: type, title, body }) }); const res = await writeRouteScopedFlowArtifact(req, env, flowId, store); const parsed = await parseResponse(res); if (!res.ok) return jsonResponse(parsed, res.status); const artifact = (parsed as { artifact?: Artifact }).artifact; if (!artifact) return errorResponse("HELPER_EXECUTION_INTAKE_ARTIFACT_WRITE_FAILED", `Artifact write did not return summary for ${type}`, 500); return artifact; }
async function loadIndex(env: Env, project: string, store: RepoStore): Promise<AnyRecord> { const existing = await fetchJson<AnyRecord>(env, project, intakeIndexPath(), store); if (existing?.schema_version === "helper_execution_intake_context_index.v0.1" && Array.isArray(existing.entries)) return existing; return { schema_version: "helper_execution_intake_context_index.v0.1", project, updated_at: now(), entries: [] }; }
function upsert(index: AnyRecord, record: AnyRecord): void { const entry = { helper_execution_intake_id: record.helper_execution_intake_id, coder_handoff_id: record.source_coder_handoff.coder_handoff_id, implementation_bundle_id: record.source_coder_handoff.implementation_bundle_id, coder_tasks_id: record.source_coder_handoff.coder_tasks_id, code_flow_id: record.source_coder_handoff.code_flow_id, share_id: record.source_coder_handoff.share_id, science_flow_id: record.source_coder_handoff.science_flow_id, share_packet_hash: record.source_coder_handoff.share_packet_hash, evidence_level: record.source_coder_handoff.evidence_level, uncertainty: record.source_coder_handoff.uncertainty, helper_execution_intake_record_path: record.helper_execution_intake_record_path, created_at: record.created_at }; const i = index.entries.findIndex((x: AnyRecord) => x.helper_execution_intake_id === record.helper_execution_intake_id); if (i >= 0) index.entries[i] = entry; else index.entries.push(entry); index.updated_at = now(); index.entries.sort((a: AnyRecord,b: AnyRecord) => Date.parse(b.created_at)-Date.parse(a.created_at)); }

export async function handleHelperExecutionIntakeRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "HELPER_AI") return errorResponse("HELPER_EXECUTION_INTAKE_ROLE_FORBIDDEN", "Only HELPER_AI may create Helper execution-intake artifacts", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    const url = new URL(request.url); const body = await bodyJson(request); const project = projectName(url, body); if (!getProject(project)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${project}`, 404);
    const key = req(body.idempotency_key, "idempotency_key"); if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(key)) return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    const title = req(body.intake_title, "intake_title"); const intakeBody = req(body.intake_body, "intake_body"); const titleError = validateText(title, "intake_title"); if (titleError) return titleError; const bodyError = validateText(intakeBody, "intake_body"); if (bodyError) return bodyError;
    const entry = await loadHandoffEntry(env, project, body, repoStore); const handoff = await fetchJson<AnyRecord>(env, project, entry.coder_handoff_record_path, repoStore); if (!handoff) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_RECORD_NOT_FOUND", `No Coder handoff record found for ${entry.coder_handoff_id}`, 404);
    if (handoff.coder_handoff_id !== entry.coder_handoff_id || handoff.coder_handoff_record_path !== entry.coder_handoff_record_path) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_CONTEXT_MISMATCH", "Coder handoff record does not match generated Coder handoff context", 409);
    const recordError = validateHandoffRecord(handoff); if (recordError) return recordError; const manifest = await fetchJson<Manifest>(env, project, manifestPath(handoff.source_implementation_bundle.code_flow_id), repoStore); const manifestError = validateManifest(manifest, handoff); if (manifestError) return manifestError;
    const id = buildId(handoff.coder_handoff_id, key); const payloadHash = await sha(JSON.stringify({ project, idempotency_key: key, coder_handoff_id: handoff.coder_handoff_id, coder_handoff_record_path: handoff.coder_handoff_record_path, coder_handoff_payload_hash: handoff.submitted_payload_hash, share_packet_hash: handoff.source_implementation_bundle.share_packet_hash, intake_title: title, intake_body: intakeBody }));
    const recPath = intakeRecordPath(id); const existing = await fetchJson<AnyRecord>(env, project, recPath, repoStore); if (existing && existing.schema_version !== "helper_execution_intake_context.v0.1") return errorResponse("HELPER_EXECUTION_INTAKE_EXISTING_RECORD_INVALID", "Existing Helper execution-intake idempotency record has invalid schema", 409); if (existing?.schema_version === "helper_execution_intake_context.v0.1") { if (existing.submitted_payload_hash !== payloadHash) return errorResponse("HELPER_EXECUTION_INTAKE_IDEMPOTENCY_CONFLICT", "Existing Helper execution-intake idempotency record exists but submitted payload hash does not match", 409); return jsonResponse({ ok: true, idempotent_replay: true, helper_execution_intake: existing, required_status_labels: labels() }, 200); }
    const artifact = await writeArtifact(request, env, handoff.source_implementation_bundle.code_flow_id, project, "helper_execution_intake", title, markdown(handoff, id, title, intakeBody), repoStore); if (artifact instanceof Response) return artifact;
    const created = now(); const src = handoff.source_implementation_bundle; const record: AnyRecord = { schema_version: "helper_execution_intake_context.v0.1", official_artifact: true, project, helper_execution_intake_id: id, idempotency_key: key, created_at: created, created_by_role: "HELPER_AI", source_coder_handoff: { coder_handoff_id: handoff.coder_handoff_id, coder_handoff_record_path: handoff.coder_handoff_record_path, implementation_bundle_id: src.implementation_bundle_id, coder_tasks_id: src.coder_tasks_id, coder_work_plan_id: src.coder_work_plan_id, tasking_id: src.tasking_id, code_flow_id: src.code_flow_id, plan_id: src.plan_id, specification_id: src.specification_id, intake_id: src.intake_id, pm_handoff_id: src.pm_handoff_id, share_id: src.share_id, science_flow_id: src.science_flow_id, share_packet_hash: src.share_packet_hash, submitted_share_payload_hash: src.submitted_share_payload_hash, handoff_payload_hash: src.handoff_payload_hash, intake_payload_hash: src.intake_payload_hash, specification_payload_hash: src.specification_payload_hash, plan_payload_hash: src.plan_payload_hash, tasking_payload_hash: src.tasking_payload_hash, coder_work_plan_payload_hash: src.coder_work_plan_payload_hash, coder_tasks_payload_hash: src.coder_tasks_payload_hash, implementation_bundle_payload_hash: src.implementation_bundle_payload_hash, coder_handoff_payload_hash: handoff.submitted_payload_hash, evidence_level: src.evidence_level, uncertainty: src.uncertainty, source_artifacts: src.source_artifacts, resolved_source_artifacts: src.resolved_source_artifacts, allowed_claims: src.allowed_claims, forbidden_claims: src.forbidden_claims }, output_artifacts: { helper_execution_intake: artifact }, submitted_payload_hash: payloadHash, helper_execution_intake_record_path: recPath, generated_helper_execution_intake_context_path: intakeIndexPath(), required_status_labels: labels() };
    const index = await loadIndex(env, project, repoStore); upsert(index, record); const iw = await writeJson(env, project, intakeIndexPath(), index, `Update Helper execution-intake context ${id}`, repoStore); record.generated_helper_execution_intake_context_sha = iw.sha; const rw = await writeJson(env, project, recPath, record, `Write Helper execution-intake record ${id}`, repoStore);
    return jsonResponse({ ok: true, idempotent_replay: false, project, helper_execution_intake: { ...record, helper_execution_intake_record_sha: rw.sha }, required_status_labels: labels() }, 201);
  } catch (err) {
    if (err instanceof Response) return err; const message = err instanceof Error ? err.message : String(err); if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) return errorResponse("BAD_REQUEST", message, 400); if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404); if (message.includes("Coder handoff context fields conflict")) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_CONTEXT_MISMATCH", message, 409); if (message.includes("No Coder handoff context entry") || message.includes("Coder handoff context index is missing")) return errorResponse("HELPER_EXECUTION_INTAKE_HANDOFF_CONTEXT_NOT_FOUND", message, 404); return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
