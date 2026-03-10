---
phase: 10-claude-code-skills
plan: "04"
subsystem: skills
tags: [claude-code, skills, gray-matter, tags, knowledge-base]

# Dependency graph
requires:
  - phase: 10-claude-code-skills
    provides: skill framework established by plans 01-03 (add, validate, organize)
provides:
  - /loom:retag slash command — merge or split a tag across all corpus documents using gray-matter
  - /loom:gaps slash command — identify thin-coverage tags and suggest research topics
affects: [knowledge-base maintenance, tag taxonomy, research planning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - gray-matter based frontmatter rewriting for safe tag updates
    - tag frequency map for corpus coverage analysis
    - MERGE vs SPLIT mode argument parsing pattern in skills

key-files:
  created:
    - .claude/skills/retag/SKILL.md
    - .claude/skills/gaps/SKILL.md
  modified: []

key-decisions:
  - "retag supports both MERGE (2 args) and SPLIT (3 args) modes — one skill handles tag consolidation and decomposition"
  - "gray-matter required for frontmatter rewriting — safe for all YAML formats, handles edge cases"
  - "gaps is read-only — analysis only, no modifications, clear separation from write skills"
  - "deduplication enforced after tag replacement — prevents duplicate tags when new tag already exists"

patterns-established:
  - "Frequency map pattern: Glob all docs, parse frontmatter, aggregate into { tag: [titles] } map"
  - "Inline node -e script pattern: require('./node_modules/gray-matter') for CJS in ESM project"

requirements-completed: [SKILL-04, SKILL-05]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 10 Plan 04: /loom:retag and /loom:gaps Skills Summary

**Two tag-management Claude Code skills: retag handles merge/split operations with gray-matter rewriting, gaps surfaces thin-coverage tags with concrete research topic suggestions**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T23:43:13Z
- **Completed:** 2026-03-10T23:44:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `/loom:retag` skill supports MERGE mode (2 args) and SPLIT mode (3 args) for tag taxonomy maintenance
- `/loom:gaps` skill builds a frequency map over all corpus documents and reports thin tags with actionable suggestions
- Both skills use `disable-model-invocation: true` and have minimal, focused tool lists
- gray-matter-based rewriting with deduplication ensures reliable YAML updates across all document formats

## Task Commits

Each task was committed atomically:

1. **Task 1: Write /loom:retag SKILL.md** - `68d2f9d` (feat)
2. **Task 2: Write /loom:gaps SKILL.md** - `e7d6aea` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `.claude/skills/retag/SKILL.md` — 4-step skill: parse args (MERGE vs SPLIT), find affected files, update each with inline node/gray-matter script, print report
- `.claude/skills/gaps/SKILL.md` — 4-step skill: build tag frequency map, filter to count <= 2, generate structured report with research suggestions, print summary line

## Decisions Made

- retag supports both MERGE (2 args) and SPLIT (3 args) in a single skill — simpler for users than two separate commands
- gray-matter required for rewriting — handles all YAML quoting and formatting edge cases
- gaps is strictly read-only with `allowed-tools: Read, Glob` only — no accidental file modification possible
- Deduplication (spread Set) enforced after replacement — handles case where new-tag already exists on document

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 10 plans 01-04 complete: add, organize, validate, retag, gaps skills all delivered
- All 5 skills cover the full loom knowledge base management workflow
- Skills are ready for use immediately via `/loom:retag` and `/loom:gaps` Claude Code slash commands

---
*Phase: 10-claude-code-skills*
*Completed: 2026-03-11*
