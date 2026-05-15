import type { Env, Role } from "./types";
import { requireRole, validateBrokerKeyUniqueness } from "./auth";
import { getProject, contextPathFor } from "./projects";
import { fetchGithubFile } from "./github_app";
import { jsonResponse, errorResponse } from "./response";
import { handleNotesRequest } from "./notes";
import { handleMessagesRequest } from "./messages";
import { handleFlowsRequest } from "./flows";
import { handleScienceRequest } from "./science";
import { handlePmHandoffRequest } from "./pm_handoff";
import { handlePmIntakeRequest } from "./pm_intake";
import { handlePmSpecifyRequest } from "./pm_specify";
import { handlePmPlanRequest } from "./pm_plan";
import { handlePmTaskingRequest } from "./pm_tasking";
import { handleCoderWorkPlanRequest } from "./coder_work_plan";
import type { RepoStore } from "./repo_store";

function getParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value && value.trim() ? value.trim() : null;
}

async function handleHealth(env: Env): Promise<Response> {
  return jsonResponse({
    ok: true,
    service: "Arqon ContextOS Broker",
    version: env.BROKER_VERSION,
    status: ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]
  });
}

async function handleContext(request: Request, env: Env): Promise<Response> {
  const authRole = requireRole(request, env);
  const url = new URL(request.url);
  const projectName = getParam(url, "project") || "";
  const requestedRole = (getParam(url, "role") || authRole) as Role;
  if (authRole !== "HUMAN" && authRole !== requestedRole) {
    return errorResponse("ROLE_MISMATCH", `Authenticated role ${authRole} cannot request ${requestedRole}`, 403);
  }
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);
  const path = contextPathFor(project, requestedRole);
  if (!path) return errorResponse("ROLE_CONTEXT_NOT_FOUND", `No context path for role: ${requestedRole}`, 404);
  const file = await fetchGithubFile(env, project, path);
  return jsonResponse({ ok: true, project: projectName, role: requestedRole, source_path: file.path, source_sha: file.sha, context: JSON.parse(file.content) });
}

async function handleManifest(request: Request, env: Env): Promise<Response> {
  requireRole(request, env);
  const url = new URL(request.url);
  const projectName = getParam(url, "project") || "";
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);
  const file = await fetchGithubFile(env, project, project.manifest);
  return jsonResponse({ ok: true, project: projectName, source_path: file.path, source_sha: file.sha, manifest: JSON.parse(file.content) });
}

async function handleNotImplemented(name: string): Promise<Response> {
  return errorResponse("NOT_IMPLEMENTED", `${name} is reserved in v0.1 scaffold. Implement after read-only context load is validated.`, 501);
}

function brokerKeyConfigError(env: Env): Response | null {
  const validation = validateBrokerKeyUniqueness(env);
  if (validation.ok) return null;
  return errorResponse(
    "BROKER_KEY_CONFIGURATION_INVALID",
    `Broker key configuration has missing or duplicate role credentials: missing=${validation.missing.join(",")}; duplicate_groups=${validation.duplicate_groups.map(group => group.join("+")).join(",")}`,
    500
  );
}

export async function handleWorkerFetch(
  request: Request,
  env: Env,
  options: { flowRepoStore?: RepoStore } = {}
): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname === "/v1/health" && request.method === "GET") return handleHealth(env);
    const keyConfigError = brokerKeyConfigError(env);
    if (keyConfigError) return keyConfigError;
    if (url.pathname === "/v1/context" && request.method === "GET") return handleContext(request, env);
    if (url.pathname === "/v1/constitution" && request.method === "GET") return handleContext(request, env);
    if (url.pathname === "/v1/manifest" && request.method === "GET") return handleManifest(request, env);
    if (url.pathname === "/v1/notes") return handleNotesRequest(request, env);
    if (url.pathname === "/v1/messages") return handleMessagesRequest(request, env);
    if (url.pathname === "/v1/messages/inbox") return handleMessagesRequest(request, env);
    const messageArchiveMatch = url.pathname.match(/^\/v1\/messages\/([^/]+)\/archive$/);
    if (messageArchiveMatch) return handleMessagesRequest(request, env, decodeURIComponent(messageArchiveMatch[1]), "archive");
    const messageMatch = url.pathname.match(/^\/v1\/messages\/([^/]+)$/);
    if (messageMatch) return handleMessagesRequest(request, env, decodeURIComponent(messageMatch[1]), "item");
    const scienceMatch = url.pathname.match(/^\/v1\/science\/([^/]+)$/);
    if (scienceMatch) return handleScienceRequest(request, env, decodeURIComponent(scienceMatch[1]), options.flowRepoStore);
    if (url.pathname === "/v1/pm/handoff") return handlePmHandoffRequest(request, env, options.flowRepoStore);
    if (url.pathname === "/v1/pm/intake") return handlePmIntakeRequest(request, env, options.flowRepoStore);
    if (url.pathname === "/v1/pm/specify") return handlePmSpecifyRequest(request, env, options.flowRepoStore);
    if (url.pathname === "/v1/pm/plan") return handlePmPlanRequest(request, env, options.flowRepoStore);
    if (url.pathname === "/v1/pm/tasks") return errorResponse("PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING", "The generic PM Tasks route is retired. Use /v1/pm/tasking for PM tasking; Coder owns implementation task decomposition.", 410);
    if (url.pathname === "/v1/pm/tasking") return handlePmTaskingRequest(request, env, options.flowRepoStore);
    if (url.pathname === "/v1/coder/work-plan") return handleCoderWorkPlanRequest(request, env, options.flowRepoStore);
    if (url.pathname === "/v1/flows") return handleFlowsRequest(request, env, undefined, "collection", options.flowRepoStore);
    const flowStatusMatch = url.pathname.match(/^\/v1\/flows\/([^/]+)\/status$/);
    if (flowStatusMatch) return handleFlowsRequest(request, env, decodeURIComponent(flowStatusMatch[1]), "status", options.flowRepoStore);
    const flowArtifactsMatch = url.pathname.match(/^\/v1\/flows\/([^/]+)\/artifacts$/);
    if (flowArtifactsMatch) return handleFlowsRequest(request, env, decodeURIComponent(flowArtifactsMatch[1]), "artifacts", options.flowRepoStore);
    const flowAdvanceMatch = url.pathname.match(/^\/v1\/flows\/([^/]+)\/advance$/);
    if (flowAdvanceMatch) return handleFlowsRequest(request, env, decodeURIComponent(flowAdvanceMatch[1]), "advance", options.flowRepoStore);
    const flowMatch = url.pathname.match(/^\/v1\/flows\/([^/]+)$/);
    if (flowMatch) return handleFlowsRequest(request, env, decodeURIComponent(flowMatch[1]), "item", options.flowRepoStore);
    if (url.pathname.startsWith("/v1/runs")) return handleNotImplemented("runs");
    return errorResponse("NOT_FOUND", `No route for ${request.method} ${url.pathname}`, 404);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("INTERNAL_ERROR", err instanceof Error ? err.message : String(err), 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleWorkerFetch(request, env);
  }
};
