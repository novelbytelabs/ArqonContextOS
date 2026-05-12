import { requireRole } from "./auth";
import { fetchGithubDirectoryIfExists, fetchGithubFile, writeGithubFile } from "./github_app";
import { getProject } from "./projects";
import { errorResponse, jsonResponse } from "./response";
import { isKnownProject, isRole, STATUS_LABELS } from "./policy";
import type { Env, Role } from "./types";
import { buildFrontMatter, parseFrontMatter, shortId } from "./notes";

interface MessageSummary {
  message_id: string;
  project: string;
  from: Role;
  to: Role;
  subject: string;
  priority: string;
  run_id: string;
  status: string;
  official_artifact: boolean;
  created_at: string;
  required_status_labels: string[];
  source_path: string;
  source_sha: string;
}

interface MessageRecord extends MessageSummary {
  body: string;
}

function getParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value && value.trim() ? value.trim() : null;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function requiredStatusLabels(): string[] {
  return [...STATUS_LABELS];
}

function buildMessageDocument(message: {
  messageId: string;
  project: string;
  from: Role;
  to: Role;
  subject: string;
  priority: string;
  runId: string;
  createdAt: string;
  body: string;
}): string {
  const frontMatter = buildFrontMatter([
    ["message_id", message.messageId],
    ["project", message.project],
    ["from", message.from],
    ["to", message.to],
    ["subject", message.subject],
    ["priority", message.priority],
    ["run_id", message.runId],
    ["status", "unread"],
    ["official_artifact", false],
    ["created_at", message.createdAt],
    ["required_status_labels", requiredStatusLabels()]
  ]);
  return `${frontMatter}\n\n${message.body.trimEnd()}\n`;
}

function buildMessagePath(role: Role, kind: "inbox" | "archive", messageId: string): string {
  return `governance/messages/${role}/${kind}/${messageId}.md`;
}

function resolveRequestedRole(authRole: Role, requestedRole: string | null): Role {
  const role = requestedRole || authRole;
  if (!isRole(role)) {
    throw new Error(`Unknown role: ${role}`);
  }
  if (authRole !== "HUMAN" && role !== authRole) {
    throw new Error(`Authenticated role ${authRole} cannot request ${role}`);
  }
  return role;
}

async function listMessageFiles(env: Env, projectName: string, role: Role, folder: "inbox" | "archive"): Promise<string[]> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  const entries = await fetchGithubDirectoryIfExists(env, project, `governance/messages/${role}/${folder}`);
  return entries.filter(entry => entry.type === "file" && entry.name.endsWith(".md")).map(entry => entry.path);
}

async function loadMessageRecord(env: Env, projectName: string, path: string): Promise<MessageRecord> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);
  const file = await fetchGithubFile(env, project, path);
  const parsed = parseFrontMatter(file.content);
  const messageId = requireString(parsed.frontMatter.message_id, "message_id");
  const projectValue = requireString(parsed.frontMatter.project, "project");
  const fromValue = requireString(parsed.frontMatter.from, "from");
  const toValue = requireString(parsed.frontMatter.to, "to");
  const subject = requireString(parsed.frontMatter.subject, "subject");
  const priority = requireString(parsed.frontMatter.priority, "priority");
  const runId = optionalString(parsed.frontMatter.run_id);
  const status = requireString(parsed.frontMatter.status, "status");
  const officialArtifact = parsed.frontMatter.official_artifact === true;
  const createdAt = requireString(parsed.frontMatter.created_at, "created_at");
  const labelsValue = parsed.frontMatter.required_status_labels;
  if (!isKnownProject(projectValue)) throw new Error(`Unknown project in message: ${projectValue}`);
  if (!isRole(fromValue)) throw new Error(`Unknown sender role in message: ${fromValue}`);
  if (!isRole(toValue)) throw new Error(`Unknown recipient role in message: ${toValue}`);
  if (!Array.isArray(labelsValue)) throw new Error("Invalid required_status_labels");
  const requiredLabels = labelsValue.map(item => {
    if (typeof item !== "string" || !item.trim()) throw new Error("Invalid required_status_labels entry");
    return item.trim();
  });
  return {
    message_id: messageId,
    project: projectValue,
    from: fromValue,
    to: toValue,
    subject,
    priority,
    run_id: runId,
    status,
    official_artifact: officialArtifact,
    created_at: createdAt,
    required_status_labels: requiredLabels,
    source_path: file.path,
    source_sha: file.sha,
    body: parsed.body
  };
}

async function findAccessibleMessagePath(env: Env, projectName: string, role: Role, messageId: string): Promise<string | null> {
  const inboxPaths = await listMessageFiles(env, projectName, role, "inbox");
  const archivePaths = await listMessageFiles(env, projectName, role, "archive");
  const allPaths = [...inboxPaths, ...archivePaths];
  return allPaths.find(path => path.endsWith(`/${messageId}.md`)) || null;
}

async function handleSendMessage(request: Request, env: Env): Promise<Response> {
  const fromRole = requireRole(request, env);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return errorResponse("INVALID_REQUEST", "Missing JSON body", 400);

  const projectName = requireString(body.project, "project");
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);
  if (!isKnownProject(projectName)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const toRoleValue = requireString(body.to, "to");
  if (!isRole(toRoleValue)) return errorResponse("UNKNOWN_ROLE", `Unknown role: ${toRoleValue}`, 400);
  const subject = requireString(body.subject, "subject");
  const messageBody = requireString(body.body, "body");
  const priority = optionalString(body.priority) || "normal";
  if (!["low", "normal", "high"].includes(priority)) {
    return errorResponse("INVALID_PRIORITY", "priority must be low, normal, or high", 400);
  }
  const runId = optionalString(body.run_id);

  const date = new Date().toISOString().slice(0, 10);
  const messageId = `MSG-${date}-${shortId()}`;
  const path = buildMessagePath(toRoleValue, "inbox", messageId);
  const document = buildMessageDocument({
    messageId,
    project: projectName,
    from: fromRole,
    to: toRoleValue,
    subject,
    priority,
    runId,
    createdAt: new Date().toISOString(),
    body: messageBody
  });
  const written = await writeGithubFile(env, project, path, document, `Write role message ${messageId}`);
  return jsonResponse({
    ok: true,
    project: projectName,
    message_id: messageId,
    from: fromRole,
    to: toRoleValue,
    source_path: written.path,
    source_sha: written.sha,
    required_status_labels: requiredStatusLabels()
  }, 201);
}

async function handleListInbox(request: Request, env: Env): Promise<Response> {
  const authRole = requireRole(request, env);
  const url = new URL(request.url);
  const projectName = getParam(url, "project") || "";
  const requestedRole = resolveRequestedRole(authRole, getParam(url, "role"));
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const paths = await listMessageFiles(env, projectName, requestedRole, "inbox");
  const records = await Promise.all(paths.map(path => loadMessageRecord(env, projectName, path)));
  records.sort((a, b) => {
    const diff = Date.parse(b.created_at) - Date.parse(a.created_at);
    if (diff !== 0) return diff;
    return b.source_path.localeCompare(a.source_path);
  });
  return jsonResponse({
    ok: true,
    project: projectName,
    role: requestedRole,
    count: records.length,
    messages: records
  });
}

async function handleOpenMessage(request: Request, env: Env, messageId: string): Promise<Response> {
  const authRole = requireRole(request, env);
  const url = new URL(request.url);
  const projectName = getParam(url, "project") || "";
  const requestedRole = resolveRequestedRole(authRole, getParam(url, "role"));
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const path = await findAccessibleMessagePath(env, projectName, requestedRole, messageId);
  if (!path) return errorResponse("MESSAGE_NOT_FOUND", `No accessible message found for ${messageId}`, 404);
  const message = await loadMessageRecord(env, projectName, path);
  return jsonResponse({
    ok: true,
    project: projectName,
    role: requestedRole,
    source_path: message.source_path,
    source_sha: message.source_sha,
    message
  });
}

async function handleArchiveMessage(request: Request, env: Env, messageId: string): Promise<Response> {
  const authRole = requireRole(request, env);
  const url = new URL(request.url);
  const projectName = getParam(url, "project") || "";
  const requestedRole = resolveRequestedRole(authRole, getParam(url, "role"));
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const sourcePath = await findAccessibleMessagePath(env, projectName, requestedRole, messageId);
  if (!sourcePath) return errorResponse("MESSAGE_NOT_FOUND", `No accessible message found for ${messageId}`, 404);
  const message = await loadMessageRecord(env, projectName, sourcePath);
  const archivePath = buildMessagePath(requestedRole, "archive", messageId);
  const archived = await writeGithubFile(env, project, archivePath, await (async () => {
    const file = await fetchGithubFile(env, project, sourcePath);
    return file.content;
  })(), `Archive role message ${messageId}`);
  return jsonResponse({
    ok: true,
    project: projectName,
    role: requestedRole,
    message_id: messageId,
    archived_from: sourcePath,
    archived_to: archived.path,
    archive_sha: archived.sha,
    note: "Inbox deletion deferred to v0.3"
  });
}

export async function handleMessagesRequest(request: Request, env: Env, messageId?: string, action: "collection" | "item" | "archive" = "collection"): Promise<Response> {
  try {
    if (action === "collection") {
      if (request.method === "POST") return await handleSendMessage(request, env);
      if (request.method === "GET") return await handleListInbox(request, env);
      return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
    }
    if (!messageId) return errorResponse("INVALID_REQUEST", "Missing message id", 400);
    if (action === "item") {
      if (request.method !== "GET") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
      return await handleOpenMessage(request, env, messageId);
    }
    if (action === "archive") {
      if (request.method !== "POST") return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
      return await handleArchiveMessage(request, env, messageId);
    }
    return errorResponse("INVALID_REQUEST", "Unknown messages action", 400);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid or missing field:") || message.startsWith("Invalid array item in") || message === "Missing JSON body") {
      return errorResponse("BAD_REQUEST", message, 400);
    }
    if (message.startsWith("Unknown project")) {
      return errorResponse("UNKNOWN_PROJECT", message, 404);
    }
    if (message.startsWith("Unknown role")) {
      return errorResponse("UNKNOWN_ROLE", message, 400);
    }
    if (message.startsWith("Authenticated role")) {
      return errorResponse("ROLE_MISMATCH", message, 403);
    }
    if (message.startsWith("No accessible message found")) {
      return errorResponse("MESSAGE_NOT_FOUND", message, 404);
    }
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
