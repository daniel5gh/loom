# Phase 2: Graph Visualization and Relationship Engine - Research

**Researched:** 2026-03-09
**Domain:** D3.js v7 force-directed graph, Astro client-side scripting, SVG graph rendering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Library:** D3.js v7 — already decided as the graph library (from STATE.md)
- **Rendering:** SVG-based (Canvas deferred to 50+ node threshold)
- **Edge weight threshold:** 2+ shared tags — edges with fewer shared tags are hidden
- **Node labels:** Always visible when zoomed in; hidden when zoomed out far (threshold TBD by planner)
- **Node size:** Sized by tag count (more tags = larger node)
- **Node color:** Colored by tag cluster (most-common shared tag determines color grouping); use neon palette (cyan, magenta, green)
- **Hover behavior:** Hovered node + direct neighbors stay full brightness; all non-adjacent nodes and edges dim to ~15% opacity
- **Related Documents layout:** Simple list — title as link + shared tags listed (e.g., `LangChain ← shared: llm, agents`)
- **Related Documents position:** Sidebar/aside (requires Document.astro to expand from single-column to two-column)
- **Related Documents shared tags:** List actual tag names, not just a count
- **Stack:** Astro + vanilla CSS + no TypeScript + no React/Vue + no Tailwind (project-wide constraint)
- **Graph data:** Generated at build time as static JSON, consumed client-side by D3

### Claude's Discretion

- Graph page URL and nav placement (suggest `/graph/` with nav link added to Base.astro)
- Tag filter UI approach (suggest sidebar tag list or click-to-filter on graph nodes)
- Exact label hide/show zoom threshold
- Tag cluster → color mapping algorithm (e.g., most frequent tag across all docs gets cyan)
- Force simulation parameters (gravity, link distance, charge strength)
- Number of related documents shown: 3–5 sorted by shared tag count descending (per REQ-014 spec)

### Deferred Ideas (OUT OF SCOPE)

- Per-document local graph view (REQ-101) — explicitly deferred to V2
- Tag cloud page with weighted tag frequency — V2 per REQUIREMENTS.md
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-006 | Generate a build-time relationship graph (nodes = documents, edges = shared tags, weight = overlap count) | Astro getCollection() provides doc + tags; compute overlap in Astro frontmatter script; serialize to JSON |
| REQ-007 | Serialize graph data to static JSON consumed by client-side visualization | Write to `/public/graph.json` in a build script or generate in `graph.astro` frontmatter using `fs.writeFileSync`; or embed inline as JSON in the page |
| REQ-014 | Show "related documents" section on each page derived from tag overlap | Compute at build time in `[slug].astro` frontmatter; sort by shared tag count descending; show top 3–5 |
| REQ-020 | Interactive force-directed graph showing documents as nodes, shared tags as edges | D3.js v7 forceSimulation + forceLink + forceManyBody + forceCenter in client `<script>` |
| REQ-021 | Clicking a node navigates to that document's page | `node.on("click", d => window.location.href = d.url)` |
| REQ-022 | Hovering a node highlights it and its direct connections | Build adjacency set on mouseover; apply opacity to non-neighbors via D3 selections |
| REQ-023 | Graph supports zoom and pan | `d3.zoom().scaleExtent([0.3, 4]).on("zoom", ...)` applied to SVG, transforming inner `<g>` |
| REQ-024 | Edge rendering controlled by weight threshold (2+ shared tags) | Filter links array at data-generation time before serializing; or filter in D3 on client |
| REQ-025 | Graph styled with neon/dark aesthetic consistent with site theme | CSS custom properties from global.css applied to SVG elements; SVG feGaussianBlur glow filter on nodes/edges |
| REQ-026 | Tag-based filtering: select a tag to highlight/isolate nodes that share it | Click tag in sidebar list → D3 selection filter → dim/highlight nodes; toggle state with active class |
</phase_requirements>

---

## Summary

Phase 2 adds two deliverables to the existing Astro site: (1) a `/graph/` page with an interactive D3.js v7 force-directed graph of all documents, and (2) a "Related Documents" sidebar on each document page. Both are data-driven by a build-time relationship graph — a JSON structure where each node is a document and each edge represents shared tags above a weight threshold of 2.

D3.js v7 is an ESM-only library that must run exclusively in the browser. Astro's standard `<script>` tag (processed, type=module) is the correct integration point. Data flows from Astro's build-time `getCollection()` to a JSON blob embedded in the page (via a `<script type="application/json">` element or a `data-` attribute), then read by the D3 client script. The `graph.astro` page generates the JSON and initializes the simulation; `[slug].astro` computes related documents in its frontmatter.

The project has ~15 documents across three collections (aiTools, cloudPlatforms, companies). At this scale, SVG is entirely appropriate — no Canvas needed. The force simulation will run until settled (`alpha < alphaMin`) and the final node positions will render via tick-event updates.

**Primary recommendation:** Generate graph data in Astro frontmatter at build time, embed as JSON in a hidden element, and load D3 v7 via ESM CDN import inside an `is:inline` `<script type="module">` on the graph page.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| D3.js | ^7.9.x | Force simulation, SVG rendering, zoom/pan, drag | Locked decision; most capable graph library for SVG; ESM-native in v7 |
| Astro Content Collections | (astro ^5.18) | Access doc data at build time via `getCollection()` | Already in use; provides typed access to all docs and their tags |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| D3 CDN (jsDelivr ESM) | `d3@7` | Browser-side D3 import without bundler | Use for the inline client script on `graph.astro` — no npm install needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CDN ESM import | `npm install d3` | npm install gives Vite bundling + tree-shaking; CDN is simpler for a single page with no framework. CDN is correct here given Astro's "plain `<script>`" model for this project |
| SVG rendering | Canvas | Canvas needed at 50+ nodes per STATE.md decision; current corpus is ~15 docs |
| Build-time JSON file in `/public/` | Inline JSON in `<script type="application/json">` | Both work. Inline avoids an extra HTTP request; a separate file is more inspectable. Either is valid — planner chooses |

**Installation:**

```bash
# No npm install needed — D3 loaded via CDN ESM in the browser script
# graph.astro client script uses:
# import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── pages/
│   ├── graph.astro          # New: /graph/ page — builds graph JSON, renders D3
│   ├── ai-tools-and-services/[slug].astro   # Existing: add related docs sidebar
│   ├── cloud-ai-platforms/[slug].astro      # Existing: add related docs sidebar
│   └── companies/[slug].astro               # Existing: add related docs sidebar
├── layouts/
│   ├── Base.astro           # Existing: add "Graph" nav link
│   └── Document.astro       # Existing: expand to two-column layout for sidebar
└── components/
    └── RelatedDocs.astro    # New: sidebar component — list of related docs with shared tags
public/
└── styles/
    └── global.css           # Existing: add graph page CSS, two-column doc layout CSS
```

### Pattern 1: Build-Time Graph Data Generation

**What:** In `graph.astro` frontmatter, collect all documents from all three collections, compute tag overlap between every pair, filter to edges with weight >= 2, assign cluster colors, and serialize to a JSON object.

**When to use:** Any time graph data is needed client-side; Astro frontmatter runs at build time so the computation is free.

**Example:**

```javascript
// Source: Astro Content Collections API (astro:content)
---
import { getCollection } from 'astro:content';

const aiTools = await getCollection('aiTools');
const cloudPlatforms = await getCollection('cloudPlatforms');
const companies = await getCollection('companies');

const allDocs = [
  ...aiTools.map(d => ({ ...d, category: 'ai-tools-and-services' })),
  ...cloudPlatforms.map(d => ({ ...d, category: 'cloud-ai-platforms' })),
  ...companies.map(d => ({ ...d, category: 'companies' })),
];

// Build nodes
const nodes = allDocs.map(doc => ({
  id: doc.id,
  title: doc.data.title,
  tags: doc.data.tags,
  url: `/${doc.category}/${doc.id}/`,
  tagCount: doc.data.tags.length,
}));

// Build edges (shared tag count >= 2)
const edges = [];
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const shared = nodes[i].tags.filter(t => nodes[j].tags.includes(t));
    if (shared.length >= 2) {
      edges.push({ source: nodes[i].id, target: nodes[j].id, weight: shared.length, sharedTags: shared });
    }
  }
}

// Assign cluster colors: find top-3 most frequent tags across all docs
const tagFreq = {};
for (const node of nodes) {
  for (const tag of node.tags) {
    tagFreq[tag] = (tagFreq[tag] || 0) + 1;
  }
}
const topTags = Object.entries(tagFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([tag]) => tag);

const clusterColors = {
  [topTags[0]]: 'var(--neon-cyan)',
  [topTags[1]]: 'var(--neon-magenta)',
  [topTags[2]]: 'var(--neon-green)',
};

// Add color to each node based on highest-frequency shared tag
for (const node of nodes) {
  node.color = '#8888AA'; // fallback: secondary text color
  for (const tag of topTags) {
    if (node.tags.includes(tag)) {
      node.color = clusterColors[tag];
      node.cluster = tag;
      break;
    }
  }
}

const graphData = JSON.stringify({ nodes, edges });
---
```

### Pattern 2: Passing Build Data to Client Script

**What:** Embed JSON in a hidden DOM element; read it in the client `<script type="module">`.

**When to use:** Any time Astro frontmatter data must reach client-side D3 code. This avoids the `define:vars` + `import` incompatibility (known Astro issue: `define:vars` implies `is:inline`, which breaks ESM imports).

**Example:**

```astro
<!-- graph.astro template section -->
<script type="application/json" id="graph-data">{graphData}</script>

<script is:inline type="module">
  import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

  const graphData = JSON.parse(document.getElementById('graph-data').textContent);
  const { nodes, edges } = graphData;

  // ... D3 force simulation setup ...
</script>
```

**Why not `define:vars`:** Using `define:vars` on a `<script>` tag implies `is:inline`, which then requires `type="module"` to be added manually, AND Astro has a known bug (#12343) where `define:vars` + `import` statements cause a SyntaxError. The `<script type="application/json">` data island pattern is reliable and idiomatic.

### Pattern 3: D3 Force Simulation Initialization

**What:** Set up the force simulation after DOM is ready, apply tick handler to update SVG element positions.

**When to use:** On DOMContentLoaded or at the end of the module script.

**Example:**

```javascript
// Source: d3js.org/d3-force/simulation (official docs)
const width = container.clientWidth;
const height = container.clientHeight;

const svg = d3.select('#graph-svg')
  .attr('width', width)
  .attr('height', height);

// Inner group — zoom transforms apply here
const g = svg.append('g');

// Zoom + pan
const zoom = d3.zoom()
  .scaleExtent([0.3, 4])
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
    // Label visibility by zoom level
    const k = event.transform.k;
    g.selectAll('.node-label')
      .style('display', k < 0.6 ? 'none' : 'block');
  });
svg.call(zoom);

// Force simulation
const simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(-200))
  .force('link', d3.forceLink(edges).id(d => d.id).distance(80))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collide', d3.forceCollide(d => Math.sqrt(d.tagCount) * 8 + 10));

// Draw edges
const link = g.append('g')
  .selectAll('line')
  .data(edges)
  .join('line')
  .attr('stroke', 'var(--bg-elevated)')
  .attr('stroke-width', d => Math.sqrt(d.weight));

// Draw node groups (circle + label)
const node = g.append('g')
  .selectAll('g')
  .data(nodes)
  .join('g')
  .call(d3.drag()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    })
  );

node.append('circle')
  .attr('r', d => Math.sqrt(d.tagCount) * 5 + 6)
  .attr('fill', d => d.color)
  .style('filter', 'url(#glow)');

node.append('text')
  .text(d => d.title)
  .attr('class', 'node-label')
  .attr('x', 0)
  .attr('y', d => Math.sqrt(d.tagCount) * 5 + 14)
  .attr('text-anchor', 'middle')
  .attr('fill', 'var(--text-primary)')
  .attr('font-size', '0.65rem');

// Tick handler
simulation.on('tick', () => {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);
  node.attr('transform', d => `translate(${d.x},${d.y})`);
});
```

### Pattern 4: Hover Highlight / Neighbor Dimming

**What:** Build a neighbor adjacency set on each mouseover; dim all non-adjacent nodes and edges.

**Example:**

```javascript
// Source: community pattern, verified against D3 selection API
// Build adjacency lookup
const linkedByIndex = {};
edges.forEach(d => {
  linkedByIndex[`${d.source.id},${d.target.id}`] = true;
  linkedByIndex[`${d.target.id},${d.source.id}`] = true;
});

function isNeighbor(a, b) {
  return a.id === b.id || linkedByIndex[`${a.id},${b.id}`];
}

node
  .on('mouseover', (event, d) => {
    node.style('opacity', n => isNeighbor(d, n) ? 1 : 0.15);
    link.style('opacity', l =>
      l.source.id === d.id || l.target.id === d.id ? 1 : 0.05);
  })
  .on('mouseout', () => {
    node.style('opacity', 1);
    link.style('opacity', 1);
  })
  .on('click', (event, d) => {
    window.location.href = d.url;
  });
```

### Pattern 5: SVG Glow Filter for Neon Aesthetic

**What:** Append `<defs>` with a Gaussian blur filter to the SVG; apply via `style("filter", "url(#glow)")`.

**Example:**

```javascript
// Source: visualcinnamon.com/2016/06/glow-filter-d3-visualization/ — verified pattern
const defs = svg.append('defs');
const filter = defs.append('filter').attr('id', 'glow');
filter.append('feGaussianBlur')
  .attr('stdDeviation', '2.5')
  .attr('result', 'coloredBlur');
const feMerge = filter.append('feMerge');
feMerge.append('feMergeNode').attr('in', 'coloredBlur');
feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
```

**Note:** The glow filter works on circles and paths but NOT on lines. Apply to node circles. For edges, use CSS `box-shadow` alternative or thicker strokes with translucent color.

### Pattern 6: Related Documents Computation (Build Time)

**What:** For each document, compute overlap with all other documents; sort by shared tag count; take top N.

**Example:**

```javascript
// In [slug].astro frontmatter — runs at build time, no client cost
const allDocs = [...aiTools, ...cloudPlatforms, ...companies];

const relatedDocs = allDocs
  .filter(other => other.id !== doc.id)
  .map(other => {
    const sharedTags = doc.data.tags.filter(t => other.data.tags.includes(t));
    return { doc: other, sharedTags };
  })
  .filter(r => r.sharedTags.length > 0)
  .sort((a, b) => b.sharedTags.length - a.sharedTags.length)
  .slice(0, 5);
```

### Pattern 7: Tag Filter UI

**What:** Sidebar list of all tags (with doc counts); clicking a tag dims nodes that don't carry that tag.

**Recommended approach:** Static tag list rendered in `graph.astro` template from the graph data; client-side click handler applies D3 opacity updates.

**Example:**

```javascript
// Tag filter sidebar interaction
let activeTag = null;

d3.selectAll('.tag-filter-btn').on('click', function() {
  const tag = this.dataset.tag;
  if (activeTag === tag) {
    // Toggle off — restore all
    activeTag = null;
    node.style('opacity', 1);
    link.style('opacity', 1);
    d3.selectAll('.tag-filter-btn').classed('active', false);
  } else {
    activeTag = tag;
    node.style('opacity', n => n.tags.includes(tag) ? 1 : 0.1);
    link.style('opacity', l =>
      l.source.tags.includes(tag) && l.target.tags.includes(tag) ? 1 : 0.05);
    d3.selectAll('.tag-filter-btn').classed('active', false);
    d3.select(this).classed('active', true);
  }
});
```

### Anti-Patterns to Avoid

- **Running D3 in Astro frontmatter:** D3 requires `document`; frontmatter runs server-side where `document` is undefined. Always place D3 code in `<script>` tags.
- **Using `define:vars` + ESM imports:** Known Astro bug (#12343) causes SyntaxError. Use the `<script type="application/json">` data island pattern instead.
- **Attaching zoom to the inner `<g>` instead of the outer `<svg>`:** Zoom must be applied to the outermost SVG element; the transform is then applied to the inner group. Reversing this breaks panning.
- **Forgetting `.id(d => d.id)` on forceLink:** Without this, D3 forceLink cannot resolve string node IDs in the links array and will fail silently or error.
- **Node radius fixed rather than data-driven:** Size by tag count is a locked decision — use `Math.sqrt(d.tagCount) * factor + base` to avoid extreme size differences.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force physics simulation | Custom spring/repulsion math | `d3.forceSimulation` + `d3.forceManyBody` + `d3.forceLink` | Velocity Verlet integration with alpha cooling; handles cycles, disconnected nodes, convergence |
| Zoom + pan behavior | Manual wheel/pointer event math | `d3.zoom()` | Handles pinch-zoom, double-click, wheel, keyboard; correctly composes with drag |
| Node drag behavior | `mousedown`/`mousemove` listeners | `d3.drag()` | Handles alpha reheating, pointer capture, touch events |
| Graph layout algorithm | BFS/DFS layouting | D3 force simulation tick | Force simulation IS the layout algorithm |
| Tag frequency counting | Custom loop | Plain JS `reduce` in frontmatter | Already simple enough; no library needed |
| Color assignment | Manual hex palette | CSS custom properties + JS assignment | Reuses `--neon-cyan`, `--neon-magenta`, `--neon-green` already defined in global.css |

**Key insight:** D3 provides force simulation, zoom, drag, and selection all in one ESM package. The only custom logic in this phase is the graph data generation algorithm (tag overlap calculation) and the cluster color assignment — both are straightforward O(n²) passes over ~15 documents.

---

## Common Pitfalls

### Pitfall 1: D3 Runs Server-Side in Astro

**What goes wrong:** Placing D3 code in Astro frontmatter (between `---` fences) causes `ReferenceError: document is not defined` at build time.

**Why it happens:** Astro frontmatter is server-side JavaScript. D3 requires DOM APIs.

**How to avoid:** All D3 code goes in `<script>` tags in the template section. Data generated in frontmatter is passed via a `<script type="application/json" id="...">` element.

**Warning signs:** Build error containing "document is not defined" or "window is not defined".

### Pitfall 2: `define:vars` + ESM Import SyntaxError

**What goes wrong:** Using `<script define:vars={{ graphData }}>` then writing `import * as d3 from "..."` inside that script causes a SyntaxError at runtime.

**Why it happens:** `define:vars` forces `is:inline` mode, which prepends variable declarations before the script body — but ES import statements must appear before any other statements. This is a known Astro bug (#12343).

**How to avoid:** Use the `<script type="application/json" id="graph-data">` pattern to pass data; use a separate `<script is:inline type="module">` with the CDN import.

**Warning signs:** Console error at runtime: "SyntaxError: Cannot use import statement before a variable declaration".

### Pitfall 3: forceLink ID Resolution Failure

**What goes wrong:** Graph renders with no edges, or `NaN` positions for all nodes.

**Why it happens:** `d3.forceLink(edges)` by default looks for numeric array indices as source/target, but if edges use string IDs (e.g., `{source: "langchain", target: "litellm"}`), D3 cannot resolve them without `.id(d => d.id)`.

**How to avoid:** Always call `.force("link", d3.forceLink(edges).id(d => d.id))`.

**Warning signs:** NaN in SVG transform attributes; all nodes cluster at the center.

### Pitfall 4: SVG Height Not Set / Graph Invisible

**What goes wrong:** The `<svg>` renders at 0px height, making the graph invisible.

**Why it happens:** SVG without explicit `height` attribute or CSS height takes zero height by default.

**How to avoid:** Set height explicitly via D3 (`svg.attr("height", containerHeight)`) or CSS (`height: 80vh`). Use `container.clientWidth` / `clientHeight` after DOM is ready.

**Warning signs:** Empty space where graph should appear; SVG element visible in DevTools but has 0px height.

### Pitfall 5: Glow Filter on Lines Has No Effect

**What goes wrong:** Applied SVG glow filter to edge `<line>` elements; no visual glow appears.

**Why it happens:** Known D3/SVG limitation — `feGaussianBlur` glow filter does not render on zero-area elements like lines, regardless of stroke-width.

**How to avoid:** Apply glow only to node circles. For edge glow effect, use multiple overlapping lines with different opacity/color, or increase edge stroke-width with translucent neon color.

### Pitfall 6: Zoom Applied to Inner Group Instead of SVG

**What goes wrong:** Zoom behavior is attached to the inner `<g>` element; panning breaks or zoom accumulates incorrectly.

**Why it happens:** D3 zoom stores transform state on the element it's called on. The transform must then be applied to a child element. If both are the same element, the transform cascades incorrectly.

**How to avoid:** `svg.call(zoom)` — always call zoom on the outer SVG. Apply `event.transform` to the inner `g` in the handler.

### Pitfall 7: Two-Column Layout Breaking on Narrow Docs

**What goes wrong:** Document.astro two-column layout (main content + related sidebar) wraps awkwardly or sidebar overflows on mid-width viewports.

**Why it happens:** Project is desktop-first but "desktop" was single-column — expanding to two-column changes the layout model significantly.

**How to avoid:** Use CSS Grid with `grid-template-columns: 1fr 280px` on the doc layout wrapper. The sidebar has a fixed width; main content takes remaining space. Use `@media (max-width: 900px)` to hide sidebar on narrower screens (acceptable per desktop-first constraint).

---

## Code Examples

Verified patterns from official sources:

### Complete D3 Zoom + Pan Setup

```javascript
// Source: d3js.org/d3-zoom (official docs)
const zoom = d3.zoom()
  .scaleExtent([0.3, 4])
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
    // Hide labels when zoomed out past 0.6
    g.selectAll('.node-label')
      .style('display', event.transform.k < 0.6 ? 'none' : null);
  });

svg.call(zoom);
// Disable double-click zoom (navigating to node on click is separate)
svg.on('dblclick.zoom', null);
```

### Node Size by Tag Count

```javascript
// r = base_radius + scaled_by_tag_count
// tagCount range ~1–6 for current corpus
const radius = d => Math.sqrt(d.tagCount) * 5 + 6;
// tagCount=1: r≈11  tagCount=4: r≈16  tagCount=8: r≈20
```

### Related Documents Sidebar Component

```astro
---
// RelatedDocs.astro
interface Props {
  relatedDocs: Array<{
    doc: { data: { title: string }; id: string };
    sharedTags: string[];
    category: string;
  }>;
}
const { relatedDocs } = Astro.props;
---
<aside class="related-docs">
  <h2 class="related-heading">Related</h2>
  <ul class="related-list">
    {relatedDocs.map(({ doc, sharedTags, category }) => (
      <li class="related-item">
        <a href={`/${category}/${doc.id}/`} class="related-link">
          {doc.data.title}
        </a>
        <span class="related-shared-tags">
          shared: {sharedTags.join(', ')}
        </span>
      </li>
    ))}
  </ul>
</aside>
```

### Document.astro Two-Column Layout

```astro
<!-- Document.astro — expanded from single to two-column -->
<Base title={title}>
  <div class="doc-layout">
    <article class="doc-page">
      <header class="doc-header">...</header>
      <div class="doc-content"><slot /></div>
    </article>
    <RelatedDocs relatedDocs={relatedDocs} />
  </div>
</Base>
```

```css
/* global.css addition */
.doc-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.related-docs {
  background: var(--bg-surface);
  border: 1px solid var(--bg-elevated);
  border-radius: 6px;
  padding: 1rem;
  align-self: start;
  position: sticky;
  top: 2rem;
}

.related-heading {
  font-size: 0.85rem;
  color: var(--neon-green);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.related-list {
  list-style: none;
}

.related-item {
  margin-bottom: 0.75rem;
}

.related-link {
  display: block;
  color: var(--neon-cyan);
  font-size: 0.85rem;
}

.related-shared-tags {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D3 UMD bundle via `<script src>` | ESM import via `import * as d3 from CDN/+esm` | D3 v7 (2021) | Enables `<script type="module">` without bundler |
| D3 v4/v5 `d3.event` global | `event` parameter in callbacks | D3 v6 (2020) | Must use function parameter, not `d3.event` |
| Manual force tick loop | `simulation.on("tick", fn)` event handler | Long-standing v4+ pattern | Reactive; handles variable frame rates |
| Astro `define:vars` for data passing | `<script type="application/json">` data island | Workaround for Astro bug #12343 | Required for combining ESM imports with build-time data |

**Deprecated/outdated:**
- `d3.event`: removed in D3 v6 — use the event parameter passed directly to callback functions
- `d3.select(this)` inside arrow functions: `this` is undefined in arrow functions; use the event's `currentTarget` or switch to `function()` syntax

---

## Open Questions

1. **Graph page data embedding method: inline JSON vs. `/public/graph.json` file**
   - What we know: Inline `<script type="application/json">` avoids an HTTP request; a separate file is inspectable and reusable
   - What's unclear: Whether any other page (e.g., tag pages) will ever need the full graph data
   - Recommendation: Use inline JSON for Phase 2; extract to file if reuse is needed in Phase 3

2. **Three [slug].astro pages need identical related-docs logic**
   - What we know: `ai-tools-and-services/[slug].astro`, `cloud-ai-platforms/[slug].astro`, `companies/[slug].astro` all need the same related-docs computation
   - What's unclear: Whether a shared utility function in `src/lib/` or a shared layout handles this
   - Recommendation: Extract a `getRelatedDocs(doc, allDocs)` utility to `src/lib/graph.js` — call it from each slug page's frontmatter

3. **Tag filter UI placement on graph page**
   - What we know: CONTEXT.md marks this as Claude's discretion; a sidebar tag list is suggested
   - What's unclear: Whether the graph SVG should take full width or share layout with the sidebar
   - Recommendation: Two-column layout on graph page (tag sidebar left ~200px, graph SVG takes remaining width); tag sidebar uses same neon tag-pill styling

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

No test framework is currently installed in this project. The project uses plain Astro + vanilla JS with no test runner configured. Given the static site nature and client-side D3, meaningful automated testing would require a browser environment (Playwright or similar).

| Property | Value |
|----------|-------|
| Framework | None installed — see Wave 0 |
| Config file | None — needs setup |
| Quick run command | `npm run build` (build-time validation) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-006 | Graph JSON contains nodes and edges arrays with correct structure | manual-only (no test runner) | `npm run build && node -e "const g=require('./public/graph.json'); console.assert(g.nodes.length>0)"` if file-based | ❌ Wave 0 |
| REQ-007 | Serialized graph data accessible client-side | smoke (build check) | `npm run build` — confirms page builds without error | N/A |
| REQ-014 | Related docs appear on document pages | manual-only | Visual check of built HTML | ❌ Wave 0 |
| REQ-020 | Force-directed graph renders nodes and edges | manual-only | Visual check in browser | N/A |
| REQ-021 | Node click navigates to document page | manual-only | Browser interaction test | N/A |
| REQ-022 | Hover dims non-adjacent nodes | manual-only | Browser interaction test | N/A |
| REQ-023 | Zoom and pan work | manual-only | Browser interaction test | N/A |
| REQ-024 | Edges filtered by weight >= 2 | unit (if graph.js extracted) | Node.js test of `getGraphData()` output | ❌ Wave 0 |
| REQ-025 | Neon styling applied | manual-only | Visual check in browser | N/A |
| REQ-026 | Tag filter highlights correct nodes | manual-only | Browser interaction test | N/A |

**Note on testing strategy for this phase:** The primary correctness check is `npm run build` — if the Astro build succeeds, the build-time data generation logic is working. The graph logic (edge filtering, related docs computation) can be unit-tested if extracted to `src/lib/graph.js` and run via Node.js. D3 rendering and interactions are browser-only and must be verified manually.

### Sampling Rate

- **Per task commit:** `npm run build` — confirms no build breakage
- **Per wave merge:** `npm run build` + manual browser review of `/graph/` page and one document page
- **Phase gate:** Build green + visual review of all interactive behaviors before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/graph.js` — extract graph data logic for testability (covers REQ-006, REQ-024)
- [ ] No test runner installed — manual browser testing is the primary validation method for D3 interactions
- [ ] Framework install: `npm install --save-dev vitest` would enable unit testing of `graph.js` logic (optional — planner decides if worth the setup cost)

*(If vitest is not set up, `npm run build` + manual browser QA is sufficient for this phase's scope.)*

---

## Sources

### Primary (HIGH confidence)

- `https://d3js.org/d3-force/simulation` — forceSimulation API, all force types, alpha control, tick events
- `https://d3js.org/d3-zoom` — zoom/pan API, scaleExtent, transform application, event.transform pattern
- `https://docs.astro.build/en/guides/client-side-scripts/` — Astro script handling, data attribute pattern, is:inline behavior
- Astro Content Collections (`astro:content` docs) — `getCollection()`, `render()`, collection schema patterns already in use in this project

### Secondary (MEDIUM confidence)

- `https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization/` — SVG feGaussianBlur glow filter implementation (older article but SVG filter spec is stable)
- `https://observablehq.com/@shreshthmohan/force-directed-graph` — node+label grouping pattern with `<g>` elements
- `https://github.com/withastro/astro/issues/3987` — confirmed D3 must run client-side in Astro; Astro team guidance
- `https://github.com/withastro/astro/issues/12343` — confirmed `define:vars` + ESM import incompatibility

### Tertiary (LOW confidence)

- Community pattern for neighbor adjacency dimming on hover — well-established D3 idiom, cross-referenced from multiple sources but no single official doc
- Glow filter known limitation on lines — reported in community sources; not in official SVG spec docs

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — D3 v7 locked decision; CDN ESM import pattern verified from official d3js.org docs
- Architecture: HIGH — Astro + D3 client script pattern verified from Astro docs and official issue resolution; data passing pattern resolves known bug
- Pitfalls: HIGH — Most pitfalls verified from official sources or known Astro issues; glow-on-lines limitation is MEDIUM (community sources)

**Research date:** 2026-03-09
**Valid until:** 2026-09-09 (D3 v7 API is stable; Astro 5.x is current release line)
