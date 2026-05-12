import { requireRole } from "./auth";
import { fetchGithubDirectoryIfExists, fetchGithubFile, writeGithubFile } from "./github_app";
import { getProject } from "./projects";
import { jsonResponse, errorResponse } from "./response";
import { STATUS_LABELS, isKnownProject, isRole } from "./policy";
import type { Env, Role } from "./types";

type FrontMatterValue = string | boolean | string[];

export interface NoteSummary {
  note_id: string;
  project: string;
  source_role: Role;
  title: string;
  tags: string[];
  visibility: string;
  official_artifact: boolean;
  created_at: string;
  required_status_labels: string[];
  source_path: string;
  source_sha: string;
}

interface ParsedFrontMatter {
  frontMatter: Record<string, unknown>;
  body: string;
}

function getParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value && value.trim() ? value.trim() : null;
}

function parseJsonish(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function utcDateParts(date = new Date()): { isoDate: string; year: string; month: string } {
  const isoDate = date.toISOString().slice(0, 10);
  return {
    isoDate,
    year: isoDate.slice(0, 4),
    month: isoDate.slice(5, 7)
  };
}

export function shortId(byteLength = 4): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function frontMatterScalar(value: FrontMatterValue): string {
  if (Array.isArray(value)) {
    return value.map(item => `  - ${JSON.stringify(item)}`).join("\n");
  }
  return JSON.stringify(value);
}

export function buildFrontMatter(entries: Array<[string, FrontMatterValue]>): string {
  const lines = ["---"];
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${JSON.stringify(item)}`);
        }
      }
      continue;
    }
    lines.push(`${key}: ${frontMatterScalar(value)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

export function parseFrontMatter(markdown: string): ParsedFrontMatter {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Missing YAML front matter");
  }

  const frontMatter: Record<string, unknown> = {};
  let currentArrayKey: string | null = null;
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const scalarMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (scalarMatch) {
      const key = scalarMatch[1];
      const value = scalarMatch[2];
      if (!value) {
        frontMatter[key] = [];
        currentArrayKey = key;
      } else {
        frontMatter[key] = parseJsonish(value);
        currentArrayKey = null;
      }
      continue;
    }

    const arrayMatch = line.match(/^\s*-\s*(.*)$/);
    if (arrayMatch && currentArrayKey) {
      const existing = frontMatter[currentArrayKey];
      if (!Array.isArray(existing)) {
        throw new Error(`Front matter key is not an array: ${currentArrayKey}`);
      }
      existing.push(parseJsonish(arrayMatch[1]));
      continue;
    }

    throw new Error(`Unrecognized front matter line: ${line}`);
  }

  return {
    frontMatter,
    body: match[2].replace(/^\n+/, "")
  };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  return value.trim();
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  const items = value.map(item => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`Invalid array item in ${field}`);
    }
    return item.trim();
  });
  return items;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  return value;
}

function requiredStatusLabels(): string[] {
  return [...STATUS_LABELS];
}

function buildNotePath(dateParts: { year: string; month: string; isoDate: string }, noteId: string): string {
  return `governance/notes/${dateParts.year}/${dateParts.month}/${noteId}.md`;
}

function buildNoteDocument(note: {
  noteId: string;
  project: string;
  sourceRole: Role;
  title: string;
  tags: string[];
  visibility: string;
  createdAt: string;
  body: string;
}): string {
  const frontMatter = buildFrontMatter([
    ["note_id", note.noteId],
    ["project", note.project],
    ["source_role", note.sourceRole],
    ["title", note.title],
    ["tags", note.tags],
    ["visibility", note.visibility],
    ["official_artifact", false],
    ["created_at", note.createdAt],
    ["required_status_labels", requiredStatusLabels()]
  ]);
  return `${frontMatter}\n\n${note.body.trimEnd()}\n`;
}

async function listNoteFilePaths(env: Env, projectName: string): Promise<string[]> {
  const project = getProject(projectName);
  if (!project) throw new Error(`Unknown project: ${projectName}`);

  const noteRoot = await fetchGithubDirectoryIfExists(env, project, "governance/notes");
  const paths: string[] = [];
  for (const yearEntry of noteRoot) {
    if (yearEntry.type !== "dir") continue;
    const monthEntries = await fetchGithubDirectoryIfExists(env, project, yearEntry.path);
    for (const monthEntry of monthEntries) {
      if (monthEntry.type !== "dir") continue;
      const fileEntries = await fetchGithubDirectoryIfExists(env, project, monthEntry.path);
      for (const fileEntry of fileEntries) {
        if (fileEntry.type === "file" && fileEntry.name.endsWith(".md")) {
          paths.push(fileEntry.path);
        }
      }
    }
  }
  return paths;
}

async function loadNoteSummary(env: Env, project: ReturnType<typeof getProject>, path: string): Promise<NoteSummary> {
  if (!project) throw new Error("Unknown project");
  const file = await fetchGithubFile(env, project, path);
  const parsed = parseFrontMatter(file.content);
  const noteId = requireString(parsed.frontMatter.note_id, "note_id");
  const projectName = requireString(parsed.frontMatter.project, "project");
  const sourceRoleValue = requireString(parsed.frontMatter.source_role, "source_role");
  if (!isKnownProject(projectName)) throw new Error(`Unknown project in note: ${projectName}`);
  if (!isRole(sourceRoleValue)) throw new Error(`Unknown source role in note: ${sourceRoleValue}`);
  const sourceRole = sourceRoleValue;
  const title = requireString(parsed.frontMatter.title, "title");
  const tags = requireStringArray(parsed.frontMatter.tags, "tags");
  const visibility = requireString(parsed.frontMatter.visibility, "visibility");
  const officialArtifact = requireBoolean(parsed.frontMatter.official_artifact, "official_artifact");
  const createdAt = requireString(parsed.frontMatter.created_at, "created_at");
  const labels = requireStringArray(parsed.frontMatter.required_status_labels, "required_status_labels");
  return {
    note_id: noteId,
    project: projectName,
    source_role: sourceRole,
    title,
    tags,
    visibility,
    official_artifact: officialArtifact,
    created_at: createdAt,
    required_status_labels: labels,
    source_path: file.path,
    source_sha: file.sha
  };
}

async function handleCreateNote(request: Request, env: Env): Promise<Response> {
  const authRole = requireRole(request, env);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return errorResponse("INVALID_REQUEST", "Missing JSON body", 400);

  const projectName = requireString(body.project, "project");
  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);
  if (!isKnownProject(projectName)) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const title = requireString(body.title, "title");
  const noteBody = requireString(body.body, "body");
  const tags = requireStringArray(body.tags, "tags");
  const visibility = requireString(body.visibility, "visibility");
  if (visibility !== "team") {
    return errorResponse("INVALID_VISIBILITY", "Notes visibility must be team", 400);
  }

  const dateParts = utcDateParts();
  const noteId = `NOTE-${dateParts.isoDate}-${shortId()}`;
  const path = buildNotePath(dateParts, noteId);
  const createdAt = new Date().toISOString();
  const document = buildNoteDocument({
    noteId,
    project: projectName,
    sourceRole: authRole,
    title,
    tags,
    visibility,
    createdAt,
    body: noteBody
  });
  const written = await writeGithubFile(env, project, path, document, `Write context note ${noteId}`);
  return jsonResponse({
    ok: true,
    project: projectName,
    note_id: noteId,
    source_role: authRole,
    source_path: written.path,
    source_sha: written.sha,
    required_status_labels: requiredStatusLabels()
  }, 201);
}

async function handleListNotes(request: Request, env: Env): Promise<Response> {
  requireRole(request, env);
  const url = new URL(request.url);
  const projectName = getParam(url, "project") || "";
  const limitRaw = getParam(url, "limit") || "20";
  const limit = Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return errorResponse("INVALID_LIMIT", "limit must be an integer between 1 and 100", 400);
  }

  const project = getProject(projectName);
  if (!project) return errorResponse("UNKNOWN_PROJECT", `Unknown project: ${projectName}`, 404);

  const paths = await listNoteFilePaths(env, projectName);
  const summaries = await Promise.all(paths.map(path => loadNoteSummary(env, project, path)));
  summaries.sort((a, b) => {
    const timeDiff = Date.parse(b.created_at) - Date.parse(a.created_at);
    if (timeDiff !== 0) return timeDiff;
    return b.source_path.localeCompare(a.source_path);
  });

  return jsonResponse({
    ok: true,
    project: projectName,
    limit,
    count: summaries.length,
    notes: summaries.slice(0, limit)
  });
}

export async function handleNotesRequest(request: Request, env: Env): Promise<Response> {
  try {
    if (request.method === "POST") return await handleCreateNote(request, env);
    if (request.method === "GET") return await handleListNotes(request, env);
    return errorResponse("METHOD_NOT_ALLOWED", `Unsupported method: ${request.method}`, 405);
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Invalid or missing field:") || message.startsWith("Invalid array item in") || message === "Missing JSON body" || message === "Invalid visibility") {
      return errorResponse("BAD_REQUEST", message, 400);
    }
    if (message.startsWith("Unknown project")) {
      return errorResponse("UNKNOWN_PROJECT", message, 404);
    }
    if (message.startsWith("Unknown source role")) {
      return errorResponse("UNKNOWN_ROLE", message, 400);
    }
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
