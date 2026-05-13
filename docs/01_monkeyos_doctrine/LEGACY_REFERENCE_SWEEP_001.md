# LEGACY REFERENCE SWEEP 001

Status labels:

- REQUIRES_HUMAN_REVIEW
- development diagnostic only
- NOT SEALED-TEST CERTIFIED
- not promotable

## Summary

- Controlled legacy sweep completed after repo and local directory rename.
- Historical/archival references were preserved intentionally.
- Active-facing docs and low-risk identity strings were updated to ArqonMonkeyOS / MonkeyOS / ContextBus.
- No route/auth/secret/runtime behavior changes were introduced.

- Commit before: `874b36bb6de975987a66e2d2a6e7599c6c4c8992`
- Repo name: `novelbytelabs/ArqonMonkeyOS`
- Local path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS`
- Inventory size after controlled edits: `194` references

## Classification Counts

- ACTIVE_RENAME: `8`
- LEGACY_KEEP: `110`
- COMPATIBILITY_KEEP: `46`
- DEFER_REVIEW: `30`

## ACTIVE_RENAME Edits Performed

- Updated current-facing platform identity and compatibility note in `README.md`.
- Updated `docs/index.md` to reflect current repo name `ArqonMonkeyOS`.
- Updated `docs/00_active_state/CURRENT_STATE.md` for renamed repo and local path state.
- Updated `docs/00_active_state/OPEN_DECISIONS.md` to resolve repo name decision and keep pending naming decisions open.
- Updated `docs/00_active_state/TRANSITION_CHECKLIST.md` to record local directory rename and controlled sweep completion.
- Updated `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md` to record local directory rename and sweep execution.
- Updated `docs/01_monkeyos_doctrine/GLOSSARY.md` for canonical naming definitions.
- Updated harmless `worker/src/github_app.ts` User-Agent string to `ArqonMonkeyOS/0.2` (non-behavioral identity update only).
- Updated `openapi/arqon_contextos.openapi.yaml` title/description text only (no path, operationId, schema, or server changes).
- Updated ContextBus infrastructure docs under `docs/02_contextbus_infrastructure/` to current naming.

## LEGACY_KEEP References

- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:12:This document captures the doctrine shift from treating **Arqon ContextOS** as the whole system to treating it as the infrastructure layer inside a larger platform called **MonkeyOS**.`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:25:Therefore the old name **ContextOS** is too broad and too narrow at the same time:`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:39:| **ContextBus** | Infrastructure layer formerly called ContextOS: context, messages, flows, artifacts, gates, governance, repo persistence |`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:165:### Existing ContextOS v0.2 commands remain legacy-compatible`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:268:| Arqon ContextOS / ContextOS as whole platform | MonkeyOS | Umbrella platform name |`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:269:| ContextOS infrastructure layer | ContextBus | Broker/context/flow/governance bus |`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:270:| ArqonContextOS repo | candidate: `MonkeyOS` or `ContextBus` | Requires human decision |`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:271:| ContextOS docs | MonkeyOS + ContextBus docs | Split platform doctrine from infrastructure docs |`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:280:Arqon ContextOS / ContextOS = legacy name for what is now split into MonkeyOS + ContextBus.`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:289:1. Inventory of all `ContextOS`, `ArqonContextOS`, and contextos references.`
- `docs/monkey_os_context_bus_doctrine_and_rename_readiness_pm_spec.md:341:Mark old ContextOS terminology as legacy.`
- `docs/00_active_state/TRANSITION_CHECKLIST.md:12:- [ ] ArqonContextOS merged docs installed`
- `docs/00_active_state/TRANSITION_CHECKLIST.md:30:- [ ] ArqonContextOS branch/commit recorded`
- `docs/00_active_state/TRANSITION_CHECKLIST.md:62:- [ ] inventory ContextOS references across docs/source/config`
- `docs/00_active_state/TRANSITION_CHECKLIST.md:67:- [x] GitHub repository renamed: `ArqonContextOS` -> `ArqonMonkeyOS``
- `docs/00_active_state/TRANSITION_CHECKLIST.md:68:- [x] Local directory renamed: `/home/irbsurfer/Projects/arqon/ArqonContextOS` -> `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS``
- `docs/00_active_state/TRANSITION_CHECKLIST.md:84:- [ ] stale `ContextOS` wording marked as legacy where appropriate`
- `docs/00_active_state/ROADMAP.md:11:ContextBus (legacy name: ContextOS) v0.2 is operational for:`
- `docs/00_active_state/CURRENT_STATE.md:12:Active doctrine treats MonkeyOS / Arqon MonkeyOS as the umbrella platform and ContextBus as the repo-backed infrastructure layer formerly called ContextOS.`
- `docs/00_active_state/CURRENT_STATE.md:97:- ContextBus is the infrastructure layer formerly called ContextOS.`
- `docs/00_active_state/CURRENT_STATE.md:101:- GitHub repository rename is complete: `ArqonContextOS` -> `ArqonMonkeyOS`.`
- `docs/00_active_state/CURRENT_STATE.md:103:- ContextOS remains legacy terminology.`
- `docs/00_active_state/CURRENT_STATE.md:105:- Historical and archival docs intentionally preserve legacy ContextOS references for traceability.`
- `docs/00_active_state/OPEN_DECISIONS.md:15:- How ContextOS flow artifacts sync with real Spec Kit paths`
- `docs/index.md:10:ContextBus is the infrastructure layer formerly called ContextOS.`
- `docs/index.md:63:Legacy ContextOS references remain in archive and compatibility documents where historical traceability is required.`
- `docs/03_commands_and_runbooks/GPT_COMMANDS.md:9:These are instruction-level commands routed through the ContextBus broker (legacy infrastructure name: ContextOS).`
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:18:- `ContextOS``
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:19:- `ArqonContextOS``
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:20:- `contextos``
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:21:- `context_os``
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:44:- “ContextOS is the legacy name for the infrastructure now called ContextBus inside MonkeyOS.”`
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:60:- Old repository name: `ArqonContextOS``
- `docs/01_monkeyos_doctrine/RENAME_READINESS_PLAN.md:62:- Local directory rename completed: `/home/irbsurfer/Projects/arqon/ArqonContextOS` -> `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS``
- `docs/01_monkeyos_doctrine/MONKEYOS_CONTEXTBUS_DOCTRINE.md:14:  repo-backed infrastructure layer formerly called ContextOS.`
- `docs/01_monkeyos_doctrine/GLOSSARY.md:15:- ContextOS (legacy):`
- `docs/04_flows_and_spec_kit/SPEC_KIT_INTEGRATION.md:28:- ContextOS is the legacy name for infrastructure now called ContextBus.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/MANIFEST.json:2:  "bundle": "arqon_contextos_merged_ground_truth_docs",`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/MANIFEST.json:80:    "Arqon ContextOS top-level docs",`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/prompts/INSTALL_MERGED_DOCS_PROMPT.md:3:You are Helper/Codex for the ArqonContextOS repository.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/prompts/INSTALL_MERGED_DOCS_PROMPT.md:5:TARGET REPO: ArqonContextOS  `
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/prompts/INSTALL_MERGED_DOCS_PROMPT.md:6:TARGET PATH: `/home/irbsurfer/Projects/arqon/ArqonContextOS`  `
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/prompts/INSTALL_MERGED_DOCS_PROMPT.md:37:cd /home/irbsurfer/Projects/arqon/ArqonContextOS`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/README.md:1:# Arqon ContextOS Merged Ground Truth Docs`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/README.md:11:This bundle replaces the earlier scattered ContextOS docs with one consolidated ground-truth document set.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/README.md:17:- the newer ContextOS top-level docs`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/16_GLOSSARY.md:9:## ContextOS`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/16_GLOSSARY.md:23:Infrastructure layer inside MonkeyOS; legacy name is ContextOS.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/16_GLOSSARY.md:25:## ContextOS (legacy term)`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/16_GLOSSARY.md:59:ContextOS pre-spec context artifact.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/17_MONKEYOS_CONTEXTBUS_DOCTRINE.md:14:  repo-backed infrastructure layer formerly called ContextOS.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:11:GitHub Spec Kit provides the specification-driven development backbone. ContextOS provides the multi-agent, repo-backed, role-governed flow and artifact system.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:17:ContextOS owns the team, flow, artifact, identity, and governance bus.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:24:| `/dossier` | ContextOS custom | PM | collect facts before specification |`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:33:| `/execute` | ContextOS/Helper local execution | Helper/Codex | run commands/tests and capture evidence |`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:34:| `/audit` | ContextOS audit gate | Auditor | milestone/risk/claim audit |`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:92:ContextOS flow paths:`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:116:Do not let Spec Kit bypass ContextOS governance.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md:118:Do not let ContextOS bypass Spec Kit discipline.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md:11:ContextOS must support both the user and partner using the same system and GPTs concurrently.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md:15:ContextOS must also support replicating a PM/Coder/Auditor/Helper GPT team for additional repos.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md:34:GPT Action -> OAuth -> ContextOS Broker -> user_id + role + project`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md:76:contextos.swarm.yaml`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md:117:contextos init-swarm --config contextos.swarm.yaml`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:23:As the human operator, I want to manually open and command each GPT while state persists through ContextOS, so I keep control without copy/paste overhead.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:99:As the system designer, I want ContextOS flows to store Spec Kit-compatible artifacts, so the workflow is specification-driven and compatible with VS Code/Codex Spec Kit use.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:104:- `/dossier`, `/execute`, `/audit` complete the ContextOS-specific lifecycle.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:123:- `contextos.swarm.yaml` defines repo/team variables.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:152:- [`docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md`](../../../04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md)`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:156:- [`docs/Arqon_ContextOS_Natural_Flow_User_Stories.md`](../../../Arqon_ContextOS_Natural_Flow_User_Stories.md)`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/15_USER_STORIES_AND_ACCEPTANCE_CRITERIA.md:157:- [`docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md`](../../../project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md)`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:1:# 00 — Arqon ContextOS Ground Truth`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:11:Arqon ContextOS is a repo-backed, Cloudflare-served, GitHub App-powered operating layer that lets PM, Coder, Auditor, Helper/Codex, and human operators share persistent project context, messages, notes, flows, Spec Kit-compatible artifacts, execution evidence, and gate decisions without manual copy/paste or daily context reconstruction.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:17:ContextOS fixes this by making the repository the durable memory and Cloudflare the controlled broker. GPTs do not rely on chat memory. GPTs pull current state through role-bound Actions.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:34:| `ArqonContextOS` | Public infrastructure repo: Worker, OpenAPI, docs, schemas, templates |`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:40:https://arqon-contextos-broker.sonarum.workers.dev`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:170:ContextOS should not replace GitHub Spec Kit.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:172:ContextOS wraps and governs it.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md:176:ContextOS = role/team/repo/flow/artifact/message/evidence bus`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/11_IMPLEMENTATION_PLAN.md:17:`ArqonContextOS``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/11_IMPLEMENTATION_PLAN.md:67:`ArqonContextOS``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/11_IMPLEMENTATION_PLAN.md:76:- `openapi/arqon_contextos.openapi.yaml``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/11_IMPLEMENTATION_PLAN.md:169:- contextos.swarm.yaml`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/03_ARCHITECTURE.md:27:They do not own durable state. They load and write through ContextOS.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/03_ARCHITECTURE.md:61:### ArqonContextOS repo`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/18_RENAME_READINESS_PLAN.md:18:- `ContextOS``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/18_RENAME_READINESS_PLAN.md:19:- `ArqonContextOS``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/18_RENAME_READINESS_PLAN.md:20:- `contextos``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/18_RENAME_READINESS_PLAN.md:21:- `context_os``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/18_RENAME_READINESS_PLAN.md:44:- “ContextOS is the legacy name for the infrastructure now called ContextBus inside MonkeyOS.”`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/01_VISION_MISSION_OBJECTIVES.md:11:Arqon ContextOS is the persistent operating layer for governed AI development teams. It turns isolated GPT sessions into role-bound project operators that can share current repo-backed context, communicate through controlled message boxes, save non-official notes, manage official flows, preserve evidence, and advance work through explicit human-governed gates.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/01_VISION_MISSION_OBJECTIVES.md:27:Arqon ContextOS exists to make AI team workflows persistent, auditable, role-separated, multi-user, multi-repo, and specification-driven.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/01_VISION_MISSION_OBJECTIVES.md:31:ContextOS must:`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/01_VISION_MISSION_OBJECTIVES.md:110:- OAuth into the ContextOS broker`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/01_VISION_MISSION_OBJECTIVES.md:120:contextos.swarm.yaml`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/01_VISION_MISSION_OBJECTIVES.md:125:ContextOS succeeds when the user can:`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/10_ROADMAP_PLAN_MILESTONES.md:23:## Milestone 0 — ContextOS v0.2 Baseline Stabilized`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/10_ROADMAP_PLAN_MILESTONES.md:231:- OAuth into ContextOS broker`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/10_ROADMAP_PLAN_MILESTONES.md:250:- `contextos.swarm.yaml``
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/10_ROADMAP_PLAN_MILESTONES.md:288:## Milestone 9 — ContextOS v1.0`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/02_CURRENT_SYSTEM_STATUS.md:11:ContextOS v0.2 is operational for context sync, non-official notes, and role messages.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/02_CURRENT_SYSTEM_STATUS.md:32:### ArqonContextOS`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/02_CURRENT_SYSTEM_STATUS.md:61:https://arqon-contextos-broker.sonarum.workers.dev`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/MKDOCS_NAV_SNIPPET.md:29:    - Runbook: 03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/MKDOCS_NAV_SNIPPET.md:31:    - Natural Flow User Stories: 04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/MKDOCS_NAV_SNIPPET.md:43:    - Ground Truth Start: ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/14_COMMAND_RUNBOOK.md:53:Load flow00 from ContextOS, read the latest Helper packet, execute it exactly, capture evidence, and write the Helper report.`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/14_COMMAND_RUNBOOK.md:139:/save-context title="Improve broker retry logic" tags=contextos,hardening`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md:88:    contextos/`
- `docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/05_COMMAND_MODEL.md:49:/save-context title="Coder deception-resistance suggestions" tags=contextos,deception,governance`

## COMPATIBILITY_KEEP References

- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:1:# Arqon ContextOS Natural Flow User Stories`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:12:This document preserves the user stories, design intent, workflow expectations, command semantics, and natural-flow doctrine shared during the Arqon ContextOS design session. It is intended to help rebuild context in a new PM/Coder/Auditor/Helper AI session without relying on chat history.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:51:As the human operator, I want to manually open and command each GPT, while the GPTs persist their state and artifacts through ContextOS, so I can keep control without being buried in copy/paste work.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:66:The project repo should become the memory and evidence ledger. ArqonZero contains project-specific context, notes, messages, flows, artifacts, and decisions. ArqonContextOS contains the reusable infrastructure: Worker broker, OpenAPI schema, command definitions, project templates, and docs.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:68:The Cloudflare Worker acts as the ContextOS broker. It reads and writes allowlisted paths in the project repo through a GitHub App. Each GPT gets a role-specific bearer key. The broker uses that key to infer the role and enforce permissions.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:72:As the system designer, I want ContextOS to store notes, messages, flows, artifacts, and decisions in GitHub, so the project has durable, auditable memory independent of any single GPT chat.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:76:- ArqonContextOS remains infrastructure.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:86:The current v0.2 ContextOS layer supports context notes and role messages. These are important but informal. A context note captures useful thinking, suggestions, analysis, design ideas, or observations. A message sends one role’s note or request to another role’s inbox.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:816:As the human operator, I want the whole system to be named MonkeyOS / Arqon MonkeyOS, so the platform includes both exploration and exploitation instead of treating ContextOS as the whole system.`
- `docs/Arqon_ContextOS_Natural_Flow_User_Stories.md:822:- ContextOS is marked legacy terminology.`
- `docs/00_active_state/TRANSITION_CHECKLIST.md:104:- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md)`
- `docs/00_active_state/CURRENT_STATE.md:26:- `https://arqon-contextos-broker.sonarum.workers.dev``
- `docs/00_active_state/CURRENT_STATE.md:92:- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/README.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/README.md)`
- `docs/00_active_state/OPEN_DECISIONS.md:57:- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md)`
- `docs/00_active_state/OPEN_DECISIONS.md:58:- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/08_MULTI_USER_MULTI_REPO.md)`
- `docs/00_active_state/OPEN_DECISIONS.md:59:- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/09_SECURITY_AND_GOVERNANCE.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/09_SECURITY_AND_GOVERNANCE.md)`
- `docs/index.md:60:- [Merged Ground Truth Docs](./ground_truth/arqon_contextos_merged_ground_truth_docs/README.md)`
- `docs/03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md:1:# Arqon ContextOS Command Runbook Cheat Sheet`
- `docs/03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md:8:- ContextBus is the infrastructure layer formerly called ContextOS.`
- `docs/03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md:47:- Example: `/save-context project=ArqonZero role=CODER_AI title="Claim guard ideas" tags=contextos,deception,governance``
- `docs/03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md:127:`Give me three suggestions to improve Arqon ContextOS deception resistance. Do not implement anything.``
- `docs/03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md:128:`/save-context project=ArqonZero role=CODER_AI title="Coder deception-resistance suggestions" tags=contextos,deception,governance``
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:1:# Arqon ContextOS Natural Flow User Stories`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:12:This document preserves the user stories, design intent, workflow expectations, command semantics, and natural-flow doctrine shared during the Arqon ContextOS design session. It is intended to help rebuild context in a new PM/Coder/Auditor/Helper AI session without relying on chat history.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:51:As the human operator, I want to manually open and command each GPT, while the GPTs persist their state and artifacts through ContextOS, so I can keep control without being buried in copy/paste work.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:66:The project repo should become the memory and evidence ledger. ArqonZero contains project-specific context, notes, messages, flows, artifacts, and decisions. ArqonContextOS contains the reusable infrastructure: Worker broker, OpenAPI schema, command definitions, project templates, and docs.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:68:The Cloudflare Worker acts as the ContextOS broker. It reads and writes allowlisted paths in the project repo through a GitHub App. Each GPT gets a role-specific bearer key. The broker uses that key to infer the role and enforce permissions.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:72:As the system designer, I want ContextOS to store notes, messages, flows, artifacts, and decisions in GitHub, so the project has durable, auditable memory independent of any single GPT chat.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:76:- ArqonContextOS remains infrastructure.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:86:The current v0.2 ContextOS layer supports context notes and role messages. These are important but informal. A context note captures useful thinking, suggestions, analysis, design ideas, or observations. A message sends one role’s note or request to another role’s inbox.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:816:As the human operator, I want the whole system to be named MonkeyOS / Arqon MonkeyOS, so the platform includes both exploration and exploitation instead of treating ContextOS as the whole system.`
- `docs/project/specs/Arqon_ContextOS_Natural_Flow_User_Stories.md:822:- ContextOS is marked legacy terminology.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:1:# Arqon ContextOS Natural Flow User Stories`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:12:This document preserves the user stories, design intent, workflow expectations, command semantics, and natural-flow doctrine shared during the Arqon ContextOS design session. It is intended to help rebuild context in a new PM/Coder/Auditor/Helper AI session without relying on chat history.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:51:As the human operator, I want to manually open and command each GPT, while the GPTs persist their state and artifacts through ContextOS, so I can keep control without being buried in copy/paste work.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:66:The project repo should become the memory and evidence ledger. ArqonZero contains project-specific context, notes, messages, flows, artifacts, and decisions. ArqonContextOS contains the reusable infrastructure: Worker broker, OpenAPI schema, command definitions, project templates, and docs.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:68:The Cloudflare Worker acts as the ContextOS broker. It reads and writes allowlisted paths in the project repo through a GitHub App. Each GPT gets a role-specific bearer key. The broker uses that key to infer the role and enforce permissions.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:72:As the system designer, I want ContextOS to store notes, messages, flows, artifacts, and decisions in GitHub, so the project has durable, auditable memory independent of any single GPT chat.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:76:- ArqonContextOS remains infrastructure.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:86:The current v0.2 ContextOS layer supports context notes and role messages. These are important but informal. A context note captures useful thinking, suggestions, analysis, design ideas, or observations. A message sends one role’s note or request to another role’s inbox.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:816:As the human operator, I want the whole system to be named MonkeyOS / Arqon MonkeyOS, so the platform includes both exploration and exploitation instead of treating ContextOS as the whole system.`
- `docs/04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md:822:- ContextOS is marked legacy terminology.`
- `docs/04_flows_and_spec_kit/FLOW_MODEL.md:35:- [`ground_truth/.../06_FLOW_MODEL.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/06_FLOW_MODEL.md)`
- `docs/04_flows_and_spec_kit/SPEC_KIT_INTEGRATION.md:33:- [`ground_truth/.../07_SPEC_KIT_INTEGRATION.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/07_SPEC_KIT_INTEGRATION.md)`
- `docs/07_arqon_zero_project/ARQON_ZERO_PROJECT_CONTEXT.md:18:- `https://arqon-contextos-broker.sonarum.workers.dev``
- `openapi/arqon_contextos.openapi.yaml:7:  - url: https://arqon-contextos-broker.sonarum.workers.dev`

## DEFER_REVIEW References

- `README.md:54:- ContextOS is the legacy terminology for the infrastructure now named ContextBus.`
- `docs/00_active_state/OPEN_DECISIONS.md:48:- How to keep old ContextOS URLs/actions working during rename transition`
- `openapi/arqon_contextos.openapi.yaml:5:  description: Repo-backed ContextBus broker for Arqon role GPTs (legacy name: ContextOS).`
- `worker/package.json:2:  "name": "arqon-contextos-worker",`
- `worker/src/index.ts:17:    service: "Arqon ContextOS Broker",`
- `worker/node_modules/typescript/lib/pt-br/diagnosticMessages.generated.json:249:  "An_implementation_cannot_be_declared_in_ambient_contexts_1183": "Uma implementação não pode ser declarada em contextos de ambiente.",`
- `worker/node_modules/typescript/lib/pt-br/diagnosticMessages.generated.json:945:  "Initializers_are_not_allowed_in_ambient_contexts_1039": "Inicializadores não são permitidos em contextos de ambiente.",`
- `worker/node_modules/typescript/lib/pt-br/diagnosticMessages.generated.json:1518:  "Statements_are_not_allowed_in_ambient_contexts_1036": "Instruções não são permitidas em contextos de ambiente.",`
- `worker/node_modules/typescript/lib/pt-br/diagnosticMessages.generated.json:2022:  "await_using_declarations_are_not_allowed_in_ambient_contexts_1546": "Declarações \"await using\" não são permitidas em contextos de ambiente.",`
- `worker/node_modules/typescript/lib/pt-br/diagnosticMessages.generated.json:2117:  "using_declarations_are_not_allowed_in_ambient_contexts_1545": "Declarações \"using\" não são permitidas em contextos de ambiente.",`
- `worker/node_modules/typescript/lib/es/diagnosticMessages.generated.json:249:  "An_implementation_cannot_be_declared_in_ambient_contexts_1183": "Una implementación no se puede declarar en contextos de ambiente.",`
- `worker/node_modules/typescript/lib/es/diagnosticMessages.generated.json:945:  "Initializers_are_not_allowed_in_ambient_contexts_1039": "No se permiten inicializadores en los contextos de ambiente.",`
- `worker/node_modules/typescript/lib/es/diagnosticMessages.generated.json:1518:  "Statements_are_not_allowed_in_ambient_contexts_1036": "No se permiten instrucciones en los contextos de ambiente.",`
- `worker/node_modules/typescript/lib/es/diagnosticMessages.generated.json:2022:  "await_using_declarations_are_not_allowed_in_ambient_contexts_1546": "No se permiten declaraciones \"await using\" en contextos de ambiente.",`
- `worker/node_modules/typescript/lib/es/diagnosticMessages.generated.json:2117:  "using_declarations_are_not_allowed_in_ambient_contexts_1545": "No se permiten declaraciones 'using' en contextos de ambiente.",`
- `worker/node_modules/.package-lock.json:2:  "name": "arqon-contextos-worker",`
- `worker/package-lock.json:2:  "name": "arqon-contextos-worker",`
- `worker/package-lock.json:8:      "name": "arqon-contextos-worker",`
- `worker/wrangler.toml:1:name = "arqon-contextos-broker"`
- `schemas/role_context.schema.json:30:  "title": "Arqon ContextOS Role Context",`
- `schemas/human_decision.schema.json:30:  "title": "Arqon ContextOS Human Decision",`
- `schemas/context_snapshot.schema.json:34:  "title": "Arqon ContextOS Current Context Snapshot",`
- `schemas/message.schema.json:39:  "title": "Arqon ContextOS Message",`
- `schemas/run_manifest.schema.json:27:  "title": "Arqon ContextOS Run Manifest",`
- `schemas/note.schema.json:35:  "title": "Arqon ContextOS Context Note",`
- `schemas/artifact.schema.json:34:  "title": "Arqon ContextOS Run Artifact",`
- `project_templates/governance/context/context_ledger.jsonl:1:{"event":"CONTEXT_LEDGER_CREATED","actor":"HUMAN","summary":"Initial Arqon ContextOS ledger created.","status":["REQUIRES_HUMAN_REVIEW","development diagnostic only","NOT SEALED-TEST CERTIFIED","not promotable"]}`
- `project_templates/.github/workflows/build-gpt-context.yml:29:            git config user.name "arqon-contextos-bot"`
- `prompts/BOOTSTRAP_REPO_PROMPT.md:1:# Prompt: Bootstrap ArqonContextOS Repo`
- `prompts/BOOTSTRAP_REPO_PROMPT.md:3:You are Helper/Codex for the ArqonContextOS repository.`

## ACTIVE_RENAME References Remaining (if any)

- `docs/index.md:42:- [Command Runbook Cheat Sheet](./03_commands_and_runbooks/Arqon_ContextOS_Command_Runbook_Cheat_Sheet.md)`
- `docs/index.md:46:- [Natural Flow User Stories](./04_flows_and_spec_kit/Arqon_ContextOS_Natural_Flow_User_Stories.md)`
- `docs/02_contextbus_infrastructure/DEPLOYMENT_CLOUDFLARE.md:14:- Arqon ContextOS Worker configured`
- `docs/02_contextbus_infrastructure/ARCHITECTURE.md:11:Arqon ContextOS connects GPT role agents to repo-backed context and artifact storage.`
- `docs/02_contextbus_infrastructure/PROJECT_INTEGRATION_GUIDE.md:11:Integrate a project repo with Arqon ContextOS.`
- `docs/02_contextbus_infrastructure/PROJECT_INTEGRATION_GUIDE.md:21:7. Add the repo to the ContextOS broker project map.`
- `docs/02_contextbus_infrastructure/GITHUB_APP_SETUP.md:15:`Arqon ContextOS Governance App``
- `docs/07_arqon_zero_project/ARQON_ZERO_PROJECT_CONTEXT.md:13:- ArqonContextOS repo: public infrastructure/docs/tooling.`

## Remaining Risks

- Legacy references still exist in archival ground-truth docs and compatibility filenames by design.
- Broker URL naming (`arqon-contextos-broker`) remains for compatibility and deployment stability.
- OpenAPI filename (`arqon_contextos.openapi.yaml`) remains for compatibility and pending naming decision.
- Further renaming of external integrations (Cloudflare/GPT Actions/OpenAPI file paths/source package names) remains deferred for explicit PM/Human approval.

## Required Status Labels

- REQUIRES_HUMAN_REVIEW
- development diagnostic only
- NOT SEALED-TEST CERTIFIED
- not promotable

