# Feature Landscape

**Domain:** Static knowledge base / digital garden with graph visualization
**Researched:** 2026-03-09
**Confidence:** MEDIUM (based on training data knowledge of established tools: Obsidian Publish, Quartz, Logseq, Foam, Dendron, TiddlyWiki, Jekyll/Hugo digital gardens; web verification unavailable)

## Table Stakes

Features users expect from any knowledge base / digital garden. Missing any of these and the site feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Markdown rendering | Every digital garden renders markdown to HTML. This is the absolute minimum. | Low | Frontmatter parsing + markdown-to-HTML pipeline. Well-solved by remark/rehype ecosystem. |
| Document listing / index page | Users need to see what exists. A browsable list of all documents. | Low | Generated at build time from frontmatter. Sort by date, title, or category. |
| Tag display on documents | Tags in frontmatter must be visible on each document page. Clickable to navigate. | Low | Parse YAML frontmatter, render as clickable badges/chips. |
| Tag-based filtering / tag index | Browse all documents by tag. Click a tag, see all docs with that tag. Core navigation pattern. | Low | Build a tag-to-documents index at build time. Render tag pages. |
| Responsive typography and readability | Long-form content must be readable. Good line lengths, font sizing, spacing. | Low | CSS concern. Max-width prose container, sensible defaults. |
| Dark theme | Every hacker/developer tool defaults to dark. The project explicitly requires this. | Low | CSS custom properties for theming. One theme (dark) is simpler than theme switching. |
| Navigation / site structure | Header, sidebar, or breadcrumbs. Users need to orient themselves. | Low | Category-based nav derived from directory structure. |
| Individual document pages | Each markdown file becomes its own page with a unique URL. | Low | Standard static site generator behavior. |
| Build-time static generation | All pages generated at build time, deployed as static files. No server required. | Low | Core SSG pipeline. This is the foundation everything else builds on. |

## Differentiators

Features that set this product apart from a plain static site or basic markdown renderer. These create the "knowledge graph" experience. Not expected in every tool, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Interactive graph visualization | **The core differentiator.** Visualize document relationships via shared tags as a force-directed node-link graph. Makes connections discoverable at a glance. Obsidian's graph view is the reference UX. | High | Needs a graph viz library (D3.js force simulation or similar). Build-time relationship computation, client-side rendering. Nodes = documents, edges = shared tags. |
| Tag-based relationship inference | Automatically compute "related documents" from shared tags. Two docs sharing 3+ tags are strongly related. This powers both the graph and related-document suggestions. | Medium | Build-time computation. Weighted by tag overlap count. Output as JSON consumed by graph viz and related-docs components. |
| Neon / hacker aesthetic with rich visuals | Not "terminal cosplay" -- rich interactive visualizations with neon accent colors (cyan, magenta, green on dark backgrounds). Glowing edges on the graph, animated transitions. | Medium | CSS + SVG styling. Glow effects via CSS filters/shadows, neon color palette. The graph viz benefits most from this treatment. |
| Graph filtering and interaction | Click a node to navigate to that document. Hover to highlight connections. Filter graph by tag or category. Zoom and pan. | Medium | D3.js interaction handlers. Filter controls overlay on the graph. |
| Local graph view on document pages | Each document page shows a small graph of its immediate neighbors (documents sharing tags). Contextual, not the full global graph. | Medium | Subset of the global graph data. Ego-network centered on current document. Powerful for discovery. |
| Related documents section | "See also" section at bottom of each document, computed from tag overlap. | Low | Straightforward once tag-relationship index exists. Sort by overlap count, show top 3-5. |
| Client-side search | Fuzzy search across document titles, tags, and optionally content. Instant results as you type. | Medium | Pre-built search index at build time (e.g., Fuse.js or Lunr.js). JSON index loaded client-side. Keep it lightweight -- title + tags is sufficient for 15-100 docs. |
| Tag cloud / tag overview | Visual representation of all tags with size/weight indicating frequency. Entry point to browse by concept. | Low | Count tag occurrences at build time, render as weighted list or cloud. |
| Smooth page transitions | Fade or slide transitions between pages to feel app-like rather than static-site-like. | Low | CSS transitions or View Transitions API. Small polish, big impact on feel. |
| Document metadata display | Show date, tags, category, reading time, word count on each document page. Rich contextual info. | Low | Computed at build time from frontmatter and content. |

## Anti-Features

Features to explicitly NOT build. Each would add complexity without proportional value for a single-user static knowledge base.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full-text server-side search | Requires a server, indexing infrastructure, ongoing maintenance. Overkill for a personal collection of 15-100 documents. | Client-side search with a pre-built JSON index (Fuse.js). Scales fine to hundreds of documents. |
| Wiki-style `[[wikilinks]]` parsing | Would require modifying existing markdown content format and adding a custom markdown plugin. The project uses standard markdown with YAML tags -- relationships come from tags, not inline links. | Use tag-based relationship inference. Wikilinks are an editing concern (Obsidian); for a read-only static site, tag relationships serve the same purpose. |
| User authentication / access control | Single-user personal tool. Adding auth adds complexity with zero value. | Deploy as public static site or use Cloudflare Access if privacy needed (infrastructure concern, not app concern). |
| Comments or annotations | Social features for a personal knowledge base add maintenance burden and require server infrastructure. | Keep it read-only. The author uses git + Claude Code for interaction. |
| CMS / admin panel / WYSIWYG editor | Documents are managed via git and Claude Code slash commands. A CMS duplicates this workflow and adds attack surface. | Claude Code skills for document management (already planned). |
| Real-time collaboration | Single user. Real-time adds massive complexity (CRDT, WebSockets, conflict resolution). | Git-based workflow. |
| Mobile-first responsive design | Explicitly out of scope per PROJECT.md. Desktop-first personal tool. | Basic responsive so it doesn't completely break on mobile, but don't optimize for it. |
| Theme switching (light/dark toggle) | The aesthetic IS dark + neon. A light theme undermines the visual identity and doubles CSS work. | Ship dark only. If light is ever needed, CSS custom properties make it addable later. |
| Backlinks (bidirectional links) | Backlinks require `[[wikilink]]` syntax in content. The project uses tags for relationships, not inline links. Backlinks without wikilinks would just duplicate the "related documents" feature. | Related documents via tag overlap achieves the same discovery goal. |
| Versioning / document history | Git already provides this. Building version display into the site is redundant. | Link to GitHub repo if version history is needed. |
| RSS / Atom feed | This is a personal knowledge base, not a blog. No audience subscribing to updates. | Skip entirely unless public sharing becomes a goal later. |
| Nested tag hierarchies | Over-engineering taxonomy for 15-100 documents. Flat tags with good naming are sufficient. | Flat tags. Use naming conventions (e.g., `cloud`, `cloud-ai`) if hierarchy is ever needed. |

## Feature Dependencies

```
Markdown rendering ─────────────────────> Individual document pages
                                              │
Frontmatter parsing ────> Tag index ─────> Tag-based filtering
                              │                │
                              ├────> Tag cloud  │
                              │                │
                              └────> Tag-relationship index
                                         │
                                         ├────> Related documents section
                                         │
                                         ├────> Global graph visualization
                                         │         │
                                         │         └────> Graph filtering/interaction
                                         │
                                         └────> Local graph view (per-document)

Document listing ──────> Client-side search (needs document index)

Dark theme + neon aesthetic ──────> Graph styling (glow effects, neon colors)
```

**Critical path:** Frontmatter parsing --> Tag-relationship index --> Graph visualization. Everything graph-related depends on the relationship computation layer.

## MVP Recommendation

### Phase 1: Foundation (must ship first)
1. **Markdown rendering + individual pages** -- the base layer everything needs
2. **Frontmatter parsing + tag display** -- parse existing YAML tags, show on pages
3. **Document listing / index page** -- browsable entry point
4. **Dark theme with neon aesthetic** -- establish visual identity from day one
5. **Tag index pages** -- click a tag, see all documents with that tag

### Phase 2: The Differentiator
6. **Tag-relationship computation** -- build the relationship index at build time
7. **Global interactive graph visualization** -- the flagship feature, force-directed graph
8. **Related documents section** -- low-hanging fruit once relationships exist
9. **Graph interaction** -- click, hover, filter, zoom

### Phase 3: Polish
10. **Local graph view** on document pages -- contextual mini-graph
11. **Client-side search** -- Fuse.js or similar, search titles + tags
12. **Tag cloud** -- visual overview of the knowledge space
13. **Page transitions and micro-interactions** -- polish the feel

### Defer Indefinitely
- Wikilinks, backlinks, CMS, mobile optimization, theme switching, RSS, nested tags

**Rationale:** Ship a readable, navigable, visually striking static site first (Phase 1). Then add the graph visualization that makes this more than "just another static site" (Phase 2). Polish after the core experience works (Phase 3). The graph is the product's identity -- but it depends on solid foundations.

## Sources

- Obsidian Publish feature set (graph view, backlinks, search, tag navigation) -- training data, MEDIUM confidence
- Quartz v4 static site generator features (graph, backlinks, full-text search, tag pages) -- training data, MEDIUM confidence
- Digital garden ecosystem patterns (TiddlyWiki, Foam, Dendron, Jekyll gardens) -- training data, MEDIUM confidence
- D3.js force-directed graph capabilities -- training data, HIGH confidence (stable, well-known library)
- Fuse.js client-side search -- training data, HIGH confidence (stable, well-known library)
- Project context from PROJECT.md and existing document structure -- HIGH confidence (direct source)
