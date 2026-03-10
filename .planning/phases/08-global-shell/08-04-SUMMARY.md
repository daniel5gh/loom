---
phase: 08-global-shell
plan: 04
subsystem: ui
tags: [vim, keyboard-navigation, status-bar, astro, css, data-attributes]

# Dependency graph
requires:
  - phase: 08-02
    provides: body padding-bottom for status bar, shell overlay, global keydown handler infrastructure
  - phase: 08-03
    provides: isTypingContext() guard, overlayOpen flag, bundled script pattern in Base.astro
provides:
  - vim-style j/k/G/gg/Enter keyboard navigation on all list pages
  - persistent fixed status bar at bottom of every page (NORMAL mode + position context)
  - data-vim-list/data-vim-item attribute protocol for list page marking
affects: [09-doc-pages, 10-final-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-vim-list / data-vim-item attribute protocol for keyboard navigable lists"
    - "Status bar DOM pattern: fixed bar with mode label + context label spans"
    - "Double keydown listener pattern: first for overlay toggle, second for vim navigation"
    - "gg double-tap detection via Date.now() timestamp diff with 500ms window"

key-files:
  created: []
  modified:
    - public/styles/global.css
    - src/layouts/Base.astro
    - src/components/DocCard.astro
    - src/pages/index.astro
    - src/pages/tags/index.astro
    - src/pages/tags/[tag].astro

key-decisions:
  - "Second addEventListener('keydown') added for vim keys rather than consolidating into existing handler — separation of concerns, simpler to reason about"
  - "data-vim-item placed on DocCard article root — every DocCard usage becomes a vim item automatically without call-site changes"
  - "index.astro wraps all category sections in a single <div data-vim-list> — unified j/k navigation across all categories"
  - "handleVimKey no-ops when no [data-vim-list] found — graph and map pages unaffected"

patterns-established:
  - "List pages mark navigable regions with data-vim-list on container and data-vim-item on each item"
  - "Status bar initialized via DOMContentLoaded with 0/{count} position; updates on each selectVimItem call"

requirements-completed: [SHELL-04, SHELL-05]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 8 Plan 04: Vim Navigation + Status Bar Summary

**Vim-style j/k/G/gg/Enter keyboard navigation on index, tags, and tag-filtered pages with a persistent NORMAL-mode status bar fixed to the bottom of every page**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T21:05:00Z
- **Completed:** 2026-03-10T21:13:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Status bar CSS added: `.vim-status-bar` fixed at bottom, `#vim-mode-label` neon-cyan, `[data-vim-item].vim-selected` outline+glow
- Base.astro extended with `handleVimKey` function implementing j/k/G/gg (500ms)/Enter navigation and `updateStatusBar` + `selectVimItem` helpers
- `#vim-status-bar` div injected into Base.astro body (after shell-overlay) — appears on all pages
- `data-vim-item` added to DocCard.astro article root — every DocCard across the site is a vim item
- `data-vim-list` added to: index.astro wrapper div, tags/index.astro ul, tags/[tag].astro doc-grid div

## Task Commits

1. **Task 1: Status bar CSS + vim-selected highlight** - `1aa3a10` (feat)
2. **Task 2: Status bar HTML + vim key handler + data-vim attrs** - `cd269c2` (feat)

## Files Created/Modified

- `public/styles/global.css` - Added `.vim-status-bar`, `#vim-mode-label`, `[data-vim-item].vim-selected` rules
- `src/layouts/Base.astro` - Added `#vim-status-bar` HTML div; added vim navigation script block with `handleVimKey`, `selectVimItem`, `getVimItems`, `updateStatusBar`
- `src/components/DocCard.astro` - Added `data-vim-item` to root `<article>` element
- `src/pages/index.astro` - Wrapped category sections in `<div data-vim-list>`
- `src/pages/tags/index.astro` - Added `data-vim-list` to `<ul>`, `data-vim-item` to each `<li>`
- `src/pages/tags/[tag].astro` - Added `data-vim-list` to `.doc-grid` div

## Decisions Made

- Added a second `addEventListener('keydown')` for vim keys rather than merging with the existing overlay handler — cleaner separation of concerns, easier to reason about
- `data-vim-item` on DocCard article root means every DocCard usage site (index, tag pages, future pages) gets vim navigation automatically
- `handleVimKey` returns early if no `[data-vim-list]` found — graph and map pages work identically to before

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Vim navigation (SHELL-04) and status bar (SHELL-05) complete
- All Phase 8 requirements satisfied
- Phase 9 (doc pages) can build on the vim item protocol if doc content pages need navigation

## Self-Check: PASSED

All 6 modified files verified on disk. Both commits (1aa3a10, cd269c2) confirmed in git log. All key content patterns verified in files.

---
*Phase: 08-global-shell*
*Completed: 2026-03-10*
