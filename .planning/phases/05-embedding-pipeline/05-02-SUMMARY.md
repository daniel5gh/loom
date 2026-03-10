---
phase: 05-embedding-pipeline
plan: "02"
subsystem: scripts
tags: [ollama, umap-js, gray-matter, embeddings, cjs-in-esm, cache, atomic-write]

# Dependency graph
requires:
  - "05-01 — npm deps installed; embed.test.mjs scaffold with stubs"
provides:
  - "scripts/embed.mjs — fully working offline embedding pipeline with 6 named exports"
  - "EMBED-01: readDocs + getVectors + reduce + atomicWriteJSON deliver 2D coords to embeddings.json"
  - "EMBED-02: loadCache + sha256 content hashing; allCached fast path skips UMAP and output write"
  - "EMBED-03: assertOllamaRunning fails loud with ECONNREFUSED → actionable error + exit 1"
affects:
  - "05-03 — integration test for Ollama failure path (subprocess spawn check)"
  - "06-embedding-consumer — reads src/data/embeddings.json for visualization"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CJS-in-ESM: createRequire for umap-js and gray-matter; bare ESM import for ollama"
    - "Incremental sha256 cache: 16-hex-char content hash keyed on relPath"
    - "allCached fast path: getVectors returns { vectors, allCached }; main() skips UMAP if all hit"
    - "UMAP nNeighbors clamp: Math.min(15, vectors.length - 1) prevents crash on small corpus"
    - "Atomic write: write to .tmp then renameSync — no partial reads of output file"
    - "Main guard: process.argv[1] === fileURLToPath(import.meta.url) — safe to import in tests"

key-files:
  created:
    - "scripts/embed.mjs — 229-line embedding pipeline; 6 exported functions + main guard"
  modified: []

key-decisions:
  - "model-not-found error handled inside getVectors with actionable 'ollama pull' message — not a generic throw"
  - "getVectors returns { vectors, allCached } tuple so main() can branch without re-iterating"
  - "atomicWriteJSON creates parent dirs with mkdirSync recursive — .cache/ may not exist on first run"

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 5 Plan 02: Implement scripts/embed.mjs Summary

**Fully working offline embedding pipeline: 6 exported pure functions (assertOllamaRunning, readDocs, loadCache, getVectors, reduce, atomicWriteJSON) with incremental sha256 vector cache, UMAP nNeighbors clamp, atomic JSON writes, and main guard for safe test import**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T15:59:25Z
- **Completed:** 2026-03-10T16:04:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Implemented `scripts/embed.mjs` as a single self-contained module with 6 exported pure functions and a `main()` guard
- All 4 automated tests in `embed.test.mjs` now pass (readDocs, loadCache, reduce, schema) — previously 3 were stubs
- CJS-in-ESM pattern applied correctly: `createRequire` for `umap-js` and `gray-matter`, bare ESM import for `ollama`
- Incremental cache: sha256 content hash (16 hex chars) keyed by relPath; `allCached` fast path skips UMAP and output write entirely
- Loud failure path: `assertOllamaRunning` prints `"ERROR: Ollama is not running. Start it with: ollama serve"` and calls `process.exit(1)` before any doc processing
- Model-not-found handled in `getVectors` with `"Run: ollama pull nomic-embed-text"` message
- Atomic write via `.tmp` → `renameSync` prevents partial-read corruption
- `mkdirSync({ recursive: true })` in `atomicWriteJSON` ensures `.cache/` is created on first run

## Task Commits

1. **Task 1: Implement scripts/embed.mjs** — `a9d5f5c` (feat)

## Files Created/Modified

- `scripts/embed.mjs` — 229-line embedding pipeline; JSDoc-annotated, 6 exported functions + main()

## Decisions Made

- `getVectors` returns `{ vectors, allCached }` tuple so `main()` can branch to fast path without re-iterating docs
- Model-not-found detected inline in `getVectors` rather than at the top level — closer to the failure point, more actionable
- `atomicWriteJSON` creates parent dirs (`.cache/` may not exist on first run) — avoids ENOENT on first execution

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- Plan 03 (integration tests): `assertOllamaRunning` subprocess check can now be tested; `embed.mjs` exits 1 correctly when Ollama is down
- EMBED-04 remains satisfied: `src/data/embeddings.json` placeholder still in place; real output written by Plan 03 which runs the script end-to-end

---
*Phase: 05-embedding-pipeline*
*Completed: 2026-03-10*
