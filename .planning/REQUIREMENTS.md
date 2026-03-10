# Requirements: Loom

**Defined:** 2026-03-10
**Core Value:** Turn a flat collection of tagged markdown documents into a navigable, visual knowledge graph — making connections between research topics discoverable at a glance.

## v1.0 Requirements (Shipped)

All v1.0 requirements validated and shipped. See ROADMAP.md phases 1-4.

- ✓ Static site generation from markdown documents — v1.0 Phase 1
- ✓ Tag-based filtering and navigation — v1.0 Phase 1
- ✓ Interactive force-directed graph showing document relationships — v1.0 Phase 2
- ✓ Dark/neon hacker aesthetic — v1.0 Phases 1-3
- ✓ Cloudflare Pages deployment with auto-deploy — v1.0 Phase 1
- ✓ Claude Code skills: /loom:research, /loom:organize, /loom:validate — v1.0 Phase 3
- ✓ Frontmatter processing pipeline (tags, index, relationships) — v1.0 Phases 1-2

## v1.1 Requirements

### Embedding Pipeline

- [x] **EMBED-01**: Operator can run `scripts/embed.mjs` to generate 2D coordinates for all documents via Ollama + nomic-embed-text + UMAP
- [x] **EMBED-02**: Pipeline only re-embeds new/changed documents (content-hash incremental caching)
- [x] **EMBED-03**: Pipeline fails loudly if Ollama is not running (explicit health check + atomic file write)
- [x] **EMBED-04**: `src/data/embeddings.json` is committed to git and consumed by Astro at build time

### Map Visualization

- [x] **MAP-01**: User can view all documents as dots on a 2D semantic similarity map at `/map`
- [x] **MAP-02**: Hovering a dot shows tooltip with title and tags
- [x] **MAP-03**: Clicking a dot opens a side panel with title, tags, summary, and link to full article
- [x] **MAP-04**: Clicking a dot draws lines to 5 nearest neighbors
- [x] **MAP-05**: User can filter map by selecting one or more tags (matching dots glow, others dim to ~20% opacity)
- [x] **MAP-06**: User can filter map by typing a search term (matching dots glow, others dim)
- [x] **MAP-07**: User can toggle ANY (union) / ALL (intersection) tag matching mode
- [x] **MAP-08**: User can scrub a timeline slider applying gaussian opacity to dots by document date
- [x] **MAP-09**: Timeline slider has a play button that auto-scrubs forward through time
- [x] **MAP-10**: Tag filter, search filter, and timeline compose and apply simultaneously

### Global Shell

- [ ] **SHELL-01**: User can press `/` from any page to open a terminal-style search overlay (`loom> _` with blinking cursor)
- [x] **SHELL-02**: Search overlay supports fuzzy title, tag, and keyword matching across all documents
- [ ] **SHELL-03**: User can navigate search results with arrow keys and open selected result with Enter
- [ ] **SHELL-04**: User can navigate list pages with vim-style keys (j/k to move, Enter to open, gg/G for top/bottom)
- [ ] **SHELL-05**: Vim-style status bar at bottom of page shows current mode/context
- [ ] **SHELL-06**: Esc dismisses overlays and returns to previous context

### Home Page

- [ ] **HOME-01**: Home page shows terminal search prompt (`loom> _`) as primary entry point
- [ ] **HOME-02**: Home page shows recently added articles (last 10 by date)

### Cyberpunk Aesthetic

- [x] **AESTH-01**: Scanline/CRT overlay renders on all pages as always-on effect
- [x] **AESTH-02**: Headings use typewriter animation effect on load
- [x] **AESTH-03**: ASCII-art dividers used in page layouts
- [x] **AESTH-04**: All aesthetic effects maintain WCAG AA contrast on body text

### Claude Code Skills

- [ ] **SKILL-01**: `/loom:add <url>` fetches a URL, summarizes content, and creates a properly formatted markdown document with inferred tags and category (file created, not committed)
- [ ] **SKILL-02**: `/loom:deploy` validates all documents, re-embeds changed docs via Ollama, commits, and pushes to trigger Cloudflare build
- [ ] **SKILL-03**: `/loom:deploy` refuses to deploy if validation fails
- [ ] **SKILL-04**: `/loom:retag` merges duplicate tags or splits overly broad ones across all documents
- [ ] **SKILL-05**: `/loom:gaps` identifies tags with thin coverage (1-2 documents) and suggests research topics

## v2 Requirements

Deferred to future release.

- Full-text semantic search (vector similarity at query time) — server-side, not static
- Multi-collection support beyond the 3 current categories
- Mobile-optimized layout
- Parametric UMAP for position stability across re-runs

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user collaboration | Single-user personal tool |
| Server-side processing | Static site only; Cloudflare Pages constraint |
| Real-time sync | No backend |
| Mobile-first layout | Desktop personal tool |
| OAuth/authentication | No user accounts needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EMBED-01 | Phase 5 | Complete |
| EMBED-02 | Phase 5 | Complete |
| EMBED-03 | Phase 5 | Complete |
| EMBED-04 | Phase 5 | Complete |
| MAP-01 | Phase 6 | Complete |
| MAP-02 | Phase 6 | Complete |
| MAP-03 | Phase 7 | Complete |
| MAP-04 | Phase 7 | Complete |
| MAP-05 | Phase 7 | Complete |
| MAP-06 | Phase 7 | Complete |
| MAP-07 | Phase 7 | Complete |
| MAP-08 | Phase 7 | Complete |
| MAP-09 | Phase 7 | Complete |
| MAP-10 | Phase 7 | Complete |
| SHELL-01 | Phase 8 | Pending |
| SHELL-02 | Phase 8 | Complete |
| SHELL-03 | Phase 8 | Pending |
| SHELL-04 | Phase 8 | Pending |
| SHELL-05 | Phase 8 | Pending |
| SHELL-06 | Phase 8 | Pending |
| AESTH-01 | Phase 8 | Complete |
| AESTH-02 | Phase 8 | Complete |
| AESTH-03 | Phase 8 | Complete |
| AESTH-04 | Phase 8 | Complete |
| HOME-01 | Phase 9 | Pending |
| HOME-02 | Phase 9 | Pending |
| SKILL-01 | Phase 10 | Pending |
| SKILL-02 | Phase 10 | Pending |
| SKILL-03 | Phase 10 | Pending |
| SKILL-04 | Phase 10 | Pending |
| SKILL-05 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 — v1.1 traceability complete, all 31 requirements mapped to phases 5-10*
