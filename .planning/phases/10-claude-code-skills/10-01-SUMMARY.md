---
phase: 10-claude-code-skills
plan: 01
subsystem: testing
tags: [node-test, gray-matter, validation, scripts, frontmatter]

# Dependency graph
requires:
  - phase: 05-embedding-pipeline
    provides: embed.mjs patterns for ROOT, CONTENT_DIRS, gray-matter import via createRequire
provides:
  - scripts/validate-docs.mjs — standalone validator callable by /loom:deploy skill
  - scripts/validate-docs.test.mjs — 14 unit tests covering all validation rules
  - validateContent(raw, filePath) — pure function for per-document validation
  - validateDocs(rootDir) — corpus-wide aggregation function
affects: [10-claude-code-skills]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - validateContent pure function takes raw string + filePath, returns {file, field, issue}[] errors array
    - gray-matter import via createRequire (CJS in ESM) — same as embed.mjs
    - Main guard pattern: `if (process.argv[1] === fileURLToPath(import.meta.url))` prevents main() on import
    - node:test with in-memory fixtures (no temp files) for unit testing validation logic

key-files:
  created:
    - scripts/validate-docs.mjs
    - scripts/validate-docs.test.mjs
  modified:
    - ai-tools-and-services/airllm.md
    - ai-tools-and-services/langflow.md
    - ai-tools-and-services/lovable.md
    - ai-tools-and-services/pageindex.md
    - cloud-ai-platforms/cloud-ai-platforms-comparison.md

key-decisions:
  - "validateContent uses gray-matter date instanceof Date check — gray-matter parses YYYY-MM-DD as a Date object, so string comparison requires .toISOString().slice(0, 10) conversion before regex test"
  - "Test fixture makeDoc() quotes tag values containing spaces/colons in YAML — bare YAML list items strip surrounding whitespace, so quoted strings are required to test leading/trailing space normalization"
  - "5 documents restructured to use ## Summary + ## Content template — airllm, langflow, lovable, pageindex used flat ## Key Features/## Use Cases/## References structure from before template was finalized"

patterns-established:
  - "validateContent(raw, filePath) — pure, importable, testable without filesystem"
  - "validateDocs(rootDir = ROOT) — injectable rootDir for testing, defaults to project root"
  - "Error shape: { file: string, field: string, issue: string } — consistent across all error types"

requirements-completed: [SKILL-02, SKILL-03]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 10 Plan 01: validate-docs.mjs Summary

**Standalone validate-docs.mjs script using gray-matter + node:test with 14 unit tests covering all frontmatter and section validation rules; exits 0 against all 15 corpus documents**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T23:35:21Z
- **Completed:** 2026-03-10T23:38:29Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- `validateContent(raw, filePath)` pure function validates frontmatter (title, date, tags, tag normalization) and body sections (H1, ## Summary, ## Content)
- `validateDocs(rootDir)` globs all three CONTENT_DIRS and aggregates errors; main() prints formatted errors and exits 1 or prints "All N documents valid." and exits 0
- 14 unit tests using node:test with in-memory fixtures covering every validation rule
- Fixed 5 documents that lacked ## Summary and ## Content headings — corpus now fully valid

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement validate-docs.mjs with tests** - `d838a51` (feat + test — TDD)
2. **Task 2: Smoke-test against live corpus** - `3b1e137` (fix — document restructuring)

**Plan metadata:** (docs: complete plan — added below)

## Files Created/Modified
- `scripts/validate-docs.mjs` — Validation script: validateContent(), validateDocs(), main() entry point
- `scripts/validate-docs.test.mjs` — 14 unit tests for all validation rules
- `ai-tools-and-services/airllm.md` — Added ## Summary and ## Content sections
- `ai-tools-and-services/langflow.md` — Added ## Summary and ## Content sections
- `ai-tools-and-services/lovable.md` — Added ## Summary and ## Content sections
- `ai-tools-and-services/pageindex.md` — Added ## Summary and ## Content sections
- `cloud-ai-platforms/cloud-ai-platforms-comparison.md` — Added ## Content section (already had ## Summary)

## Decisions Made
- gray-matter parses `date: 2024-01-15` as a JavaScript `Date` object, not a string — required `instanceof Date` check and `.toISOString().slice(0, 10)` conversion before regex testing
- Test's `makeDoc()` helper quotes YAML tag values containing spaces so gray-matter preserves them (bare YAML list items strip surrounding whitespace)
- Documents fixed rather than validation rules relaxed — the ## Summary / ## Content structure is the established template; the 5 affected documents predated it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test fixture YAML quoting for space-padded tags**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Test 9 ("tag with leading/trailing spaces fails normalization") failed because `makeDoc()` generated bare YAML list items (e.g., `  -  ai `), which YAML parsers trim to `ai` — the tag roundtripped as already canonical
- **Fix:** Updated `makeDoc()` to quote tag values containing spaces or colons using `"${item}"` YAML syntax
- **Files modified:** scripts/validate-docs.test.mjs
- **Verification:** All 14 tests pass after fix
- **Committed in:** d838a51 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in test fixture)
**Impact on plan:** Minor bug in test infrastructure; fix was inline in the same commit. No scope creep.

## Issues Encountered
- gray-matter parses ISO date strings as Date objects when the YAML type system maps them — this is well-known behavior but required explicit handling in the validator's date check

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `node scripts/validate-docs.mjs` is the validation command for /loom:deploy to invoke
- Script exits 0 / 1 with clear output, importable as ESM for further extension
- All 15 corpus documents are now template-conformant

---
*Phase: 10-claude-code-skills*
*Completed: 2026-03-10*
