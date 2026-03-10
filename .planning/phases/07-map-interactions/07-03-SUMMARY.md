---
phase: 07-map-interactions
plan: "03"
subsystem: ui
tags: [canvas, fuse.js, tag-filter, search, controls-bar, map]

requires:
  - phase: 07-02
    provides: selectedTags, anyAllMode, matchingDocIds state variables and redraw() function in map.astro

provides:
  - Controls bar HTML above canvas with search input, tag filter buttons, and ANY/ALL toggle
  - CSS for controls bar, scoped map tag filter buttons, search input, and ANY/ALL button
  - Fuse.js ESM search wired to matchingDocIds + redraw()
  - Tag filter buttons dynamically generated from corpus tags, wired to selectedTags + redraw()
  - ANY/ALL toggle wired to anyAllMode + redraw()

affects:
  - 07-04
  - 07-05

tech-stack:
  added:
    - fuse.js@7.1.0 (CDN ESM, browser-only — same CDN pattern as D3 in graph.astro)
  patterns:
    - Map controls bar placed as flex-shrink:0 sibling before .map-canvas-wrap inside .map-page flex column
    - Tag buttons scoped via .map-controls .tag-filter-btn to avoid collision with graph sidebar .tag-filter-btn
    - Fuse index initialized once at page load; search re-runs on every input event

key-files:
  created: []
  modified:
    - src/pages/map.astro
    - public/styles/global.css

key-decisions:
  - ".map-controls .tag-filter-btn scoped selector used instead of bare .tag-filter-btn — global.css already defines .tag-filter-btn for graph sidebar with different styling"
  - "matchingDocIds = null (not empty Set) used for 'no search filter active' — matches existing searchOpacity() null-check from Plan 02"

patterns-established:
  - "CDN ESM import pattern: import Lib from 'https://cdn.jsdelivr.net/npm/pkg@version/dist/lib.esm.min.js' inside is:inline type=module"
  - "Dynamically built filter controls: JS reads corpus data at runtime, creates DOM buttons, wires events — no SSR-time tag enumeration needed"

requirements-completed: [MAP-05, MAP-06, MAP-07]

duration: 2min
completed: 2026-03-10
---

# Phase 7 Plan 03: Map Interactions Controls Bar Summary

**Tag filter buttons, ANY/ALL toggle, and Fuse.js real-time search wired above the map canvas via controls bar HTML/CSS/JS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T17:37:27Z
- **Completed:** 2026-03-10T17:39:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Controls bar renders above canvas as a flex-shrink:0 row — search input left, tag buttons center, ANY/ALL toggle right
- Tag filter buttons dynamically built from unique corpus tags (sorted), wired to selectedTags Set and redraw()
- ANY/ALL toggle switches anyAllMode between 'ANY' and 'ALL' with matching CSS class (any-mode / all-mode) and color
- Fuse.js (v7.1.0, CDN ESM) indexes docs on page load; each input event updates matchingDocIds and triggers redraw()
- CSS scoped with .map-controls .tag-filter-btn to avoid conflict with graph sidebar button styles

## Task Commits

Each task was committed atomically:

1. **Task 1: Add controls bar HTML and CSS** - `2e7e2ee` (feat)
2. **Task 2: Wire tag filter, ANY/ALL toggle, and Fuse.js search to redraw()** - `23effef` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/pages/map.astro` - Added controls bar HTML div + Fuse.js import + tag/anyall/search event wiring
- `public/styles/global.css` - Added controls bar CSS block (`.map-controls`, `.map-search-input`, `.map-tag-filter`, `.map-controls .tag-filter-btn`, `.map-anyall-btn`)

## Decisions Made
- Used `.map-controls .tag-filter-btn` scoped selector instead of bare `.tag-filter-btn` — global.css already defines `.tag-filter-btn` for the graph sidebar with `background: none; border: none;` styling, which conflicts with the map controls bar's button appearance
- Kept `matchingDocIds = null` (not `new Set(docs.map(d => d.id))`) for "no search filter active" — matches the existing `searchOpacity()` null-check established in Plan 02, avoids "empty Set = dim all docs" bug

## Deviations from Plan

None - plan executed exactly as written, with one minor scoping adjustment (`.map-controls .tag-filter-btn` instead of bare `.tag-filter-btn`) to avoid CSS collision that the plan did not anticipate — this is a correctness fix, not a feature addition.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Controls bar is fully wired and functional — tag, search, and ANY/ALL filters all compose via composedOpacity() in redraw()
- Ready for Plan 04 (timeline slider) which adds the fourth filter dimension (timelineDate + gaussianOp)
- Manual smoke test recommended: visit /map, click tag buttons, toggle ANY/ALL, type in search box

---
*Phase: 07-map-interactions*
*Completed: 2026-03-10*
