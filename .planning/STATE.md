---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Visualization
status: planning
stopped_at: Completed 07-01-PLAN.md
last_updated: "2026-03-10T17:32:21.793Z"
last_activity: 2026-03-10 — v1.1 roadmap created, 31 requirements mapped to phases 5-10
progress:
  total_phases: 10
  completed_phases: 6
  total_plans: 24
  completed_plans: 20
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Turn a flat collection of tagged markdown documents into a navigable, visual knowledge graph — making connections between research topics discoverable at a glance.
**Current focus:** Phase 5 - Embedding Pipeline

## Current Position

Phase: 5 of 10 (Embedding Pipeline)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-10 — v1.1 roadmap created, 31 requirements mapped to phases 5-10

Progress: [████░░░░░░] 40% (4 of 10 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 14 (v1.0)
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.0 phases 1-4 | 14 | - | - |

*Updated after each plan completion*
| Phase 05-embedding-pipeline P01 | 2 | 3 tasks | 4 files |
| Phase 05-embedding-pipeline P02 | 5min | 1 tasks | 1 files |
| Phase 05-embedding-pipeline P03 | 30 | 2 tasks | 3 files |
| Phase 06-map-page-skeleton P01 | 2min | 3 tasks | 5 files |
| Phase 06-map-page-skeleton P02 | 5min | 2 tasks | 0 files |
| Phase 07-map-interactions P01 | 2 | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack: Astro ^5.x + D3.js ^7.x + vanilla CSS + Shiki + Cloudflare Pages (no React, no Tailwind, no TypeScript)
- Data island pattern established in graph.astro — extend for embeddings.json, do not replace
- v1.1 stack additions: ollama@^0.6.3, umap-js@^1.4.0, gray-matter@^4.x (offline only); regl-scatterplot@^1.15.0, fuse.js@^7.1.0 (browser)
- Canvas vs regl-scatterplot decision deferred to Phase 6 planning (depends on projected corpus size)
- embeddings.json location (src/data/ vs public/) deferred to Phase 6 planning
- [Phase 05-embedding-pipeline]: embed.mjs deps installed to production dependencies (not devDeps) — runs in deploy context
- [Phase 05-embedding-pipeline]: embeddings.json committed to git (not gitignored) so Cloudflare Pages builds succeed before pipeline runs
- [Phase 05-embedding-pipeline]: .cache/ gitignored — raw 768-dim vector cache is local-only, never committed
- [Phase 05-embedding-pipeline]: getVectors returns { vectors, allCached } tuple — main() branches to fast path without re-iterating docs
- [Phase 05-embedding-pipeline]: atomicWriteJSON creates parent dirs with mkdirSync recursive — avoids ENOENT on first run when .cache/ missing
- [Phase 05-embedding-pipeline]: Ollama host set to http://10.0.1.3:11434 — project uses remote LAN Ollama instance, not localhost
- [Phase 05-embedding-pipeline]: embeddings.json committed to git with real UMAP coordinates — EMBED-04 closed
- [Phase 06-map-page-skeleton]: map.mjs exports buildScales and hitTest as pure ESM functions — testable with node and importable from astro
- [Phase 06-map-page-skeleton]: HiDPI canvas reads layout dimensions from getBoundingClientRect at runtime — avoids hardcoded sizes
- [Phase 06-map-page-skeleton]: embeddings.json consumed via data island at build time — no SSR globals, no window/document references in frontmatter
- [Phase 06-map-page-skeleton]: Phase 6 visual verification passed by human inspection — automated tests cannot cover HiDPI sharpness or tooltip DOM behavior
- [Phase 07-map-interactions]: gaussianOpacity does NOT apply DIM_OPACITY floor — timeline is continuous fade, callers handle clamping
- [Phase 07-map-interactions]: composedOpacity does no clamping — pure Math.min; callers apply DIM_OPACITY floor themselves
- [Phase 07-map-interactions]: kNearest uses reference equality (d !== dot) to exclude self from results
- [Phase 07-map-interactions]: Astro collection enrichment at build time via getCollection + regex to extract ## Summary section

### Pending Todos

None.

### Blockers/Concerns

- [Phase 5] Ollama must be running locally for embed.mjs — pipeline must health-check first and fail loudly, not silently produce partial data
- [Phase 5] umap-js last published 2 years ago; if it runs too slowly, Python umap-learn is the documented fallback — document the decision point in Phase 5 plan
- [Phase 7] Gaussian opacity timeline has no prior art as a reusable component — research pass recommended during Phase 7 planning

## Session Continuity

Last session: 2026-03-10T17:32:21.790Z
Stopped at: Completed 07-01-PLAN.md
Resume file: None
