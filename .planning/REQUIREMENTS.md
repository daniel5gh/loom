# Requirements: Loom

**Version:** 1.0
**Date:** 2026-03-09

---

## V1 — In Scope

### Content Pipeline

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-001 | Parse all existing markdown documents with YAML frontmatter (title, date, tags) | Must |
| REQ-002 | Fix malformed frontmatter in `airllm.md` and `langflow.md` (leading space on `date:`) | Must |
| REQ-003 | Validate frontmatter at build time — fail the build on missing required fields | Must |
| REQ-004 | Normalize tags at build time: lowercase, trim whitespace, hyphenate spaces | Must |
| REQ-005 | Generate a build-time tag index mapping each tag to the documents that carry it | Must |
| REQ-006 | Generate a build-time relationship graph (nodes = documents, edges = shared tags, weight = overlap count) | Must |
| REQ-007 | Serialize graph data to static JSON consumed by client-side visualization | Must |

### Static Site (Astro)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-010 | Render each markdown document as an individual HTML page | Must |
| REQ-011 | Generate a document index/listing page with all documents | Must |
| REQ-012 | Generate per-tag pages listing all documents with that tag | Must |
| REQ-013 | Display tags on each document page as clickable links to tag pages | Must |
| REQ-014 | Show "related documents" section on each page derived from tag overlap | Must |
| REQ-015 | Site structure navigable from existing directory categories (ai-tools-and-services, cloud-ai-platforms, companies) | Must |
| REQ-016 | Syntax highlighting for code blocks (Shiki, build-time) | Should |

### Graph Visualization

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-020 | Interactive force-directed graph showing documents as nodes, shared tags as edges | Must |
| REQ-021 | Clicking a node navigates to that document's page | Must |
| REQ-022 | Hovering a node highlights it and its direct connections | Must |
| REQ-023 | Graph supports zoom and pan | Must |
| REQ-024 | Edge rendering controlled by weight threshold (e.g., only edges with 2+ shared tags) to avoid visual noise | Should |
| REQ-025 | Graph styled with neon/dark aesthetic consistent with site theme | Must |
| REQ-026 | Tag-based filtering: select a tag to highlight/isolate nodes that share it | Should |

### Aesthetic

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-030 | Dark background with high-contrast typography for readability | Must |
| REQ-031 | Neon accent colors applied to graph nodes, edges, tag pills, hovers, and interactive elements | Must |
| REQ-032 | Monospace font (e.g., Fira Code) for primary UI chrome | Must |
| REQ-033 | Glow/bloom effects on graph elements and accent highlights (CSS, not affecting text readability) | Should |
| REQ-034 | WCAG AA contrast ratio on all body text | Must |

### Deployment

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-040 | Static output deployable to Cloudflare Pages (no server-side adapter needed) | Must |
| REQ-041 | Git-based auto-deploy: push to main → Cloudflare Pages builds and publishes | Must |
| REQ-042 | `.gitignore` covering OS artifacts, editor files, and build output | Must |
| REQ-043 | Local preview via Wrangler (`wrangler pages dev`) | Should |

### AI Document Management (Claude Code Skills)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-050 | `/research` skill: given a topic, research it and create a new document following TEMPLATE.md | Must |
| REQ-051 | `/organize` skill: audit existing documents for missing/inconsistent tags and suggest fixes | Must |
| REQ-052 | `/validate` skill: check all documents for frontmatter errors and template non-conformance | Must |
| REQ-053 | Skills enforce tag normalization (lowercase, hyphenated, canonical form) | Must |

---

## V2 — Deferred

| ID | Requirement | Reason Deferred |
|----|-------------|-----------------|
| REQ-100 | Client-side full-text search (Fuse.js) | Only valuable at 50+ documents; current corpus is 15 |
| REQ-101 | Per-document local graph view | Enhancement of Phase 2 graph; Phase 3 feature |
| REQ-102 | Tag cloud page with weighted tag frequency visualization | Nice-to-have after graph ships |
| REQ-103 | Page transitions / micro-interactions | Polish layer, not core |
| REQ-104 | Mobile-optimized responsive layout | Desktop-first personal tool |
| REQ-105 | RSS/Atom feed | Not needed for personal use |
| REQ-106 | Theme switching (light/dark toggle) | Dark-only for v1 |

---

## Out of Scope

| What | Why |
|------|-----|
| Multi-user collaboration | Personal knowledge base, single owner |
| CMS or admin interface | Documents managed via git + Claude Code |
| Server-side processing | Static site only |
| Wikilinks / backlinks | Existing content uses YAML tags, not wikilink syntax |
| Database or external storage | All data lives in the git repo |
| Comments or discussion | Not a public community site |
| Analytics or tracking | Personal tool |

---

## Content Standards (existing documents must comply)

All documents in the repo must follow `TEMPLATE.md`:
- YAML frontmatter with `title` (string), `date` (YYYY-MM-DD), `tags` (list)
- H1 heading matching frontmatter title
- Summary section
- Content section
- At least one external reference

Existing non-conforming documents (`pageindex.md`, `lovable.md`, `airllm.md`, `langflow.md`) should be fixed during Phase 1.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-001 | Phase 1 | Complete |
| REQ-002 | Phase 1 | Complete |
| REQ-003 | Phase 1 | Complete |
| REQ-004 | Phase 1 | Complete |
| REQ-005 | Phase 1 | Complete |
| REQ-006 | Phase 2 | Pending |
| REQ-007 | Phase 2 | Pending |
| REQ-010 | Phase 1 | Complete |
| REQ-011 | Phase 1 | Complete |
| REQ-012 | Phase 1 | Complete |
| REQ-013 | Phase 1 | Complete |
| REQ-014 | Phase 2 | Pending |
| REQ-015 | Phase 1 | Complete |
| REQ-016 | Phase 3 | Pending |
| REQ-020 | Phase 2 | Pending |
| REQ-021 | Phase 2 | Pending |
| REQ-022 | Phase 2 | Pending |
| REQ-023 | Phase 2 | Pending |
| REQ-024 | Phase 2 | Pending |
| REQ-025 | Phase 2 | Pending |
| REQ-026 | Phase 2 | Pending |
| REQ-030 | Phase 1 | Complete |
| REQ-031 | Phase 1 | Complete |
| REQ-032 | Phase 1 | Complete |
| REQ-033 | Phase 3 | Pending |
| REQ-034 | Phase 1 | Complete |
| REQ-040 | Phase 1 | Complete |
| REQ-041 | Phase 1 | Complete |
| REQ-042 | Phase 1 | Complete |
| REQ-043 | Phase 3 | Pending |
| REQ-050 | Phase 3 | Pending |
| REQ-051 | Phase 3 | Pending |
| REQ-052 | Phase 3 | Pending |
| REQ-053 | Phase 3 | Pending |
