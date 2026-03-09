---
phase: 01-content-pipeline-and-site-foundation
plan: "02"
subsystem: infra
tags: [astro, astro5, content-collections, zod, glob, typescript, node22, cloudflare-pages]

# Dependency graph
requires:
  - phase: 01-content-pipeline-and-site-foundation
    plan: "01"
    provides: "YAML-valid and tag-normalized markdown documents in root content directories"
provides:
  - "package.json with Astro 5, @fontsource/fira-code, wrangler as devDep"
  - "astro.config.mjs with output: static and site URL"
  - "src/content/config.ts with three glob()-based content collections and Zod schema"
  - ".gitignore covering dist/, node_modules/, .DS_Store, .astro/, .wrangler/"
  - ".node-version pinning Node 22 for Cloudflare Pages"
  - "npm run build completes successfully, parsing all 15 documents"
affects:
  - 01-content-pipeline-and-site-foundation
  - Plan 03 (page templates — will use entry.id, not entry.slug)
  - Phase 3 (D3 graph — reads collection entries at build time)

# Tech tracking
tech-stack:
  added:
    - "astro ^5.18.0"
    - "@fontsource/fira-code ^5.0.0"
    - "wrangler ^3.0.0 (devDep)"
  patterns:
    - "Astro 5 content collections: glob() loader pointing at root-level dirs (NOT src/content/{name}/)"
    - "Zod schema: z.coerce.date() for date fields, transform() for tag normalization"
    - "entry.id (not entry.slug) — Astro 5 pattern"

key-files:
  created:
    - package.json
    - package-lock.json
    - astro.config.mjs
    - .gitignore
    - .node-version
    - src/content/config.ts
    - src/pages/index.astro
  modified: []

key-decisions:
  - "Created project files manually (not via npm create astro) because the interactive CLI cannot handle non-empty directories without stdin interaction"
  - "Node 22 installed via fnm (Fast Node Manager) since system had Node 18.19.1 which Astro 5 rejects at build time"
  - "src/pages/index.astro placeholder created as minimal build target — full templates come in Plan 03"

patterns-established:
  - "Astro 5 glob() loader: base: './dir-name' at repo root, pattern: '**/*.md'"
  - "Content collection names: aiTools, cloudPlatforms, companies"
  - "Tag normalization via Zod transform at parse time (lowercase, trim, spaces to hyphens)"

requirements-completed: [REQ-001, REQ-003, REQ-004, REQ-005, REQ-040, REQ-042]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 1 Plan 02: Astro 5 Project Initialization Summary

**Astro 5 project with three glob()-based content collections parsing all 15 documents via Zod schema — npm run build succeeds with no validation errors**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-09T14:32:01Z
- **Completed:** 2026-03-09T14:36:42Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Initialized Astro 5 project with package.json, astro.config.mjs, .gitignore, and .node-version
- Created src/content/config.ts using the Astro 5 glob() loader pattern pointing at root-level content directories (ai-tools-and-services/, cloud-ai-platforms/, companies/)
- Zod schema enforces title, date, tags on all 15 documents with tag normalization transform at parse time
- npm run build completes successfully with no Zod validation errors and produces dist/ directory

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Astro project, install dependencies, create config files** - `380782e` (chore)
2. **Task 2: Create content collections config and verify build parses all 15 documents** - `7e4c2cc` (feat)

## Files Created/Modified

- `package.json` - Astro 5 project with build script, astro + @fontsource/fira-code + wrangler devDep
- `package-lock.json` - Lock file from npm install
- `astro.config.mjs` - output: static, site: https://loom.pages.dev
- `.gitignore` - Covers dist/, node_modules/, .DS_Store, .env, .astro/, .wrangler/
- `.node-version` - Pins Node 22 for Cloudflare Pages
- `src/content/config.ts` - Three content collections with glob loaders and Zod schema
- `src/pages/index.astro` - Minimal placeholder page (templates added in Plan 03)

## Decisions Made

- Created Astro project files manually rather than via `npm create astro@latest` because the interactive CLI prompts for confirmation when the target directory is non-empty and cannot be scripted without stdin piping
- Installed Node 22 via fnm since the system only had Node 18.19.1, which Astro 5 rejects at build time with a hard error
- Added a minimal src/pages/index.astro placeholder so the build has at least one page to generate — this is replaced by proper templates in Plan 03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used manual file creation instead of npm create astro**
- **Found during:** Task 1 (Initialize Astro project)
- **Issue:** `npm create astro@latest . -- --template minimal --no-install --no-git` prompts interactively when target directory is non-empty; cannot be non-interactively forced
- **Fix:** Created package.json, astro.config.mjs, .gitignore, .node-version manually with exact required content
- **Files modified:** package.json, astro.config.mjs, .gitignore, .node-version
- **Verification:** Verified all files contain expected content and npm install succeeded
- **Committed in:** 380782e (Task 1 commit)

**2. [Rule 3 - Blocking] Installed Node 22 via fnm to meet Astro 5 engine requirement**
- **Found during:** Task 2 (npm run build)
- **Issue:** System Node 18.19.1 < Astro 5's minimum (18.20.8); Astro hard-errors with "Node.js v18.19.1 is not supported"
- **Fix:** Installed fnm (Fast Node Manager), installed Node 22.22.1 via `fnm install 22`, activated with `fnm use 22`
- **Files modified:** None (environment change only)
- **Verification:** `node --version` reports v22.22.1; build succeeds
- **Committed in:** N/A (environment setup, no files committed)

**3. [Rule 3 - Blocking] Created src/pages/index.astro placeholder**
- **Found during:** Task 2 (build preparation)
- **Issue:** Astro requires at least one page file in src/pages/ to produce a dist/ output
- **Fix:** Created minimal index.astro with placeholder HTML
- **Files modified:** src/pages/index.astro
- **Verification:** Build produces dist/index.html
- **Committed in:** 380782e (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking)
**Impact on plan:** All fixes necessary for build system functionality. No scope creep. Plan outcome fully achieved.

## Issues Encountered

- Node version incompatibility required installing Node 22 via fnm before the build could run. This is expected for any developer environment that hasn't upgraded to Node 22 yet. The `.node-version` file ensures Cloudflare Pages uses Node 22 correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Astro 5 build system is live — `npm run build` parses all 15 documents against Zod schema
- Content collections (aiTools, cloudPlatforms, companies) are available for Plan 03 page templates
- Use `entry.id` (not `entry.slug`) in all Plan 03 templates — Astro 5 pattern
- Node 22 required in developer environment: install via `fnm install 22 && fnm use 22`
- Zod schema is strict (title, date, tags required) — any new documents must have all three fields

---
*Phase: 01-content-pipeline-and-site-foundation*
*Completed: 2026-03-09*
