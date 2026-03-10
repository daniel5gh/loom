# Phase 6: Map Page Skeleton - Research

**Researched:** 2026-03-10
**Domain:** Astro static page + vanilla Canvas 2D + HiDPI scaling + tooltip hit-detection
**Confidence:** HIGH

## Summary

Phase 6 renders the committed `src/data/embeddings.json` artifact (produced in Phase 5) onto a canvas element at `/map`, with one dot per document positioned by its 2D UMAP coordinates. Hovering a dot shows a tooltip with title and tags. No filtering logic yet — this phase is purely about verified data flow and correct rendering.

The key architectural questions deferred from Phase 5 are now answerable given the current corpus size (15 documents):

1. **Canvas vs regl-scatterplot:** Plain Canvas 2D wins at this scale. regl-scatterplot is engineered for millions of points — its WebGL initialization overhead (loading regl, creating a WebGL context, shader compilation) is not justified for 15–~100 points. The project's established pattern in `graph.astro` uses a CDN ESM import with `is:inline type="module"`, and the same pattern works identically for canvas code. Plain canvas keeps zero new npm runtime dependencies in the browser bundle.

2. **SSR / `window` guard:** The Astro project uses `output: 'static'` (confirmed in `astro.config.mjs`). Canvas code lives entirely inside an `is:inline type="module"` `<script>` tag, which is not processed by Astro's Node.js build — it is emitted verbatim into HTML and only executes in the browser. No SSR error risk exists as long as no canvas/window references appear in the `.astro` frontmatter block. This matches the exact pattern already used in `graph.astro`.

3. **embeddings.json import:** The data island pattern is established: serialize the JSON to a string in frontmatter, inject into a `<script type="application/json" id="map-data">` element, read it with `document.getElementById('map-data').textContent` in the inline script.

**Primary recommendation:** Implement `src/pages/map.astro` using the existing `graph.astro` data island pattern — frontmatter loads and serializes `embeddings.json`, passes it via a hidden JSON script element, and a `<script is:inline type="module">` draws dots to a `<canvas>` with HiDPI scaling and a floating tooltip div.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-01 | User can view all documents as dots on a 2D semantic similarity map at `/map` | embeddings.json has verified UMAP x/y coordinates for all 15 documents; data island pattern loads them; canvas arc() draws dots |
| MAP-02 | Hovering a dot shows tooltip with title and tags | mousemove → hit detection via Euclidean distance to each dot center; tooltip is a positioned `<div>` moved with mouse event coordinates |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTML Canvas 2D API | browser built-in | Draw dots, handle hit detection | Zero dependency; sufficient for ≤100 points; matches project's no-framework, no-library constraint |
| Astro frontmatter import | Astro ^5.x | Load embeddings.json at build time | Established pattern from graph.astro; JSON in src/data/ is importable at compile time |

### No New Browser Dependencies
The project stack decision is "no React, no Tailwind, no TypeScript" and regl-scatterplot is NOT needed at this corpus scale. The v1.1 stack entry `regl-scatterplot@^1.15.0` was listed as a candidate but the STATE.md explicitly records the decision as deferred — this phase resolves the deferral in favor of plain canvas.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain Canvas 2D | regl-scatterplot | regl-scatterplot handles 20M points via WebGL; overkill for 15-100 docs; adds CDN weight and WebGL context initialization overhead |
| Plain Canvas 2D | D3.js SVG circles | SVG works fine; canvas is better for Phase 7+ when dot count may grow and opacity animations are needed |
| Floating `<div>` tooltip | Canvas-drawn tooltip | `<div>` tooltip allows HTML content (tags as styled elements); easier to position and style |

**Installation:** No new packages required. All implementation is browser built-ins + existing Astro patterns.

## Architecture Patterns

### Recommended Page Structure
```
src/pages/
└── map.astro          # New page — mirrors graph.astro structure

src/data/
└── embeddings.json    # Read at build time in map.astro frontmatter (already exists)

public/styles/
└── global.css         # Add .map-page, .map-canvas-wrap, #map-canvas, .map-tooltip rules
```

### Pattern 1: Data Island (mirroring graph.astro)

**What:** Frontmatter imports JSON, serializes to string, injects into hidden `<script type="application/json">` element. Client script reads it with `JSON.parse(document.getElementById(...).textContent)`.

**When to use:** Any time build-time data must reach a browser `is:inline` script without going through Astro's bundler.

**Example:**
```astro
---
// In map.astro frontmatter
import embeddingsData from '../data/embeddings.json';
const mapData = JSON.stringify(embeddingsData);
---
<!-- HTML body -->
<script type="application/json" id="map-data" set:html={mapData}></script>
<script is:inline type="module">
  const data = JSON.parse(document.getElementById('map-data').textContent);
  const docs = data.documents; // Array of { id, title, category, tags, x, y }
</script>
```

### Pattern 2: HiDPI Canvas Setup

**What:** Canvas internal resolution is multiplied by `devicePixelRatio`; drawing context is scaled inversely; CSS constrains visual size.

**When to use:** Every canvas initialization — always required for sharp Retina rendering.

**Example:**
```javascript
// Source: https://web.dev/articles/canvas-hidipi + https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm
function setupHiDPICanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  // CSS restores intended visual size
  canvas.style.width  = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  return ctx;
}
```

### Pattern 3: Coordinate Normalization (UMAP → canvas pixels)

**What:** embeddings.json x/y values are raw UMAP output (floating point, range ~-5 to 7 in current corpus). These must be linearly mapped to canvas pixel coordinates with padding.

**Example:**
```javascript
// Source: derived from embeddings.json inspection (x: -5.38 to -2.67, y: 3.82 to 6.80)
function buildScales(docs, canvasW, canvasH, padding = 40) {
  const xs = docs.map(d => d.x);
  const ys = docs.map(d => d.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const scaleX = v => padding + (v - xMin) / (xMax - xMin) * (canvasW - 2 * padding);
  const scaleY = v => padding + (v - yMin) / (yMax - yMin) * (canvasH - 2 * padding);
  return { scaleX, scaleY };
}
```

Note: scaleY maps UMAP y-increasing upward to canvas y-increasing downward (canvas origin is top-left). This inversion is intentional.

### Pattern 4: Hit Detection on mousemove

**What:** On every mousemove event, iterate all dot positions and find the first within a threshold radius. Pure math — no hidden canvas required at this scale.

**Example:**
```javascript
const HIT_RADIUS = 8; // CSS pixels (before dpr scaling)

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mx = event.clientX - rect.left;
  const my = event.clientY - rect.top;
  let hit = null;
  for (const dot of dotPositions) { // dotPositions = [{ doc, cx, cy }, ...]
    const dx = dot.cx - mx;
    const dy = dot.cy - my;
    if (Math.sqrt(dx * dx + dy * dy) < HIT_RADIUS) { hit = dot; break; }
  }
  // show/hide tooltip
});
```

### Pattern 5: Floating Tooltip Div

**What:** A `<div class="map-tooltip">` is positioned absolutely inside the canvas wrapper, hidden by default, shown with `display: block` + `left`/`top` set from mouse coordinates.

**Example:**
```html
<div id="map-tooltip" class="map-tooltip" aria-hidden="true"></div>
```
```javascript
function showTooltip(event, doc) {
  tooltip.style.display = 'block';
  tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
  tooltip.style.top  = (event.clientY - rect.top  + 12) + 'px';
  tooltip.innerHTML  = `<strong>${doc.title}</strong><br>${doc.tags.join(', ')}`;
}
function hideTooltip() { tooltip.style.display = 'none'; }
```

### Anti-Patterns to Avoid

- **Canvas code in frontmatter:** Any reference to `window`, `document`, or `canvas` in the `---` block will execute at Node.js build time and throw `ReferenceError: window is not defined`. All canvas code must be inside `<script is:inline type="module">`.
- **Setting canvas.width/height without dpr:** Default canvas size without HiDPI scaling produces blurry dots on Retina — the success criterion explicitly tests for this.
- **Drawing dots at raw UMAP coordinates:** Raw UMAP x values are in range -5 to -2 — all dots would cluster at the canvas edge or off-screen. Always normalize to canvas pixel space first.
- **Hardcoding canvas pixel dimensions:** Use `canvas.getBoundingClientRect()` after CSS layout to get the actual rendered size — do not hardcode 800×600.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coordinate mapping | Custom scale function | Simple linear min-max normalization (Pattern 3 above) | Not complex enough to need D3.scaleLinear here; no axis ticks required in Phase 6 |
| Tooltip positioning | Canvas-drawn label | HTML `<div>` positioned absolutely | HTML allows styled tag pills in Phase 7+; simpler visibility management |
| Hit detection at 15 docs | Spatial index (R-tree, quadtree) | Brute-force O(n) Euclidean distance | O(n) for n≤100 is <1µs per mousemove — no optimization needed |

**Key insight:** At 15 documents, every approach that works is fast enough. Choose the simplest one — complexity is the only risk.

## Common Pitfalls

### Pitfall 1: Blurry Canvas on HiDPI / Retina
**What goes wrong:** Canvas renders at CSS pixel resolution (e.g., 800×600) but device has 2× pixel density — browser stretches the bitmap, making dots and text blurry.
**Why it happens:** Canvas width/height attributes set the bitmap resolution; CSS width/height set the display size. They are independent.
**How to avoid:** Always apply Pattern 2 (HiDPI setup) immediately after the canvas element is accessible in the browser, before any drawing calls.
**Warning signs:** Dots look soft or antialiased when zoomed in on a Retina display; `devicePixelRatio` is 2 but canvas width equals CSS width.

### Pitfall 2: SSR Build Error from Browser Globals
**What goes wrong:** `npm run build` fails with `ReferenceError: window is not defined` or `document is not defined`.
**Why it happens:** Astro runs `.astro` frontmatter code in Node.js during build. Any reference to browser globals in the `---` block fails.
**How to avoid:** All canvas/window/document code lives exclusively inside `<script is:inline type="module">` tags. The frontmatter only imports JSON and passes it as a serialized string. This is exactly how `graph.astro` works — follow that pattern verbatim.
**Warning signs:** Error stack trace points to map.astro; error mentions "window" or "document" in an SSR context.

### Pitfall 3: Dots Clustered or Off-Screen
**What goes wrong:** All dots appear at the canvas edge, or all appear at the same point.
**Why it happens:** Raw UMAP coordinates are floating point values (e.g., x ∈ [-5.38, -2.67], y ∈ [3.82, 6.80]) — they are not pixel coordinates. Drawing at raw values places dots far outside the canvas.
**How to avoid:** Apply coordinate normalization (Pattern 3) that linearly maps the full data range to the canvas pixel area with padding.
**Warning signs:** Canvas appears empty or shows one dot in a corner.

### Pitfall 4: Canvas Size Measured Before Layout
**What goes wrong:** `canvas.getBoundingClientRect()` returns 0×0 if called before the element is laid out.
**Why it happens:** Scripts can run before the browser has computed layout, especially with `is:inline` scripts.
**How to avoid:** Either place the script at the bottom of the body (after the canvas element), or wrap initialization in `window.addEventListener('load', ...)` or a `DOMContentLoaded` listener. The existing `graph.astro` places its `<script>` after all HTML, which works correctly.
**Warning signs:** Canvas appears blank; `rect.width === 0` in the debugger.

### Pitfall 5: Tooltip Positioned Incorrectly
**What goes wrong:** Tooltip appears at wrong position relative to dots — offset by the page scroll or nav bar height.
**Why it happens:** `event.clientX/Y` is relative to the viewport; canvas position must be subtracted via `getBoundingClientRect()`.
**How to avoid:** Always compute mouse position relative to canvas: `const mx = event.clientX - canvas.getBoundingClientRect().left`.
**Warning signs:** Tooltip follows the mouse but is consistently offset.

## Code Examples

### Complete HiDPI Canvas Initialization
```javascript
// Source: https://web.dev/articles/canvas-hidipi and https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm
const canvas = document.getElementById('map-canvas');
const wrap   = document.getElementById('map-canvas-wrap');

// Let CSS size the canvas wrapper, then read actual dimensions
const dpr  = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width  = rect.width  * dpr;
canvas.height = rect.height * dpr;
canvas.style.width  = rect.width  + 'px';
canvas.style.height = rect.height + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
// All subsequent ctx drawing uses CSS pixel units (dpr handled automatically)
```

### Drawing a Dot with Neon Glow
```javascript
// Uses project design tokens: --neon-cyan, glow via shadowBlur
function drawDot(ctx, cx, cy, color = '#00E5FF') {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 8;
  ctx.fill();
  ctx.restore();
}
```

### Reading embeddings.json in Astro Frontmatter
```astro
---
// Source: established data island pattern from graph.astro
import embeddingsData from '../data/embeddings.json';
const mapData = JSON.stringify(embeddingsData);
---
<script type="application/json" id="map-data" set:html={mapData}></script>
```

### Astro import vs. fs.readFileSync
Both work in static Astro:
- `import embeddingsData from '../data/embeddings.json'` — cleaner, Astro handles the parse
- `import { readFileSync } from 'fs'` in frontmatter — also works, but unnecessary for JSON

Use the import form — it is what `graph.astro` does via `buildGraphData` and is simpler.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG for all viz | Canvas for scatter, SVG for graphs | Canvas API mature since ~2015 | Better perf for dot-heavy views |
| Manual dpr handling | Same — no helper library exists | Unchanged | Must do it by hand every time |
| regl-scatterplot for any scatter | Plain canvas for <1000 points | Ecosystem matured ~2022 | Simpler stack for small corpora |

**Not deprecated for this phase:**
- `is:inline type="module"` — still the correct Astro pattern for CDN/browser-only scripts
- Data island via `<script type="application/json">` — still the right pattern

## Open Questions

1. **Nav link for /map**
   - What we know: `Base.astro` renders `<nav>` with hardcoded links (`/`, `/tags/`, `/graph/`)
   - What's unclear: Should `/map` be added to the nav in this phase or a later one?
   - Recommendation: Add it in this phase — the page exists and needs to be discoverable

2. **Category-based dot coloring**
   - What we know: `embeddings.json` includes `category` per document; `graph.astro` uses three neon colors mapped to the three categories
   - What's unclear: Phase 6 requirements (MAP-01, MAP-02) don't specify color differentiation — only position and tooltip
   - Recommendation: Apply the same category color mapping from graph.astro for visual consistency; cost is trivial

3. **Corpus size growth rate**
   - What we know: 15 documents now; canvas 2D is efficient to ~10,000 points before needing offscreen canvas or WebGL
   - What's unclear: How fast the corpus will grow before Phase 7 filter interactions
   - Recommendation: Plain canvas is correct; revisit only if corpus exceeds 1,000 documents

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` (no external test runner) |
| Config file | none — tests are standalone `.mjs` scripts run with `node` |
| Quick run command | `node src/lib/graph.test.mjs` |
| Full suite command | `node src/lib/graph.test.mjs && npm run build` |
| Estimated runtime | ~30 seconds (build dominates) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-01 | `/map` route renders and build succeeds | smoke | `npm run build` | ❌ Wave 0 (map.astro doesn't exist yet) |
| MAP-01 | embeddings.json parsed correctly at build time | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |
| MAP-02 | Tooltip logic (hit detection math) | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |

MAP-02 tooltip rendering and MAP-01 HiDPI canvas correctness are visual/browser behaviors — they cannot be automated with Node.js unit tests. They are verified by the phase success criteria (manual review on a Retina display + checking `npm run build` passes).

### Sampling Rate
- **Per task commit:** `npm run build` (verifies no SSR error from the new map.astro page)
- **Per wave merge:** `node src/lib/graph.test.mjs && npm run build`
- **Phase gate:** Full suite green + manual visual check before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/map.test.mjs` — unit tests for coordinate normalization (buildScales) and hit detection logic
- [ ] `src/pages/map.astro` — the page itself (created in Wave 1 of the plan)

## Sources

### Primary (HIGH confidence)
- MDN Web Docs: `window.devicePixelRatio` — HiDPI canvas pattern (canonical API reference)
- https://web.dev/articles/canvas-hidipi — Google's canonical HiDPI canvas guide (code verified via WebFetch)
- https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm — confirmed same pattern (code verified via WebFetch)
- https://docs.astro.build/en/guides/client-side-scripts/ — Astro `is:inline` and data island pattern (verified via WebFetch)
- `/home/daniel/codes/loom/src/pages/graph.astro` — project source: established data island + `is:inline type="module"` pattern
- `/home/daniel/codes/loom/src/data/embeddings.json` — project source: confirmed data shape, coordinate ranges, 15 documents
- `/home/daniel/codes/loom/astro.config.mjs` — project source: `output: 'static'` confirmed, no SSR adapter

### Secondary (MEDIUM confidence)
- https://github.com/flekschas/regl-scatterplot — regl-scatterplot repo: confirmed WebGL/large-dataset focus justifying plain-canvas decision for small corpus
- https://joshuatz.com/posts/2022/canvas-hit-detection-methods/ — hit detection approaches (brute-force vs color-pick); verified brute force is standard for small n

### Tertiary (LOW confidence)
- None — all key claims are backed by primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed by project source files; no new dependencies
- Architecture: HIGH — all patterns verified from existing project code (graph.astro) or official docs
- HiDPI pattern: HIGH — verified via web.dev official guide and kirupa.com independent source
- SSR safety: HIGH — confirmed by astro.config.mjs (output: static) and graph.astro pattern
- Pitfalls: HIGH — all verified from official docs or direct code inspection

**Research date:** 2026-03-10
**Valid until:** 2026-09-10 (stable APIs; Astro static output behavior unlikely to change)
