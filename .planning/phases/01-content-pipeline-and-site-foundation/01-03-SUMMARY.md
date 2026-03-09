---
phase: 01-content-pipeline-and-site-foundation
plan: "03"
subsystem: ui
tags: [astro, astro5, content-collections, static-routes, tag-pages, layouts, components]

# Dependency graph
requires:
  - phase: 01-content-pipeline-and-site-foundation
    plan: "02"
    provides: "Astro 5 project with three glob()-based content collections and Zod schema; npm run build succeeds parsing all 15 documents"
provides:
  - "src/layouts/Base.astro: HTML shell with nav and global CSS link placeholder"
  - "src/layouts/Document.astro: document chrome with title, date, TagPill list, content slot"
  - "src/components/TagPill.astro: clickable tag badge linking to /tags/{tag}/"
  - "src/components/DocCard.astro: preview card with title, date, tags for index/tag pages"
  - "src/pages/ai-tools-and-services/[slug].astro: 10 individual HTML pages via aiTools collection"
  - "src/pages/cloud-ai-platforms/[slug].astro: 4 individual HTML pages via cloudPlatforms collection"
  - "src/pages/companies/[slug].astro: 1 individual HTML page via companies collection"
  - "src/pages/index.astro: category-grouped index of all 15 documents"
  - "src/pages/tags/index.astro: alphabetical tag listing with document counts"
  - "src/pages/tags/[tag].astro: 43 per-tag listing pages covering all unique tags"
  - "scripts/validate-output.mjs: build output validator; counts doc pages, tag pages, checks tag links"
  - "npm run build produces 60 static HTML pages total with correct URL structure"
affects:
  - 01-content-pipeline-and-site-foundation
  - Plan 04 (styling — drops global.css into /public/styles/ without touching layout files)
  - Phase 2 (knowledge graph — reads collection entries, links to /{category}/{slug}/ URLs)
  - Phase 3 (D3 graph — builds on established URL structure)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro 5 getStaticPaths() with getCollection() for dynamic routes: params use doc.id (not doc.slug)"
    - "Cross-collection aggregation: Promise.all([getCollection('aiTools'), getCollection('cloudPlatforms'), getCollection('companies')]) then spread into allDocs"
    - "Tag index built dynamically inside getStaticPaths() — no hardcoded tag lists"
    - "Component composition: DocCard uses TagPill; Document layout uses TagPill; index/tag pages use DocCard"

key-files:
  created:
    - src/layouts/Base.astro
    - src/layouts/Document.astro
    - src/components/TagPill.astro
    - src/components/DocCard.astro
    - src/pages/ai-tools-and-services/[slug].astro
    - src/pages/cloud-ai-platforms/[slug].astro
    - src/pages/companies/[slug].astro
    - src/pages/tags/index.astro
    - src/pages/tags/[tag].astro
    - scripts/validate-output.mjs
  modified:
    - src/pages/index.astro

key-decisions:
  - "Used doc.id (not doc.slug) in all getStaticPaths() per Astro 5 pattern established in Plan 02"
  - "Base layout references /styles/global.css at build time so Plan 04 (styling) can drop the file without touching layout files"
  - "validate-output.mjs counts directory entries in dist/ category dirs (not .html files at top level) because Astro static output uses slug/index.html structure"

patterns-established:
  - "Dynamic route pattern: getCollection() in getStaticPaths(), params: { slug: doc.id }, props: { doc }"
  - "Category slug mapping: aiTools -> 'ai-tools-and-services', cloudPlatforms -> 'cloud-ai-platforms', companies -> 'companies'"
  - "Tag URL pattern: /tags/{tag}/ (trailing slash, used by TagPill and tags/[tag].astro)"
  - "DocCard link pattern: /{category}/{slug}/ (trailing slash)"

requirements-completed: [REQ-010, REQ-011, REQ-012, REQ-013, REQ-015, REQ-005]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 1 Plan 03: Page Routes, Layouts, and Components Summary

**15 document pages, 43 tag pages, and a category-grouped index generated from three Astro 5 content collections — validate-output.mjs exits 0**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-09T14:40:09Z
- **Completed:** 2026-03-09T14:43:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created Base and Document layouts plus TagPill and DocCard components composing the full page hierarchy
- Generated 15 individual document HTML pages via three category-scoped dynamic routes using Astro 5 getStaticPaths() with doc.id
- Built index page grouped by category, tag index listing all unique tags, and 43 per-tag listing pages dynamically from collection data
- validate-output.mjs script confirms 15 document pages, 43 tag pages, index page, and tag link presence in one command

## Task Commits

Each task was committed atomically:

1. **Task 1: Create layouts, components, and three document route files** - `6284077` (feat)
2. **Task 2: Create index page, tag pages, and output validator** - `8946c35` (feat)

## Files Created/Modified

- `src/layouts/Base.astro` - HTML shell with site nav and /styles/global.css link
- `src/layouts/Document.astro` - Document wrapper: title h1, date, TagPill list, content slot
- `src/components/TagPill.astro` - Anchor badge linking to /tags/{tag}/
- `src/components/DocCard.astro` - Preview card with title link, date, tag pills
- `src/pages/ai-tools-and-services/[slug].astro` - 10 document pages via aiTools collection
- `src/pages/cloud-ai-platforms/[slug].astro` - 4 document pages via cloudPlatforms collection
- `src/pages/companies/[slug].astro` - 1 document page via companies collection
- `src/pages/index.astro` - Replaced placeholder; category-grouped listing of all 15 docs
- `src/pages/tags/index.astro` - Alphabetically sorted tag listing with per-tag counts
- `src/pages/tags/[tag].astro` - Per-tag pages with DocCard list for matching documents
- `scripts/validate-output.mjs` - Build output validator with 4 checks; exits 0 on success

## Decisions Made

- Used `doc.id` (not `doc.slug`) in all `getStaticPaths()` implementations per Astro 5 pattern from Plan 02
- Base layout references `/styles/global.css` at build time so Plan 04 can add the file without touching layout files
- validate-output.mjs inspects `dist/{cat}/*/` directories (Astro static output uses `slug/index.html` structure) rather than counting `.html` files at category root

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - build succeeded on first attempt after activating Node 22 via fnm (same environment requirement established in Plan 02).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 15 documents are browseable HTML pages at `/{category}/{slug}/`
- Index page at `/` groups documents by category with DocCard previews
- Tag system fully functional: 43 unique tag pages, all tags link to `/tags/{tag}/`
- Plan 04 (styling) can drop `/public/styles/global.css` without modifying any layout or component files
- Phase 2 (knowledge graph) can reference established URL patterns: `/{category}/{slug}/` and `/tags/{tag}/`

---
*Phase: 01-content-pipeline-and-site-foundation*
*Completed: 2026-03-09*
