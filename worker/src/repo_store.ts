import type { Env, ProjectConfig } from "./types";
import { fetchGithubFile, writeGithubFile } from "./github_app";

export interface RepoFileRef {
  content: string;
  sha: string;
  path: string;
}

export interface RepoWriteResult {
  path: string;
  sha: string;
}

export interface RepoStore {
  fetchFile(env: Env, project: ProjectConfig, path: string): Promise<RepoFileRef>;
  writeFile(env: Env, project: ProjectConfig, path: string, content: string, message: string): Promise<RepoWriteResult>;
}

export const githubRepoStore: RepoStore = {
  fetchFile: fetchGithubFile,
  writeFile: writeGithubFile
};
