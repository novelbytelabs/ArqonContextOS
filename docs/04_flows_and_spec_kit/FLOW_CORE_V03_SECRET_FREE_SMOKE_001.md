# FLOW CORE V0.3 SECRET-FREE SMOKE 001

Status:
REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable

## Run context

- branch: `main`
- commit: `a3886f25d283e7bb0bd428bd5535f94deba9ba9c`
- repo: `novelbytelabs/ArqonMonkeyOS`
- local path: `/home/irbsurfer/Projects/arqon/ArqonMonkeyOS`
- smoke command used: `node --experimental-specifier-resolution=node runtime/flow-core-smoke-dist/test_support/flow_core_v03_offline_smoke.js`

## Command output summary

- `cd worker && npm run typecheck` -> PASS
- `cd worker && npx tsc -p tsconfig.smoke.json` -> PASS
- `node runtime/flow-core-smoke-dist/test_support/flow_core_v03_offline_smoke.js` -> PASS

## JSON smoke result

```json
{
  "status": "PASS",
  "created_flow_id": "FLOW-2026-0001",
  "created_flow_name": "flowcore-v03-smoke-001",
  "memory_paths": [
    "governance/flows/FLOW-2026-0001/artifacts/ART-2026-05-14-c9b8754f-Offline_Smoke_PM_Spec_Artifact.md",
    "governance/flows/FLOW-2026-0001/flow_manifest.json",
    "governance/flows/flow_index.json"
  ],
  "results": [
    {
      "name": "A create science_flow with default ArqonZero project",
      "status": "PASS",
      "details": "created FLOW-2026-0001/flowcore-v03-smoke-001"
    },
    {
      "name": "B list/load by flow_id and alias",
      "status": "PASS",
      "details": "list, flow_id load, and alias load passed"
    },
    {
      "name": "C flow status returns gate state",
      "status": "PASS",
      "details": "status active/DRAFT returned"
    },
    {
      "name": "D valid role-gated artifact write succeeds",
      "status": "PASS",
      "details": "governance/flows/FLOW-2026-0001/artifacts/ART-2026-05-14-c9b8754f-Offline_Smoke_PM_Spec_Artifact.md"
    },
    {
      "name": "D invalid role-gated artifact write fails closed",
      "status": "PASS",
      "details": "HELPER_CODEX forbidden from pm_spec as expected"
    },
    {
      "name": "E non-HUMAN advancement denied",
      "status": "PASS",
      "details": "PM_AI advancement denied"
    },
    {
      "name": "E HUMAN advancement succeeds",
      "status": "PASS",
      "details": "HUMAN advancement accepted"
    },
    {
      "name": "F v0.2 route regression smoke: health and legacy runs fallback",
      "status": "PASS",
      "details": "health ok and legacy /v1/runs fallback retained"
    }
  ]
}
```

## Scenario matrix

- create flow: PASS
- list/load by id and alias: PASS
- status endpoint: PASS
- valid PM artifact write: PASS
- invalid HELPER_CODEX PM artifact write denied: PASS
- non-HUMAN advancement denied: PASS
- HUMAN advancement accepted: PASS
- v0.2 health and legacy `/v1/runs` fallback: PASS

## Required evidence confirmations

- generated flow_id/name: `FLOW-2026-0001` / `flowcore-v03-smoke-001`
- project default to ArqonZero: PASS
- alias resolution: PASS
- role-gated artifact writes: PASS
- Human-only advancement: PASS
- health and legacy runs fallback intact: PASS

## Micro-edits made

Execution-blocking, test-only micro-edits were required:

1. `worker/test_support/flow_core_v03_offline_smoke.ts`
   - Added `declare const process` for Node typing without adding packages.
   - Wrapped PASS branch push in braces to satisfy Promise<void> typing.
   - Switched test imports to `.js` specifiers for emitted runtime compatibility.

2. `worker/tsconfig.smoke.json`
   - Changed test-only compile target from ESM/Bundler to CommonJS/Node so Node can execute compiled harness without changing production runtime.

These edits are limited to smoke harness execution path and do not alter production Worker behavior.

## Required status labels

REQUIRES_HUMAN_REVIEW  
development diagnostic only  
NOT SEALED-TEST CERTIFIED  
not promotable
