import type { Env, ProjectConfig } from "./types";
import { assertSafeReadPath } from "./policy";

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
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
    headers: { authorization: `Bearer ${jwt}`, accept: "application/vnd.github+json", "user-agent": "ArqonContextOS/0.1" }
  });
  if (!res.ok) throw new Error(`GitHub installation token failed: ${res.status} ${await res.text()}`);
  const body = await res.json() as { token: string };
  return body.token;
}

export async function fetchGithubFile(env: Env, project: ProjectConfig, path: string): Promise<{ content: string; sha: string; path: string; }> {
  assertSafeReadPath(path);
  const token = await getInstallationToken(env);
  const url = `https://api.github.com/repos/${project.owner}/${project.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(project.branch)}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "ArqonContextOS/0.1" }
  });
  if (!res.ok) throw new Error(`GitHub file fetch failed for ${path}: ${res.status} ${await res.text()}`);
  const body = await res.json() as { content?: string; encoding?: string; sha: string; path: string; };
  if (body.encoding !== "base64" || !body.content) throw new Error(`Unexpected GitHub content encoding for ${path}`);
  return { content: atob(body.content.replace(/
/g, "")), sha: body.sha, path: body.path };
}
