---
phase: 09-home-page
plan: 02
subsystem: ui
tags: [astro, custom-events, css, vim-navigation, fuse-js]

# Dependency graph
requires:
  - phase: 09-01
    provides: home.test.mjs test file with getRecentDocs sort+slice tests
  - phase: 08-global-shell
    provides: Base.astro with openOverlay() function and loom:open-search event channel, shell overlay, vim navigation, cursor-blink keyframe

provides:
  - Rebuilt home page: terminal prompt (loom> _) + 10 most recent docs in reverse-chronological order
  - loom:open-search CustomEvent listener wired in Base.astro
  - Home page CSS rules (.home-prompt, .home-prompt-cursor, .home-recent-list) in global.css

affects:
  - 09-03
  - any future phase that renders home page or adds collection docs

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CustomEvent('loom:open-search') dispatched from bundled script, listened in Base.astro — cross-script decoupled communication"
    - "doc.category from spread assignment (not doc.collection) for correct URL slug generation"
    - "data-vim-list on .home-recent-list enables automatic vim j/k navigation via Base.astro getVimItems()"

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/layouts/Base.astro
    - public/styles/global.css

key-decisions:
  - "doc.category assigned via spread (e.g., 'ai-tools-and-services') not from doc.collection — avoids broken URL paths"
  - "Bundled <script> (no is:inline) used in index.astro so Astro bundles the file correctly with no bare specifier issues"
  - "loom:open-search listener placed immediately after openOverlay() closing brace in Base.astro bundled script"
  - "cursor-blink keyframe not redefined — reuses existing Phase 8 definition in global.css"

patterns-established:
  - "Home page: terminal prompt dispatches loom:open-search → Base.astro opens overlay"
  - "Recent docs: sort allDocs by date desc THEN slice to 10 (not slice then sort)"

requirements-completed: [HOME-01, HOME-02]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 9 Plan 02: Home Page Rebuild Summary

**Terminal prompt (loom> _) replaces category-grid; recent 10 docs list with vim navigation wired via loom:open-search CustomEvent**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T22:39:54Z
- **Completed:** 2026-03-10T22:41:18Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Replaced category-grid home page with terminal prompt widget + recent 10 articles list
- Wired loom:open-search CustomEvent channel between index.astro (dispatch) and Base.astro (listener)
- Added home page CSS rules to global.css — reuses Phase 8 cursor-blink keyframe, no duplication
- All 15 tests pass; build succeeds with 62 pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Add loom:open-search listener to Base.astro** - `f404b55` (feat)
2. **Task 2: Rewrite index.astro — terminal prompt + recent docs list** - `de6502b` (feat)
3. **Task 3: Add home page CSS rules to global.css** - `5412d0d` (feat)

## Files Created/Modified

- `src/layouts/Base.astro` - Added `document.addEventListener('loom:open-search', () => openOverlay())` after openOverlay definition
- `src/pages/index.astro` - Full rewrite: terminal prompt, merge+sort+slice 3 collections, DocCard recent list
- `public/styles/global.css` - Added .home-prompt, .home-prompt:hover, .home-prompt-label, .home-prompt-cursor, .home-recent-heading, .home-recent-list

## Decisions Made

- Used `doc.category` from spread assignment rather than `doc.collection` — prevents broken URL paths (e.g., would generate `/aiTools/slug/` instead of `/ai-tools-and-services/slug/`)
- Dispatches `CustomEvent('loom:open-search')` from bundled index.astro script — does not attempt to call `openOverlay()` directly across script boundaries
- No redefinition of `cursor-blink` keyframe — already defined in global.css from Phase 8

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Home page implementation complete (HOME-01, HOME-02 delivered)
- Terminal prompt opens search overlay on click/Enter/Space
- Vim j/k navigation works on recent list via existing Base.astro infrastructure
- Ready for Phase 9 Plan 03 (human verification checkpoint)

---
*Phase: 09-home-page*
*Completed: 2026-03-10*

## Self-Check: PASSED

- src/pages/index.astro: FOUND
- src/layouts/Base.astro: FOUND
- public/styles/global.css: FOUND
- .planning/phases/09-home-page/09-02-SUMMARY.md: FOUND
- Commit f404b55 (Task 1): FOUND
- Commit de6502b (Task 2): FOUND
- Commit 5412d0d (Task 3): FOUND
