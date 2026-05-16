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

const REPORT_INDEX_PATH = "governance/context/generated_helper_execution_report_context.json";
const REVIEW_INDEX_PATH = "governance/context/generated_auditor_helper_execution_review_context.json";
const LABELS = () => [...STATUS_LABELS];
const VERDICTS = new Set(["AUDITOR_REVIEW_PASS", "REQUIRES_REVISION", "BLOCKED"]);

function reqStr(v: unknown, f: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`Invalid or missing field: ${f}`);
  return v.trim();
}
function optStr(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function safe(v: string, max = 96): string { return v.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max); }
function iso(): string { return new Date().toISOString(); }
function j(v: unknown): string { return `${JSON.stringify(v, null, 2)}\n`; }
function recordPath(id: string): string { return `governance/context/auditor_helper_execution_review/${id}.json`; }
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
async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}
async function sha256Hex(value: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, "0")).join("");
}

function normalize(v: string): string { return v.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim(); }
function forbiddenReviewText(value: string, field: string): Response | null {
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
    [/\bhuman advancement approved\b/, "human advancement approved"],
    [/\bno further review required\b/, "no further review required"]
  ];
  const hit = forbidden.find(([r]) => r.test(n));
  return hit ? errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_FORBIDDEN_CLAIM_INCLUDED", `${field} contains forbidden advancement/certification/promotion/deployment language: ${hit[1]}`, 409) : null;
}
function secretText(value: string, field: string): Response | null {
  const patterns: Array<[RegExp, string]> = [
    [/BEGIN PRIVATE KEY/i, "BEGIN PRIVATE KEY"],
    [/GITHUB_APP_PRIVATE_KEY/i, "GITHUB_APP_PRIVATE_KEY"],
    [/BROKER_KEY_/i, "BROKER_KEY_"],
    [/Authorization:/i, "Authorization:"],
    [/\bBearer\s+/i, "Bearer "],
    [/\bapi_key\b/i, "api_key"],
    [/\btoken=/i, "token="]
  ];
  const hit = patterns.find(([p]) => p.test(value));
  return hit ? errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_SECRET_MATERIAL_FORBIDDEN", `${field} contains forbidden secret-like material: ${hit[1]}`, 409) : null;
}
function validateText(value: string, field: string): Response | null {
  return forbiddenReviewText(value, field) || secretText(value, field);
}
function findingList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v, i) => reqStr(v, `findings[${i}]`));
}

async function loadReportEntry(env: Env, project: string, body: AnyRecord, store: RepoStore): Promise<{ id: string; path: string }> {
  const id = optStr(body.helper_execution_report_id);
  const path = optStr(body.helper_execution_report_record_path);
  if (!id && !path) throw new Error("Invalid or missing field: helper_execution_report_id or helper_execution_report_record_path");
  const index = await fetchJson<AnyRecord>(env, project, REPORT_INDEX_PATH, store);
  if (!index || index.schema_version !== "helper_execution_report_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("Helper execution report context index is missing or invalid");
  }
  const entry = index.entries.find((e: AnyRecord) => {
    if (id && path) return e.helper_execution_report_id === id && e.helper_execution_report_record_path === path;
    return (id && e.helper_execution_report_id === id) || (path && e.helper_execution_report_record_path === path);
  });
  if (!entry && id && path) throw new Error("Helper execution report context fields conflict: helper_execution_report_id and helper_execution_report_record_path do not resolve to the same generated context entry");
  if (!entry) throw new Error(`No Helper execution report context entry found for ${id || path}`);
  return { id: entry.helper_execution_report_id, path: entry.helper_execution_report_record_path };
}

function artifactByType(record: AnyRecord, artifactType: string): Artifact | null {
  const artifact = record.output_artifacts?.[artifactType];
  return artifact && artifact.artifact_type === artifactType ? artifact as Artifact : null;
}
function validateReportRecord(record: AnyRecord): Response | null {
  if (record.schema_version !== "helper_execution_report_context.v0.1") return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_INVALID_REPORT_RECORD", "Helper execution report record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "HELPER_AI") return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_INVALID_REPORT_AUTHORITY", "Helper execution report is not official Helper output", 409);
  if (!record.source_helper_execution_intake?.share_packet_hash || !record.source_helper_execution_intake?.uncertainty) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_SOURCE_BOUNDARY_REQUIRED", "Helper execution report must preserve source boundary metadata", 409);
  if (!Array.isArray(record.source_helper_execution_intake.resolved_source_artifacts) || record.source_helper_execution_intake.resolved_source_artifacts.length === 0) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_RESOLVED_SOURCES_REQUIRED", "Helper execution report must preserve resolved source metadata", 409);
  if (!artifactByType(record, "execution_report") || !artifactByType(record, "command_log") || !artifactByType(record, "evidence_manifest")) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACTS_REQUIRED", "Helper execution report must include execution_report, command_log, and evidence_manifest", 409);
  if (!Number.isInteger(record.command_count) || record.command_count < 1 || !Array.isArray(record.commands) || record.commands.length < 1) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_COMMAND_EVIDENCE_REQUIRED", "Helper execution report must include command evidence", 409);
  if (!hasLabels(record.required_status_labels)) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_STATUS_LABELS_REQUIRED", "Helper execution report is missing required status labels", 409);
  return null;
}
function validateArtifactInFlow(manifest: FlowManifest, expected: Artifact, kind: string): Response | null {
  const actual = manifest.artifacts.find(a => a.artifact_id === expected.artifact_id);
  if (!actual) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain ${kind} artifact ${expected.artifact_id}`, 409);
  if (actual.artifact_type !== expected.artifact_type || actual.role !== "HELPER_AI") return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_TYPE_MISMATCH", `Expected ${kind} by HELPER_AI`, 409);
  if (actual.source_path !== expected.source_path) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_SOURCE_MISMATCH", `${kind} source path mismatch`, 409);
  if (actual.source_sha !== expected.source_sha) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_SHA_MISMATCH", `${kind} source SHA mismatch`, 409);
  return null;
}
function validateFlow(manifest: FlowManifest | null, record: AnyRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  const flowId = record.source_helper_execution_intake.code_flow_id;
  if (manifest.type !== "code_flow" || manifest.flow_id !== flowId) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_CODE_FLOW_REQUIRED", "Auditor review target must be a code_flow", 409);
  for (const kind of ["execution_report", "command_log", "evidence_manifest"]) {
    const artifact = artifactByType(record, kind);
    if (!artifact) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACTS_REQUIRED", `Missing ${kind}`, 409);
    const error = validateArtifactInFlow(manifest, artifact, kind);
    if (error) return error;
  }
  return null;
}
async function writeArtifact(request: Request, env: Env, project: string, flowId: string, title: string, body: string, store: RepoStore): Promise<Artifact | Response> {
  const url = new URL(request.url);
  const r = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: new Headers({ authorization: request.headers.get("authorization") || "", "content-type": "application/json" }),
    body: JSON.stringify({ project, artifact_type: "helper_execution_review", title, body })
  });
  const response = await writeRouteScopedFlowArtifact(r, env, flowId, store);
  const parsed = await parseResponse(response);
  if (!response.ok) return jsonResponse(parsed, response.status);
  if (!parsed?.artifact) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_WRITE_FAILED", "No artifact returned for helper_execution_review", 500);
  return parsed.artifact as Artifact;
}
function mdReview(title: string, summary: string, verdict: string, findings: string[], report: AnyRecord): string {
  return `# ${title}

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Boundary

This is an Auditor-owned review of Helper execution evidence.

It is not Human advancement, deployment, certification, promotion, Science behavior, or runtime personalization.

## Verdict

${verdict}

## Source

- helper_execution_report_id: ${report.helper_execution_report_id}
- helper_execution_intake_id: ${report.source_helper_execution_intake.helper_execution_intake_id}
- code_flow_id: ${report.source_helper_execution_intake.code_flow_id}
- share_packet_hash: ${report.source_helper_execution_intake.share_packet_hash}
- command_count: ${report.command_count}
- uncertainty: ${report.source_helper_execution_intake.uncertainty}

## Summary

${summary}

## Findings

${findings.length ? findings.map(f => `- ${f}`).join("\n") : "- No additional findings recorded."}

## Non-Advancement Rule

Human advancement requires a later explicit Human gate.
`;
}

export async function handleAuditorHelperExecutionReviewRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "AUDITOR_AI") return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_ROLE_FORBIDDEN", "Only AUDITOR_AI may create Helper execution reviews", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);

    const body = await request.json().catch(() => null) as AnyRecord | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Missing or invalid JSON body");
    const url = new URL(request.url);
    const project = projectName(url, body);
    if (!getProject(project)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${project}`, 404);

    const idempotencyKey = reqStr(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(idempotencyKey)) return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    const title = reqStr(body.review_title, "review_title");
    const summary = reqStr(body.review_summary, "review_summary");
    const verdict = reqStr(body.review_verdict, "review_verdict");
    if (!VERDICTS.has(verdict)) return errorResponse("BAD_REQUEST", "review_verdict must be AUDITOR_REVIEW_PASS, REQUIRES_REVISION, or BLOCKED", 400);
    const findings = findingList(body.findings);

    for (const [field, value] of [["review_title", title], ["review_summary", summary], ["review_verdict", verdict]] as Array<[string, string]>) {
      const error = validateText(value, field);
      if (error) return error;
    }
    for (let i = 0; i < findings.length; i += 1) {
      const error = validateText(findings[i], `findings[${i}]`);
      if (error) return error;
    }

    const entry = await loadReportEntry(env, project, body, repoStore);
    const report = await fetchJson<AnyRecord>(env, project, entry.path, repoStore);
    if (!report) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_REPORT_NOT_FOUND", `No Helper execution report record found for ${entry.id}`, 404);
    if (report.helper_execution_report_id !== entry.id || report.helper_execution_report_record_path !== entry.path) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_REPORT_CONTEXT_MISMATCH", "Helper execution report does not match generated context", 409);
    const reportError = validateReportRecord(report);
    if (reportError) return reportError;
    const manifest = await fetchJson<FlowManifest>(env, project, manifestPath(report.source_helper_execution_intake.code_flow_id), repoStore);
    const flowError = validateFlow(manifest, report);
    if (flowError) return flowError;

    const reviewId = `${safe(report.helper_execution_report_id, 90)}-${safe(idempotencyKey, 36)}`;
    const payloadHash = await sha256Hex(JSON.stringify({ project, idempotency_key: idempotencyKey, helper_execution_report_id: report.helper_execution_report_id, helper_execution_report_record_path: report.helper_execution_report_record_path, helper_execution_report_payload_hash: report.submitted_payload_hash, review_title: title, review_summary: summary, review_verdict: verdict, findings }));
    const path = recordPath(reviewId);
    const existing = await fetchJson<AnyRecord>(env, project, path, repoStore);
    if (existing && existing.schema_version !== "auditor_helper_execution_review_context.v0.1") return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_EXISTING_RECORD_INVALID", "Existing Auditor review idempotency record has invalid schema", 409);
    if (existing) {
      if (existing.submitted_payload_hash !== payloadHash) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_IDEMPOTENCY_CONFLICT", "Existing Auditor review payload hash does not match", 409);
      return jsonResponse({ ok: true, idempotent_replay: true, auditor_helper_execution_review: existing, required_status_labels: LABELS() }, 200);
    }

    const flowId = report.source_helper_execution_intake.code_flow_id;
    const reviewArtifact = await writeArtifact(request, env, project, flowId, title, mdReview(title, summary, verdict, findings, report), repoStore);
    if (reviewArtifact instanceof Response) return reviewArtifact;

    const record: AnyRecord = {
      schema_version: "auditor_helper_execution_review_context.v0.1",
      official_artifact: true,
      project,
      auditor_helper_execution_review_id: reviewId,
      idempotency_key: idempotencyKey,
      created_at: iso(),
      created_by_role: "AUDITOR_AI",
      review_verdict: verdict,
      findings,
      source_helper_execution_report: {
        helper_execution_report_id: report.helper_execution_report_id,
        helper_execution_report_record_path: report.helper_execution_report_record_path,
        helper_execution_intake_id: report.source_helper_execution_intake.helper_execution_intake_id,
        coder_handoff_id: report.source_helper_execution_intake.coder_handoff_id,
        implementation_bundle_id: report.source_helper_execution_intake.implementation_bundle_id,
        code_flow_id: flowId,
        share_id: report.source_helper_execution_intake.share_id,
        science_flow_id: report.source_helper_execution_intake.science_flow_id,
        share_packet_hash: report.source_helper_execution_intake.share_packet_hash,
        helper_execution_report_payload_hash: report.submitted_payload_hash,
        evidence_level: report.source_helper_execution_intake.evidence_level,
        uncertainty: report.source_helper_execution_intake.uncertainty,
        source_artifacts: report.source_helper_execution_intake.source_artifacts,
        resolved_source_artifacts: report.source_helper_execution_intake.resolved_source_artifacts,
        allowed_claims: report.source_helper_execution_intake.allowed_claims,
        forbidden_claims: report.source_helper_execution_intake.forbidden_claims
      },
      output_artifacts: { helper_execution_review: reviewArtifact },
      submitted_payload_hash: payloadHash,
      auditor_helper_execution_review_record_path: path,
      generated_auditor_helper_execution_review_context_path: REVIEW_INDEX_PATH,
      required_status_labels: LABELS()
    };

    const index = await fetchJson<AnyRecord>(env, project, REVIEW_INDEX_PATH, repoStore) || { schema_version: "auditor_helper_execution_review_context_index.v0.1", project, updated_at: iso(), entries: [] };
    if (!Array.isArray(index.entries)) index.entries = [];
    const idx = { auditor_helper_execution_review_id: reviewId, helper_execution_report_id: report.helper_execution_report_id, helper_execution_intake_id: report.source_helper_execution_intake.helper_execution_intake_id, code_flow_id: flowId, share_id: report.source_helper_execution_intake.share_id, share_packet_hash: report.source_helper_execution_intake.share_packet_hash, review_verdict: verdict, evidence_level: report.source_helper_execution_intake.evidence_level, uncertainty: report.source_helper_execution_intake.uncertainty, auditor_helper_execution_review_record_path: path, created_at: record.created_at };
    index.entries = index.entries.filter((e: AnyRecord) => e.auditor_helper_execution_review_id !== reviewId);
    index.entries.unshift(idx);
    index.updated_at = iso();
    const indexWrite = await writeJson(env, project, REVIEW_INDEX_PATH, index, `Update Auditor helper execution review context ${reviewId}`, repoStore);
    record.generated_auditor_helper_execution_review_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, project, path, record, `Write Auditor helper execution review ${reviewId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project, auditor_helper_execution_review: { ...record, auditor_helper_execution_review_record_sha: recordWrite.sha }, required_status_labels: LABELS() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be") || message.includes("findings")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("Helper execution report context fields conflict")) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_REPORT_CONTEXT_MISMATCH", message, 409);
    if (message.includes("No Helper execution report context entry") || message.includes("Helper execution report context index is missing")) return errorResponse("AUDITOR_HELPER_EXECUTION_REVIEW_REPORT_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
