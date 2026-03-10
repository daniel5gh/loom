---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Visualization
status: planning
stopped_at: Completed 09-01-PLAN.md
last_updated: "2026-03-10T22:39:16.246Z"
last_activity: 2026-03-10 — Phase 7 map interactions complete; all MAP-03 through MAP-10 verified by human
progress:
  total_phases: 10
  completed_phases: 8
  total_plans: 32
  completed_plans: 30
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Turn a flat collection of tagged markdown documents into a navigable, visual knowledge graph — making connections between research topics discoverable at a glance.
**Current focus:** Phase 5 - Embedding Pipeline

## Current Position

Phase: 7 of 10 (Map Interactions)
Plan: 05 of 05 (complete)
Status: Phase 7 complete — ready to plan Phase 8
Last activity: 2026-03-10 — Phase 7 map interactions complete; all MAP-03 through MAP-10 verified by human

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
| Phase 07-map-interactions P02 | 2min | 2 tasks | 2 files |
| Phase 07-map-interactions P03 | 2min | 2 tasks | 2 files |
| Phase 07-map-interactions P04 | 3min | 2 tasks | 2 files |
| Phase 07-map-interactions P05 | checkpoint | 2 tasks | 3 files |
| Phase 08-global-shell P01 | 4min | 2 tasks | 2 files |
| Phase 08-global-shell P02 | 5min | 2 tasks | 4 files |
| Phase 08-global-shell P03 | 3min | 2 tasks | 2 files |
| Phase 08-global-shell P04 | 8min | 2 tasks | 6 files |
| Phase 08-global-shell P05 | checkpoint | 2 tasks | 0 files |
| Phase 09-home-page P01 | 1min | 1 tasks | 1 files |

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
- [Phase 07-map-interactions]: hitTestInline inlined in map.astro — is:inline type=module cannot resolve bare specifiers; map.mjs is Node-only
- [Phase 07-map-interactions]: .map-panel .tag-pill overrides global tag-pill with subdued styling — panel tags are metadata labels, not interactive filters
- [Phase 07-map-interactions]: .map-controls .tag-filter-btn scoped selector used instead of bare .tag-filter-btn — global.css already defines .tag-filter-btn for graph sidebar; map controls bar needed different styling
- [Phase 07-map-interactions]: Fuse.js CDN ESM import (fuse.js@7.1.0) added inline in is:inline type=module script — same CDN pattern as D3 in graph.astro
- [Phase 07-map-interactions]: Timeline slider position 0 on initial load leaves timelineDate=null (no filter); activates only on first drag
- [Phase 07-map-interactions]: Play tick fires slider.dispatchEvent(new Event('input')) to reuse input handler — avoids duplicate redraw logic
- [Phase 07-map-interactions]: pagehide listener calls stopPlay() to clear interval and prevent memory leak on SPA navigation
- [Phase 07-map-interactions]: Fuse.js CDN ESM import replaced with local npm install (fuse.js@7.1.0) — CDN failed to load reliably in dev environment
- [Phase 07-map-interactions]: Side panel restructured from position:absolute overlay to flex sibling — canvas shrinks correctly with min-width:0 when panel opens
- [Phase 07-map-interactions]: initCanvas calls getBoundingClientRect each time and is re-called on panel open/close — correct HiDPI sizing after layout reflow
- [Phase 07-map-interactions]: selectedDot reattached by slug match after each initCanvas call — preserves neighbor lines and panel state across resize/panel-toggle
- [Phase 08-global-shell]: node:test (built-in) used exclusively — no external test framework installed
- [Phase 08-global-shell]: [Phase 08-global-shell]: contrastRatio() hardcodes hex values from global.css — no runtime CSS parsing
- [Phase 08-global-shell]: [Phase 08-global-shell]: --text-secondary tested at >= 3.0:1 (large text AA) not 4.5:1 — metadata labels, not body copy
- [Phase 08-global-shell]: heading-appear uses fade+translateY not white-space:nowrap typewriter — document titles are long and would overflow
- [Phase 08-global-shell]: AsciiDivider not placed in Base.astro — graph/map use full-viewport layouts that don't benefit from dividers
- [Phase 08-global-shell]: Bundled <script> (no is:inline) used so import Fuse from fuse.js resolves via Astro bundler
- [Phase 08-global-shell]: JSON data island pattern: serialize build-time collection data as application/json for client script consumption in shell overlay
- [Phase 08-global-shell]: isTypingContext() guards / shortcut — overlay won't fire inside map-search input, tag filter, or any form element
- [Phase 08-global-shell]: Second addEventListener('keydown') added for vim keys rather than consolidating into existing handler — separation of concerns
- [Phase 08-global-shell]: data-vim-item placed on DocCard article root — every DocCard usage becomes a vim item automatically without call-site changes
- [Phase 08-global-shell]: All 10 Phase 8 requirements verified by human in browser — no automated substitute for DOM/keyboard/visual behavior confirmation
- [Phase 09-home-page]: getRecentDocs defined inline in test file — self-contained without Astro API dependency; Wave 1 implements same logic in index.astro

### Pending Todos

None.

### Blockers/Concerns

- [Phase 5] Ollama must be running locally for embed.mjs — pipeline must health-check first and fail loudly, not silently produce partial data
- [Phase 5] umap-js last published 2 years ago; if it runs too slowly, Python umap-learn is the documented fallback — document the decision point in Phase 5 plan
- [Phase 7] Gaussian opacity timeline has no prior art as a reusable component — research pass recommended during Phase 7 planning

## Session Continuity

Last session: 2026-03-10T22:39:16.241Z
Stopped at: Completed 09-01-PLAN.md
Resume file: None
