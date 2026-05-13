import type { Env, ProjectConfig } from "./types";
import { assertSafeReadPath, assertSafeWritePath } from "./policy";

export interface GithubDirectoryEntry {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
}

export interface GithubFileRef {
  content: string;
  sha: string;
  path: string;
}

export interface GithubWriteResult {
  path: string;
  sha: string;
}

const GITHUB_USER_AGENT = "ArqonMonkeyOS/0.2";

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64Content(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const clean = pem
    .replace("-----BEGIN RSA PRIVATE KEY-----", "")
    .replace("-----END RSA PRIVATE KEY-----", "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey("pkcs8", bytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

export async function createGithubJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iat: now - 60, exp: now + 9 * 60, iss: env.GITHUB_APP_ID };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importPrivateKey(env.GITHUB_APP_PRIVATE_KEY);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  return `${data}.${base64url(sig)}`;
}

export async function getInstallationToken(env: Env): Promise<string> {
  const jwt = await createGithubJwt(env);
  const url = `https://api.github.com/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`;
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${jwt}`, accept: "application/vnd.github+json", "user-agent": GITHUB_USER_AGENT }
  });
  if (!res.ok) throw new Error(`GitHub installation token failed: ${res.status} ${await res.text()}`);
  const body = await res.json() as { token: string };
  return body.token;
}

function encodeGithubPath(path: string): string {
  return encodeURIComponent(path).replace(/%2F/g, "/");
}

async function githubContentsRequest(env: Env, project: ProjectConfig, path: string, init?: RequestInit): Promise<Response> {
  const token = await getInstallationToken(env);
  const url = `https://api.github.com/repos/${project.owner}/${project.repo}/contents/${encodeGithubPath(path)}${init?.method === "GET" ? `?ref=${encodeURIComponent(project.branch)}` : ""}`;
  return fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": GITHUB_USER_AGENT,
      ...(init?.headers || {})
    }
  });
}

export async function fetchGithubFile(env: Env, project: ProjectConfig, path: string): Promise<GithubFileRef> {
  assertSafeReadPath(path);
  const res = await githubContentsRequest(env, project, path, { method: "GET" });
  if (!res.ok) throw new Error(`GitHub file fetch failed for ${path}: ${res.status} ${await res.text()}`);
  const body = await res.json() as { content?: string; encoding?: string; sha: string; path: string; };
  if (body.encoding !== "base64" || !body.content) throw new Error(`Unexpected GitHub content encoding for ${path}`);
  return { content: atob(body.content.replace(/\n/g, "")), sha: body.sha, path: body.path };
}

export async function fetchGithubDirectory(env: Env, project: ProjectConfig, path: string): Promise<GithubDirectoryEntry[]> {
  assertSafeReadPath(path);
  const res = await githubContentsRequest(env, project, path, { method: "GET" });
  if (!res.ok) throw new Error(`GitHub directory fetch failed for ${path}: ${res.status} ${await res.text()}`);
  const body = await res.json() as GithubDirectoryEntry[] | { type?: string };
  if (!Array.isArray(body)) {
    throw new Error(`Unexpected GitHub directory listing for ${path}`);
  }
  return body;
}

export async function fetchGithubDirectoryIfExists(env: Env, project: ProjectConfig, path: string): Promise<GithubDirectoryEntry[]> {
  try {
    return await fetchGithubDirectory(env, project, path);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return [];
    throw err;
  }
}

export async function writeGithubFile(env: Env, project: ProjectConfig, path: string, content: string, message: string): Promise<GithubWriteResult> {
  assertSafeWritePath(path);
  const existing = await githubContentsRequest(env, project, path, { method: "GET" });
  let sha: string | undefined;
  if (existing.status === 200) {
    const file = await existing.json() as { sha?: string };
    sha = typeof file.sha === "string" ? file.sha : undefined;
  } else if (existing.status !== 404) {
    throw new Error(`GitHub preflight failed for ${path}: ${existing.status} ${await existing.text()}`);
  }

  const payload: Record<string, unknown> = {
    message,
    content: base64Content(content),
    branch: project.branch
  };
  if (sha) payload.sha = sha;
  const putRes = await githubContentsRequest(env, project, path, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  if (!putRes.ok) throw new Error(`GitHub file write failed for ${path}: ${putRes.status} ${await putRes.text()}`);
  const body = await putRes.json() as { content?: { path?: string; sha?: string } };
  const written = body.content;
  if (!written?.path || !written?.sha) throw new Error(`Unexpected GitHub write response for ${path}`);
  return { path: written.path, sha: written.sha };
}
