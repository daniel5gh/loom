---
phase: 07-map-interactions
plan: 02
subsystem: ui
tags: [canvas, redraw, side-panel, knn, click-handler, map, interactions]

requires:
  - phase: 07-map-interactions
    plan: 01
    provides: gaussianOpacity, kNearest, composedOpacity in map.mjs; enriched data island with date and summary

provides:
  - redraw() loop in map.astro inline script (foundation for all filter plans)
  - #map-panel side panel with title, tags, summary, article link
  - Canvas click handler: hitTest → openPanel / toggle close
  - drawNeighborLines() using inline kNearest

affects:
  - 07-03 (tag filter will call redraw())
  - 07-04 (search filter will call redraw())
  - 07-05 (Gaussian timeline will call redraw())

tech-stack:
  added: []
  patterns:
    - Central redraw() pattern — all canvas state changes flow through one function
    - Inline helper duplication — map.mjs exports used for Node tests; is:inline scripts inline equivalent logic
    - Side panel slide-in with CSS transform transition (no JS animation)

key-files:
  created: []
  modified:
    - src/pages/map.astro
    - public/styles/global.css

key-decisions:
  - "hitTestInline is inlined (not imported from map.mjs) — is:inline type=module cannot resolve bare specifiers"
  - ".map-panel .tag-pill overrides global .tag-pill with subdued styling — panel tags are metadata, not interactive filters"
  - "drawNeighborLines uses inline kNearest — same reason as hitTest; map.mjs is Node-only"
  - "selectedDot toggle: second click on same dot closes panel and removes neighbor lines"

metrics:
  duration: "~2 min"
  completed: "2026-03-10"
  tasks_completed: 2
  files_modified: 2
---

# Phase 7 Plan 2: redraw() Loop, Side Panel, and Click Interactions Summary

**Central redraw() loop established in map.astro with composable filter state, side panel slide-in (MAP-03), and nearest-neighbor line drawing on click (MAP-04).**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T17:33:14Z
- **Completed:** 2026-03-10T17:35:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced the Phase 6 one-shot draw loop with a central `redraw()` function that reads all filter state on every call
- Added module-level filter state variables (`selectedTags`, `searchQuery`, `timelineDate`, `matchingDocIds`, `selectedDot`) — all inactive at this stage, providing the foundation for Phase 7 filter plans
- Added inline opacity functions (`tagOpacity`, `searchOpacity`, `gaussianOp`, `composedOp`) mirroring map.mjs exports — is:inline scripts cannot use bare specifiers so logic is duplicated
- Added `drawDot` helper with reduced shadow blur for dimmed dots (opacity < 0.5 gets blur 4, not 8)
- Added `drawNeighborLines` using inline `kNearest` — draws 5 lines in `#8888AA` at 40% opacity
- Added `hitTestInline` — same logic as map.mjs `hitTest`, inlined for the same reason
- Added `#map-panel` HTML div with close button and content div inside `.map-canvas-wrap`
- Added `openPanel(doc)` — populates content with title, tag pills, summary, article link and adds `.open` class
- Added `closePanel()` — removes `.open` class
- Added canvas `click` listener: hit test → toggle `selectedDot` → open or close panel → `redraw()`
- Added `map-panel-close` button listener
- Added all CSS for the side panel (`.map-panel`, `.map-panel.open`, close button, title, tags, summary, link)
- Added `.map-panel .tag-pill` override with subdued `--bg-elevated` background and `--text-secondary` color — overrides the global neon tag-pill style for the panel context

## Task Commits

1. **Task 1: redraw() loop refactor** - `d25513b` (feat)
2. **Task 2: side panel HTML/CSS and click handler** - `4bc7dc4` (feat)

## Files Created/Modified

- `src/pages/map.astro` - Inline script rewritten with redraw() loop, filter state, opacity functions, kNearest, drawDot, drawNeighborLines, hitTestInline, openPanel, closePanel, click handler; HTML updated with #map-panel div
- `public/styles/global.css` - Side panel CSS appended to Map Page section; .map-panel .tag-pill override added

## Decisions Made

- `hitTestInline` is inlined in the script rather than imported from map.mjs — `is:inline type="module"` cannot resolve bare specifiers; map.mjs functions are for Node.js testing only
- `.map-panel .tag-pill` overrides the global `.tag-pill` with subdued styling — panel tags are metadata labels, not interactive filters, so the neon neon-cyan border/color would be visually misleading
- `drawNeighborLines` uses the inline `kNearest` rather than the map.mjs export — same constraint
- `selectedDot` toggle: clicking the same dot a second time sets `selectedDot = null`, closes panel, and calls `redraw()` which removes the neighbor lines

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added hitTestInline() — plan referenced hitTest without defining inline version**

- **Found during:** Task 2 implementation
- **Issue:** The plan stated "hitTest is already imported/available from Phase 6's inline script" but Phase 6 used an inline loop (not a named function). The click handler needed a callable `hitTest`-equivalent that isn't imported from map.mjs.
- **Fix:** Added `hitTestInline()` function alongside other inline helpers, mirroring map.mjs `hitTest` exactly.
- **Files modified:** src/pages/map.astro
- **Commit:** 4bc7dc4

**2. [Rule 2 - Missing critical functionality] Added .map-panel .tag-pill CSS override**

- **Found during:** Task 2 — CSS authoring
- **Issue:** The plan's tag-pill CSS for the panel context conflicts with the existing global `.tag-pill` (neon-cyan border/color). Without a more specific rule, panel tags would render with neon cyan border — inconsistent with the subdued panel aesthetic.
- **Fix:** Added `.map-panel .tag-pill` with higher specificity to override the global rule within panel context.
- **Files modified:** public/styles/global.css
- **Commit:** 4bc7dc4

## Self-Check

- [x] `dist/map/index.html` contains `map-panel` (9 matches)
- [x] `public/styles/global.css` contains `translateX(100%)` and `translateX(0)`
- [x] `src/pages/map.astro` contains `function redraw()`
- [x] `src/pages/map.astro` contains `canvas.addEventListener('click'`
- [x] Commit `d25513b` — feat(07-02): refactor map.astro to redraw() loop
- [x] Commit `4bc7dc4` — feat(07-02): add side panel HTML/CSS and click handler

## Self-Check: PASSED
