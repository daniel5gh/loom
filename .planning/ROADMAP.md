# Roadmap: Loom

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-03-09)
- 🚧 **v1.1 Visualization** - Phases 5-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED 2026-03-09</summary>

### Phase 1: Content Pipeline and Site Foundation
**Goal**: A working static site with all 15 documents rendered, tag navigation functional, dark/neon aesthetic established, and live on Cloudflare Pages
**Depends on**: Nothing (first phase)
**Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-010, REQ-011, REQ-012, REQ-013, REQ-015, REQ-030, REQ-031, REQ-032, REQ-034, REQ-040, REQ-041, REQ-042
**Success Criteria** (what must be TRUE):
  1. All 15 documents render as individual HTML pages with correct title, date, and tags
  2. Every tag on a document page is a clickable link that leads to a tag page listing all documents sharing that tag
  3. The document index page lists all documents, browsable by directory category
  4. Site is live on Cloudflare Pages — a git push to main triggers a build and publishes the updated site
  5. Dark background with neon accent colors and monospace font renders consistently across all pages
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Fix frontmatter bugs and normalize tags in source files
- [x] 01-02-PLAN.md — Initialize Astro project and configure content collections
- [x] 01-03-PLAN.md — Build page routes, layouts, components, and output validator
- [x] 01-04-PLAN.md — Create dark/neon CSS theme
- [x] 01-05-PLAN.md — Deploy to Cloudflare Pages and verify live site

### Phase 2: Graph Visualization and Relationship Engine
**Goal**: An interactive force-directed graph shows all documents as nodes with edges representing shared tag relationships; each document page surfaces its most-related documents
**Depends on**: Phase 1
**Requirements**: REQ-006, REQ-007, REQ-014, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026
**Success Criteria** (what must be TRUE):
  1. A graph page renders all documents as labeled nodes with edges connecting documents that share tags
  2. Clicking any node navigates to that document's page
  3. Hovering a node highlights it and dims all non-adjacent nodes and edges
  4. Graph supports zoom and pan without losing node labels or edge visibility
  5. Each document page shows a "Related Documents" section with 3-5 documents that share the most tags
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Build-time graph data library (buildGraphData + getRelatedDocs in src/lib/graph.js)
- [x] 02-02-PLAN.md — Related Documents sidebar component and two-column document layout
- [x] 02-03-PLAN.md — Graph page scaffold with D3 force simulation, zoom/pan, neon styling
- [x] 02-04-PLAN.md — Graph page interactions: hover highlight, click navigation, tag filter
- [x] 02-05-PLAN.md — Human visual checkpoint for all interactive behaviors

### Phase 3: Claude Code Skills and Polish
**Goal**: Three working Claude Code slash commands enable AI-assisted document creation, organization, and validation; visual polish completes the neon aesthetic
**Depends on**: Phase 1 (skills use tag normalization rules established there); Phase 2 for graph polish
**Requirements**: REQ-016, REQ-033, REQ-043, REQ-050, REQ-051, REQ-052, REQ-053
**Success Criteria** (what must be TRUE):
  1. `/loom:research` creates a valid new document following TEMPLATE.md from a topic prompt, with normalized tags
  2. `/loom:organize` audits all documents and reports missing or inconsistent tags with suggested canonical fixes
  3. `/loom:validate` reports all frontmatter errors and template non-conformance without modifying files
  4. Code blocks in document pages render with syntax highlighting
  5. Graph nodes and accent elements display glow/bloom effects consistent with the neon aesthetic
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Shiki syntax highlighting, CSS neon glow effects, validate-output extension
- [x] 03-02-PLAN.md — Claude Code skills: /loom:research, /loom:organize, /loom:validate
- [x] 03-03-PLAN.md — Build verification and human visual checkpoint

### Phase 4: Cleanup and Polish
**Goal**: Close 3 minor tech debt items identified in the v1.0 milestone audit — validator coverage for the graph page, document layout double-padding fix, and Wrangler config completeness
**Depends on**: Phase 3
**Requirements**: (tech debt — no new requirement IDs; references REQ-006, REQ-030, REQ-043)
**Gap Closure**: Closes MC-01, MC-02, MC-04 from v1.0-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. `node scripts/validate-output.mjs` checks for `dist/graph/index.html` and fails if absent
  2. Document pages have no double padding — `main:has(.doc-layout)` reset mirrors the existing graph page reset
  3. `npx wrangler pages dev` (without `dist/` argument) starts correctly using `pages_build_output_dir` from `wrangler.toml`
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md — Validator graph check, layout padding fix, wrangler.toml pages_build_output_dir

</details>

---

### 🚧 v1.1 Visualization (In Progress)

**Milestone Goal:** Transform the site into an immersive cyberpunk knowledge terminal — semantic embedding map, terminal-style search and keyboard navigation, timeline scrubbing, and AI-powered content management skills.

- [x] **Phase 5: Embedding Pipeline** - Offline script embeds all documents via Ollama + UMAP and commits coordinates as a static JSON artifact consumed at build time (completed 2026-03-10)
- [ ] **Phase 6: Map Page Skeleton** - `/map` route renders documents as 2D dots from embeddings.json; validates data island, HiDPI canvas, and SSR boundary before any interactions are added
- [ ] **Phase 7: Map Interactions** - Filter lenses (tag + search + ANY/ALL), Gaussian timeline slider with play button, side panel, and nearest-neighbor lines wire together via CustomEvent bus
- [ ] **Phase 8: Global Shell** - Terminal search overlay, vim-style keyboard navigation, and cyberpunk CSS layer (scanlines, CRT vignette, typewriter headings) all land in Base.astro together
- [ ] **Phase 9: Home Page** - Redesigned home page uses the shell's search overlay as its primary entry point and surfaces the 10 most recently added articles
- [ ] **Phase 10: Claude Code Skills** - Four new slash commands wrap the fully functioning system: add, deploy, retag, and gaps

## Phase Details

### Phase 5: Embedding Pipeline
**Goal**: The operator can run a single offline script that embeds all documents, reduces them to 2D coordinates, and writes a committed JSON artifact the Astro build reads at compile time — with incremental caching and loud failure on bad state
**Depends on**: Phase 4
**Requirements**: EMBED-01, EMBED-02, EMBED-03, EMBED-04
**Success Criteria** (what must be TRUE):
  1. Operator runs `node scripts/embed.mjs` and `src/data/embeddings.json` is produced with 2D x/y coordinates for every document
  2. Running the script a second time with no document changes completes without calling Ollama (incremental cache hit verified in console output)
  3. Running the script with Ollama stopped prints an explicit error and exits non-zero — no partial or stale output file is written
  4. `npm run build` succeeds using the committed embeddings.json — Cloudflare Pages build log shows no missing-file errors
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Test scaffold, npm deps (ollama, umap-js, gray-matter), placeholder embeddings.json, .gitignore .cache/
- [ ] 05-02-PLAN.md — Implement scripts/embed.mjs with exported functions, incremental cache, UMAP reduction, atomic write
- [ ] 05-03-PLAN.md — Run against live Ollama, verify all EMBED behaviors, commit real embeddings.json artifact

### Phase 6: Map Page Skeleton
**Goal**: The `/map` route renders every document as a dot at its 2D embedding coordinate on an HiDPI-correct canvas, with a hover tooltip showing title and tags — no filter interactions yet, just verified data flow
**Depends on**: Phase 5
**Requirements**: MAP-01, MAP-02
**Success Criteria** (what must be TRUE):
  1. Visiting `/map` shows a canvas with one dot per document positioned according to semantic similarity (no overlapping all-at-origin dots)
  2. Hovering a dot shows a tooltip with the document's title and its tags
  3. Dots are sharp on a Retina/HiDPI display — no blurriness from missing devicePixelRatio scaling
  4. `npm run build` completes without SSR errors referencing `window` or `document`
**Plans**: TBD

### Phase 7: Map Interactions
**Goal**: Users can filter the map by tags and search terms with ANY/ALL composition, scrub a timeline that applies Gaussian opacity by date, and click any dot to open a side panel and draw nearest-neighbor lines — all filters compose simultaneously
**Depends on**: Phase 6
**Requirements**: MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, MAP-08, MAP-09, MAP-10
**Success Criteria** (what must be TRUE):
  1. Clicking a dot slides in a side panel with the document's title, tags, summary, and a link to the full article; clicking a second dot draws lines to its 5 nearest neighbors
  2. Selecting tags in the filter bar causes matching dots to glow and non-matching dots to dim to ~20% opacity; toggling ANY/ALL changes which dots glow for multi-tag selections
  3. Typing in the search box dims non-matching dots to ~20% opacity in real time
  4. Dragging the timeline slider applies a Gaussian opacity curve centered on the selected date — dots far from that date fade without disappearing entirely
  5. Tag filter, search filter, and timeline slider compose: a dot's final opacity reflects all three applied simultaneously
  6. The play button auto-advances the timeline through the document corpus from earliest to latest date
**Plans**: TBD

### Phase 8: Global Shell
**Goal**: A terminal-style search overlay and vim-style keyboard navigation mount once in Base.astro and work across every page; a cyberpunk CSS layer adds scanlines, CRT vignette, typewriter headings, and ASCII dividers to the site-wide aesthetic
**Depends on**: Phase 6 (map route must exist for nav link); Phase 7 (keyboard/canvas conflict resolution)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, AESTH-01, AESTH-02, AESTH-03, AESTH-04
**Success Criteria** (what must be TRUE):
  1. Pressing `/` from any page opens a `loom> _` overlay with a blinking cursor; Esc closes it and returns focus to the previous context
  2. Typing in the search overlay returns fuzzy-matched results by title, tag, and keyword; arrow keys navigate results; Enter opens the selected document
  3. On any list page, pressing `j`/`k` moves the selection down/up, `gg`/`G` jumps to top/bottom, and Enter opens the selected item; a status bar at the bottom shows current mode
  4. A scanline/CRT overlay is visible on every page as an always-on static effect (not animated)
  5. Headings animate with a typewriter effect on page load; body text maintains WCAG AA contrast against the dark background
**Plans**: TBD

### Phase 9: Home Page
**Goal**: The home page is rebuilt around the search overlay as the primary entry point and a list of the 10 most recently added articles — replacing the current category-grid landing page
**Depends on**: Phase 8 (SearchOverlay must exist in Base.astro before index.astro can invoke it)
**Requirements**: HOME-01, HOME-02
**Success Criteria** (what must be TRUE):
  1. The home page displays a `loom> _` terminal prompt; clicking or pressing `/` opens the global search overlay
  2. Below the search prompt, the 10 most recently added articles are listed in reverse-chronological order with title, date, and tags visible
**Plans**: TBD

### Phase 10: Claude Code Skills
**Goal**: Four Claude Code slash commands wrap the fully functioning system — capturing new content from URLs, deploying with validation and re-embedding, reshaping the tag taxonomy, and surfacing research gaps
**Depends on**: Phase 5 (deploy calls embed script), Phase 9 (wraps a fully functioning site)
**Requirements**: SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05
**Success Criteria** (what must be TRUE):
  1. `/loom:add <url>` fetches a URL, produces a correctly formatted markdown document in the appropriate category directory with title, date, inferred tags drawn from the existing tag vocabulary, and a summary — file is created but not committed
  2. `/loom:deploy` runs validation, re-embeds any changed documents via Ollama, commits the updated embeddings.json, and pushes — triggering a Cloudflare Pages build
  3. `/loom:deploy` refuses to proceed and prints validation errors if any document fails the frontmatter check; no commit is made
  4. `/loom:retag <old> <new>` updates every document that uses the old tag to use the new tag, or splits one tag into two across the corpus
  5. `/loom:gaps` lists tags with only 1-2 documents and outputs suggested research topics for each thin-coverage area
**Plans**: TBD

## Coverage Validation

Every v1.1 requirement maps to exactly one phase. No orphans.

| Requirement | Description (abbreviated) | Phase |
|-------------|---------------------------|-------|
| EMBED-01 | Run embed.mjs to generate 2D coordinates via Ollama + UMAP | 5 | 3/3 | Complete   | 2026-03-10 | 5 |
| EMBED-03 | Fail loudly if Ollama not running; atomic file write | 5 |
| EMBED-04 | embeddings.json committed to git, consumed at Astro build time | 5 |
| MAP-01 | View all documents as dots on 2D semantic map at /map | 6 |
| MAP-02 | Hover dot shows tooltip with title and tags | 6 |
| MAP-03 | Click dot opens side panel with title, tags, summary, link | 7 |
| MAP-04 | Click dot draws lines to 5 nearest neighbors | 7 |
| MAP-05 | Filter by tag — matching dots glow, others dim to ~20% | 7 |
| MAP-06 | Filter by search term — matching dots glow, others dim | 7 |
| MAP-07 | Toggle ANY (union) / ALL (intersection) tag matching | 7 |
| MAP-08 | Timeline slider applies Gaussian opacity by document date | 7 |
| MAP-09 | Play button auto-scrubs timeline forward through time | 7 |
| MAP-10 | Tag filter, search filter, timeline compose simultaneously | 7 |
| SHELL-01 | Press `/` from any page to open terminal search overlay | 8 |
| SHELL-02 | Search overlay fuzzy-matches title, tag, and keyword | 8 |
| SHELL-03 | Arrow keys navigate results; Enter opens selected result | 8 |
| SHELL-04 | Vim-style j/k/gg/G/Enter navigation on list pages | 8 |
| SHELL-05 | Status bar at bottom shows current mode/context | 8 |
| SHELL-06 | Esc dismisses overlays and returns to previous context | 8 |
| AESTH-01 | Scanline/CRT overlay on all pages as always-on effect | 8 |
| AESTH-02 | Headings use typewriter animation on load | 8 |
| AESTH-03 | ASCII-art dividers in page layouts | 8 |
| AESTH-04 | All aesthetic effects maintain WCAG AA on body text | 8 |
| HOME-01 | Home page shows terminal search prompt as primary entry point | 9 |
| HOME-02 | Home page shows 10 most recently added articles | 9 |
| SKILL-01 | /loom:add — fetch URL, create document with inferred tags | 10 |
| SKILL-02 | /loom:deploy — validate + re-embed + commit + push | 10 |
| SKILL-03 | /loom:deploy refuses to deploy if validation fails | 10 |
| SKILL-04 | /loom:retag — merge or split tags across all documents | 10 |
| SKILL-05 | /loom:gaps — identify thin-coverage tags, suggest topics | 10 |

**Total v1.1 requirements:** 31
**Mapped:** 31/31
**Orphaned:** 0

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Content Pipeline and Site Foundation | v1.0 | 5/5 | Complete | 2026-03-09 |
| 2. Graph Visualization and Relationship Engine | v1.0 | 5/5 | Complete | 2026-03-09 |
| 3. Claude Code Skills and Polish | v1.0 | 3/3 | Complete | 2026-03-09 |
| 4. Cleanup and Polish | v1.0 | 1/1 | Complete | 2026-03-09 |
| 5. Embedding Pipeline | v1.1 | 0/3 | Planned | - |
| 6. Map Page Skeleton | v1.1 | 0/TBD | Not started | - |
| 7. Map Interactions | v1.1 | 0/TBD | Not started | - |
| 8. Global Shell | v1.1 | 0/TBD | Not started | - |
| 9. Home Page | v1.1 | 0/TBD | Not started | - |
| 10. Claude Code Skills | v1.1 | 0/TBD | Not started | - |
