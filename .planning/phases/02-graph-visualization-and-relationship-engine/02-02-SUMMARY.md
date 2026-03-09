---
phase: 02-graph-visualization-and-relationship-engine
plan: "02"
subsystem: ui
tags: [astro, css-grid, related-docs, sidebar, graph]

requires:
  - phase: 02-01
    provides: getRelatedDocs function in src/lib/graph.js

provides:
  - RelatedDocs.astro sidebar component showing related documents with shared tags
  - Document.astro two-column grid layout with sticky sidebar slot
  - Two-column CSS grid and related-docs sidebar styles in global.css
  - All three slug pages computing relatedDocs at build time via getRelatedDocs

affects:
  - 02-03
  - 03-graph-page

tech-stack:
  added: []
  patterns:
    - "Two-column doc layout via CSS grid: 1fr 280px with responsive collapse at 900px"
    - "Build-time related docs computed in Astro frontmatter, passed as prop to layout"
    - "Conditional rendering in Astro: {arr?.length > 0 && (<element />)} pattern"

key-files:
  created:
    - src/components/RelatedDocs.astro
  modified:
    - src/layouts/Document.astro
    - public/styles/global.css
    - src/pages/ai-tools-and-services/[slug].astro
    - src/pages/cloud-ai-platforms/[slug].astro
    - src/pages/companies/[slug].astro

key-decisions:
  - "Removed max-width/margin from .doc-page — those constraints moved up to .doc-layout wrapper to avoid double-centering conflict"
  - "Each slug page fetches all three collections independently to build allDocs — Astro caches per build so no performance concern"

patterns-established:
  - "RelatedDocs prop default empty array on Document.astro — backward compatible, no sidebar if not passed"
  - "category annotation applied via spread+property pattern: { ...d, category: 'slug-name' }"

requirements-completed: [REQ-014]

duration: 2min
completed: 2026-03-09
---

# Phase 02 Plan 02: Related Documents Sidebar Summary

**Sticky Related Documents sidebar added to all 15 document pages using CSS grid two-column layout, showing up to 5 related docs with shared tag names computed at build time**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T17:27:20Z
- **Completed:** 2026-03-09T17:28:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created RelatedDocs.astro component that conditionally renders an aside with related doc links and shared tag labels
- Expanded Document.astro to two-column grid layout with sticky sidebar, backward-compatible relatedDocs prop defaulting to empty array
- Added Phase 2 CSS to global.css: .doc-layout grid, .related-docs sidebar styles, responsive collapse at 900px
- Updated all three slug pages (ai-tools-and-services, cloud-ai-platforms, companies) to import getRelatedDocs, build allDocs from all collections, and pass computed relatedDocs to Document layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RelatedDocs component and two-column document layout** - `6a7860f` (feat)
2. **Task 2: Update all three slug pages to compute and pass relatedDocs** - `e421f91` (feat)

**Plan metadata:** (docs commit — to follow)

## Files Created/Modified

- `src/components/RelatedDocs.astro` - Conditional sidebar with related doc links and "shared: tag1, tag2" labels
- `src/layouts/Document.astro` - Two-column grid layout with RelatedDocs in sidebar position
- `public/styles/global.css` - .doc-layout grid, .related-docs sidebar CSS, responsive collapse at 900px; .doc-page max-width removed
- `src/pages/ai-tools-and-services/[slug].astro` - Imports getRelatedDocs, builds allDocs, passes relatedDocs prop
- `src/pages/cloud-ai-platforms/[slug].astro` - Same pattern with cloudPlatforms category
- `src/pages/companies/[slug].astro` - Same pattern with companies category

## Decisions Made

- Removed `max-width: 720px; margin: 0 auto` from `.doc-page` and replaced with `min-width: 0` — the two-column `.doc-layout` wrapper now handles centering and max-width, avoiding nested double-centering conflict
- Each slug page independently fetches all three collections via getCollection() to build allDocs — Astro caches collection data within a build so there is no duplication penalty

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed conflicting max-width from .doc-page**
- **Found during:** Task 1 (Create RelatedDocs component and two-column document layout)
- **Issue:** Plan noted that `.doc-page { max-width: 720px; margin: 0 auto }` would conflict with the new `.doc-layout` wrapper that also sets `max-width: 1100px; margin: 0 auto`. The `.doc-page` centering would constrain the article column inside the grid, making the sidebar appear outside the centered content.
- **Fix:** Replaced `.doc-page { max-width: 720px; margin: 0 auto }` with `.doc-page { min-width: 0 }` (min-width: 0 prevents grid blowout)
- **Files modified:** public/styles/global.css
- **Verification:** npm run build passes; built HTML confirmed sidebar renders alongside article
- **Committed in:** 6a7860f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was explicitly anticipated in the plan's action note — required for correct two-column layout rendering.

## Issues Encountered

None - build completed successfully on first attempt after CSS fix.

## Next Phase Readiness

- All 15 document pages now show Related Documents sidebar at build time
- RelatedDocs component and Document two-column layout ready for further styling or graph page integration
- getRelatedDocs is wired end-to-end; Phase 02-03 can build on this for the D3 graph page

## Self-Check: PASSED

- FOUND: src/components/RelatedDocs.astro
- FOUND: src/layouts/Document.astro
- FOUND: public/styles/global.css
- FOUND: commit 6a7860f (Task 1)
- FOUND: commit e421f91 (Task 2)

---
*Phase: 02-graph-visualization-and-relationship-engine*
*Completed: 2026-03-09*
