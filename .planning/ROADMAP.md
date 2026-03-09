# Roadmap: Loom

## Overview

Loom evolves a flat collection of 15 tagged markdown research documents into a navigable, visual knowledge graph. Phase 1 fixes existing content issues and ships a fully deployed static site with dark/neon aesthetic. Phase 2 adds the flagship D3 force-directed graph visualization and the relationship engine that powers it. Phase 3 delivers the Claude Code slash commands for AI-assisted document management and any remaining polish.

## Phases

- [ ] **Phase 1: Content Pipeline and Site Foundation** - Fix frontmatter bugs, build Astro site with dark/neon theme, tag navigation, deploy to Cloudflare Pages
- [ ] **Phase 2: Graph Visualization and Relationship Engine** - Interactive D3 force-directed graph, tag-based edges with weight thresholds, related documents
- [ ] **Phase 3: Claude Code Skills and Polish** - AI document management slash commands, glow effects, tag filtering, syntax highlighting

## Phase Details

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
- [ ] 01-01-PLAN.md — Fix frontmatter bugs and normalize tags in source files
- [ ] 01-02-PLAN.md — Initialize Astro project and configure content collections
- [ ] 01-03-PLAN.md — Build page routes, layouts, components, and output validator
- [ ] 01-04-PLAN.md — Create dark/neon CSS theme
- [ ] 01-05-PLAN.md — Deploy to Cloudflare Pages and verify live site

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
**Plans**: TBD

### Phase 3: Claude Code Skills and Polish
**Goal**: Three working Claude Code slash commands enable AI-assisted document creation, organization, and validation; visual polish completes the neon aesthetic
**Depends on**: Phase 1 (skills use tag normalization rules established there); Phase 2 for graph polish
**Requirements**: REQ-016, REQ-033, REQ-043, REQ-050, REQ-051, REQ-052, REQ-053
**Success Criteria** (what must be TRUE):
  1. `/research` creates a valid new document following TEMPLATE.md from a topic prompt, with normalized tags
  2. `/organize` audits all documents and reports missing or inconsistent tags with suggested canonical fixes
  3. `/validate` reports all frontmatter errors and template non-conformance without modifying files
  4. Code blocks in document pages render with syntax highlighting
  5. Graph nodes and accent elements display glow/bloom effects consistent with the neon aesthetic
**Plans**: TBD

## Coverage Validation

Every v1 requirement maps to exactly one phase. No orphans.

| Requirement | Description (abbreviated) | Phase |
|-------------|---------------------------|-------|
| REQ-001 | Parse markdown with YAML frontmatter | 1 | 4/5 | In Progress|  | 1 |
| REQ-003 | Validate frontmatter at build time — fail on missing fields | 1 |
| REQ-004 | Normalize tags at build time | 1 |
| REQ-005 | Generate build-time tag index | 1 |
| REQ-006 | Generate build-time relationship graph (nodes, edges, weights) | 2 |
| REQ-007 | Serialize graph data to static JSON | 2 |
| REQ-010 | Render each document as an individual HTML page | 1 |
| REQ-011 | Generate document index/listing page | 1 |
| REQ-012 | Generate per-tag pages | 1 |
| REQ-013 | Display tags as clickable links on document pages | 1 |
| REQ-014 | Show related documents section (tag overlap) | 2 |
| REQ-015 | Site structure navigable from directory categories | 1 |
| REQ-016 | Syntax highlighting (Shiki, build-time) | 3 |
| REQ-020 | Interactive force-directed graph | 2 |
| REQ-021 | Clicking a node navigates to that document | 2 |
| REQ-022 | Hovering a node highlights it and direct connections | 2 |
| REQ-023 | Graph supports zoom and pan | 2 |
| REQ-024 | Edge rendering controlled by weight threshold | 2 |
| REQ-025 | Graph styled with neon/dark aesthetic | 2 |
| REQ-026 | Tag-based filtering on graph | 2 |
| REQ-030 | Dark background with high-contrast typography | 1 |
| REQ-031 | Neon accent colors throughout | 1 |
| REQ-032 | Monospace font for primary UI chrome | 1 |
| REQ-033 | Glow/bloom effects on graph and accent elements | 3 |
| REQ-034 | WCAG AA contrast on body text | 1 |
| REQ-040 | Static output deployable to Cloudflare Pages | 1 |
| REQ-041 | Git-based auto-deploy to Cloudflare Pages | 1 |
| REQ-042 | .gitignore covering OS, editor, build output | 1 |
| REQ-043 | Local preview via Wrangler | 3 |
| REQ-050 | /research skill: create new document from topic | 3 |
| REQ-051 | /organize skill: audit tags and suggest fixes | 3 |
| REQ-052 | /validate skill: check frontmatter and template conformance | 3 |
| REQ-053 | Skills enforce tag normalization | 3 |

**Total v1 requirements:** 33
**Mapped:** 33/33
**Orphaned:** 0

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Content Pipeline and Site Foundation | 0/5 | Not started | - |
| 2. Graph Visualization and Relationship Engine | 0/TBD | Not started | - |
| 3. Claude Code Skills and Polish | 0/TBD | Not started | - |
