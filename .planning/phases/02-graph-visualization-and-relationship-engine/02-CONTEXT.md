# Phase 2: Graph Visualization and Relationship Engine - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an interactive force-directed graph page showing all documents as nodes with edges representing shared tag relationships, and surface a "Related Documents" section on each individual document page. Graph data is generated at build time as static JSON consumed client-side.

</domain>

<decisions>
## Implementation Decisions

### Node labels
- Always visible when zoomed in; hide labels when zoomed out far (threshold for hiding TBD by planner based on viewport)
- Not hover-only — the graph should be immediately readable without interaction

### Node size
- Sized by tag count — documents with more tags appear as larger nodes
- Makes highly-tagged (more connected) documents stand out naturally

### Node color
- Colored by tag cluster (most-common shared tag determines color grouping)
- Emphasizes thematic clusters over directory categories
- Use the neon palette (cyan, magenta, green) from CSS custom properties

### Hover behavior
- Hovered node + its direct neighbors stay at full brightness
- All non-adjacent nodes and edges dim to ~15% opacity (near-invisible)
- Strong focus effect — clear which document you're exploring

### Related Documents layout
- Simple list format: title as link + shared tags listed
- Example: `LangChain ← shared: llm, agents`
- Shows why documents are related, not just that they are

### Related Documents position
- Sidebar / aside — visible while reading the document
- Requires expanding Document.astro layout from single-column to two-column (main content + sidebar)
- Desktop-first (already established constraint), so two-column layout is appropriate

### Related Documents shared tags display
- List the actual shared tag names (not just a count)
- e.g., `shared: llm, agents` — actionable context for the reader

### Claude's Discretion
- Graph page URL and nav placement (suggest `/graph/` with nav link added to Base.astro)
- Tag filter UI approach (suggest sidebar tag list or click-to-filter on graph nodes)
- Exact label hide/show zoom threshold
- Tag cluster → color mapping algorithm (e.g., most frequent tag across all docs gets cyan)
- Force simulation parameters (gravity, link distance, charge strength)
- Number of related documents shown: per REQ-014 spec, 3–5 sorted by shared tag count descending

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TagPill.astro`: Renders a single tag as a styled pill with neon-cyan color — can be reused in the Related Documents sidebar for showing shared tags
- `DocCard.astro`: Full card component (title, date, tags) — NOT used for related docs (user chose simple list), but exists for reference
- `Base.astro`: Site shell with nav — needs a "Graph" nav link added
- `Document.astro`: Current single-column document layout — needs expansion to two-column for sidebar

### Established Patterns
- CSS custom properties for color tokens (`--neon-cyan`, `--neon-magenta`, `--neon-green`, `--bg-base`, `--bg-surface`)
- Vanilla CSS (no Tailwind, no CSS-in-JS)
- Astro components (`.astro` files, not React/Vue)
- Astro Content Collections API for accessing docs (`getCollection()`)
- No TypeScript — plain JS in frontmatter scripts

### Integration Points
- Graph data JSON: build-time script generates relationship graph → serialized to `/public/graph.json` or similar static asset → loaded client-side by D3
- New `/graph/` page: `src/pages/graph.astro` — fetches graph JSON, initializes D3 force simulation
- Related docs: computed at build time in `[...slug].astro` or Document.astro using tag overlap logic
- Nav: `Base.astro` nav needs a third link — "Graph"

</code_context>

<specifics>
## Specific Ideas

- D3.js v7 already decided as the graph library (from STATE.md decisions)
- SVG-based rendering decided (Canvas consideration deferred to 50+ node threshold)
- Edge weight threshold: 2+ shared tags (edges with fewer shared tags are hidden to reduce noise)
- Color by tag cluster means the planner needs to implement a cluster-detection pass: find the most common tags across all docs, assign neon colors to top-N tags, color each node by its highest-weighted shared tag

</specifics>

<deferred>
## Deferred Ideas

- Per-document local graph view (REQ-101) — explicitly deferred to V2 in REQUIREMENTS.md
- Tag cloud page with weighted tag frequency — V2 per REQUIREMENTS.md

</deferred>

---

*Phase: 02-graph-visualization-and-relationship-engine*
*Context gathered: 2026-03-09*
