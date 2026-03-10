---
phase: 05-embedding-pipeline
plan: "03"
subsystem: scripts
tags: [ollama, umap-js, embeddings, embeddings-json, npm-scripts, remote-ollama]

# Dependency graph
requires:
  - "05-02 — scripts/embed.mjs fully implemented with 6 exported functions"
provides:
  - "src/data/embeddings.json — committed artifact with real UMAP x/y for all 15 documents"
  - "npm run embed — registered convenience script in package.json"
  - "EMBED-04: embeddings.json committed to git and consumable at Astro build time"
  - "EMBED-03: Ollama failure path verified — exits 1 with actionable error"
affects:
  - "06-embedding-consumer — reads src/data/embeddings.json for visualization"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Remote Ollama host: http://10.0.1.3:11434 — Ollama runs on LAN host, not localhost"
    - "Human-verify checkpoint: operator runs embed pipeline, approves output, agent commits artifact"

key-files:
  created:
    - "src/data/embeddings.json — 15 documents with real UMAP x/y coordinates (non-zero)"
  modified:
    - "package.json — added 'embed' npm script"
    - "scripts/embed.mjs — assertOllamaRunning and Ollama constructor use http://10.0.1.3:11434"

key-decisions:
  - "Ollama host set to http://10.0.1.3:11434 — project uses remote LAN Ollama instance, not localhost"
  - "embeddings.json committed to git with real UMAP coordinates — EMBED-04 closed"

patterns-established:
  - "Remote Ollama: both assertOllamaRunning default and new Ollama({ host }) must match"

requirements-completed:
  - EMBED-04

# Metrics
duration: ~30min (includes human-verify checkpoint)
completed: 2026-03-10
---

# Phase 5 Plan 03: Run and Commit Embeddings Summary

**15-document embeddings.json committed with real UMAP x/y coordinates produced by remote Ollama at http://10.0.1.3:11434, with incremental cache fast path and loud failure path verified**

## Performance

- **Duration:** ~30 min (includes human-verify checkpoint for operator Ollama run)
- **Started:** 2026-03-10
- **Completed:** 2026-03-10
- **Tasks:** 2 (+ 1 checkpoint)
- **Files modified:** 3

## Accomplishments

- Committed `src/data/embeddings.json` with real UMAP coordinates: 15 documents, all non-zero x/y
- Registered `npm run embed` in package.json for convenience
- Configured `scripts/embed.mjs` to use remote Ollama host `http://10.0.1.3:11434` in both `assertOllamaRunning` default and `new Ollama({ host })`
- EMBED-03 failure path verified: wrong port produces actionable error + exit 1
- EMBED-02 incremental cache fast path confirmed by operator: second run shows all cache hits, no UMAP re-run
- All tests pass: graph.test.mjs + embed.test.mjs (4 tests, 0 skipped)
- .cache/ is not tracked by git (gitignored)

## Task Commits

1. **Task 1: Add embed npm script and verify EMBED-03 failure path** — `551329a` (feat)
2. **Task 2: Commit real embeddings.json and embed.mjs host change** — `e406dc3` (feat)

## Files Created/Modified

- `src/data/embeddings.json` — 15 documents with real UMAP x/y coordinates (was placeholder zeros)
- `package.json` — added `"embed": "node scripts/embed.mjs"` npm script
- `scripts/embed.mjs` — updated assertOllamaRunning default host and Ollama constructor to http://10.0.1.3:11434

## Decisions Made

- Ollama runs on a remote LAN host (10.0.1.3), not localhost — both the health-check default and the Ollama client constructor were updated to use `http://10.0.1.3:11434`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated Ollama host from localhost to http://10.0.1.3:11434**
- **Found during:** Operator-run checkpoint (embed.mjs would not connect to localhost)
- **Issue:** scripts/embed.mjs used localhost:11434 but operator's Ollama instance runs on a LAN host
- **Fix:** Updated both `assertOllamaRunning` default parameter and `new Ollama({ host })` in `main()` to use `http://10.0.1.3:11434`
- **Files modified:** scripts/embed.mjs
- **Verification:** `npm run embed` succeeded and produced 15 documents with real coordinates
- **Committed in:** e406dc3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required for the script to reach the real Ollama instance. No scope creep.

## Issues Encountered

None beyond the host configuration fix.

## User Setup Required

None — no external service configuration required beyond having Ollama running at http://10.0.1.3:11434.

## Next Phase Readiness

- Phase 5 (Embedding Pipeline) is fully complete: EMBED-01 through EMBED-04 all satisfied
- `src/data/embeddings.json` with real UMAP coordinates is committed and consumable at Astro build time
- Phase 6 (Embedding Consumer) can import embeddings.json from `src/data/` for visualization

---
*Phase: 05-embedding-pipeline*
*Completed: 2026-03-10*
