---
phase: 09-home-page
plan: "01"
subsystem: testing
tags: [node:test, home-page, sort, slice, collections]

# Dependency graph
requires: []
provides:
  - Unit test scaffold for HOME-02 sort+slice logic (test/home.test.mjs)
  - getRecentDocs(allDocs, n) pure function contract — mirrors what index.astro will implement
affects:
  - 09-02 (Wave 1 home page implementation must turn GREEN for these tests)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function inlined in test file — self-contained without importing Astro pages"
    - "Fixture data as plain objects with {collection, data: {title, date}} shape"

key-files:
  created:
    - test/home.test.mjs
  modified: []

key-decisions:
  - "getRecentDocs defined inline in test file (not imported from index.astro) — self-contained, no Astro API dependency"
  - "Fixture spans all three collections (aiTools, cloudPlatforms, companies) with 15 docs including duplicate dates"

patterns-established:
  - "Test pure logic extracted from Astro components: define function in test file, implement same logic in .astro frontmatter"

requirements-completed: [HOME-02]

# Metrics
duration: 1min
completed: 2026-03-10
---

# Phase 9 Plan 01: Home Page Test Scaffold Summary

**5-test node:test suite for getRecentDocs sort+slice logic, using 15-doc fixture spanning aiTools, cloudPlatforms, and companies**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-10T22:37:53Z
- **Completed:** 2026-03-10T22:38:38Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `test/home.test.mjs` with 5 behavioral tests covering the HOME-02 sort+slice contract
- Defined `getRecentDocs(allDocs, n=10)` as an inline pure function — the same logic Wave 1 will implement in index.astro
- Fixture data has 15 docs across 3 collections with varied dates (including duplicates) — all edge cases covered
- Full test suite passes: 15 tests across contrast, shell, and home test files, 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test/home.test.mjs** - `ecd1631` (test)

**Plan metadata:** _(to be added after final commit)_

## Files Created/Modified

- `test/home.test.mjs` — Unit tests for getRecentDocs sort+slice logic; 5 tests, all pass with `node --test`

## Decisions Made

- `getRecentDocs` defined inline in the test file (not imported from index.astro) — keeps test self-contained without Astro API dependency; Wave 1 will independently implement the same logic in index.astro frontmatter
- Fixture data uses plain objects with `{collection, data: {title, date}}` shape — mirrors Astro collection entry shape without requiring Astro imports

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Test contract is fully established for HOME-02 sort+slice logic
- Wave 1 (09-02) can now implement `getRecentDocs` in index.astro and run `node --test test/home.test.mjs` to verify the GREEN state

---
*Phase: 09-home-page*
*Completed: 2026-03-10*
