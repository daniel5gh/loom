---
phase: 06-map-page-skeleton
plan: "01"
subsystem: map-page
tags: [canvas, hidpi, umap, tooltip, tdd]
dependency_graph:
  requires: [src/data/embeddings.json, src/layouts/Base.astro, public/styles/global.css]
  provides: [src/pages/map.astro, src/lib/map.mjs, src/lib/map.test.mjs]
  affects: [all pages via Base.astro nav]
tech_stack:
  added: []
  patterns: [data-island, is:inline-module, HiDPI-canvas, TDD-node-assert]
key_files:
  created:
    - src/lib/map.test.mjs
    - src/lib/map.mjs
    - src/pages/map.astro
  modified:
    - public/styles/global.css
    - src/layouts/Base.astro
decisions:
  - "map.mjs exports buildScales and hitTest as pure ESM functions — testable with node and importable from astro"
  - "HiDPI canvas reads layout dimensions from getBoundingClientRect at runtime — avoids hardcoded sizes"
  - "Coordinate normalization guard: single-point corpus returns canvasW/2 to prevent divide-by-zero"
  - "map-page CSS uses main:has(.map-page) to remove container constraints, matching graph page pattern"
metrics:
  duration: "2 minutes"
  completed: "2026-03-10"
  tasks: 3
  files: 5
---

# Phase 6 Plan 01: Map Page Skeleton Summary

Canvas /map page rendering 15 UMAP-positioned documents as neon dots with HiDPI scaling and hover tooltip.

## What Was Built

- `src/lib/map.mjs` — Pure ESM helpers: `buildScales` (min-max normalization with divide-by-zero guard) and `hitTest` (Euclidean distance search)
- `src/lib/map.test.mjs` — 6 behavioral assertions covering both functions, run with `node src/lib/map.test.mjs`
- `src/pages/map.astro` — Map page: data island pattern (mirrors graph.astro), HiDPI canvas setup via `getBoundingClientRect + devicePixelRatio`, 15 neon dots colored by category, mousemove/mouseleave tooltip
- `public/styles/global.css` — Map-specific styles: `.map-page`, `.map-canvas-wrap`, `#map-canvas`, `.map-tooltip`, `.nav-map`; `main:has(.map-page)` removes container constraints
- `src/layouts/Base.astro` — Added `<a href="/map/" class="nav-map">Map</a>` after Graph link

## Verification Results

- `node src/lib/map.test.mjs` exits 0 — "All tests passed"
- `npm run build` exits 0 — 62 pages built, no SSR errors
- `dist/map/index.html` exists and contains: `canvas#map-canvas`, `script#map-data` data island, `a.nav-map`
- No `window is not defined` in dist/ output

## Commits

| Hash | Description |
|------|-------------|
| 769683e | test(06-01): add failing tests for buildScales and hitTest |
| 82098e9 | feat(06-01): implement buildScales and hitTest pure helpers for map page |
| 2dddac1 | feat(06-01): create /map page with HiDPI canvas, UMAP dots, and hover tooltip |
| 2a8912a | feat(06-01): add map page CSS and /map nav link to Base.astro |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- src/lib/map.test.mjs exists: FOUND
- src/lib/map.mjs exists: FOUND
- src/pages/map.astro exists: FOUND
- dist/map/index.html exists: FOUND
- All 4 commits exist in git log: FOUND
