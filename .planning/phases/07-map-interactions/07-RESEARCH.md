# Phase 7: Map Interactions - Research

**Researched:** 2026-03-10
**Domain:** Canvas 2D interactivity — side panel, nearest-neighbor lines, tag/search filtering, Gaussian timeline, play button
**Confidence:** HIGH

## Summary

Phase 7 builds the full interaction layer on top of the Phase 6 canvas. The map page already exists at `src/pages/map.astro` with HiDPI canvas, dot rendering, and tooltip hover. This phase adds: (1) a click-driven side panel (MAP-03), (2) nearest-neighbor lines on click (MAP-04), (3) tag filter with ANY/ALL mode (MAP-05, MAP-07), (4) search box filtering (MAP-06), (5) a Gaussian opacity timeline slider (MAP-08), (6) a play button auto-advancing the timeline (MAP-09), and (7) composed simultaneous application of all three filters (MAP-10).

The most important architectural insight is that **all filtering must re-render the canvas on every state change**. Phase 6 draws dots once at page load. Phase 7 requires a `redraw()` function that reads current filter state and paints all dots with computed final opacity. The three filter systems (tag, search, timeline) each produce a per-dot opacity in [0.0, 1.0]; the composed opacity is the minimum (or product) of all three, clamped to a floor of ~0.2 for non-matching dots and 1.0 for fully matching dots.

A critical data gap exists: **`embeddings.json` does not include `date` or `summary` fields**, but MAP-03 (side panel with summary) and MAP-08 (Gaussian timeline by date) both require them. The embed pipeline (`scripts/embed.mjs`) must be extended to include `date` and `summary` in its output, or a second build-time data island must supply the missing fields. The simplest fix is extending `embed.mjs` to extract and write these fields, then re-running the pipeline before Phase 7 implementation begins.

**Primary recommendation:** Extend `embeddings.json` to include `date` and `summary` fields. Implement a single `redraw()` loop in the map page's inline script that applies all three filter opacities composably. Add side panel as a positioned `<div>`, tag/search controls as native HTML elements, and a timeline `<input type="range">` — all vanilla HTML and JS, no new framework dependencies. Install `fuse.js@^7.1.0` (already in the v1.1 stack decision) for fuzzy search.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-03 | Clicking a dot opens a side panel with title, tags, summary, and link to full article | Side panel is a positioned `<div>` that slides in via CSS transition; data comes from enriched embeddings.json or a separate build-time data island; summary extracted from `## Summary` section of markdown |
| MAP-04 | Clicking a dot draws lines to 5 nearest neighbors | k-NN computed at render time from dotPositions using Euclidean distance in UMAP space (2D); draw with `ctx.strokeStyle` + opacity; O(n²) is fine at n≤100 |
| MAP-05 | Tag filter — matching dots glow, others dim to ~20% opacity | Tag filter state is a Set of selected tags; per-dot match is union (ANY) or intersection (ALL) of selected tags against doc.tags; non-match → opacity 0.2 floor |
| MAP-06 | Search box — non-matching dots dim in real time | Fuse.js fuzzy search over doc.title + doc.tags; on `input` event, recompute match set and call redraw() |
| MAP-07 | ANY / ALL toggle for multi-tag matching | Boolean state variable; ANY = union (`some`), ALL = intersection (`every`); toggle button updates state and calls redraw() |
| MAP-08 | Timeline slider applies Gaussian opacity by document date | `<input type="range">` value maps to a date; per-dot opacity = Gaussian(daysDelta, sigma); docs with no date pass through at full opacity |
| MAP-09 | Play button auto-advances timeline from earliest to latest date | `setInterval` increments slider value, calls `redraw()`; play/pause toggles interval; auto-stops at max date |
| MAP-10 | All three filters compose simultaneously | Final dot opacity = min(tagOpacity, searchOpacity, timelineOpacity), floored at DIM_OPACITY (~0.2); a dot that matches all filters gets opacity 1.0 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTML Canvas 2D API | browser built-in | Re-render all dots with computed opacity on every state change | Already established in Phase 6; `ctx.globalAlpha` controls per-dot opacity |
| Fuse.js | ^7.1.0 | Fuzzy title + tag search | Already in v1.1 stack decision in STATE.md; lightweight, no build step |
| Astro frontmatter import | Astro ^5.x | Load enriched embeddings.json at build time | Established data island pattern |

### No New Browser Framework Dependencies
The project stack is "no React, no Tailwind, no TypeScript." All UI controls are native HTML: `<button>`, `<input type="text">`, `<input type="range">`, `<div>`. CSS transitions handle panel slide animation. The only new npm package is fuse.js.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fuse.js fuzzy search | `String.prototype.includes()` exact match | Fuse.js handles typos and partial matches; exact match simpler but worse UX |
| Fuse.js fuzzy search | MiniSearch | MiniSearch is 6KB larger and has more features than needed; Fuse.js is the stated stack choice |
| `ctx.globalAlpha` per dot | Pre-multiplied RGBA color strings | `globalAlpha` is simpler and standard; pre-multiplied requires rebuilding color strings |
| Gaussian opacity | Linear falloff | Gaussian is smoother/more natural; requirement explicitly states Gaussian |
| `setInterval` play | `requestAnimationFrame` | Slider steps are discrete (1 unit/step); `setInterval` at ~60–100ms per step is correct; rAF is for animation loops |

**Installation:**
```bash
npm install fuse.js@^7.1.0
```

## Architecture Patterns

### Recommended File Changes
```
src/pages/
└── map.astro          # Major rewrite — adds controls, side panel, redraw() loop

src/lib/
└── map.mjs            # Extend: add computeOpacity(), kNearest(), gaussianOpacity()
└── map.test.mjs       # Extend: tests for new pure functions

scripts/
└── embed.mjs          # Extend: include date and summary in output documents
```

### Pattern 1: Central redraw() Loop
**What:** All state (selectedTags, anyAllMode, searchQuery, timelineDate) is held in module-level variables. One `redraw()` function clears the canvas, recomputes per-dot opacity from all three filters, and redraws every dot.

**When to use:** Any state variable changes (tag click, search input, slider move, play tick).

**Example:**
```javascript
// All filter state (module-level)
let selectedTags = new Set();    // tags currently active in filter
let anyAllMode = 'ANY';          // 'ANY' | 'ALL'
let searchQuery = '';            // current search string
let timelineDate = null;         // Date | null (null = no timeline filter)

const DIM_OPACITY = 0.2;         // floor for non-matching dots
const GLOW_RADIUS = 5;           // dot radius in CSS px
const NEIGHBOR_COUNT = 5;        // lines to draw on click

function redraw() {
  ctx.clearRect(0, 0, W, H);

  // Draw neighbor lines first (behind dots)
  if (selectedDot) {
    drawNeighborLines(selectedDot);
  }

  for (const dot of dotPositions) {
    const opacity = composedOpacity(dot.doc);
    ctx.save();
    ctx.globalAlpha = opacity;
    drawDot(ctx, dot.cx, dot.cy, CATEGORY_COLORS[dot.doc.category] || FALLBACK_COLOR);
    ctx.restore();
  }
}
```

### Pattern 2: Three-Filter Composition
**What:** Each filter produces an opacity in [DIM_OPACITY, 1.0]. Final opacity is the minimum of the three. A dot that matches all three filters gets 1.0; one that fails any filter gets DIM_OPACITY.

**Example:**
```javascript
function composedOpacity(doc) {
  const t = tagOpacity(doc);     // 1.0 if matches tag filter, DIM_OPACITY if not
  const s = searchOpacity(doc);  // 1.0 if matches search, DIM_OPACITY if not
  const g = gaussianOpacity(doc); // Gaussian value in [smallMin, 1.0]
  return Math.min(t, s, g);
}

function tagOpacity(doc) {
  if (selectedTags.size === 0) return 1.0; // no filter active
  const match = anyAllMode === 'ANY'
    ? doc.tags.some(t => selectedTags.has(t))
    : [...selectedTags].every(t => doc.tags.includes(t));
  return match ? 1.0 : DIM_OPACITY;
}

function searchOpacity(doc) {
  if (!searchQuery) return 1.0; // no filter active
  // fuse results cached in a Set of matching doc IDs
  return matchingDocIds.has(doc.id) ? 1.0 : DIM_OPACITY;
}
```

### Pattern 3: Gaussian Timeline Opacity
**What:** Given a selected date D and a sigma (spread in days), compute a Gaussian curve value for each doc based on the absolute difference in days between the doc's date and D. Docs with no date pass at full opacity (do not penalize undated docs).

**Example:**
```javascript
// Source: standard Gaussian formula — no external dependency needed
const SIGMA_DAYS = 30; // adjust: wider = slower falloff

function gaussianOpacity(doc) {
  if (!timelineDate || !doc.date) return 1.0; // no filter or no date
  const docDate = new Date(doc.date);
  const deltaDays = Math.abs(docDate - timelineDate) / (1000 * 60 * 60 * 24);
  return Math.exp(-(deltaDays * deltaDays) / (2 * SIGMA_DAYS * SIGMA_DAYS));
  // Returns ~1.0 at delta=0, ~0.61 at delta=sigma, ~0.14 at delta=2*sigma
  // Note: does NOT apply DIM_OPACITY floor — timeline is a continuous fade, not binary
}
```

**Sigma calibration:** With 15 docs clustered in a few days (current corpus: mostly 2026-03-03 to 2026-03-09), a SIGMA_DAYS of 3–7 is appropriate for tight time discrimination. Expose as a tunable constant; do not hardcode 30 days.

### Pattern 4: k-Nearest Neighbor Lines
**What:** On dot click, find the 5 closest dots by Euclidean distance in canvas (pixel) space. Draw lines from the clicked dot to each neighbor. Recompute on each click; don't cache.

**Example:**
```javascript
function kNearest(dot, dotPositions, k = 5) {
  return dotPositions
    .filter(d => d !== dot)
    .map(d => ({
      dot: d,
      dist: Math.sqrt((d.cx - dot.cx) ** 2 + (d.cy - dot.cy) ** 2)
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k)
    .map(d => d.dot);
}

function drawNeighborLines(dot) {
  const neighbors = kNearest(dot, dotPositions, NEIGHBOR_COUNT);
  ctx.save();
  ctx.strokeStyle = '#8888AA';  // --text-secondary color
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  for (const n of neighbors) {
    ctx.beginPath();
    ctx.moveTo(dot.cx, dot.cy);
    ctx.lineTo(n.cx, n.cy);
    ctx.stroke();
  }
  ctx.restore();
}
```

**Note on distance space:** Use canvas pixel coordinates (already normalized), not raw UMAP coordinates. Both give the same relative ordering; pixel space avoids an extra coordinate lookup.

### Pattern 5: Side Panel DOM Approach
**What:** A `<div id="map-panel">` positioned absolutely on the right side of the canvas wrap. Hidden by default (`transform: translateX(100%)`). On dot click, populate innerHTML and apply `transform: translateX(0)`. On close or second click, revert transform.

**Example:**
```html
<div id="map-panel" class="map-panel" aria-label="Document details">
  <button id="map-panel-close" class="map-panel-close" aria-label="Close">×</button>
  <div id="map-panel-content"></div>
</div>
```
```javascript
function openPanel(doc) {
  const panel = document.getElementById('map-panel');
  const content = document.getElementById('map-panel-content');
  content.innerHTML = `
    <h2 class="map-panel-title">${doc.title}</h2>
    <div class="map-panel-tags">${doc.tags.map(t => `<span class="tag-pill">${t}</span>`).join(' ')}</div>
    <p class="map-panel-summary">${doc.summary || ''}</p>
    <a href="/${doc.category}/${doc.id}/" class="map-panel-link">Open article →</a>
  `;
  panel.classList.add('open');
}
```

### Pattern 6: Fuse.js Browser Usage (via CDN import)
**What:** The project uses `is:inline type="module"` scripts — Fuse.js can be imported from a CDN ESM build (same pattern as D3 in graph.astro) or bundled via npm. Given the project does NOT use Astro's bundler for map.astro, use an `import` from a CDN or inline the Fuse.js ESM build.

**Important:** Fuse.js v7.x ships an ESM bundle at `fuse.js/dist/fuse.esm.js`. In an `is:inline type="module"` script, you cannot use bare specifiers (`import Fuse from 'fuse.js'`) because there's no bundler. You must either:
- Use a CDN URL: `import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.esm.min.js'`
- Or switch map.astro to use a regular (bundled) `<script>` tag — but this changes the established pattern

**Recommendation:** Use the CDN ESM import pattern, matching how graph.astro imports D3. This keeps the is:inline pattern consistent.

```javascript
// At top of <script is:inline type="module">
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.esm.min.js';
```

### Pattern 7: Timeline Play Button
**What:** A play/pause button that runs `setInterval` to advance the slider value by 1 step, firing the `input` event to trigger `redraw()`.

**Example:**
```javascript
let playInterval = null;
const slider = document.getElementById('map-timeline');

function tick() {
  const max = parseInt(slider.max);
  const val = parseInt(slider.value);
  if (val >= max) {
    stopPlay();
    return;
  }
  slider.value = val + 1;
  slider.dispatchEvent(new Event('input')); // trigger redraw
}

function startPlay() {
  playInterval = setInterval(tick, 80); // ~12.5 fps scrub speed
  document.getElementById('map-play').textContent = '⏸';
}
function stopPlay() {
  clearInterval(playInterval);
  playInterval = null;
  document.getElementById('map-play').textContent = '▶';
}
```

### Pattern 8: Data Enrichment — Extending embeddings.json
**What:** The embed pipeline must be extended to include `date` (ISO string) and `summary` (first paragraph of `## Summary` section) in each document entry.

**Where to change:** `scripts/embed.mjs`, in the `output.documents` mapping (line ~209):
```javascript
// Current output shape (from embed.mjs)
documents: docs.map((doc, i) => ({
  id: doc.id,
  title: doc.title,
  category: doc.category,
  tags: doc.tags,
  x: coords[i][0],
  y: coords[i][1],
})),

// Required new shape
documents: docs.map((doc, i) => ({
  id: doc.id,
  title: doc.title,
  category: doc.category,
  tags: doc.tags,
  date: doc.date ? doc.date.toISOString().slice(0, 10) : null,  // 'YYYY-MM-DD' or null
  summary: doc.summary || null,
  x: coords[i][0],
  y: coords[i][1],
})),
```

The `readDocs()` function also needs updating to extract `date` and `summary` from frontmatter and content:
```javascript
// In readDocs(), after parsing gray-matter:
const summaryMatch = parsed.content.match(/## Summary\n\n([\s\S]*?)(\n##|$)/);
docs.push({
  // existing fields...
  date: parsed.data.date || null,  // gray-matter already parses date
  summary: summaryMatch ? summaryMatch[1].trim() : null,
});
```

**Alternatively:** A second build-time data island in map.astro can load the enriched data using Astro's `getCollection()` API. This avoids re-running the embed pipeline. This is the safer approach if re-running embed is not desirable (requires Ollama to be running).

**Recommended approach:** Since the `allCached` path in embed.mjs skips output writing if all vectors are cached, and since the enrichment change only touches the output shape (not embedding logic), **extend embed.mjs AND provide a force-write flag** or simply trigger a re-run. Alternatively, load `date` and `summary` from Astro's content collection at build time in map.astro frontmatter — this avoids touching the embed pipeline and is safer.

### Anti-Patterns to Avoid
- **Drawing dots individually with opacity set at dot level only:** Must use `ctx.globalAlpha` before each dot's draw call, then restore. Do not bake opacity into fill color strings — `globalAlpha` interacts with `shadowBlur` correctly.
- **Recomputing Fuse.js index on every keypress:** Build the Fuse index once at page load; on `input` event, only call `fuse.search()`.
- **Setting `setInterval` tick speed too fast:** At ~15 docs spanning a week, ticks of 1 day per interval step at 16ms would complete in < 0.25 seconds. Use date-proportional steps or a slower interval (80–200ms).
- **Hardcoding SIGMA_DAYS to a large value:** Current corpus dates cluster within a ~6-day range. SIGMA=30 days would produce no visible differentiation. Use SIGMA=3 or expose as a tunable constant.
- **Nearest-neighbor distance in UMAP coordinate space vs canvas pixel space:** Either works for ordering — use canvas pixel coords (already computed in `dotPositions`) to avoid an extra data lookup.
- **innerHTML injection without sanitization:** doc.title, doc.summary come from the project's own markdown files — no user input, no XSS risk. `innerHTML` is acceptable here for this single-author static site.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string search | Custom substring matching | Fuse.js | Typo tolerance, relevance scoring, tag + title simultaneous search |
| Gaussian curve | Lookup table or approximation | `Math.exp(-x²/(2σ²))` directly | Standard formula, one line, no approximation needed |
| k-nearest neighbors | Spatial index (k-d tree) | Brute-force O(n²) sort | At n≤100, brute force completes in <1µs; k-d tree would be premature |
| Slide animation | JavaScript position tweening | CSS `transition: transform 0.2s ease` | Browser handles GPU-composited animation; JS tweening is worse |
| Date range slider | Custom drag implementation | `<input type="range">` | Native browser control; accessible; no library needed |

**Key insight:** All of Phase 7's complexity is in the composition logic, not in any individual UI component. The canvas redraw loop plus the three opacity functions are the core — everything else is standard browser primitives.

## Common Pitfalls

### Pitfall 1: embeddings.json Missing date and summary
**What goes wrong:** MAP-03 side panel cannot show summary; MAP-08 timeline has no dates to work with; all docs get `timelineOpacity = 1.0` trivially.
**Why it happens:** embed.mjs was designed only for UMAP visualization in Phase 6; `date` and `summary` were not yet needed.
**How to avoid:** Extend embed.mjs (or add a build-time Astro collection lookup) to include these fields before implementing MAP-03 and MAP-08. Verify with `jq '.documents[0]' src/data/embeddings.json` after re-running the pipeline.
**Warning signs:** `doc.date` is `undefined` in the browser script; timeline slider has no effect.

### Pitfall 2: shadowBlur Interacts Poorly with globalAlpha
**What goes wrong:** Glow appears incorrect (too bright, or glow at wrong opacity) when `ctx.globalAlpha < 1`.
**Why it happens:** `shadowBlur` renders the shadow with `globalAlpha` applied to it, which can cause the glow to appear brighter relative to the fill when the dot is dimmed.
**How to avoid:** Apply `ctx.globalAlpha` before calling `ctx.save()` / before drawing, and test dim dots at 0.2 opacity visually. If glow looks wrong, reduce `shadowBlur` for dimmed dots.
**Warning signs:** Dimmed dots' glow is disproportionately bright; dimmed area glows more than full-opacity dots.

### Pitfall 3: Tag Filter Set of All Documents (No Active Filter)
**What goes wrong:** When no tags are selected, treating `selectedTags.size === 0` as "dim everything" instead of "no filter active = all pass."
**Why it happens:** The filter composition uses `every tag in selectedTags is in doc.tags` — vacuously true for an empty set, which passes all docs. But a careless implementation might check `selectedTags.size > 0 && match` and dim all docs when empty.
**How to avoid:** Explicitly: `if (selectedTags.size === 0) return 1.0;` at the start of `tagOpacity()`.

### Pitfall 4: Timeline Slider Discrete Steps vs. Continuous Date Range
**What goes wrong:** `<input type="range">` works in integer steps; mapping to dates requires a conversion from integer index to actual Date objects.
**Why it happens:** Range inputs have `min`, `max`, `step` as integers; your date range is not necessarily integer-indexed.
**How to avoid:** Build a sorted array of all unique dates from the corpus at init time. Let `min=0`, `max=dates.length-1`, `step=1`. Convert slider value to `dates[value]`. Handle corpora with only one date (slider with range 0).
**Warning signs:** All dates map to the same slider position; slider jumps discontinuously.

### Pitfall 5: Play Button setInterval Not Cleared on Page Navigation
**What goes wrong:** If user navigates away while play is active, the interval keeps running (memory leak; may error on missing DOM).
**Why it happens:** `setInterval` is not cleared on page unload.
**How to avoid:** Add `window.addEventListener('beforeunload', stopPlay)` or a `pagehide` listener.

### Pitfall 6: Fuse.js CDN Import Blocking
**What goes wrong:** Map page blocks on CDN script load; page appears blank during load.
**Why it happens:** ESM `import` is synchronous in module execution (though the network fetch is async and non-blocking for other resources).
**How to avoid:** Initialize Fuse lazily after all dots are drawn, or use a dynamic `import()` and begin rendering immediately. Alternatively, accept the brief blocking — at 7KB minified, Fuse.js loads in <50ms on a fast connection.

## Code Examples

### Complete Opacity Composition
```javascript
// Source: project-specific design from requirements MAP-05, MAP-06, MAP-08, MAP-10
const DIM_OPACITY = 0.2;
const SIGMA_DAYS = 5; // tuned for current corpus date spread

function composedOpacity(doc) {
  const t = tagOpacity(doc);
  const s = searchOpacity(doc);
  const g = gaussianOpacity(doc);
  return Math.min(t, s, g);
}

function tagOpacity(doc) {
  if (selectedTags.size === 0) return 1.0;
  const match = anyAllMode === 'ANY'
    ? doc.tags.some(t => selectedTags.has(t))
    : [...selectedTags].every(t => doc.tags.includes(t));
  return match ? 1.0 : DIM_OPACITY;
}

function gaussianOpacity(doc) {
  if (!timelineDate || !doc.date) return 1.0;
  const docMs = new Date(doc.date).getTime();
  const selMs = timelineDate.getTime();
  const deltaDays = Math.abs(docMs - selMs) / 86400000;
  return Math.exp(-(deltaDays * deltaDays) / (2 * SIGMA_DAYS * SIGMA_DAYS));
}
```

### Fuse.js Initialization (CDN ESM)
```javascript
// Source: https://www.fusejs.io/getting-started/installation.html
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.esm.min.js';

const fuse = new Fuse(docs, {
  keys: ['title', 'tags'],
  threshold: 0.35,       // 0 = exact, 1 = match anything
  includeScore: false,
});

let matchingDocIds = new Set(docs.map(d => d.id)); // default: all match

document.getElementById('map-search').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  searchQuery = q;
  if (!q) {
    matchingDocIds = new Set(docs.map(d => d.id));
  } else {
    matchingDocIds = new Set(fuse.search(q).map(r => r.item.id));
  }
  redraw();
});
```

### Tag Filter Control HTML
```html
<!-- Controls bar above the canvas -->
<div class="map-controls">
  <div class="map-search-wrap">
    <input id="map-search" type="text" placeholder="search…" class="map-search-input" />
  </div>
  <div class="map-tag-filter">
    <!-- Populated by JS from docs tags -->
  </div>
  <div class="map-anyall">
    <button id="map-anyall-btn" class="map-anyall-btn">ANY</button>
  </div>
  <div class="map-timeline-wrap">
    <input id="map-timeline" type="range" class="map-timeline" />
    <button id="map-play" class="map-play-btn">▶</button>
  </div>
</div>
```

### Building Tag Buttons Dynamically
```javascript
// Collect all unique tags from corpus
const allTags = [...new Set(docs.flatMap(d => d.tags))].sort();

const tagContainer = document.getElementById('map-tag-filter');
for (const tag of allTags) {
  const btn = document.createElement('button');
  btn.className = 'tag-filter-btn';
  btn.textContent = tag;
  btn.addEventListener('click', () => {
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
      btn.classList.remove('active');
    } else {
      selectedTags.add(tag);
      btn.classList.add('active');
    }
    redraw();
  });
  tagContainer.appendChild(btn);
}
```

### Map Page Layout with Controls Bar
The current `map.astro` has `.map-page` → `.map-canvas-wrap` (fills viewport height minus nav). Phase 7 needs a controls bar above the canvas. Adjust `.map-page` to `flex-direction: column` with the controls bar as a fixed-height row:

```css
/* In global.css — Phase 7 additions */
.map-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--bg-elevated);
  flex-wrap: wrap;
}

.map-search-input {
  background: var(--bg-base);
  border: 1px solid var(--bg-elevated);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.map-search-input:focus {
  border-color: var(--neon-cyan);
  outline: none;
}

.map-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-surface);
  border-left: 1px solid var(--neon-cyan);
  padding: 1rem;
  transform: translateX(100%);
  transition: transform 0.2s ease;
  overflow-y: auto;
  z-index: 20;
}

.map-panel.open {
  transform: translateX(0);
}

.map-anyall-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--text-secondary);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
}

.map-anyall-btn.any-mode {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}
```

## Data Gap: Enriching embeddings.json

### Option A: Extend embed.mjs (Recommended)
Extend `readDocs()` to extract `date` and `summary`. Add them to the output shape. Re-run `node scripts/embed.mjs` (uses cache for vectors — only rewrites the JSON, no Ollama calls needed if all cached).

**Risk:** If `allCached` path is hit, embed.mjs currently returns early without writing the JSON at all (line ~196). Adding date/summary to the output requires forcing a write even on cached runs, OR the task must clear the `.cache/` dir to force a full run.

**Mitigation:** Add a separate `--force-output` flag to embed.mjs, or modify the `allCached` branch to always write the output JSON (the vectors are already in cache, only the output shape is changing).

### Option B: Build-time Astro Collection Query
In `map.astro` frontmatter, use `getCollection()` to load all three collections and merge `date` and `summary` into the data island by matching on slug/id.

```astro
---
import { getCollection } from 'astro:content';
import embeddingsData from '../data/embeddings.json';

const aiTools = await getCollection('aiTools');
const cloudPlatforms = await getCollection('cloudPlatforms');
const companies = await getCollection('companies');
const allDocs = [...aiTools, ...cloudPlatforms, ...companies];

// Build lookup: slug -> { date, summary }
const meta = {};
for (const doc of allDocs) {
  const body = doc.body || '';
  const summaryMatch = body.match(/## Summary\n\n([\s\S]*?)(\n##|$)/);
  meta[doc.id] = {
    date: doc.data.date ? doc.data.date.toISOString().slice(0, 10) : null,
    summary: summaryMatch ? summaryMatch[1].trim() : null,
  };
}

// Merge into embeddings
const enriched = {
  ...embeddingsData,
  documents: embeddingsData.documents.map(d => ({
    ...d,
    date: meta[d.id]?.date ?? null,
    summary: meta[d.id]?.summary ?? null,
  })),
};
const mapData = JSON.stringify(enriched);
---
```

**Advantage:** No pipeline re-run needed; enrichment happens at Astro build time. This is the safest approach — no Ollama dependency for the enrichment step.

**Recommendation: Use Option B for Phase 7.** It decouples the enrichment from the embed pipeline and works at build time without Ollama running.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redraw individual dots | Full canvas clear + redraw on state change | Standard canvas practice | Simpler state management; correct for <1000 dots |
| Exact string match for search | Fuse.js fuzzy search | Fuse.js v6+ (2020) | Typo tolerance; better UX |
| Custom range slider | Native `<input type="range">` | Always available | Accessible; no JS implementation needed |
| Canvas-drawn UI controls | HTML elements overlaid on canvas | Modern approach | Allows focus, keyboard access, accessibility |

**Not deprecated:**
- `is:inline type="module"` — still correct Astro pattern
- Data island via `<script type="application/json">` — still correct
- Canvas 2D for this corpus scale — still correct

## Open Questions

1. **SIGMA_DAYS calibration for current corpus**
   - What we know: Current corpus has 15 docs with dates clustered in 2026-03-03 to 2026-03-09 (a 6-day range)
   - What's unclear: What sigma feels natural for scrubbing through this range
   - Recommendation: Start with SIGMA_DAYS = 2; expose as a CSS custom property or JS constant that can be tuned during implementation

2. **Summary extraction: regex vs Astro content body**
   - What we know: Option B (Astro collection) gives `doc.body` as raw markdown string
   - What's unclear: Whether `doc.body` is the raw markdown or parsed HTML
   - Recommendation: In Astro content collections, `doc.body` is the raw markdown (before rendering). The `## Summary` regex approach works correctly on raw markdown.

3. **Tag filter bar overflow**
   - What we know: The corpus has many unique tags (~40+ across 15 docs); a flat button list won't fit in a single line
   - What's unclear: Whether to truncate, scroll, or use a dropdown for the tag filter
   - Recommendation: Use `flex-wrap: wrap` on the tag filter area and limit to a max-height with overflow scroll; or limit display to top-N most frequent tags

4. **Click behavior: second click on same dot**
   - What we know: MAP-03 says clicking opens the panel; MAP-04 says clicking draws lines
   - What's unclear: Clicking the same dot twice — does it close the panel? Toggle the lines?
   - Recommendation: Second click on the same dot closes the panel and removes lines (toggle behavior)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` (no external test runner) |
| Config file | none — standalone `.mjs` scripts run with `node` |
| Quick run command | `node src/lib/map.test.mjs` |
| Full suite command | `node src/lib/map.test.mjs && npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-03 | Side panel DOM population | manual | visual inspection | ❌ Wave 0 (DOM behavior) |
| MAP-04 | kNearest() returns correct k closest dots | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |
| MAP-05 | tagOpacity() returns 1.0 for match, DIM for no-match | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |
| MAP-06 | Fuse.js search returns correct doc IDs | manual | visual inspection (CDN import, browser-only) | ❌ N/A (CDN library) |
| MAP-07 | ANY vs ALL mode switches correctly in tagOpacity | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |
| MAP-08 | gaussianOpacity() math correctness | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |
| MAP-09 | Play button interval advances slider | manual | visual inspection | ❌ Wave 0 (DOM/timer) |
| MAP-10 | composedOpacity() returns min of all three | unit | `node src/lib/map.test.mjs` | ❌ Wave 0 |
| MAP-10 | Build succeeds with enriched data island | smoke | `npm run build` | ❌ Wave 0 |

### New Pure Functions to Test (move to map.mjs)
These functions should be exported from `src/lib/map.mjs` so they can be unit-tested:
- `gaussianOpacity(docDate, selectedDate, sigmaDays)` — pure math, no DOM
- `kNearest(dot, dotPositions, k)` — pure array operation
- `composedOpacity(tag, search, gaussian)` — pure min() composition

### Sampling Rate
- **Per task commit:** `node src/lib/map.test.mjs && npm run build`
- **Per wave merge:** `node src/lib/map.test.mjs && npm run build`
- **Phase gate:** Full suite green + manual visual check of all 6 interactions before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/map.test.mjs` — extend with tests for `gaussianOpacity`, `kNearest`, `composedOpacity` (file exists, needs new test cases)
- [ ] `src/lib/map.mjs` — export new pure functions `gaussianOpacity`, `kNearest`, `composedOpacity`

## Sources

### Primary (HIGH confidence)
- `/home/daniel/codes/loom/src/pages/map.astro` — current Phase 6 implementation; starting point for Phase 7
- `/home/daniel/codes/loom/src/lib/map.mjs` — existing pure helper functions; will be extended
- `/home/daniel/codes/loom/scripts/embed.mjs` — embed pipeline; source of data gap (no date/summary in output)
- `/home/daniel/codes/loom/src/data/embeddings.json` — confirmed data shape (15 docs, no date/summary fields)
- `/home/daniel/codes/loom/src/content/config.ts` — Astro collection schema; confirms `date` is `z.coerce.date()` in frontmatter
- `/home/daniel/codes/loom/cloud-ai-platforms/aws-sagemaker-ai.md` — representative doc; confirms `date` frontmatter + `## Summary` section
- `/home/daniel/codes/loom/.planning/STATE.md` — v1.1 stack decisions: fuse.js@^7.1.0 specified; no React/Tailwind/TypeScript
- MDN: `ctx.globalAlpha`, `input[type=range]`, `setInterval`, `Math.exp` — browser built-in APIs

### Secondary (MEDIUM confidence)
- https://www.fusejs.io/getting-started/installation.html — Fuse.js v7.x CDN ESM bundle path (`fuse.esm.min.js`) verified
- https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/ — CDN availability of ESM build (Fuse.js 7.1.0 confirmed available)
- Standard Gaussian formula: `exp(-x²/(2σ²))` — well-known; no citation needed

### Tertiary (LOW confidence)
- None — all key claims verified by project source files or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fuse.js is the stated v1.1 stack choice; all other tools are browser built-ins
- Architecture (redraw loop): HIGH — derived directly from Phase 6 code structure
- Data gap (date/summary): HIGH — confirmed by direct inspection of embeddings.json and embed.mjs
- Gaussian math: HIGH — standard formula; verified independently
- Fuse.js CDN import: MEDIUM — CDN path verified; behavior in is:inline context is a known pattern (same as D3 in graph.astro)
- Pitfalls: HIGH — derived from project code inspection and standard canvas API behavior

**Research date:** 2026-03-10
**Valid until:** 2026-09-10 (stable APIs; Fuse.js v7.x API unlikely to change)
