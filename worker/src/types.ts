export type Role = "PM_AI" | "CODER_AI" | "AUDITOR_AI" | "HELPER_CODEX" | "HUMAN";

export interface Env {
  BROKER_VERSION: string;
  DEFAULT_BRANCH: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_INSTALLATION_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  BROKER_KEY_PM: string;
  BROKER_KEY_CODER: string;
  BROKER_KEY_AUDITOR: string;
  BROKER_KEY_HELPER: string;
  BROKER_KEY_HUMAN: string;
}

export interface ProjectConfig {
  owner: string;
  repo: string;
  branch: string;
  context: Record<string, string>;
  manifest: string;
}
