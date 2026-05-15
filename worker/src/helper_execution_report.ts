import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { getProject } from "./projects";
import { STATUS_LABELS } from "./policy";
import { writeRouteScopedFlowArtifact } from "./flows";
import type { Env, Role } from "./types";

type AnyRecord = Record<string, any>;
type Artifact = { artifact_id: string; artifact_type: string; title: string; role: Role; created_at: string; source_path: string; source_sha?: string };
type FlowManifest = { schema_version: string; flow_id: string; type: string; artifacts: Artifact[]; [key: string]: any };

const INTAKE_INDEX_PATH = "governance/context/generated_helper_execution_intake_context.json";
const REPORT_INDEX_PATH = "governance/context/generated_helper_execution_report_context.json";
const LABELS = () => [...STATUS_LABELS];

function reqStr(v: unknown, f: string): string { if (typeof v !== "string" || !v.trim()) throw new Error(`Invalid or missing field: ${f}`); return v.trim(); }
function optStr(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function safe(v: string, max = 96): string { return v.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max); }
function iso(): string { return new Date().toISOString(); }
function j(v: unknown): string { return `${JSON.stringify(v, null, 2)}\n`; }
function recordPath(id: string): string { return `governance/context/helper_execution_report/${id}.json`; }
function manifestPath(flowId: string): string { return `governance/flows/${flowId}/flow_manifest.json`; }
function projectName(url: URL, body: AnyRecord): string { return optStr(body.project) || url.searchParams.get("project") || "ArqonZero"; }
function hasLabels(labels: string[] | undefined): boolean { return LABELS().every(l => Array.isArray(labels) && labels.includes(l)); }

async function fetchJson<T>(env: Env, project: string, path: string, store: RepoStore): Promise<T | null> {
  const cfg = getProject(project); if (!cfg) throw new Error(`Unknown project: ${project}`);
  try { return JSON.parse((await store.fetchFile(env, cfg, path)).content) as T; }
  catch (e) { if (e instanceof Error && e.message.includes("404")) return null; throw e; }
}
async function writeJson(env: Env, project: string, path: string, value: unknown, message: string, store: RepoStore): Promise<{ path: string; sha: string }> {
  const cfg = getProject(project); if (!cfg) throw new Error(`Unknown project: ${project}`);
  return store.writeFile(env, cfg, path, j(value), message);
}
async function parseResponse(response: Response): Promise<any> { const text = await response.text(); try { return text ? JSON.parse(text) : null; } catch { return text; } }
async function sha256Hex(value: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, "0")).join("");
}

function normalize(v: string): string { return v.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim(); }
function forbiddenEvidenceText(value: string, field: string): Response | null {
  const n = normalize(value);
  const forbidden: Array<[RegExp, string]> = [
    [/\bsealed test certified\b/, "sealed-test certified"],
    [/\bcertified\b/, "certified"],
    [/\bcertification complete\b/, "certification complete"],
    [/\bproduction ready\b/, "production ready"],
    [/\bready for production\b/, "ready for production"],
    [/\bpromotable\b/, "promotable"],
    [/\bapproved for release\b/, "approved for release"],
    [/\brelease ready\b/, "release ready"],
    [/\bdeployment complete\b/, "deployment complete"],
    [/\bdeployed to production\b/, "deployed to production"],
    [/\bdeploy now\b/, "deploy now"],
    [/\bno further review required\b/, "no further review required"]
  ];
  const hit = forbidden.find(([r]) => r.test(n));
  return hit ? errorResponse("HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", `${field} contains forbidden certification/promotion/deployment language: ${hit[1]}`, 409) : null;
}

function secretMaterialText(value: string, field: string): Response | null {
  const secretPatterns: Array<[RegExp, string]> = [
    [/BEGIN PRIVATE KEY/i, "BEGIN PRIVATE KEY"],
    [/GITHUB_APP_PRIVATE_KEY/i, "GITHUB_APP_PRIVATE_KEY"],
    [/BROKER_KEY_/i, "BROKER_KEY_"],
    [/Authorization:/i, "Authorization:"],
    [/\bBearer\s+/i, "Bearer "],
    [/\bapi_key\b/i, "api_key"],
    [/\btoken=/i, "token="]
  ];
  const hit = secretPatterns.find(([pattern]) => pattern.test(value));
  return hit ? errorResponse("HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", `${field} contains forbidden secret-like material: ${hit[1]}`, 409) : null;
}

function commandList(value: unknown): AnyRecord[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("commands must be a non-empty array");
  return value.map((item, idx) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`commands[${idx}] must be an object`);
    const rec = item as AnyRecord;
    const command = reqStr(rec.command, `commands[${idx}].command`);
    const purpose = reqStr(rec.purpose, `commands[${idx}].purpose`);
    const result = reqStr(rec.result, `commands[${idx}].result`);
    const exitCode = Number(rec.exit_code);
    if (!Number.isInteger(exitCode)) throw new Error(`commands[${idx}].exit_code must be an integer`);
    if (!["PASS", "FAIL", "SKIPPED"].includes(result)) throw new Error(`commands[${idx}].result must be PASS, FAIL, or SKIPPED`);
    return { command, purpose, result, exit_code: exitCode, stdout_excerpt: optStr(rec.stdout_excerpt).slice(0, 4000), stderr_excerpt: optStr(rec.stderr_excerpt).slice(0, 4000) };
  });
}

function validateCommandEvidence(commands: AnyRecord[]): Response | null {
  for (let idx = 0; idx < commands.length; idx += 1) {
    const command = commands[idx];
    const prefix = `commands[${idx}]`;
    const fields: Array<[string, string]> = [
      [`${prefix}.command`, command.command],
      [`${prefix}.purpose`, command.purpose],
      [`${prefix}.stdout_excerpt`, command.stdout_excerpt || ""],
      [`${prefix}.stderr_excerpt`, command.stderr_excerpt || ""]
    ];
    for (const [field, value] of fields) {
      const forbidden = forbiddenEvidenceText(value, field);
      if (forbidden) return forbidden;
    }
    for (const [field, value] of [[`${prefix}.stdout_excerpt`, command.stdout_excerpt || ""], [`${prefix}.stderr_excerpt`, command.stderr_excerpt || ""]] as Array<[string, string]>) {
      const secret = secretMaterialText(value, field);
      if (secret) return secret;
    }
  }
  return null;
}

async function loadIntakeEntry(env: Env, project: string, body: AnyRecord, store: RepoStore): Promise<{ id: string; path: string }> {
  const id = optStr(body.helper_execution_intake_id), path = optStr(body.helper_execution_intake_record_path);
  if (!id && !path) throw new Error("Invalid or missing field: helper_execution_intake_id or helper_execution_intake_record_path");
  const index = await fetchJson<AnyRecord>(env, project, INTAKE_INDEX_PATH, store);
  if (!index || index.schema_version !== "helper_execution_intake_context_index.v0.1" || !Array.isArray(index.entries)) throw new Error("Helper execution intake context index is missing or invalid");
  const entry = index.entries.find((e: AnyRecord) => id && path ? e.helper_execution_intake_id === id && e.helper_execution_intake_record_path === path : (id && e.helper_execution_intake_id === id) || (path && e.helper_execution_intake_record_path === path));
  if (!entry && id && path) throw new Error("Helper execution intake context fields conflict: helper_execution_intake_id and helper_execution_intake_record_path do not resolve to the same generated context entry");
  if (!entry) throw new Error(`No Helper execution intake context entry found for ${id || path}`);
  return { id: entry.helper_execution_intake_id, path: entry.helper_execution_intake_record_path };
}

function validateIntakeRecord(record: AnyRecord): Response | null {
  if (record.schema_version !== "helper_execution_intake_context.v0.1") return errorResponse("HELPER_EXECUTION_REPORT_INVALID_INTAKE_RECORD", "Helper execution intake record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "HELPER_AI") return errorResponse("HELPER_EXECUTION_REPORT_INVALID_INTAKE_AUTHORITY", "Helper execution intake record is not official Helper output", 409);
  const src = record.source_coder_handoff;
  if (!src || !src.share_packet_hash || !src.uncertainty) return errorResponse("HELPER_EXECUTION_REPORT_SOURCE_BOUNDARY_REQUIRED", "Helper intake record must preserve source boundary metadata", 409);
  if (!Array.isArray(src.resolved_source_artifacts) || src.resolved_source_artifacts.length === 0) return errorResponse("HELPER_EXECUTION_REPORT_RESOLVED_SOURCES_REQUIRED", "Helper intake must preserve resolved source metadata", 409);
  if (!record.output_artifacts?.helper_execution_intake) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_REQUIRED", "Helper intake record must include helper_execution_intake artifact", 409);
  if (!hasLabels(record.required_status_labels)) return errorResponse("HELPER_EXECUTION_REPORT_STATUS_LABELS_REQUIRED", "Helper intake record is missing required status labels", 409);
  return null;
}

function validateFlow(manifest: FlowManifest | null, record: AnyRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("HELPER_EXECUTION_REPORT_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  if (manifest.type !== "code_flow" || manifest.flow_id !== record.source_coder_handoff.code_flow_id) return errorResponse("HELPER_EXECUTION_REPORT_CODE_FLOW_REQUIRED", "Execution report target must be a code_flow", 409);
  const expected = record.output_artifacts.helper_execution_intake as Artifact;
  const actual = manifest.artifacts.find(a => a.artifact_id === expected.artifact_id);
  if (!actual) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain helper_execution_intake artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== "helper_execution_intake" || actual.role !== "HELPER_AI") return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_TYPE_MISMATCH", "Expected helper_execution_intake by HELPER_AI", 409);
  if (actual.source_path !== expected.source_path) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_SOURCE_MISMATCH", "Helper intake source path mismatch", 409);
  if (actual.source_sha !== expected.source_sha) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_SHA_MISMATCH", "Helper intake source SHA mismatch", 409);
  return null;
}

async function writeArtifact(request: Request, env: Env, project: string, flowId: string, artifactType: string, title: string, body: string, store: RepoStore): Promise<Artifact | Response> {
  const url = new URL(request.url);
  const r = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, { method: "POST", headers: new Headers({ authorization: request.headers.get("authorization") || "", "content-type": "application/json" }), body: JSON.stringify({ project, artifact_type: artifactType, title, body }) });
  const response = await writeRouteScopedFlowArtifact(r, env, flowId, store);
  const parsed = await parseResponse(response);
  if (!response.ok) return jsonResponse(parsed, response.status);
  if (!parsed?.artifact) return errorResponse("HELPER_EXECUTION_REPORT_ARTIFACT_WRITE_FAILED", `No artifact returned for ${artifactType}`, 500);
  return parsed.artifact as Artifact;
}

function mdReport(title: string, summary: string, commands: AnyRecord[], intake: AnyRecord): string {
  return `# ${title}

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Boundary

This records Helper execution evidence from an audited Helper execution intake.

It is not deployment, certification, promotion, Science behavior, or runtime personalization.

## Source

- helper_execution_intake_id: ${intake.helper_execution_intake_id}
- coder_handoff_id: ${intake.source_coder_handoff.coder_handoff_id}
- code_flow_id: ${intake.source_coder_handoff.code_flow_id}
- share_packet_hash: ${intake.source_coder_handoff.share_packet_hash}
- uncertainty: ${intake.source_coder_handoff.uncertainty}

## Summary

${summary}

## Command Results

${commands.map((c, i) => `${i + 1}. \`${c.command}\` — ${c.result} (exit ${c.exit_code})`).join("\n")}
`;
}
function mdCommandLog(commands: AnyRecord[]): string {
  return `# Helper Command Log

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

${commands.map((c, i) => `## Command ${i + 1}

Command:

${c.command}

Purpose:

${c.purpose}

Result:

${c.result}

Exit code:

${c.exit_code}

Stdout excerpt:

${c.stdout_excerpt || "(empty)"}

Stderr excerpt:

${c.stderr_excerpt || "(empty)"}
`).join("\n")}
`;
}
function mdEvidenceManifest(reportId: string, commands: AnyRecord[], intake: AnyRecord): string {
  return `# Helper Evidence Manifest

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

- helper_execution_report_id: ${reportId}
- helper_execution_intake_id: ${intake.helper_execution_intake_id}
- command_count: ${commands.length}
- contains_deployment_claim: false
- contains_certification_claim: false
- contains_promotion_claim: false
`;
}

export async function handleHelperExecutionReportRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "HELPER_AI") return errorResponse("HELPER_EXECUTION_REPORT_ROLE_FORBIDDEN", "Only HELPER_AI may create Helper execution reports", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    const body = await request.json().catch(() => null) as AnyRecord | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Missing or invalid JSON body");
    const url = new URL(request.url);
    const project = projectName(url, body);
    if (!getProject(project)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${project}`, 404);
    const idempotencyKey = reqStr(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(idempotencyKey)) return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    const title = reqStr(body.execution_title, "execution_title");
    const summary = reqStr(body.execution_summary, "execution_summary");
    const titleError = forbiddenEvidenceText(title, "execution_title"); if (titleError) return titleError;
    const summaryError = forbiddenEvidenceText(summary, "execution_summary"); if (summaryError) return summaryError;
    const commands = commandList(body.commands);
    const commandEvidenceError = validateCommandEvidence(commands); if (commandEvidenceError) return commandEvidenceError;

    const entry = await loadIntakeEntry(env, project, body, repoStore);
    const intake = await fetchJson<AnyRecord>(env, project, entry.path, repoStore);
    if (!intake) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_RECORD_NOT_FOUND", `No Helper execution intake record found for ${entry.id}`, 404);
    if (intake.helper_execution_intake_id !== entry.id || intake.helper_execution_intake_record_path !== entry.path) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_CONTEXT_MISMATCH", "Helper intake record does not match generated context", 409);
    const intakeError = validateIntakeRecord(intake); if (intakeError) return intakeError;
    const manifest = await fetchJson<FlowManifest>(env, project, manifestPath(intake.source_coder_handoff.code_flow_id), repoStore);
    const flowError = validateFlow(manifest, intake); if (flowError) return flowError;

    const reportId = `${safe(intake.helper_execution_intake_id, 90)}-${safe(idempotencyKey, 36)}`;
    const payloadHash = await sha256Hex(JSON.stringify({ project, idempotency_key: idempotencyKey, helper_execution_intake_id: intake.helper_execution_intake_id, helper_execution_intake_record_path: intake.helper_execution_intake_record_path, intake_payload_hash: intake.submitted_payload_hash, execution_title: title, execution_summary: summary, commands }));
    const path = recordPath(reportId);
    const existing = await fetchJson<AnyRecord>(env, project, path, repoStore);
    if (existing && existing.schema_version !== "helper_execution_report_context.v0.1") return errorResponse("HELPER_EXECUTION_REPORT_EXISTING_RECORD_INVALID", "Existing Helper execution report idempotency record has invalid schema", 409);
    if (existing) {
      if (existing.submitted_payload_hash !== payloadHash) return errorResponse("HELPER_EXECUTION_REPORT_IDEMPOTENCY_CONFLICT", "Existing Helper execution report payload hash does not match", 409);
      return jsonResponse({ ok: true, idempotent_replay: true, helper_execution_report: existing, required_status_labels: LABELS() }, 200);
    }

    const flowId = intake.source_coder_handoff.code_flow_id;
    const executionReport = await writeArtifact(request, env, project, flowId, "execution_report", title, mdReport(title, summary, commands, intake), repoStore); if (executionReport instanceof Response) return executionReport;
    const commandLog = await writeArtifact(request, env, project, flowId, "command_log", `${title} Command Log`, mdCommandLog(commands), repoStore); if (commandLog instanceof Response) return commandLog;
    const evidenceManifest = await writeArtifact(request, env, project, flowId, "evidence_manifest", `${title} Evidence Manifest`, mdEvidenceManifest(reportId, commands, intake), repoStore); if (evidenceManifest instanceof Response) return evidenceManifest;

    const record: AnyRecord = {
      schema_version: "helper_execution_report_context.v0.1", official_artifact: true, project, helper_execution_report_id: reportId, idempotency_key: idempotencyKey, created_at: iso(), created_by_role: "HELPER_AI",
      source_helper_execution_intake: { helper_execution_intake_id: intake.helper_execution_intake_id, helper_execution_intake_record_path: intake.helper_execution_intake_record_path, coder_handoff_id: intake.source_coder_handoff.coder_handoff_id, implementation_bundle_id: intake.source_coder_handoff.implementation_bundle_id, code_flow_id: flowId, share_id: intake.source_coder_handoff.share_id, science_flow_id: intake.source_coder_handoff.science_flow_id, share_packet_hash: intake.source_coder_handoff.share_packet_hash, helper_execution_intake_payload_hash: intake.submitted_payload_hash, evidence_level: intake.source_coder_handoff.evidence_level, uncertainty: intake.source_coder_handoff.uncertainty, source_artifacts: intake.source_coder_handoff.source_artifacts, resolved_source_artifacts: intake.source_coder_handoff.resolved_source_artifacts, allowed_claims: intake.source_coder_handoff.allowed_claims, forbidden_claims: intake.source_coder_handoff.forbidden_claims },
      command_count: commands.length, commands, output_artifacts: { execution_report: executionReport, command_log: commandLog, evidence_manifest: evidenceManifest }, submitted_payload_hash: payloadHash, helper_execution_report_record_path: path, generated_helper_execution_report_context_path: REPORT_INDEX_PATH, required_status_labels: LABELS()
    };

    const index = await fetchJson<AnyRecord>(env, project, REPORT_INDEX_PATH, repoStore) || { schema_version: "helper_execution_report_context_index.v0.1", project, updated_at: iso(), entries: [] };
    if (!Array.isArray(index.entries)) index.entries = [];
    const idx = { helper_execution_report_id: reportId, helper_execution_intake_id: intake.helper_execution_intake_id, coder_handoff_id: intake.source_coder_handoff.coder_handoff_id, code_flow_id: flowId, share_id: intake.source_coder_handoff.share_id, share_packet_hash: intake.source_coder_handoff.share_packet_hash, evidence_level: intake.source_coder_handoff.evidence_level, uncertainty: intake.source_coder_handoff.uncertainty, helper_execution_report_record_path: path, created_at: record.created_at };
    index.entries = index.entries.filter((e: AnyRecord) => e.helper_execution_report_id !== reportId); index.entries.unshift(idx); index.updated_at = iso();
    const indexWrite = await writeJson(env, project, REPORT_INDEX_PATH, index, `Update Helper execution report context ${reportId}`, repoStore);
    record.generated_helper_execution_report_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, project, path, record, `Write Helper execution report ${reportId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project, helper_execution_report: { ...record, helper_execution_report_record_sha: recordWrite.sha }, required_status_labels: LABELS() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be") || message.includes("commands")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("Helper execution intake context fields conflict")) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_CONTEXT_MISMATCH", message, 409);
    if (message.includes("No Helper execution intake context entry") || message.includes("Helper execution intake context index is missing")) return errorResponse("HELPER_EXECUTION_REPORT_INTAKE_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
