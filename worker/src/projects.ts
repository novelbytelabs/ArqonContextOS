import type { ProjectConfig, Role } from "./types";

export const PROJECTS: Record<string, ProjectConfig> = {
  ArqonZero: {
    owner: "novelbytelabs",
    repo: "ArqonZero",
    branch: "main",
    manifest: "governance/context/context_manifest.json",
    context: {
      PM_AI: "governance/context/pm_gpt_context.json",
      CODER_AI: "governance/context/coder_gpt_context.json",
      AUDITOR_AI: "governance/context/auditor_gpt_context.json",
      HELPER_CODEX: "governance/context/current_context_snapshot.json",
      HUMAN: "governance/context/current_context_snapshot.json"
    }
  }
};

export function getProject(project: string): ProjectConfig | null {
  return PROJECTS[project] || null;
}

export function contextPathFor(project: ProjectConfig, role: Role): string | null {
  return project.context[role] || null;
}
