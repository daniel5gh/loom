---
phase: 10-claude-code-skills
plan: "03"
subsystem: infra
tags: [claude-code, slash-command, deploy, validation, embeddings, git, cloudflare-pages]

requires:
  - phase: 10-claude-code-skills plan 01
    provides: validate-docs.mjs script that runs validation and exits non-zero on errors

provides:
  - /loom:deploy Claude Code slash command (.claude/skills/deploy/SKILL.md)

affects:
  - deploy workflow (replaces multi-step manual process)
  - corpus validation (gate before any push)

tech-stack:
  added: []
  patterns:
    - "Slash command as orchestrator: chain validate -> embed -> commit -> push in one command"
    - "Hard stop pattern: non-zero exit from validation aborts the entire pipeline"
    - "Selective git staging: only git add a specific file, never git add ."
    - "Empty commit guard: git diff --cached --quiet before committing"

key-files:
  created:
    - .claude/skills/deploy/SKILL.md
  modified: []

key-decisions:
  - "/loom:deploy orchestrates validate-docs.mjs + embed.mjs + git commit + git push as a sequential pipeline with hard stops"
  - "disable-model-invocation: true prevents the LLM from deciding on its own; skill steps are authoritative"
  - "git diff --cached --quiet guards against 'nothing to commit' error when embeddings are already up to date"

patterns-established:
  - "Hard stop on validation: STOP if validation fails. Do not proceed to embed or commit."
  - "Selective staging: Only git add src/data/embeddings.json -- do not stage other files."
  - "Empty commit guard: Check git diff --cached --quiet before committing to avoid 'nothing to commit' error."

requirements-completed:
  - SKILL-02
  - SKILL-03

duration: 2min
completed: "2026-03-11"
---

# Phase 10 Plan 03: Deploy Skill Summary

**/loom:deploy slash command orchestrating validate-docs.mjs -> embed.mjs -> selective git commit -> git push with hard stops on validation/embed failure**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T23:46:36Z
- **Completed:** 2026-03-10T23:48:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `.claude/skills/deploy/SKILL.md` implementing the full deploy pipeline as a Claude Code slash command
- Hard stop on validation failures prevents any bad document from reaching production via embed or push
- Empty commit guard (`git diff --cached --quiet`) prevents false failure when embeddings are already current
- Staged-files warning preserves user's other staged changes while keeping the embeddings commit isolated

## Task Commits

Each task was committed atomically:

1. **Task 1: Write /loom:deploy SKILL.md** - `82caa97` (feat)

## Files Created/Modified

- `.claude/skills/deploy/SKILL.md` - Six-step deploy pipeline: validate -> embed -> check staged -> stage embeddings only -> guard empty commit -> push

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 10 plans complete: /loom:add, /loom:retag, /loom:gaps, /loom:deploy, and /loom:research skills are deployed
- The Claude Code skills phase is fully implemented
- corpus is ready for ongoing maintenance via slash commands

## Self-Check: PASSED

- `.claude/skills/deploy/SKILL.md` — FOUND
- `10-03-SUMMARY.md` — FOUND
- commit `82caa97` — FOUND

---
*Phase: 10-claude-code-skills*
*Completed: 2026-03-11*
