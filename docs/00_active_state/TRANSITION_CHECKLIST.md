# TRANSITION CHECKLIST

Status labels:

- REQUIRES_HUMAN_REVIEW
- development diagnostic only
- NOT SEALED-TEST CERTIFIED
- not promotable

## 1. Pre-handoff repo checks

- [ ] ArqonContextOS merged docs installed
- [ ] CURRENT_STATE.md present
- [ ] OPEN_DECISIONS.md present
- [ ] TRANSITION_CHECKLIST.md present
- [ ] ArqonZero governance/context included
- [ ] OpenAPI schema included
- [ ] Worker source included
- [ ] no secrets included
- [ ] no private keys included
- [ ] no broker keys included

## 2. Context pack checks

- [ ] PM bootstrap zip created
- [ ] manifest created
- [ ] forbidden-file audit passed
- [ ] file count recorded
- [ ] SHA256 recorded
- [ ] ArqonContextOS branch/commit recorded
- [ ] ArqonZero branch/commit recorded

## 3. New PM AI start procedure

- [ ] Upload context pack
- [ ] Paste PM AI bootstrap prompt
- [ ] Require new PM AI to report active ground truth before work
- [ ] Do not allow implementation before ground truth report
- [ ] Confirm required status labels

## 4. New PM AI must report

- [ ] current architecture
- [ ] current working commands
- [ ] current planned commands
- [ ] current roadmap
- [ ] open decisions
- [ ] next recommended milestone
- [ ] stale/ambiguous docs

## 5. Forbidden during transition

- [ ] no certification
- [ ] no promotion
- [ ] no code edits before ground truth
- [ ] no secrets in bundle
- [ ] no private key exposure
- [ ] no treating old docs as equal to merged ground truth

## 6. MonkeyOS / ContextBus rename-readiness

- [ ] inventory ContextOS references across docs/source/config
- [ ] docs-first migration complete before any rename proposal
- [ ] OpenAPI/source/schema naming-impact review completed
- [ ] GitHub Pages, GPT Action URL, and Cloudflare URL review completed
- [x] explicit human approval captured before any repo rename
- [x] GitHub repository renamed: `ArqonContextOS` -> `ArqonMonkeyOS`
- [x] Local directory renamed: `/home/irbsurfer/Projects/arqon/ArqonContextOS` -> `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS`
- [x] controlled legacy-reference sweep completed (`LEGACY_REFERENCE_SWEEP_001`)
- [ ] OpenAPI/server/docs/site naming migration completed (pending)
- [ ] Cloudflare deployment/route naming migration completed (pending)
- [ ] GPT Action endpoint/name migration completed (pending)

## 7. Docs hierarchy migration checks

- [ ] new hierarchy folders created and populated
- [ ] key docs moved with preserved content
- [ ] compatibility docs retained where needed
- [ ] links/path references reviewed after move

## 8. Stale terminology inventory

- [ ] stale `run` terminology inventoried where superseded by `flow`
- [ ] stale `ContextOS` wording marked as legacy where appropriate
- [ ] conflicting doctrine statements flagged for PM/Human review

## 9. User-story expansion checks

- [ ] Natural Flow User Stories extended with sections 25-38
- [ ] Science Monkeys stories present
- [ ] Code Monkeys stories present
- [ ] top-level and compatibility copies synchronized

## 10. Post-rename planning checks

- [ ] post-rename GPT Action URL review plan captured
- [ ] post-rename Cloudflare URL compatibility plan captured
- [ ] human approval gate required before any actual rename action

Related references:

- [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`docs/OPEN_DECISIONS.md`](./OPEN_DECISIONS.md)
- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md`](../ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md)
