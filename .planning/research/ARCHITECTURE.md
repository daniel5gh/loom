# Architecture Patterns

**Domain:** Static knowledge base with graph visualization
**Researched:** 2026-03-09

## Recommended Architecture

Loom follows the **static site with build-time data pipeline** pattern, common in digital gardens and knowledge graph tools (Obsidian Publish, Quartz, wiki.js static exports). The system has four distinct layers that execute in sequence: content source, build pipeline, static output, and client-side runtime.

```
[Content Layer]          [Build Pipeline]           [Static Output]        [Client Runtime]

Markdown files    -->   Frontmatter parser   -->   HTML pages       -->   Tag filter UI
YAML frontmatter  -->   Tag index builder    -->   graph-data.json  -->   Graph visualization
Directory tree    -->   Markdown renderer    -->   CSS/JS assets    -->   Page navigation
                        Relationship mapper        index.html
                        Asset bundling
```

The critical architectural insight: **all relationship computation happens at build time**. The browser receives pre-computed JSON describing nodes (documents) and edges (shared tags), then renders interactively. No server, no runtime computation.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Content Layer** | Store markdown documents with YAML frontmatter (title, date, tags) | Read by Build Pipeline |
| **Frontmatter Parser** | Extract and validate YAML metadata from all documents | Feeds Tag Index Builder, Relationship Mapper |
| **Tag Index Builder** | Build inverted index: tag -> [document list] | Feeds Relationship Mapper, HTML Generator |
| **Relationship Mapper** | Compute document-to-document edges via shared tags, output graph JSON | Feeds Static Output |
| **Markdown Renderer** | Convert markdown bodies to HTML fragments | Feeds HTML Generator |
| **HTML Generator** | Assemble full pages from templates + rendered content | Writes Static Output |
| **Static Output** | HTML files, graph-data.json, CSS/JS assets in output directory | Deployed to Cloudflare Pages |
| **Graph Visualization** | Client-side interactive node-link diagram from graph-data.json | Runs in browser, reads static JSON |
| **Tag Filter UI** | Client-side tag browsing and document filtering | Runs in browser, reads tag index |

### Data Flow

**Build time (runs on every `build` command):**

1. **Scan** -- Walk `ai-tools-and-services/`, `cloud-ai-platforms/`, `companies/` directories for `.md` files
2. **Parse** -- For each file, extract YAML frontmatter (`title`, `date`, `tags[]`) and markdown body
3. **Validate** -- Flag documents with missing/malformed frontmatter (known issues: airllm.md, langflow.md have leading spaces before `date:`)
4. **Index** -- Build tag-to-documents map: `{ "langchain": ["langchain.md", "litellm.md"], "ai": [...], ... }`
5. **Map relationships** -- For each document pair, count shared tags. If shared tags >= 1, create an edge with weight = shared tag count
6. **Generate graph data** -- Output `graph-data.json`: `{ nodes: [{id, title, tags, category, url}], edges: [{source, target, sharedTags}] }`
7. **Render pages** -- Convert each markdown document to an HTML page using a template with consistent layout, navigation, tag display
8. **Generate index pages** -- Create tag listing page, document listing page, home page with embedded graph
9. **Bundle assets** -- Copy CSS, JS (graph visualization library), fonts to output directory

**Client-side (runs in browser):**

1. **Load** -- Browser fetches HTML page and static assets
2. **Graph init** -- JavaScript loads `graph-data.json`, initializes force-directed graph visualization
3. **Interact** -- User clicks nodes to navigate to documents, hovers for previews, filters by tag
4. **Filter** -- Tag clicks filter visible documents and highlight subgraph

## Patterns to Follow

### Pattern 1: Build-Time Data Pipeline
**What:** All expensive computation (parsing, indexing, relationship mapping) happens during the build step, producing static JSON consumed by the client.
**When:** Always -- this is the core architectural pattern for a static site.
**Why:** Zero server costs, instant page loads, Cloudflare Pages compatibility, simple deployment.
**Example:**
```
// Build script pseudocode
const documents = scanMarkdownFiles(['ai-tools-and-services/', 'cloud-ai-platforms/', 'companies/'])
const parsed = documents.map(doc => ({
  ...parseFrontmatter(doc),
  slug: pathToSlug(doc.path),
  html: renderMarkdown(doc.body),
  category: doc.path.split('/')[0]
}))
const tagIndex = buildTagIndex(parsed)
const graphData = buildGraphData(parsed, tagIndex)

writeJSON('dist/graph-data.json', graphData)
parsed.forEach(doc => writeHTML(`dist/${doc.slug}/index.html`, renderTemplate(doc)))
```

### Pattern 2: Document-as-Node, Tag-as-Edge
**What:** Each document is a graph node. Two documents share an edge if they have at least one common tag. Edge weight = number of shared tags.
**When:** Building the relationship graph.
**Why:** Tags already exist in frontmatter. This is the simplest meaningful relationship model that requires zero manual linking. Documents with more shared tags cluster together naturally in a force-directed layout.
**Example:**
```typescript
interface GraphNode {
  id: string          // slug
  title: string       // from frontmatter
  tags: string[]      // from frontmatter
  category: string    // directory name
  url: string         // relative path to HTML page
}

interface GraphEdge {
  source: string      // node id
  target: string      // node id
  sharedTags: string[] // which tags they share
  weight: number      // sharedTags.length
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  tags: Record<string, string[]>  // tag -> node ids
}
```

### Pattern 3: Category-Based Visual Grouping
**What:** Use the directory structure (ai-tools-and-services, cloud-ai-platforms, companies) as a secondary grouping dimension in the graph. Color nodes by category.
**When:** Rendering the graph visualization.
**Why:** Provides two levels of meaning: spatial clustering by shared tags (force-directed) and color coding by category (directory). Users can visually distinguish topic areas while also seeing cross-category connections.

### Pattern 4: Progressive Enhancement
**What:** The site works as a static HTML document browser without JavaScript. The graph visualization and tag filtering enhance the experience when JS is available.
**When:** Designing the HTML output.
**Why:** Content is the primary value. If the graph library fails to load, users can still read every document. This also improves SEO and accessibility.

### Pattern 5: Single Output Directory
**What:** Build outputs everything to a single `dist/` (or `_site/` or `public/`) directory that maps 1:1 to the deployed site.
**When:** Structuring build output.
**Why:** Cloudflare Pages deploys a directory. One directory, one deployment. No build artifacts mixed with source files.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Runtime Relationship Computation
**What:** Computing document relationships in the browser from raw markdown files.
**Why bad:** Requires shipping all markdown source to the client, parsing frontmatter in JS, computing O(n^2) document comparisons on every page load. Slow, fragile, wasteful.
**Instead:** Pre-compute all relationships at build time. Ship a single `graph-data.json` file.

### Anti-Pattern 2: Monolithic Build Script
**What:** One giant script that does parsing, rendering, graph building, and file output in a single tangled function.
**Why bad:** Hard to test, hard to debug, hard to extend. When you add a new feature (e.g., search index), you have to modify a 500-line function.
**Instead:** Pipeline of discrete steps with clear interfaces. Each step takes input, produces output. Steps are independently testable.

### Anti-Pattern 3: Over-Engineering the Graph Model
**What:** Adding manual link types, weighted relationships, bidirectional references, wiki-link parsing before having content that needs it.
**Why bad:** 15 documents with simple tags do not need a sophisticated ontology. Premature complexity adds build time and maintenance burden.
**Instead:** Start with tag-based edges only. Add wiki-link parsing or explicit relationship types later if the content demands it.

### Anti-Pattern 4: Treating the Graph as the Primary Navigation
**What:** Making the graph visualization the main/only way to navigate documents.
**Why bad:** Force-directed graphs become unusable above ~50 nodes without significant UX work. They are discovery tools, not primary navigation. Users who know what they want need a list/search, not a physics simulation.
**Instead:** Graph is one view alongside document list, tag index, and category pages. It aids discovery of connections, not routine document access.

### Anti-Pattern 5: Storing Build Artifacts in Git
**What:** Committing the `dist/` output directory to the repository.
**Why bad:** Build artifacts create noisy diffs, merge conflicts, and inflate the repo. Cloudflare Pages runs the build command on deploy.
**Instead:** Add `dist/` to `.gitignore`. Let Cloudflare Pages build on push.

## Recommended Directory Structure

```
loom/
  # Source content (existing)
  ai-tools-and-services/
    langchain.md
    ...
  cloud-ai-platforms/
    ...
  companies/
    ...
  TEMPLATE.md

  # Site source (new)
  site/
    build.ts               # Build pipeline entry point
    lib/
      parser.ts            # Frontmatter + markdown parsing
      indexer.ts            # Tag index builder
      graph.ts             # Relationship mapper -> graph-data.json
      renderer.ts          # Markdown -> HTML rendering
      templates.ts         # HTML page templates
    assets/
      styles/
        main.css           # Dark theme + neon accents
      scripts/
        graph.ts           # Client-side graph visualization
        filter.ts          # Tag filtering UI
    templates/
      document.html        # Single document page template
      index.html           # Home page with graph
      tag.html             # Tag listing/filter page

  # Build output (gitignored)
  dist/
    index.html
    graph-data.json
    documents/
      langchain/index.html
      ...
    tags/
      ai/index.html
      ...
    assets/
      main.css
      graph.js
      filter.js

  # Claude Code skills (new)
  .claude/
    commands/
      research.md
      write.md
      organize.md
      tag.md
```

## Scalability Considerations

| Concern | At 15 docs (now) | At 100 docs | At 500+ docs |
|---------|-------------------|-------------|--------------|
| Build time | Instant (<1s) | Fast (<5s) | May need incremental builds |
| Graph readability | Every node visible | Need zoom/pan, maybe clustering | Need hierarchical grouping or search-filtered subgraph |
| graph-data.json size | <5KB | ~20KB | ~100KB+ (still fine for static) |
| Tag index | Simple flat list | Needs hierarchy or grouping | Needs tag categories or faceted navigation |
| Navigation | Graph + list sufficient | Need search/filter | Need full-text search (lunr.js or similar client-side) |

## Build Order (Dependencies Between Components)

This ordering reflects what must exist before the next thing can be built:

```
Phase 1: Content Pipeline Foundation
  parser.ts (no dependencies -- reads files, extracts frontmatter)
  indexer.ts (depends on parser -- builds tag index from parsed data)
  graph.ts (depends on indexer -- computes edges from tag index)

Phase 2: Rendering
  renderer.ts (depends on parser -- converts markdown bodies to HTML)
  templates.ts (no code dependency, but needs design decisions for layout/theme)
  Build orchestrator (depends on all above -- runs pipeline, writes dist/)

Phase 3: Client-Side Interactivity
  graph visualization (depends on graph-data.json existing -- reads and renders)
  tag filter UI (depends on tag index being embedded or available as JSON)

Phase 4: Deployment & Tooling
  Cloudflare Pages config (depends on build pipeline producing dist/)
  Claude Code slash commands (independent -- can be built in parallel)
```

**Key dependency chain:** Parser -> Indexer -> Graph Data -> Graph Visualization. This is the critical path. Everything else can be parallelized around it.

## Sources

- Architecture patterns derived from established static site generator patterns (Hugo, Eleventy, Astro) -- all use build-time data pipelines with static JSON/HTML output
- Graph-as-navigation pattern seen in Obsidian Publish, Quartz (Hugo-based digital garden), Foam (VS Code extension)
- Force-directed graph layout is the standard approach for small knowledge graphs (<200 nodes) per D3.js and vis.js documentation
- Cloudflare Pages deployment model: git push triggers build command, deploys output directory

---

*Architecture analysis: 2026-03-09*
