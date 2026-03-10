# Architecture Research

**Domain:** Static knowledge base — embedding pipeline, canvas map, keyboard nav, cyberpunk layer
**Researched:** 2026-03-10
**Confidence:** HIGH (direct analysis of existing codebase + established Astro patterns)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OFFLINE / DEV TIME                               │
│                                                                       │
│  ┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐  │
│  │  Markdown    │    │  scripts/         │    │  src/data/       │  │
│  │  (3 dirs)    │───▶│  embed.mjs        │───▶│  embeddings.json │  │
│  │  frontmatter │    │  Ollama + UMAP    │    │  (committed)     │  │
│  └──────────────┘    └───────────────────┘    └────────┬─────────┘  │
│                                                         │            │
├─────────────────────────────────────────────────────────────────────┤
│                     ASTRO BUILD TIME                                 │
│                                                                       │
│  ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │  Content         │   │  src/lib/        │   │  src/data/      │  │
│  │  Collections     │   │  embeddings.js   │   │  embeddings.json│  │
│  │  (getCollection) │   │  graph.js        │   │  (read at build)│  │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬────────┘  │
│           │                      │                       │           │
│           └──────────────────────┴───────────────────────┘           │
│                                  │                                    │
│                    ┌─────────────▼──────────────────┐                │
│                    │  Astro Pages (frontmatter)      │                │
│                    │  /index  /map  /tags  /[slug]   │                │
│                    │  Data islands (JSON in <script>)│                │
│                    └─────────────┬──────────────────┘                │
│                                  │                                    │
├─────────────────────────────────────────────────────────────────────┤
│                     STATIC OUTPUT (dist/)                            │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  HTML + CSS + client JS (inline modules) + data islands        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                  │                                    │
├─────────────────────────────────────────────────────────────────────┤
│                     CLOUDFLARE PAGES (CDN)                           │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ /        │  │ /map     │  │ /tags/   │  │ /[cat]/[slug]/   │    │
│  │ home     │  │ canvas   │  │ tag pages│  │ article pages    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current State |
|-----------|----------------|---------------|
| `src/content/config.ts` | Zod schema, 3 collections, tag normalization | Existing — no changes needed |
| `src/lib/graph.js` | Build-time shared-tag graph computation | Existing — keep, not used by map |
| `src/lib/embeddings.js` | Build-time: read `src/data/embeddings.json`, typed accessors | NEW |
| `src/layouts/Base.astro` | HTML shell, nav, global styles | Modify: add overlay mounts, status bar, /map nav link, `data-page-type` |
| `src/layouts/Document.astro` | Article page wrapper | Modify: add page-context dataset attributes for keyboard nav |
| `src/pages/index.astro` | Home page | Modify: replace category-grid with search prompt + recently-added |
| `src/pages/map/index.astro` | Canvas map with sidebar, timeline, filter bar | NEW ROUTE |
| `src/pages/graph.astro` | D3 force graph | Keep until /map is done; remove from nav after |
| `src/pages/tags/index.astro` | All-tags listing | Existing — keyboard nav enhancement only |
| `src/pages/tags/[tag].astro` | Per-tag document list | Existing — keyboard nav enhancement only |
| `src/components/SearchOverlay.astro` | Global `/` search, terminal-style prompt | NEW |
| `src/components/KeyboardNav.astro` | Global keydown router, status bar DOM | NEW |
| `src/components/MapCanvas.astro` | Canvas element + all dot-rendering client JS | NEW |
| `src/components/TimelineSlider.astro` | Range selector, play button, gaussian opacity | NEW |
| `src/components/FilterBar.astro` | Tag chips + text input + ANY/ALL toggle | NEW |
| `src/components/MapSidePanel.astro` | Article preview panel (title, tags, summary, link) | NEW |
| `src/data/embeddings.json` | Committed artifact: per-doc id, x, y, date, tags, title, summary | NEW DATA FILE |
| `scripts/embed.mjs` | Offline pipeline: markdown → Ollama → UMAP → JSON | NEW SCRIPT |
| `public/styles/global.css` | CSS custom properties, layout, existing dark theme | Modify: add cyberpunk layer |
| `.claude/commands/` | Slash command skill files | Add: loom-add, loom-deploy, loom-retag, loom-gaps |

---

## Recommended Project Structure

```
loom/
├── src/
│   ├── components/
│   │   ├── DocCard.astro          # existing
│   │   ├── RelatedDocs.astro      # existing
│   │   ├── TagPill.astro          # existing
│   │   ├── FilterBar.astro        # NEW — tag chips + search input + ANY/ALL toggle
│   │   ├── KeyboardNav.astro      # NEW — global keydown handler + status bar DOM
│   │   ├── MapCanvas.astro        # NEW — <canvas> element + client rendering module
│   │   ├── MapSidePanel.astro     # NEW — slide-in article preview panel
│   │   ├── SearchOverlay.astro    # NEW — fullscreen "/" overlay, terminal style
│   │   └── TimelineSlider.astro   # NEW — range input + play button + gaussian weight
│   ├── content/
│   │   └── config.ts              # existing — no changes
│   ├── data/
│   │   └── embeddings.json        # NEW committed artifact (pipeline output)
│   ├── layouts/
│   │   ├── Base.astro             # MODIFY — overlay mounts, status bar, /map nav link
│   │   └── Document.astro         # MODIFY — data-page-type attribute
│   ├── lib/
│   │   ├── graph.js               # existing — leave intact
│   │   ├── graph.test.mjs         # existing
│   │   └── embeddings.js          # NEW — build-time helpers to read/validate JSON
│   └── pages/
│       ├── index.astro            # MODIFY — search prompt + recently added
│       ├── graph.astro            # existing — keep until /map is stable
│       ├── map/
│       │   └── index.astro        # NEW ROUTE /map — thin orchestrator page
│       ├── tags/
│       │   ├── index.astro        # existing
│       │   └── [tag].astro        # existing
│       ├── ai-tools-and-services/
│       │   └── [slug].astro       # existing
│       ├── cloud-ai-platforms/
│       │   └── [slug].astro       # existing
│       └── companies/
│           └── [slug].astro       # existing
├── scripts/
│   ├── validate-output.mjs        # existing
│   └── embed.mjs                  # NEW — offline embedding pipeline
├── public/
│   ├── fonts/                     # existing
│   └── styles/
│       └── global.css             # MODIFY — add cyberpunk CSS layer
└── .claude/
    └── commands/
        ├── loom-add.md            # NEW skill
        ├── loom-deploy.md         # NEW skill (calls scripts/embed.mjs)
        ├── loom-retag.md          # NEW skill
        └── loom-gaps.md           # NEW skill
```

### Structure Rationale

- **`src/data/`** — New directory for committed pipeline artifacts. Keeps generated files distinct from source code and makes `readFileSync` access in frontmatter unambiguous.
- **`src/pages/map/`** — Directory-style route (`/map/`) rather than `map.astro` matches Astro convention and allows future sub-routes (e.g. `/map/debug`).
- **`scripts/embed.mjs`** — Alongside existing `validate-output.mjs`. Not in `src/` because it is not processed by Astro.
- **Component-per-concern** — Each map UI feature (canvas, filter, timeline, panel) owns its `<script>`. They communicate via CustomEvents, not Astro props. This allows independent iteration and prevents a 1000-line script blob in `map/index.astro`.
- **`KeyboardNav` + `SearchOverlay` in `Base.astro`** — Global concerns mount once, persist across all pages.

---

## Architectural Patterns

### Pattern 1: Data Island (existing — extend, don't replace)

**What:** Build-time data is serialized as JSON into `<script type="application/json" id="...">`. Client JS reads it with `JSON.parse(document.getElementById(...).textContent)`.

**When to use:** Any data computed in Astro frontmatter that a client-side module needs. No fetch, no prop drilling.

**Trade-offs:** Zero runtime overhead, works with static output, simple to debug. Slightly inflates HTML. Acceptable for typical collection sizes (hundreds to low thousands).

**Example:**
```astro
---
// map/index.astro
import { readFileSync } from 'node:fs';
const raw = readFileSync(new URL('../../data/embeddings.json', import.meta.url), 'utf-8');
const mapData = raw; // already JSON string
---
<script type="application/json" id="map-data" set:html={mapData}></script>
<script type="module">
  const data = JSON.parse(document.getElementById('map-data').textContent);
  // data is [{id, title, tags, x, y, date, category, summary}, ...]
</script>
```

### Pattern 2: Global Event Bus via CustomEvents

**What:** Components communicate through `document.dispatchEvent(new CustomEvent('loom:event-name', { detail: ... }))` and matching `document.addEventListener('loom:event-name', handler)`.

**When to use:** Cross-component communication without a framework — keyboard nav triggers search overlay, filter bar updates canvas, timeline updates canvas and sidebar list.

**Trade-offs:** Loose coupling enables independent iteration. Harder to trace than direct calls. Use namespaced names (`loom:search-open`, `loom:filter-change`, `loom:time-change`, `loom:dot-click`) to prevent collisions.

**Example:**
```javascript
// KeyboardNav.astro fires
document.dispatchEvent(new CustomEvent('loom:search-open'));

// SearchOverlay.astro listens
document.addEventListener('loom:search-open', () => {
  overlay.classList.add('visible');
  input.focus();
});
```

### Pattern 3: Offline Pipeline → Committed Artifact

**What:** `scripts/embed.mjs` runs locally (developer machine, not Cloudflare). It writes `src/data/embeddings.json` which is committed to git. Astro reads the committed file at build time.

**When to use:** Any computation requiring local tooling unavailable in Cloudflare's build environment (Ollama, Python umap-learn).

**Trade-offs:** Embeddings must be regenerated and committed when documents change. `loom:deploy` skill automates this. The tradeoff is intentional — keeps Cloudflare build fast and dependency-free.

**Incremental update logic:**
```
scripts/embed.mjs:
1. Read existing embeddings.json (or start empty {docs: [], meta: {}})
2. Hash each markdown file (sha256 of content)
3. Skip docs whose hash matches stored hash
4. Embed only new/changed docs via Ollama (POST /api/embeddings, model: nomic-embed-text)
5. Prepend "search_document: " to article text before embedding
6. Merge new embeddings with existing
7. Re-run UMAP on the full merged set (all 768-dim vectors → 2D)
8. Write updated embeddings.json with new coords + updated hashes
```

### Pattern 4: Page-Context Metadata for Keyboard Nav

**What:** Each Astro page (or layout) sets `data-page-type` on `<body>`. The global `KeyboardNav.astro` reads this attribute to adjust `j/k` behavior — which elements count as "items", what `Enter` does, how status bar renders.

**When to use:** Any globally-mounted behavior that needs page-aware state without a router framework.

**Trade-offs:** Convention-based rather than enforced by types. Each layout must set the attribute. Document in `Base.astro` with a clear comment.

**Example:**
```astro
<!-- Base.astro — accepts optional pageType prop -->
---
interface Props { title: string; pageType?: string; }
const { title, pageType = 'generic' } = Astro.props;
---
<body data-page-type={pageType}>
```

Keyboard nav uses: `document.body.dataset.pageType` to switch behavior between `'map'`, `'article'`, `'list'`, `'generic'`.

---

## Data Flow

### Offline Pipeline

```
Markdown files (ai-tools-and-services/, cloud-ai-platforms/, companies/)
    │
    ▼
scripts/embed.mjs
    │  1. Parse frontmatter (gray-matter or simple regex)
    │  2. Prepend "search_document: " to body text
    │  3. POST localhost:11434/api/embeddings {model: nomic-embed-text, prompt: text}
    │  4. Collect 768-dim float array per doc
    │  5. umap-js (or child_process python umap-learn): all vectors → 2D coords
    │  6. Normalize coords to [0,1] viewport space
    │  7. Build output records with hash, title, date, tags, summary, x, y, category
    ▼
src/data/embeddings.json  (committed to git)
    [ { id, title, date, tags, summary, x, y, category, contentHash }, ... ]
```

### Astro Build: Map Page

```
src/data/embeddings.json
    │  (readFileSync in map/index.astro frontmatter)
    ▼
<script type="application/json" id="map-data">  (data island in HTML)
    │
    ▼  (client JS in MapCanvas.astro, SearchOverlay.astro)
Browser reads island once on page load — no additional fetch
```

### Runtime: Map Interactions

```
Page load
    │
    ▼
MapCanvas reads data island → draws all dots on <canvas> at (x*w, y*h)
    │
    ├── Hover dot ────────▶ Draw tooltip at cursor (title + tags)
    │
    ├── Click dot ────────▶ dispatch loom:dot-click {doc}
    │                          └─▶ MapSidePanel: show preview panel
    │                          └─▶ MapCanvas: draw 5 nearest-neighbor lines
    │
    ├── FilterBar change ─▶ dispatch loom:filter-change {tags[], query, mode}
    │                          └─▶ MapCanvas: recalculate per-dot opacity
    │                              (matching dots = full; others = 0.2)
    │
    ├── Timeline drag ────▶ dispatch loom:time-change {center: Date, halfWidth: ms}
    │                          └─▶ MapCanvas: gaussian opacity per dot
    │                              opacity = exp(-0.5 * ((t-center)/sigma)^2)
    │                              floor at 0.1 so all dots remain visible
    │                          └─▶ Chronological list: filter to window ± 2sigma
    │
    └── Play button ──────▶ requestAnimationFrame loop advancing center
                             dispatches loom:time-change each frame
```

### Runtime: Global Keyboard Nav

```
document keydown (KeyboardNav.astro listener)
    │
    ├── "/" ──────▶ e.preventDefault()
    │               dispatch loom:search-open
    │                   └─▶ SearchOverlay: classList.add('visible'), focus input
    │
    ├── "Esc" ────▶ If overlay open: dispatch loom:search-close
    │               Else: deselect / collapse side panel
    │
    ├── "j" / "k" ▶ Query [data-keyboard-item] live from DOM
    │               Move currentIndex ±1, call .focus() on target item
    │               Update status bar: "NORMAL  3/12"
    │
    ├── "Enter" ──▶ Navigate to focused item's href (or data-href attribute)
    │
    └── "g","g" / "G"  ▶ Focus first / last [data-keyboard-item]

Status bar (bottom of viewport, fixed):
    <div id="kb-status-bar">
      <span id="kb-mode">NORMAL</span>
      <span id="kb-context">map · 15 nodes</span>
      <span id="kb-pos">3/15</span>
    </div>
```

### Runtime: Search Overlay

```
User presses "/" → overlay appears
    │
User types → SearchOverlay client JS
    │  Filter over in-memory array built from data island
    │  (title + tags substring match; or Fuse.js fuzzy if added)
    ▼
Result list updates (max 50 items rendered)
    │
    ├── "Enter" / click result ──▶ window.location.href = result.url
    └── "Esc" ──────────────────▶ dispatch loom:search-close → overlay hides
```

---

## Integration Points: New vs. Modified

### Modified Existing Files

| File | What Changes | Why |
|------|-------------|-----|
| `src/layouts/Base.astro` | Mount `<SearchOverlay />` and `<KeyboardNav />` as persistent children; add `/map` nav link; accept optional `pageType` prop | Global UX features live in the shared layout |
| `src/pages/index.astro` | Replace category-grid body with terminal search prompt + recently-added section (10 latest by date) | UC-006 home page redesign |
| `public/styles/global.css` | Add cyberpunk layer: scanline overlay pseudo, `.neon-glow` utility, CRT vignette, typewriter `@keyframes`, CSS custom properties for new effects | UC-015 aesthetic |
| `src/layouts/Document.astro` | Add `data-page-type="article"` to body; mark article title and related-doc links with `data-keyboard-item` | Keyboard nav needs page type signal |
| `src/pages/tags/[tag].astro` | Add `data-page-type="list"`; mark doc card links with `data-keyboard-item` | Keyboard nav j/k through tag results |

### New Files

| File | Integration Point |
|------|------------------|
| `src/pages/map/index.astro` | Route `/map` — reads `embeddings.json` at build time, serializes data island, mounts all map components |
| `src/data/embeddings.json` | Written by `scripts/embed.mjs`, consumed by `map/index.astro` frontmatter via `readFileSync` |
| `src/lib/embeddings.js` | Imported in `map/index.astro` — validates schema, provides typed accessor functions |
| `src/components/MapCanvas.astro` | Used in `map/index.astro` — owns `<canvas>`, all render logic, nearest-neighbor lines |
| `src/components/TimelineSlider.astro` | Used in `map/index.astro` — emits `loom:time-change` events, owns play loop |
| `src/components/FilterBar.astro` | Used in `map/index.astro` — emits `loom:filter-change` events |
| `src/components/MapSidePanel.astro` | Used in `map/index.astro` — listens for `loom:dot-click`, renders preview |
| `src/components/SearchOverlay.astro` | Used in `Base.astro` — listens for `loom:search-open`, reads `map-data` island if present else fetches nothing (filters client-side array) |
| `src/components/KeyboardNav.astro` | Used in `Base.astro` — global keydown, status bar `<div>` |
| `scripts/embed.mjs` | Invoked by `/loom:deploy` skill and manually — NOT part of Astro or Cloudflare build |
| `.claude/commands/loom-add.md` | New Claude Code skill |
| `.claude/commands/loom-deploy.md` | New Claude Code skill — runs `node scripts/embed.mjs` then validates, commits, pushes |
| `.claude/commands/loom-retag.md` | New Claude Code skill |
| `.claude/commands/loom-gaps.md` | New Claude Code skill |

---

## Scaling Considerations

| Scale (docs) | Architecture Notes |
|---|---|
| 15–200 | Current approach — entire dataset in data island, Canvas 2D, client-side filter over in-memory array. No changes needed. |
| 200–1000 | `embeddings.json` at 2D coords + metadata ≈ 100–200KB at 1000 docs — still fast to load. Virtualize chronological list sidebar (don't render 1000 DOM nodes). Consider separating search index from map data island. |
| 1000+ | Consider WebGL (Pixi.js or raw) if Canvas 2D stutters. UMAP re-run on large sets is slow — explore approximate UMAP or incremental neighbor reuse. Consider streaming / chunked JSON load. |

### First Bottleneck

Gaussian opacity recalculation on every `mousemove` / timeline drag event repaints the entire canvas. Fix: throttle `loom:time-change` to animation frames with `requestAnimationFrame`; precompute gaussian weights per doc when slider settles, cache until next `loom:time-change`.

### Second Bottleneck

Client-side search latency as doc count grows past ~500. Fix: pre-build a minified Fuse.js index at Astro build time, serialize as a separate data island or a small JSON file, lazy-load when search overlay first opens.

---

## Anti-Patterns

### Anti-Pattern 1: Running Ollama Inside Astro Build

**What people do:** Import a fetch call to Ollama in an Astro integration or content loader to auto-embed at `astro build` time.

**Why it's wrong:** Cloudflare Pages build workers have no Ollama. Build passes locally, fails silently in CI with a network error or hangs.

**Do this instead:** `scripts/embed.mjs` runs offline only. Commit the output JSON. Cloudflare build reads only the committed file — zero external dependencies.

### Anti-Pattern 2: Canvas Logic in Astro Frontmatter

**What people do:** Generate draw-call strings or complex SVG paths in frontmatter, serialize as template strings.

**Why it's wrong:** Canvas is imperative and stateful — it cannot be prerendered. Frontmatter produces static HTML; canvas state requires a live DOM element.

**Do this instead:** Frontmatter serializes the data island JSON only. All `ctx.drawX()` calls live in a `<script type="module">` inside `MapCanvas.astro`.

### Anti-Pattern 3: One Giant Map Page Script

**What people do:** Put all map JS (canvas render, timeline, filter, side panel, keyboard) in a single 800-line `<script>` block in `map/index.astro`.

**Why it's wrong:** Impossible to test individual concerns, merge conflicts become unmanageable, no clear ownership boundaries.

**Do this instead:** `MapCanvas`, `TimelineSlider`, `FilterBar`, `MapSidePanel` each own their script. They communicate via CustomEvents. `map/index.astro` is a thin orchestrator that mounts components and provides the data island.

### Anti-Pattern 4: Keyboard Nav State in Window Globals

**What people do:** `window.currentFocusIndex = 0` shared between keyboard nav and search overlay as module-level state.

**Why it's wrong:** Stale state survives page context changes. Hard to reset. Causes focus bugs when overlay opens on a page with a different item count.

**Do this instead:** Derive focus state from the DOM on each keypress — query `[data-keyboard-item]` live, don't cache the NodeList. Reset explicitly on `loom:search-open` and page transitions.

### Anti-Pattern 5: Storing Intermediate Embedding Vectors in Git

**What people do:** Commit the full 768-dimensional float arrays alongside 2D coords to `embeddings.json`.

**Why it's wrong:** 15 docs × 768 floats × 8 bytes ≈ 90KB. At 1000 docs ≈ 6MB for raw vectors alone. Git history balloons. The 2D coords and metadata are the only thing Astro needs.

**Do this instead:** `embeddings.json` stores only the output of UMAP (2D coords) + metadata + content hash. Keep the raw vectors in a local cache file (gitignored) for incremental pipeline runs.

---

## Suggested Build Order (Dependency-Aware)

```
Phase 1 — Data Foundation
    scripts/embed.mjs (offline pipeline script)
    src/data/embeddings.json (initial seed — real run or placeholder fixture)
    src/lib/embeddings.js (build-time accessor/validator)
    Unblocks: all map components, search overlay index, loom:deploy skill

Phase 2 — Map Page Skeleton
    src/pages/map/index.astro (data island only, static dot render)
    src/components/MapCanvas.astro (draw dots, hover tooltip — no interaction)
    Validates: pipeline output shape reaches the browser correctly

Phase 3 — Map Interactions
    src/components/FilterBar.astro + loom:filter-change wiring
    src/components/TimelineSlider.astro + loom:time-change wiring
    src/components/MapSidePanel.astro + loom:dot-click wiring
    Nearest-neighbor lines on dot click
    Reason: filter + timeline compose — build and wire in one phase to validate interaction model

Phase 4 — Global Shell Features
    src/components/SearchOverlay.astro
    src/components/KeyboardNav.astro + status bar
    Base.astro modifications (mount overlays, pageType prop)
    Cyberpunk CSS layer (scanlines, glow, typewriter)
    Reason: all require Base.astro modification — batch to minimize layout churn

Phase 5 — Home Page Redesign
    src/pages/index.astro (search prompt + recently added)
    Reason: depends on SearchOverlay (Phase 4); simple once overlay exists

Phase 6 — Claude Code Skills
    .claude/commands/loom-add.md
    .claude/commands/loom-deploy.md (calls scripts/embed.mjs from Phase 1)
    .claude/commands/loom-retag.md
    .claude/commands/loom-gaps.md
    Reason: skills depend on stable pipeline + site; built last

Critical path: embed.mjs → embeddings.json → map/index.astro → MapCanvas → interactions
Everything else (CSS, skills, home page) can proceed in parallel after Phase 1.
```

---

## Sources

- Direct analysis of existing codebase: `src/content/config.ts`, `src/pages/graph.astro`, `src/lib/graph.js`, `src/layouts/Base.astro`, `astro.config.mjs`, `package.json`
- Embedding pipeline design: `.planning/docs/US01.md` — explicit decisions (nomic-embed-text, offline only, committed JSON, incremental, search_document prefix)
- Canvas vs. SVG scaling guidance: `.planning/docs/US01.md` Scale Considerations ("Canvas or WebGL for the dot map — SVG won't scale past ~500 nodes smoothly")
- Astro static output constraints: `astro.config.mjs` (`output: 'static'`) — confirmed no server-side rendering
- Data island pattern: established usage in existing `graph.astro` (`<script type="application/json" id="graph-data">`)
- CustomEvent pattern for cross-component communication: vanilla JS standard, no framework dependency required

---

*Architecture research for: Loom v1.1 — embedding pipeline, canvas map, keyboard nav, cyberpunk layer*
*Researched: 2026-03-10*
