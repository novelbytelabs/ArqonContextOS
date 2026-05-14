import { requireRole } from "./auth";
import { errorResponse, jsonResponse } from "./response";
import { handleFlowsRequest } from "./flows";
import { githubRepoStore, type RepoStore } from "./repo_store";
import { handleScienceShare } from "./science_share";
import type { Env, Role } from "./types";

export type ScienceCommand =
  | "research"
  | "hypothesize"
  | "design-experiment"
  | "execute-experiment"
  | "audit-experiment"
  | "interpret"
  | "iterate"
  | "record-finding"
  | "share";

interface ScienceCommandPolicy {
  command: ScienceCommand;
  allowed_roles: Role[];
  default_artifact_type?: string;
  allowed_artifact_types: string[];
  requires_flow_ref: boolean;
  may_create_science_flow: boolean;
  reserved?: boolean;
}

export const SCIENCE_COMMANDS: Record<ScienceCommand, ScienceCommandPolicy> = {
  research: {
    command: "research",
    allowed_roles: ["EXPLORER_AI"],
    default_artifact_type: "research_dossier",
    allowed_artifact_types: ["research_dossier", "source_map", "contradiction_map", "open_questions"],
    requires_flow_ref: false,
    may_create_science_flow: true
  },
  hypothesize: {
    command: "hypothesize",
    allowed_roles: ["HYPOTHESIZER_AI"],
    default_artifact_type: "hypothesis_card",
    allowed_artifact_types: ["hypothesis_card", "null_hypothesis", "prediction_record"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  "design-experiment": {
    command: "design-experiment",
    allowed_roles: ["DESIGNER_AI"],
    default_artifact_type: "experiment_protocol",
    allowed_artifact_types: ["experiment_protocol", "metric_plan", "control_plan", "execution_packet", "sealed_boundary_plan"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  "execute-experiment": {
    command: "execute-experiment",
    allowed_roles: ["SCIENCE_EXECUTOR_AI"],
    default_artifact_type: "execution_report",
    allowed_artifact_types: ["execution_report", "evidence_manifest", "command_log", "raw_result_index", "deviation_report"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  "audit-experiment": {
    command: "audit-experiment",
    allowed_roles: ["SCIENCE_AUDITOR_AI"],
    default_artifact_type: "audit_report",
    allowed_artifact_types: ["science_checklist", "protocol_audit", "evidence_audit", "claim_scope_audit", "audit_report", "quarantine_recommendation"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  interpret: {
    command: "interpret",
    allowed_roles: ["HYPOTHESIZER_AI"],
    default_artifact_type: "interpretation_draft",
    allowed_artifact_types: ["interpretation_draft", "alternative_explanation_review"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  iterate: {
    command: "iterate",
    allowed_roles: ["HYPOTHESIZER_AI", "DESIGNER_AI"],
    default_artifact_type: "iteration_proposal",
    allowed_artifact_types: ["iteration_proposal", "revised_hypothesis_card", "revised_experiment_protocol"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  "record-finding": {
    command: "record-finding",
    allowed_roles: ["SCIENCE_AUDITOR_AI"],
    default_artifact_type: "finding_record",
    allowed_artifact_types: ["finding_record", "negative_finding_record", "inconclusive_finding_record", "finding_boundary_record"],
    requires_flow_ref: true,
    may_create_science_flow: false
  },
  share: {
    command: "share",
    allowed_roles: ["HUMAN"],
    allowed_artifact_types: ["share_packet"],
    requires_flow_ref: true,
    may_create_science_flow: false
  }
};

function getParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value && value.trim() ? value.trim() : null;
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  return value.trim();
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

function scienceRouteRoleError(command: ScienceCommand, role: Role): Response {
  return errorResponse(
    "SCIENCE_ROUTE_ROLE_FORBIDDEN",
    `Role ${role} cannot run /v1/science/${command}`,
    403
  );
}

export function validateScienceCommandRole(command: ScienceCommand, role: Role): string | null {
  const policy = SCIENCE_COMMANDS[command];
  if (!policy.allowed_roles.includes(role)) {
    return `Role ${role} cannot run /v1/science/${command}`;
  }
  return null;
}

function resolveArtifactType(policy: ScienceCommandPolicy, role: Role, body: Record<string, unknown>): string {
  const requested = optionalString(body.artifact_type);
  const artifactType = requested || policy.default_artifact_type || "";
  if (!artifactType || !policy.allowed_artifact_types.includes(artifactType)) {
    throw new Error(`Invalid artifact_type for /v1/science/${policy.command}: ${artifactType || "(missing)"}`);
  }

  if (policy.command === "iterate") {
    if (role === "DESIGNER_AI" && artifactType !== "revised_experiment_protocol") {
      throw new Error("DESIGNER_AI may only write revised_experiment_protocol through /v1/science/iterate");
    }
    if (role === "HYPOTHESIZER_AI" && !["iteration_proposal", "revised_hypothesis_card"].includes(artifactType)) {
      throw new Error("HYPOTHESIZER_AI may only write iteration_proposal or revised_hypothesis_card through /v1/science/iterate");
    }
  }

  return artifactType;
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

async function createScienceFlow(
  request: Request,
  env: Env,
  body: Record<string, unknown>,
  projectName: string,
  repoStore: RepoStore
): Promise<{ flow_id: string; response_body: unknown } | Response> {
  const url = new URL(request.url);
  const name = requireString(body.name, "name");
  const title = requireString(body.title, "title");
  const summary = optionalString(body.summary);
  const createRequest = new Request(`${url.origin}/v1/flows`, {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify({
      project: projectName,
      name,
      type: "science_flow",
      title,
      summary,
      initial_gate: "DRAFT"
    })
  });

  const createResponse = await handleFlowsRequest(createRequest, env, undefined, "collection", repoStore);
  const parsed = await parseJsonResponse(createResponse);
  if (!createResponse.ok) {
    return jsonResponse(parsed, createResponse.status);
  }
  if (!parsed || typeof parsed !== "object" || typeof (parsed as { flow_id?: unknown }).flow_id !== "string") {
    return errorResponse("SCIENCE_FLOW_CREATE_FAILED", "Flow creation response did not include flow_id", 500);
  }
  return { flow_id: (parsed as { flow_id: string }).flow_id, response_body: parsed };
}

async function writeScienceArtifact(
  request: Request,
  env: Env,
  flowRef: string,
  projectName: string,
  artifactType: string,
  artifactTitle: string,
  artifactBody: string,
  repoStore: RepoStore
): Promise<Response> {
  const url = new URL(request.url);
  const artifactRequest = new Request(`${url.origin}/v1/flows/${encodeURIComponent(flowRef)}/artifacts`, {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify({
      project: projectName,
      artifact_type: artifactType,
      title: artifactTitle,
      body: artifactBody
    })
  });
  return await handleFlowsRequest(artifactRequest, env, flowRef, "artifacts", repoStore);
}

export async function handleScienceRequest(
  request: Request,
  env: Env,
  command: string,
  repoStore: RepoStore = githubRepoStore
): Promise<Response> {
  try {
    if (!Object.prototype.hasOwnProperty.call(SCIENCE_COMMANDS, command)) {
      return errorResponse("SCIENCE_COMMAND_NOT_FOUND", `Unknown science command: ${command}`, 404);
    }

    const scienceCommand = command as ScienceCommand;
    const role = requireRole(request, env);

    if (scienceCommand === "share") {
      return await handleScienceShare(request, env, role, repoStore);
    }

    const policy = SCIENCE_COMMANDS[scienceCommand];

    if (request.method !== "POST") {
      return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    }

    const roleError = validateScienceCommandRole(scienceCommand, role);
    if (roleError) return scienceRouteRoleError(scienceCommand, role);

    const url = new URL(request.url);
    const body = await readJsonBody(request);
    const projectName = projectNameFrom(url, body);
    const artifactType = resolveArtifactType(policy, role, body);
    const artifactTitle = optionalString(body.artifact_title) || optionalString(body.title) || `${scienceCommand}: ${artifactType}`;
    const artifactBody = requireString(body.body, "body");

    let flowRef = optionalString(body.flow_ref) || getParam(url, "flow_ref") || "";
    let createdFlow: unknown = null;

    if (!flowRef && policy.may_create_science_flow) {
      const created = await createScienceFlow(request, env, body, projectName, repoStore);
      if (created instanceof Response) return created;
      flowRef = created.flow_id;
      createdFlow = created.response_body;
    }

    if (!flowRef) {
      return errorResponse("SCIENCE_FLOW_REF_REQUIRED", `/v1/science/${scienceCommand} requires flow_ref`, 400);
    }

    const artifactResponse = await writeScienceArtifact(
      request,
      env,
      flowRef,
      projectName,
      artifactType,
      artifactTitle,
      artifactBody,
      repoStore
    );

    const artifactBodyParsed = await parseJsonResponse(artifactResponse);
    if (!artifactResponse.ok) {
      return jsonResponse(artifactBodyParsed, artifactResponse.status);
    }

    const responseBody =
      artifactBodyParsed && typeof artifactBodyParsed === "object"
        ? {
            ...(artifactBodyParsed as Record<string, unknown>),
            science_command: scienceCommand,
            science_route: `/v1/science/${scienceCommand}`,
            created_flow: createdFlow
          }
        : {
            ok: true,
            science_command: scienceCommand,
            science_route: `/v1/science/${scienceCommand}`,
            flow_id: flowRef,
            artifact_type: artifactType,
            artifact_response: artifactBodyParsed,
            created_flow: createdFlow
          };

    return jsonResponse(responseBody, artifactResponse.status);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid") || message.startsWith("Missing") || message.includes("must be")) {
      return errorResponse("BAD_REQUEST", message, 400);
    }
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}

export function scienceCommandSnapshot(): Record<string, unknown> {
  return {
    commands: SCIENCE_COMMANDS
  };
}
