# Project Research Summary

**Project:** Loom - Static Knowledge Base with Graph Visualization
**Domain:** Static knowledge base / digital garden with interactive graph visualization
**Researched:** 2026-03-09
**Confidence:** MEDIUM

## Executive Summary

Loom is a static knowledge base that renders markdown documents with YAML frontmatter into a browsable, visually distinctive website with a force-directed graph showing document relationships via shared tags. This is a well-established domain -- tools like Obsidian Publish, Quartz, and various digital garden generators have proven the pattern. The expert approach is a build-time data pipeline: parse markdown, compute tag-based relationships, emit static HTML plus a pre-computed graph JSON file, and render the graph interactively on the client side. Astro is the ideal static site generator for this because it ships zero JavaScript by default and supports "islands" for the one interactive component (the graph).

The recommended approach is straightforward: Astro for static generation with Content Collections handling the existing markdown files, D3.js for the force-directed graph visualization, vanilla CSS with custom properties for the neon/dark aesthetic, and Cloudflare Pages for deployment. The stack is deliberately minimal -- no React, no Tailwind, no TypeScript, no database. The entire client-side JavaScript footprint should be the graph visualization and nothing more. All relationship computation (tag indexing, edge calculation, graph data generation) happens at build time, producing a static `graph-data.json` that the D3 script consumes.

The key risks are: (1) graph rendering performance -- SVG-based D3 force layouts choke at 100+ nodes with dense tag edges, so edge thresholds or Canvas rendering may be needed, (2) silent frontmatter parsing failures dropping documents from the site (already observed in airllm.md and langflow.md), and (3) tag taxonomy entropy where inconsistent tag naming fractures the relationship graph. All three are preventable with early architectural decisions: strict frontmatter validation, tag normalization, and performance testing with realistic node counts.

## Key Findings

### Recommended Stack

The stack centers on Astro as the static site generator and D3.js for graph visualization, with vanilla CSS and Cloudflare Pages for deployment. This is a low-dependency stack by design -- the project has minimal client-side JavaScript needs and should not pay the complexity tax of a full framework.

**Core technologies:**
- **Astro ^5.x**: Static site generation -- zero JS by default, Content Collections for typed frontmatter, islands architecture for the D3 graph component
- **D3.js ^7.x (d3-force)**: Force-directed graph visualization -- industry standard, full styling control for neon aesthetic, stable API
- **Vanilla CSS with custom properties**: Theming and styling -- neon color palette, CSS @layer for organization, no framework overhead for ~5-8 templates
- **Shiki ^1.x**: Syntax highlighting -- built into Astro, build-time rendering, supports custom themes
- **Cloudflare Pages**: Deployment -- static output mode, no adapter needed, Wrangler for local testing

**Explicitly not using:** React/Vue/Svelte (no SPA needed), Tailwind (custom aesthetic needs raw CSS control), TypeScript (not enough JS to justify it), any database or CMS.

### Expected Features

**Must have (table stakes):**
- Markdown rendering with YAML frontmatter to individual pages
- Document listing / index page with sort options
- Tag display on documents (clickable, navigable)
- Tag-based filtering / tag index pages
- Dark theme with readable typography
- Navigation / site structure derived from directories
- Build-time static generation for Cloudflare Pages

**Should have (differentiators):**
- Interactive force-directed graph visualization (the flagship feature)
- Tag-based relationship inference powering graph edges and related docs
- Neon/hacker aesthetic with glow effects on graph, accent colors throughout
- Graph interaction: click-to-navigate, hover highlights, tag filtering, zoom/pan
- Related documents section on each page (from tag overlap)
- Local graph view showing a document's immediate neighbors

**Defer (v2+):**
- Client-side search (Fuse.js -- only worthwhile at 50+ documents)
- Tag cloud / weighted tag overview
- Page transitions / micro-interactions
- Wikilinks, backlinks, CMS, mobile optimization, theme switching, RSS, nested tags

### Architecture Approach

The architecture is a four-layer pipeline: Content Layer (markdown files with frontmatter) feeds the Build Pipeline (parser, tag indexer, relationship mapper, renderer), which produces Static Output (HTML pages, graph-data.json, CSS/JS), consumed by the Client Runtime (D3 graph, tag filter UI). The critical architectural principle is that all relationship computation happens at build time -- the browser receives pre-computed JSON and renders it, with no parsing or computation. The dependency chain is: Parser -> Tag Indexer -> Relationship Mapper -> Graph Data JSON -> Client-side Graph Visualization.

**Major components:**
1. **Content Layer** -- Existing markdown files in repo root directories, read by Astro Content Collections
2. **Build Pipeline** -- Frontmatter parsing, tag index building, relationship mapping, markdown rendering (all Astro-native)
3. **Graph Data Generator** -- Computes nodes (documents) and edges (shared tags with weight) into graph-data.json
4. **Static Output** -- HTML pages, graph-data.json, CSS/JS assets in dist/ directory
5. **Graph Visualization** -- Client-side D3 force-directed graph reading pre-computed JSON
6. **Claude Code Skills** -- Slash commands for document management, independent from site rendering

### Critical Pitfalls

1. **Graph rendering performance at scale** -- SVG/DOM-based D3 force layouts degrade past 100 nodes with dense tag edges. Prevention: implement edge weight thresholds (only show edges for 2+ shared tags), test with 50+ nodes early, consider Canvas rendering if SVG struggles. Pre-computing graph layout positions at build time is a viable optimization.

2. **Silent frontmatter parsing failures** -- Malformed YAML (already present in airllm.md, langflow.md) causes documents to silently vanish from the site. Prevention: strict validation step in build pipeline that fails the build on invalid frontmatter. Fix known issues in Phase 1.

3. **Tag taxonomy entropy** -- Inconsistent tags ("ai" vs "AI" vs "artificial-intelligence") fracture the relationship graph. Prevention: normalize tags at build time (lowercase, trim, hyphenate), define a canonical tag list, validate in Claude Code skills.

4. **SPA over-engineering** -- Reaching for a full framework when only one page needs interactivity. Prevention: already mitigated by choosing Astro with islands architecture.

5. **Cloudflare Pages build environment mismatches** -- Node version differences, asset path issues on preview deployments. Prevention: pin Node version, test with Wrangler locally, use relative asset paths.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Content Pipeline and Site Foundation

**Rationale:** Everything depends on the content pipeline. Frontmatter parsing, tag indexing, and rendered pages are prerequisites for the graph, navigation, and every other feature. The dark/neon theme should be established early to avoid retrofitting. Fixing existing frontmatter bugs is a day-one concern.
**Delivers:** A working static site with all documents rendered, tag navigation, dark neon theme, deployed to Cloudflare Pages.
**Addresses:** All table-stakes features (markdown rendering, document pages, tag display, tag index, dark theme, navigation, document listing).
**Avoids:** Silent frontmatter failures (Pitfall 2), SPA over-engineering (Pitfall 4), build vs runtime confusion (Pitfall 7), dark theme readability issues (Pitfall 8).
**Stack elements:** Astro with Content Collections, vanilla CSS with custom properties, Shiki for syntax highlighting, Wrangler for Cloudflare deployment.

### Phase 2: Graph Visualization and Relationship Engine

**Rationale:** The graph is the flagship differentiator but depends on the tag index from Phase 1. This phase builds the relationship mapper and the D3 visualization together since they are tightly coupled. Edge weight thresholds and performance testing must happen here, not later.
**Delivers:** Interactive force-directed graph on the home/graph page, related documents sections on each document page.
**Addresses:** Graph visualization, tag-based relationship inference, graph interaction (click/hover/filter/zoom), related documents section.
**Avoids:** Graph performance issues (Pitfall 1), over-engineered tag navigation (Pitfall 6).
**Stack elements:** D3.js with d3-force, Astro island with client:load directive.

### Phase 3: Local Graph, Search, and Polish

**Rationale:** Local graph views and search are enhancement features that build on the complete graph data from Phase 2. These are high-value polish items but not critical path. Claude Code skills can also be formalized here since they are independent of the site rendering pipeline.
**Delivers:** Per-document local graph views, client-side search, tag cloud, Claude Code slash commands for document management.
**Addresses:** Local graph view, client-side search, tag cloud, Claude Code skills, page transitions.
**Avoids:** Coupling Claude Code skills to site structure (Pitfall 10), broken internal links (Pitfall 11).
**Stack elements:** Fuse.js for search (if document count warrants it), Claude Code slash command definitions.

### Phase Ordering Rationale

- **Phase 1 before Phase 2** because the graph visualization consumes the tag index and rendered document URLs that Phase 1 produces. You cannot build the graph without the data pipeline.
- **Phase 2 before Phase 3** because local graph views are a subset of the global graph data, and search is an enhancement once the core experience works.
- **Theme/aesthetic in Phase 1** because retrofitting a neon aesthetic onto existing pages is harder than building with it from the start. The CSS custom properties established in Phase 1 carry through to graph styling in Phase 2.
- **Cloudflare deployment in Phase 1** because early deployment catches environment issues (Pitfall 5) before the codebase is complex. Deploy a working site early, iterate on it.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Graph Visualization):** D3 force-directed graph implementation details, SVG vs Canvas decision based on expected node count, edge bundling strategies, interaction patterns. The STACK.md recommends D3 SVG but PITFALLS.md warns about SVG performance -- this tension needs resolution during phase planning with actual performance testing.
- **Phase 1 (Astro Content Collections config):** Astro 5's content collection source configuration for pointing at root-level directories (rather than moving files into src/content/) needs verification against current Astro docs.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core site build):** Standard Astro static site with markdown content -- extremely well-documented, many reference implementations.
- **Phase 3 (Search, Claude Code skills):** Fuse.js integration is straightforward; Claude Code slash commands are prompt templates, not complex code.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Astro 5.x and D3 v7 are strong choices but version numbers need verification (training data cutoff May 2025). Architectural rationale is HIGH confidence. |
| Features | MEDIUM | Feature landscape based on established digital garden tools (Obsidian, Quartz, etc.). Feature prioritization aligns with project goals. |
| Architecture | MEDIUM-HIGH | Build-time data pipeline is the standard pattern for this domain. Component boundaries are clear. Astro-specific Content Collections configuration needs verification. |
| Pitfalls | MEDIUM-HIGH | Pitfalls grounded in real codebase issues (frontmatter bugs) and well-known domain problems (graph performance, tag entropy). Actionable prevention strategies provided. |

**Overall confidence:** MEDIUM

The architectural approach and technology choices are sound and based on well-established patterns. The main uncertainty is around specific library versions and Astro 5 configuration details that should be verified against current documentation during Phase 1 setup.

### Gaps to Address

- **Astro 5 Content Collections configuration:** Verify that Astro 5 supports pointing content collection sources at root-level directories (ai-tools-and-services/, etc.) without moving files into src/content/. If not, symlinks or restructuring needed.
- **SVG vs Canvas for D3 graph:** STACK.md recommends D3 SVG, PITFALLS.md warns about SVG performance past 100 nodes. Current corpus is ~15 documents but architecture should handle 200+. Resolve during Phase 2 planning -- start with SVG, benchmark, switch to Canvas if needed.
- **Tag normalization scope:** Existing documents have inconsistent tags. Audit all current tags during Phase 1 to determine cleanup extent and whether a canonical tag list is needed from day one.
- **Node.js version pinning:** Verify current LTS version for Cloudflare Pages compatibility before Phase 1 setup.
- **Claude Code slash command format:** Verify current `.claude/commands/` file format and capabilities against latest docs.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: existing markdown documents, frontmatter structure, known YAML issues (airllm.md, langflow.md)
- PROJECT.md project definition and goals

### Secondary (MEDIUM confidence)
- Astro documentation patterns (Content Collections, islands architecture, Cloudflare deployment) -- training data, May 2025 cutoff
- D3.js force simulation API documentation -- training data, stable since 2021
- Cloudflare Pages deployment model -- training data
- Digital garden ecosystem (Obsidian Publish, Quartz, Foam, Dendron) -- training data

### Tertiary (LOW confidence)
- Specific version numbers (Astro ^5.x, Shiki ^1.x, Node ^22.x) -- need verification against current releases
- Astro 5 content directory configuration flexibility -- needs verification

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
