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

const REVIEW_INDEX_PATH = "governance/context/generated_auditor_helper_execution_review_context.json";
const DECISION_INDEX_PATH = "governance/context/generated_human_advancement_decision_context.json";
const OUTCOMES = new Set(["advance", "require_revision", "reject", "quarantine"]);
const LABELS = () => [...STATUS_LABELS];

function reqStr(v: unknown, f: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`Invalid or missing field: ${f}`);
  return v.trim();
}
function optStr(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function safe(v: string, max = 96): string { return v.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, max); }
function iso(): string { return new Date().toISOString(); }
function j(v: unknown): string { return `${JSON.stringify(v, null, 2)}\n`; }
function recordPath(id: string): string { return `governance/context/human_advancement_decision/${id}.json`; }
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
function forbiddenDecisionText(value: string, field: string): Response | null {
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
    [/\bautomatic approval\b/, "automatic approval"],
    [/\bai approved advancement\b/, "AI-approved advancement"],
    [/\bno further review required\b/, "no further review required"]
  ];
  const hit = forbidden.find(([r]) => r.test(n));
  return hit ? errorResponse("HUMAN_ADVANCEMENT_DECISION_FORBIDDEN_CLAIM_INCLUDED", `${field} contains forbidden certification/promotion/deployment/automation language: ${hit[1]}`, 409) : null;
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
  return hit ? errorResponse("HUMAN_ADVANCEMENT_DECISION_SECRET_MATERIAL_FORBIDDEN", `${field} contains forbidden secret-like material: ${hit[1]}`, 409) : null;
}
function validateText(value: string, field: string): Response | null {
  return forbiddenDecisionText(value, field) || secretText(value, field);
}
function stringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v, i) => reqStr(v, `${field}[${i}]`));
}

async function loadReviewEntry(env: Env, project: string, body: AnyRecord, store: RepoStore): Promise<{ id: string; path: string }> {
  const id = optStr(body.auditor_helper_execution_review_id);
  const path = optStr(body.auditor_helper_execution_review_record_path);
  if (!id && !path) throw new Error("Invalid or missing field: auditor_helper_execution_review_id or auditor_helper_execution_review_record_path");
  const index = await fetchJson<AnyRecord>(env, project, REVIEW_INDEX_PATH, store);
  if (!index || index.schema_version !== "auditor_helper_execution_review_context_index.v0.1" || !Array.isArray(index.entries)) {
    throw new Error("Auditor helper execution review context index is missing or invalid");
  }
  const entry = index.entries.find((e: AnyRecord) => {
    if (id && path) return e.auditor_helper_execution_review_id === id && e.auditor_helper_execution_review_record_path === path;
    return (id && e.auditor_helper_execution_review_id === id) || (path && e.auditor_helper_execution_review_record_path === path);
  });
  if (!entry && id && path) throw new Error("Auditor helper execution review context fields conflict: auditor_helper_execution_review_id and auditor_helper_execution_review_record_path do not resolve to the same generated context entry");
  if (!entry) throw new Error(`No Auditor helper execution review context entry found for ${id || path}`);
  return { id: entry.auditor_helper_execution_review_id, path: entry.auditor_helper_execution_review_record_path };
}

function validateReviewRecord(record: AnyRecord): Response | null {
  if (record.schema_version !== "auditor_helper_execution_review_context.v0.1") return errorResponse("HUMAN_ADVANCEMENT_DECISION_INVALID_REVIEW_RECORD", "Auditor helper execution review record schema is invalid", 409);
  if (record.official_artifact !== true || record.created_by_role !== "AUDITOR_AI") return errorResponse("HUMAN_ADVANCEMENT_DECISION_INVALID_REVIEW_AUTHORITY", "Auditor helper execution review is not official Auditor output", 409);
  if (!record.source_helper_execution_report?.share_packet_hash || !record.source_helper_execution_report?.uncertainty) return errorResponse("HUMAN_ADVANCEMENT_DECISION_SOURCE_BOUNDARY_REQUIRED", "Auditor review must preserve source boundary metadata", 409);
  if (!Array.isArray(record.source_helper_execution_report.resolved_source_artifacts) || record.source_helper_execution_report.resolved_source_artifacts.length === 0) return errorResponse("HUMAN_ADVANCEMENT_DECISION_RESOLVED_SOURCES_REQUIRED", "Auditor review must preserve resolved source metadata", 409);
  if (!record.output_artifacts?.helper_execution_review) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_ARTIFACT_REQUIRED", "Auditor review must include helper_execution_review artifact", 409);
  if (!hasLabels(record.required_status_labels)) return errorResponse("HUMAN_ADVANCEMENT_DECISION_STATUS_LABELS_REQUIRED", "Auditor review is missing required status labels", 409);
  return null;
}
function validateReviewArtifact(manifest: FlowManifest | null, record: AnyRecord): Response | null {
  if (!manifest || manifest.schema_version !== "flow_manifest.v0.3") return errorResponse("HUMAN_ADVANCEMENT_DECISION_CODE_FLOW_NOT_FOUND", "Code flow manifest not found", 404);
  const flowId = record.source_helper_execution_report.code_flow_id;
  if (manifest.type !== "code_flow" || manifest.flow_id !== flowId) return errorResponse("HUMAN_ADVANCEMENT_DECISION_CODE_FLOW_REQUIRED", "Human advancement decision target must be a code_flow", 409);
  const expected = record.output_artifacts.helper_execution_review as Artifact;
  const actual = manifest.artifacts.find(a => a.artifact_id === expected.artifact_id);
  if (!actual) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_ARTIFACT_NOT_ON_CODE_FLOW", `Code flow does not contain helper_execution_review artifact ${expected.artifact_id}`, 409);
  if (expected.role !== "AUDITOR_AI" || actual.role !== "AUDITOR_AI" || expected.artifact_type !== "helper_execution_review" || actual.artifact_type !== "helper_execution_review") return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_ARTIFACT_TYPE_MISMATCH", "Expected helper_execution_review by AUDITOR_AI", 409);
  if (actual.source_path !== expected.source_path) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_ARTIFACT_SOURCE_MISMATCH", "helper_execution_review source path mismatch", 409);
  if (actual.source_sha !== expected.source_sha) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_ARTIFACT_SHA_MISMATCH", "helper_execution_review source SHA mismatch", 409);
  return null;
}

async function writeArtifact(request: Request, env: Env, project: string, flowId: string, title: string, body: string, store: RepoStore): Promise<Artifact | Response> {
  const url = new URL(request.url);
  const r = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: new Headers({ authorization: request.headers.get("authorization") || "", "content-type": "application/json" }),
    body: JSON.stringify({ project, artifact_type: "human_advancement_decision", title, body })
  });
  const response = await writeRouteScopedFlowArtifact(r, env, flowId, store);
  const parsed = await parseResponse(response);
  if (!response.ok) return jsonResponse(parsed, response.status);
  if (!parsed?.artifact) return errorResponse("HUMAN_ADVANCEMENT_DECISION_ARTIFACT_WRITE_FAILED", "No artifact returned for human_advancement_decision", 500);
  return parsed.artifact as Artifact;
}

function mdDecision(title: string, summary: string, outcome: string, nextAction: string, blockers: string[], review: AnyRecord): string {
  return `# ${title}

Required status:

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Boundary

This is a Human-owned advancement decision.

It is not deployment, certification, promotion, production readiness, or sealed-test certification.

## Decision Outcome

${outcome}

## Source

- auditor_helper_execution_review_id: ${review.auditor_helper_execution_review_id}
- helper_execution_report_id: ${review.source_helper_execution_report.helper_execution_report_id}
- helper_execution_intake_id: ${review.source_helper_execution_report.helper_execution_intake_id}
- code_flow_id: ${review.source_helper_execution_report.code_flow_id}
- share_packet_hash: ${review.source_helper_execution_report.share_packet_hash}
- auditor_review_verdict: ${review.review_verdict}
- uncertainty: ${review.source_helper_execution_report.uncertainty}

## Decision Summary

${summary}

## Required Next Action

${nextAction}

## Unresolved Blockers

${blockers.length ? blockers.map(b => `- ${b}`).join("\n") : "- None declared."}

## Non-Promotion Rule

This decision only controls whether the chain may move to the next bounded stage. It does not deploy, certify, promote, or declare production readiness.
`;
}

export async function handleHumanAdvancementDecisionRequest(request: Request, env: Env, repoStore: RepoStore = githubRepoStore): Promise<Response> {
  try {
    const role = requireRole(request, env);
    if (role !== "HUMAN") return errorResponse("HUMAN_ADVANCEMENT_DECISION_ROLE_FORBIDDEN", "Only HUMAN may create Human advancement decisions", 403);
    if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);

    const body = await request.json().catch(() => null) as AnyRecord | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Missing or invalid JSON body");
    const url = new URL(request.url);
    const project = projectName(url, body);
    if (!getProject(project)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${project}`, 404);

    const idempotencyKey = reqStr(body.idempotency_key, "idempotency_key");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/.test(idempotencyKey)) return errorResponse("BAD_REQUEST", "idempotency_key must be 8-128 chars and contain only letters, numbers, dot, underscore, or dash", 400);
    const title = reqStr(body.decision_title, "decision_title");
    const summary = reqStr(body.decision_summary, "decision_summary");
    const outcome = reqStr(body.decision_outcome, "decision_outcome");
    const nextAction = reqStr(body.required_next_action, "required_next_action");
    if (!OUTCOMES.has(outcome)) return errorResponse("BAD_REQUEST", "decision_outcome must be advance, require_revision, reject, or quarantine", 400);
    const unresolvedBlockers = stringList(body.unresolved_blockers, "unresolved_blockers");
    const findings = stringList(body.findings, "findings");

    for (const [field, value] of [["decision_title", title], ["decision_summary", summary], ["decision_outcome", outcome], ["required_next_action", nextAction]] as Array<[string, string]>) {
      const error = validateText(value, field);
      if (error) return error;
    }
    for (let i = 0; i < unresolvedBlockers.length; i += 1) {
      const error = validateText(unresolvedBlockers[i], `unresolved_blockers[${i}]`);
      if (error) return error;
    }
    for (let i = 0; i < findings.length; i += 1) {
      const error = validateText(findings[i], `findings[${i}]`);
      if (error) return error;
    }

    const entry = await loadReviewEntry(env, project, body, repoStore);
    const review = await fetchJson<AnyRecord>(env, project, entry.path, repoStore);
    if (!review) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_NOT_FOUND", `No Auditor helper execution review record found for ${entry.id}`, 404);
    if (review.auditor_helper_execution_review_id !== entry.id || review.auditor_helper_execution_review_record_path !== entry.path) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_CONTEXT_MISMATCH", "Auditor review does not match generated context", 409);
    const reviewError = validateReviewRecord(review);
    if (reviewError) return reviewError;
    const manifest = await fetchJson<FlowManifest>(env, project, manifestPath(review.source_helper_execution_report.code_flow_id), repoStore);
    const artifactError = validateReviewArtifact(manifest, review);
    if (artifactError) return artifactError;

    if (outcome === "advance" && review.review_verdict !== "AUDITOR_REVIEW_PASS") return errorResponse("HUMAN_ADVANCEMENT_DECISION_AUDITOR_REVIEW_NOT_PASS", "advance requires source Auditor review verdict AUDITOR_REVIEW_PASS", 409);
    if (outcome === "advance" && unresolvedBlockers.length > 0) return errorResponse("HUMAN_ADVANCEMENT_DECISION_UNRESOLVED_BLOCKERS_PRESENT", "advance is forbidden while unresolved blockers are present", 409);

    const decisionId = `${safe(review.auditor_helper_execution_review_id, 90)}-${safe(idempotencyKey, 36)}`;
    const payloadHash = await sha256Hex(JSON.stringify({ project, idempotency_key: idempotencyKey, auditor_helper_execution_review_id: review.auditor_helper_execution_review_id, auditor_helper_execution_review_record_path: review.auditor_helper_execution_review_record_path, review_payload_hash: review.submitted_payload_hash, decision_title: title, decision_summary: summary, decision_outcome: outcome, required_next_action: nextAction, unresolved_blockers: unresolvedBlockers, findings }));
    const path = recordPath(decisionId);
    const existing = await fetchJson<AnyRecord>(env, project, path, repoStore);
    if (existing && existing.schema_version !== "human_advancement_decision_context.v0.1") return errorResponse("HUMAN_ADVANCEMENT_DECISION_EXISTING_RECORD_INVALID", "Existing Human decision idempotency record has invalid schema", 409);
    if (existing) {
      if (existing.submitted_payload_hash !== payloadHash) return errorResponse("HUMAN_ADVANCEMENT_DECISION_IDEMPOTENCY_CONFLICT", "Existing Human decision payload hash does not match", 409);
      return jsonResponse({ ok: true, idempotent_replay: true, human_advancement_decision: existing, required_status_labels: LABELS() }, 200);
    }

    const flowId = review.source_helper_execution_report.code_flow_id;
    const decisionArtifact = await writeArtifact(request, env, project, flowId, title, mdDecision(title, summary, outcome, nextAction, unresolvedBlockers, review), repoStore);
    if (decisionArtifact instanceof Response) return decisionArtifact;

    const record: AnyRecord = {
      schema_version: "human_advancement_decision_context.v0.1",
      official_artifact: true,
      project,
      human_advancement_decision_id: decisionId,
      idempotency_key: idempotencyKey,
      created_at: iso(),
      created_by_role: "HUMAN",
      decision_outcome: outcome,
      decision_summary: summary,
      required_next_action: nextAction,
      unresolved_blockers: unresolvedBlockers,
      findings,
      source_auditor_helper_execution_review: {
        auditor_helper_execution_review_id: review.auditor_helper_execution_review_id,
        auditor_helper_execution_review_record_path: review.auditor_helper_execution_review_record_path,
        helper_execution_report_id: review.source_helper_execution_report.helper_execution_report_id,
        helper_execution_intake_id: review.source_helper_execution_report.helper_execution_intake_id,
        coder_handoff_id: review.source_helper_execution_report.coder_handoff_id,
        implementation_bundle_id: review.source_helper_execution_report.implementation_bundle_id,
        code_flow_id: flowId,
        share_id: review.source_helper_execution_report.share_id,
        science_flow_id: review.source_helper_execution_report.science_flow_id,
        share_packet_hash: review.source_helper_execution_report.share_packet_hash,
        auditor_review_payload_hash: review.submitted_payload_hash,
        review_verdict: review.review_verdict,
        evidence_level: review.source_helper_execution_report.evidence_level,
        uncertainty: review.source_helper_execution_report.uncertainty,
        source_artifacts: review.source_helper_execution_report.source_artifacts,
        resolved_source_artifacts: review.source_helper_execution_report.resolved_source_artifacts,
        allowed_claims: review.source_helper_execution_report.allowed_claims,
        forbidden_claims: review.source_helper_execution_report.forbidden_claims
      },
      output_artifacts: { human_advancement_decision: decisionArtifact },
      submitted_payload_hash: payloadHash,
      human_advancement_decision_record_path: path,
      generated_human_advancement_decision_context_path: DECISION_INDEX_PATH,
      required_status_labels: LABELS()
    };

    const index = await fetchJson<AnyRecord>(env, project, DECISION_INDEX_PATH, repoStore) || { schema_version: "human_advancement_decision_context_index.v0.1", project, updated_at: iso(), entries: [] };
    if (!Array.isArray(index.entries)) index.entries = [];
    const idx = { human_advancement_decision_id: decisionId, auditor_helper_execution_review_id: review.auditor_helper_execution_review_id, helper_execution_report_id: review.source_helper_execution_report.helper_execution_report_id, code_flow_id: flowId, share_id: review.source_helper_execution_report.share_id, share_packet_hash: review.source_helper_execution_report.share_packet_hash, decision_outcome: outcome, review_verdict: review.review_verdict, evidence_level: review.source_helper_execution_report.evidence_level, uncertainty: review.source_helper_execution_report.uncertainty, human_advancement_decision_record_path: path, created_at: record.created_at };
    index.entries = index.entries.filter((e: AnyRecord) => e.human_advancement_decision_id !== decisionId);
    index.entries.unshift(idx);
    index.updated_at = iso();
    const indexWrite = await writeJson(env, project, DECISION_INDEX_PATH, index, `Update Human advancement decision context ${decisionId}`, repoStore);
    record.generated_human_advancement_decision_context_sha = indexWrite.sha;
    const recordWrite = await writeJson(env, project, path, record, `Write Human advancement decision ${decisionId}`, repoStore);

    return jsonResponse({ ok: true, idempotent_replay: false, project, human_advancement_decision: { ...record, human_advancement_decision_record_sha: recordWrite.sha }, required_status_labels: LABELS() }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be") || message.includes("findings") || message.includes("unresolved_blockers")) return errorResponse("BAD_REQUEST", message, 400);
    if (message.startsWith("Unknown project")) return errorResponse("UNKNOWN_PROJECT", message, 404);
    if (message.includes("Auditor helper execution review context fields conflict")) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_CONTEXT_MISMATCH", message, 409);
    if (message.includes("No Auditor helper execution review context entry") || message.includes("Auditor helper execution review context index is missing")) return errorResponse("HUMAN_ADVANCEMENT_DECISION_REVIEW_CONTEXT_NOT_FOUND", message, 404);
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
