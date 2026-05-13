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
- [ ] explicit human approval captured before any repo rename

Related references:

- [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`docs/OPEN_DECISIONS.md`](./OPEN_DECISIONS.md)
- [`docs/ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md`](./ground_truth/arqon_contextos_merged_ground_truth_docs/docs/00_GROUND_TRUTH.md)
