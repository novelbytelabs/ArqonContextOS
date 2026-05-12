import type { Env, Role } from "./types";
import { requireRole } from "./auth";
import { getProject, contextPathFor } from "./projects";
import { fetchGithubFile } from "./github_app";
import { jsonResponse, errorResponse } from "./response";

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/v1/health" && request.method === "GET") return handleHealth(env);
      if (url.pathname === "/v1/context" && request.method === "GET") return handleContext(request, env);
      if (url.pathname === "/v1/constitution" && request.method === "GET") return handleContext(request, env);
      if (url.pathname === "/v1/manifest" && request.method === "GET") return handleManifest(request, env);
      if (url.pathname.startsWith("/v1/notes")) return handleNotImplemented("notes");
      if (url.pathname.startsWith("/v1/messages")) return handleNotImplemented("messages");
      if (url.pathname.startsWith("/v1/runs")) return handleNotImplemented("runs");
      return errorResponse("NOT_FOUND", `No route for ${request.method} ${url.pathname}`, 404);
    } catch (err) {
      if (err instanceof Response) return err;
      return errorResponse("INTERNAL_ERROR", err instanceof Error ? err.message : String(err), 500);
    }
  }
};
