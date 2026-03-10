---
phase: 07-map-interactions
plan: "05"
subsystem: ui
tags: [canvas, fuse, d3, astro, visual-verification, side-panel, gaussian-opacity]

# Dependency graph
requires:
  - phase: 07-04
    provides: Timeline slider, play button, and three-filter composition wired in map.astro
provides:
  - Human-verified confirmation that all 8 MAP interactions (MAP-03 through MAP-10) work correctly in the browser
  - Fuse.js replaced from CDN ESM to local npm install (fuse.js@7.1.0)
  - Side panel restructured as flex sibling instead of absolute overlay — prevents layout clipping
  - min-width: 0 added to flex children for correct shrink behavior
  - initCanvas reads wrap dimensions via getBoundingClientRect — fixes HiDPI sizing after panel open
  - selectedDot reattached after resize to preserve neighbor lines and panel state
affects:
  - 08 (any future phase building on map interactions)

# Tech tracking
tech-stack:
  added:
    - fuse.js@7.1.0 (moved from CDN ESM import to local npm package)
  patterns:
    - Panel as flex sibling (not absolute/fixed overlay) — canvas + panel share a flex row, canvas flex-shrinks correctly with min-width:0
    - initCanvas re-reads wrap dimensions on resize — supports dynamic layout changes (panel open/close)
    - selectedDot reattach after resize — preserves interaction state across layout reflows

key-files:
  created: []
  modified:
    - src/pages/map.astro
    - public/styles/global.css
    - package.json

key-decisions:
  - "Fuse.js CDN ESM import replaced with local npm install — CDN import failed to load in dev environment, local install is more reliable and avoids external dependency at runtime"
  - "Side panel restructured from position:absolute overlay to flex sibling of canvas wrapper — absolute positioning caused canvas clipping and touch-target confusion; flex layout lets canvas shrink naturally"
  - "min-width: 0 applied to flex children — required for flex shrink to work correctly when panel opens alongside canvas"
  - "initCanvas reads wrap dimensions from getBoundingClientRect — recalculates on resize/panel-open so HiDPI canvas fills available space correctly"
  - "selectedDot reattached after canvas resize — prevents ghost state where panel is open but neighbor lines vanish after layout reflow"

patterns-established:
  - "Flex sibling panel pattern: interactive canvas + detail panel in a flex row, canvas uses min-width:0 to allow shrink"
  - "initCanvas on layout change: call initCanvas whenever container dimensions change (not just on window resize)"

requirements-completed: [MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, MAP-08, MAP-09, MAP-10]

# Metrics
duration: checkpoint
completed: 2026-03-10
---

# Phase 7 Plan 05: Human Visual Checkpoint Summary

**All 8 MAP interactions (side panel, neighbor lines, tag filter, ANY/ALL toggle, search, timeline slider, play button, composed filtering) verified working by human in browser after fixing CDN Fuse.js, panel layout, flex shrink, and canvas resize state**

## Performance

- **Duration:** checkpoint (human verification pass)
- **Started:** 2026-03-10
- **Completed:** 2026-03-10
- **Tasks:** 2 (automated suite + human checkpoint)
- **Files modified:** 3

## Accomplishments

- Human confirmed all 8 MAP interactions function correctly end-to-end in the browser
- Fuse.js CDN ESM import replaced with local npm install — resolves load failure in dev environment
- Side panel restructured from `position: absolute` overlay to flex sibling — canvas now shrinks correctly when panel opens
- `min-width: 0` added to flex children so canvas shrinks without overflow
- `initCanvas` updated to read wrap dimensions via `getBoundingClientRect` after panel state changes
- `selectedDot` reattached after canvas resize — neighbor lines and panel state survive layout reflows
- Phase 7 map-interactions now fully complete: MAP-03 through MAP-10 all pass human verification

## Task Commits

1. **Task 1: Run automated test suite** - verified via `map.test.mjs` + `npm run build`
2. **Task 2: Human visual verification checkpoint** - approved by human (all 8 interactions confirmed)

## Files Created/Modified

- `src/pages/map.astro` - Panel restructured as flex sibling; initCanvas reads wrap dimensions; selectedDot reattached after resize; Fuse.js imported from local package
- `public/styles/global.css` - Panel layout updated from absolute positioning to flex sibling pattern; min-width: 0 on flex children
- `package.json` - fuse.js@7.1.0 added as production dependency (moved from CDN)

## Decisions Made

- Fuse.js CDN ESM import (`https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.esm.js`) replaced with local npm install — CDN failed to load reliably; local install is consistent with the rest of the dependency stack
- Panel changed from `position: absolute` overlay to a flex sibling alongside the canvas wrapper — avoids canvas clipping, allows natural flex shrink, and eliminates touch-target overlap issues
- `min-width: 0` is mandatory on flex children when you want them to shrink below their content size — added to canvas wrapper and panel
- `initCanvas` now called after panel open/close in addition to `window.resize` — correct HiDPI canvas sizing requires knowing the actual rendered width, not a cached value
- `selectedDot` reattached after resize so clicking a dot, resizing the window (or opening the panel), and then interacting again does not lose the selection state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced CDN Fuse.js with local npm install**
- **Found during:** Task 1 (automated test suite / pre-checkpoint verification)
- **Issue:** `import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.esm.js'` failed to load in the dev environment — search was silently broken
- **Fix:** Installed `fuse.js@7.1.0` via npm; updated inline script import to use the local package path
- **Files modified:** `src/pages/map.astro`, `package.json`
- **Verification:** Search dims non-matching dots in real time as confirmed by human verifier

**2. [Rule 1 - Bug] Restructured side panel from absolute overlay to flex sibling**
- **Found during:** Task 2 (human visual checkpoint — MAP-03 verification)
- **Issue:** Panel used `position: absolute` and overlaid the canvas — dots near the right edge were unreachable while panel was open; canvas did not resize to give panel space
- **Fix:** Wrapped canvas and panel in a flex row; panel is a sibling with fixed width; canvas uses `flex: 1; min-width: 0` to shrink when panel opens
- **Files modified:** `src/pages/map.astro`, `public/styles/global.css`
- **Verification:** Panel opens cleanly to the right; canvas reflows; all dots remain clickable

**3. [Rule 1 - Bug] Added min-width: 0 to flex children for correct shrink**
- **Found during:** Task 2 (human visual checkpoint — MAP-03 panel open)
- **Issue:** Without `min-width: 0`, flex children default to `min-width: auto` and refuse to shrink below content width — canvas overflowed its container when panel opened
- **Fix:** Added `min-width: 0` to canvas wrapper in flex row
- **Files modified:** `public/styles/global.css`
- **Verification:** Canvas shrinks and reflows correctly when panel opens/closes

**4. [Rule 1 - Bug] initCanvas reads wrap dimensions via getBoundingClientRect after panel open**
- **Found during:** Task 2 (human visual checkpoint — MAP-03 dot click after panel open)
- **Issue:** `initCanvas` used cached or fixed pixel dimensions — after panel opened and canvas resized, HiDPI canvas was sized incorrectly; dots rendered in wrong positions
- **Fix:** `initCanvas` calls `wrapEl.getBoundingClientRect()` each time it runs; also called on panel open/close in addition to window resize
- **Files modified:** `src/pages/map.astro`
- **Verification:** Canvas resolution correct after panel toggle; dots render at correct positions

**5. [Rule 1 - Bug] selectedDot reattached after canvas resize**
- **Found during:** Task 2 (human visual checkpoint — neighbor lines after panel open)
- **Issue:** After `initCanvas` ran on panel open/close, `selectedDot` pointed to a stale dot reference — neighbor lines disappeared and panel lost its association with the active dot
- **Fix:** `selectedDot` is reattached from the dots array by matching slug after each `initCanvas` call
- **Files modified:** `src/pages/map.astro`
- **Verification:** Neighbor lines persist after panel open/close; panel content remains correct

---

**Total deviations:** 5 auto-fixed (1 blocking dependency, 4 bugs)
**Impact on plan:** All fixes required for correct browser behavior. CDN replacement resolves a silent failure; panel layout fixes are necessary for MAP-03 usability and all subsequent interaction tests. No scope creep.

## Issues Encountered

None beyond the auto-fixed items above. All 8 MAP requirements passed human verification after fixes were applied.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 map-interactions is complete — MAP-03 through MAP-10 all verified
- The map page is production-ready: side panel, neighbor lines, tag filter, ANY/ALL toggle, Fuse.js search, timeline slider, play button, and composed filtering all work correctly
- Fuse.js is now a local npm dependency (no CDN runtime dependency)
- Panel flex layout pattern documented — reusable for any future detail-panel + canvas page

---
*Phase: 07-map-interactions*
*Completed: 2026-03-10*
