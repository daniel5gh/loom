# Stack Research

**Domain:** Personal knowledge base — embedding pipeline, canvas map, terminal UX (v1.1 additions)
**Researched:** 2026-03-10
**Confidence:** HIGH (all new library versions verified against npm registry via web search)

---

## Existing Stack (v1.0 — Validated, Do Not Re-Research)

Already in production. Listed here as integration context for new additions.

| Technology | Version | Status |
|------------|---------|--------|
| Astro | ^5.18.0 | In use |
| D3.js v7 | CDN ESM | In use for force graph (page being replaced) |
| Vanilla CSS | — | Dark/neon theme established |
| Shiki | via Astro | Syntax highlighting at build time |
| Cloudflare Pages | — | Auto-deploy on push |
| @fontsource/fira-code | ^5.0.0 | Installed |
| Wrangler | ^3.x | Dev/deploy CLI |

---

## New Stack Additions for v1.1

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `regl-scatterplot` | ^1.15.0 | WebGL dot map for the similarity map | Purpose-built for exactly this use case: 2D scatter plot with pan/zoom, hover, click, opacity encoding, and category color encoding. Scales to 20M points (hardware permitting). Actively maintained — v1.15.0 released January 2026. Uses instanced WebGL rendering, which is the correct approach for 1000+ nodes. Provides built-in hit testing, lasso selection, and point opacity — all features needed for the timeline/filter lenses. Ships as ESM, works with Vite/Astro out of the box. |
| `fuse.js` | ^7.1.0 | Fuzzy client-side search for the `/` terminal overlay | Zero dependencies, 7.1KB gzipped. Builds index from plain JSON at runtime — no build step. Searches title, tags, summary with configurable key weights and threshold. The Fuse.js + Astro static site pattern is extensively documented with community guides. v7.1.0 published ~10 months ago. |
| `ollama` (npm) | ^0.6.3 | Node.js client for local Ollama REST API | Official SDK from the Ollama team. Used in the embed pipeline script to call `nomic-embed-text`. API: `await ollama.embed({ model: 'nomic-embed-text', input: text })`. Runs against local Ollama process — no external network. v0.6.3 last published 4 months ago, actively maintained. |
| `umap-js` | ^1.4.0 | UMAP dimensionality reduction: 768d embeddings → 2D coordinates | Google PAIR's official JavaScript port of UMAP. The only mature, maintained JS implementation. Synchronous `umap.fit(data)` returns 2D coordinate array. Run in the offline embed script, not in the browser. Last published 2 years ago — the API is stable and the UMAP algorithm is not changing. Suitable for hundreds to low-thousands of documents. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `gray-matter` | ^4.x | Frontmatter parsing in the embed script | The embed pipeline script (`scripts/embed.mjs`) reads markdown files outside Astro's build context. gray-matter parses YAML frontmatter to extract `title`, `date`, `tags`, and body text for embedding. Already a common utility in the Node.js ecosystem — version 4 has been stable for years. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `scripts/embed.mjs` | Offline pipeline: read docs → Ollama embed → UMAP → write `public/embeddings.json` | New Node.js script, not an npm package. Run via `node scripts/embed.mjs` from `/loom:deploy` skill. Must not run during Cloudflare build (Ollama not available there). |
| `.claude/commands/loom-add.md` | `/loom:add <url>` skill | Uses Claude's `WebFetch` + `Write` tools. No new npm packages. |
| `.claude/commands/loom-deploy.md` | `/loom:deploy` skill | Uses Claude's `Bash` tool to run embed script then `git push`. |
| `.claude/commands/loom-retag.md` | `/loom:retag` skill | Uses Claude's `Read`/`Write` tools across all `.md` files. |
| `.claude/commands/loom-gaps.md` | `/loom:gaps` skill | Uses Claude's `Read` + analysis prompt. |

---

## Installation

```bash
# Embedding pipeline (Node.js script only — NOT bundled for browser)
npm install ollama umap-js gray-matter

# Canvas map rendering + search (client-side, bundled by Astro/Vite)
npm install regl-scatterplot fuse.js
```

No new dev dependencies needed for these additions.

---

## Integration Patterns with Existing Astro 5 Stack

### Pattern 1: Embedding JSON as data source

The embed script writes `public/embeddings.json`. Astro copies `public/` to `dist/` verbatim. The map page fetches it client-side:

```javascript
// In <script> block inside map.astro
const response = await fetch('/embeddings.json');
const docs = await response.json();
```

Do NOT import the JSON into the Astro frontmatter bundle — it would bloat the initial HTML. Fetch it asynchronously on the client after page load.

**Output schema for `public/embeddings.json`:**
```json
[
  {
    "id": "ai-tools-and-services/langchain",
    "title": "LangChain",
    "date": "2024-01-15",
    "tags": ["llm", "orchestration"],
    "category": "ai-tools-and-services",
    "summary": "First paragraph of body text, truncated to ~200 chars",
    "x": 0.423,
    "y": -0.187
  }
]
```

Note: 768d vectors are NOT stored in this file. Only 2D coords. At 1000 docs, the full JSON is ~200KB — acceptable.

### Pattern 2: regl-scatterplot in an Astro page

```astro
<!-- src/pages/map.astro -->
<canvas id="scatter" style="width:100%;height:100vh;"></canvas>
<script>
  import createScatterplot from 'regl-scatterplot';

  const canvas = document.getElementById('scatter');
  const scatterplot = createScatterplot({ canvas, pointSize: 6 });

  const docs = await fetch('/embeddings.json').then(r => r.json());

  // Build category color index (auto-assign from set of categories)
  const categories = [...new Set(docs.map(d => d.category))];
  const points = docs.map(d => [d.x, d.y, categories.indexOf(d.category)]);

  await scatterplot.draw(points);

  // Hover tooltip, click for side panel, opacity for timeline/filters
  // handled via scatterplot.subscribe('pointover', ...) and 'select' events
</script>
```

Astro will bundle this `<script>` via Vite. `regl-scatterplot` is an ESM package and Vite handles it natively.

### Pattern 3: Fuse.js search overlay

```astro
<!-- In Base.astro layout or a global component -->
<div id="search-overlay" hidden>
  <div class="terminal-prompt">loom&gt; <input id="search-input" /></div>
  <ul id="search-results"></ul>
</div>
<script>
  import Fuse from 'fuse.js';
  let fuse = null;

  document.addEventListener('keydown', async (e) => {
    if (e.key === '/') {
      e.preventDefault();
      if (!fuse) {
        const docs = await fetch('/embeddings.json').then(r => r.json());
        fuse = new Fuse(docs, { keys: ['title', 'tags', 'summary'], threshold: 0.4 });
      }
      document.getElementById('search-overlay').removeAttribute('hidden');
      document.getElementById('search-input').focus();
    }
  });
</script>
```

The search index is built lazily on first `/` press, reusing the same JSON file the map already fetched.

### Pattern 4: Vim keyboard navigation (no npm package)

```javascript
// Global keydown handler in Base.astro <script>
const items = Array.from(document.querySelectorAll('[data-nav-item]'));
let cursor = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === 'j') { cursor = Math.min(cursor + 1, items.length - 1); items[cursor].focus(); }
  if (e.key === 'k') { cursor = Math.max(cursor - 1, 0); items[cursor].focus(); }
  if (e.key === 'Enter') { items[cursor].click(); }
  if (e.key === 'Escape') { history.back(); }
});
```

No library — ~20 lines of vanilla JS.

### Pattern 5: Cyberpunk CSS effects (no new dependencies)

All effects are pure CSS applied in the existing `global.css`:

```css
/* Scanlines overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}

/* Typewriter on headings */
.typewriter {
  overflow: hidden;
  border-right: 2px solid var(--neon-green);
  white-space: nowrap;
  animation: typing 1.5s steps(30) forwards, blink 0.5s step-end infinite alternate;
}
```

No JavaScript required for static text typewriter effects.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `regl-scatterplot` | PixiJS v8 (^8.16.0) | When you need a general-purpose WebGL scene graph (sprites, textures, complex transforms). For a dot map, PixiJS forces you to build hit testing and opacity encoding from scratch — regl-scatterplot provides these built-in. |
| `regl-scatterplot` | Plain Canvas 2D with `arc()` loop | Acceptable at <500 documents. Will degrade noticeably at 1000+ and require a rewrite. Given US01.md explicitly calls for 1000+ node support, start with WebGL. |
| `umap-js` | Python `umap-learn` via `child_process` subprocess | Prefer Python umap-learn if you want spectral initialization (better cluster separation), parametric UMAP (stable positions when adding new docs), or >5K documents. For this project, umap-js in Node.js keeps the pipeline in a single language with no Python dependency requirement. |
| `fuse.js` | FlexSearch | FlexSearch is 3-10x faster at very large indices (10K+ docs). API is more complex. For <1K docs, Fuse.js is imperceptibly slower and far simpler. Revisit if collection grows past 5K. |
| `fuse.js` | Lunr.js | Lunr.js requires a pre-built index exported at Astro build time. Fuse.js builds from plain JSON at runtime, fitting the single-JSON-file architecture of this project. Lunr.js is also less actively maintained. |
| Vanilla JS keyboard nav | Hotkeys.js / Mousetrap | Only if keyboard shortcut complexity grows to 20+ shortcuts with modifier key combinations. Current requirements (j/k/Enter/Esc//) are ~15 lines of vanilla code. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| D3-force for the new map | D3-force positions are arbitrary (physics simulation) — the entire value of the embedding map is semantically meaningful positions. D3-force would discard the UMAP layout. Also SVG won't scale past ~500 nodes. | `regl-scatterplot` with pre-computed UMAP coordinates |
| Three.js | 3D library, ~600KB bundle. Building a flat 2D dot map in Three.js is using a jackhammer as a hammer. | `regl-scatterplot` (~80KB, purpose-built 2D) |
| `tsne-js` (t-SNE in JS) | Last commit 2018, unmaintained. t-SNE is also slower than UMAP and less stable. | `umap-js` |
| `@astrojs/react` or any framework adapter | Adding React/Vue/Svelte to render a search overlay and keyboard handler is importing 40KB+ of framework for <100 lines of DOM manipulation. Astro `<script>` islands handle this cleanly. | Vanilla JS in Astro `<script>` blocks |
| Server-side search (Astro Actions + Cloudflare Workers) | Violates the static-only constraint. Adds deployment complexity with no benefit for a single-user tool where the entire content set fits in a small JSON file. | Fuse.js client-side |
| Storing 768d vectors in `embeddings.json` | At 1000 docs, storing full embeddings = 1000 × 768 × 8 bytes = ~6MB JSON. Unnecessary — UMAP reduction is done offline, only 2D coords needed at runtime. | Store only `x`, `y`, metadata in the JSON |
| Running embed pipeline during Cloudflare build | Ollama is not available on Cloudflare build workers. The pipeline must run locally before `git push`. | Run `node scripts/embed.mjs` in `/loom:deploy` before pushing |

---

## Stack Patterns by Variant

**If collection grows past 2,000 documents:**
- `embeddings.json` still acceptable (2K × ~200 bytes = ~400KB)
- Consider lazy-loading: fetch only the metadata initially, defer summary fields
- Fuse.js stays fast to ~5K docs; switch to FlexSearch beyond that
- `umap-js` re-runs may take 30+ seconds at 2K docs; consider Python `umap-learn` for faster computation

**If position stability becomes a requirement (currently resolved as "not required" in US01.md):**
- `umap-js` does not support parametric UMAP or `transform()` on existing embeddings
- Switch to Python `umap-learn` with `transform()` which maps new points into an existing projection without moving existing ones
- This is a future concern, not a v1.1 concern

**For incremental embedding (only re-embed new/changed docs):**
- Keep a `embeddings-raw.json` alongside `embeddings.json` (internal format with IDs and modification timestamps)
- On each `/loom:deploy`, compare git diff to identify changed files, only call Ollama for those
- Re-run UMAP on the full set (fast at this scale) to produce updated 2D coords
- This is the `/loom:deploy` script's responsibility, not an npm package concern

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `regl-scatterplot@^1.15.0` | Astro 5 / Vite | Ships as ESM. Vite handles it without special config. Use `import createScatterplot from 'regl-scatterplot'` in a `<script>` block. |
| `fuse.js@^7.1.0` | Astro 5 / Vite | Ships CJS + ESM. Use ESM import path. Works with Astro's default Vite bundler. |
| `ollama@^0.6.3` | Node.js >= 18 | Uses native `fetch()` internally — requires Node 18+. Embed script only, never bundled for browser. |
| `umap-js@^1.4.0` | Node.js >= 14 | Embed script only. Pure computation, no I/O — no compatibility concerns. |
| `gray-matter@^4.x` | Node.js >= 12 | Embed script only. Rock-solid stability, version 4 current for years. |
| All browser packages | Astro 5 `<script>` | Vite bundles these. No framework adapter needed (no `client:*` directive needed for vanilla JS scripts). |

---

## Sources

- [regl-scatterplot on npm](https://www.npmjs.com/package/regl-scatterplot) — v1.15.0, published January 2026 (HIGH confidence)
- [GitHub: flekschas/regl-scatterplot](https://github.com/flekschas/regl-scatterplot) — actively maintained, 20M point scale confirmed
- [fuse.js on npm](https://www.npmjs.com/package/fuse.js) — v7.1.0, published ~10 months ago (HIGH confidence)
- [ollama on npm](https://www.npmjs.com/package/ollama) — v0.6.3, official Ollama JS SDK (HIGH confidence)
- [umap-js on npm](https://www.npmjs.com/package/umap-js) — v1.4.0, Google PAIR (MEDIUM confidence — stable but last published 2 years ago)
- [pixi.js on npm](https://www.npmjs.com/package/pixi.js) — v8.16.0, evaluated and rejected in favor of regl-scatterplot
- WebSearch: Canvas 2D vs WebGL performance benchmarks — Canvas drops to 22 FPS at 50K scatter, WebGL maintains 58 FPS (MEDIUM confidence — benchmark source: svggenie.com)
- WebSearch: Astro 5 client-side script patterns — JSON island, `fetch()` in `<script>` blocks (HIGH confidence — from Astro official docs)
- WebSearch: Cyberpunk CSS scanlines via `repeating-linear-gradient` — confirmed pattern across multiple independent implementations (HIGH confidence)
- Ollama official docs — `nomic-embed-text` embed API, `search_document: ` prefix for improved retrieval quality (HIGH confidence)

---

*Stack research for: Loom v1.1 — embedding pipeline, canvas map, terminal UX*
*Researched: 2026-03-10*
