# Project Research Summary

**Project:** Loom v1.1 — Cyberpunk Knowledge Terminal
**Domain:** Personal knowledge base — semantic embedding map, terminal UX, content management skills
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

Loom v1.1 is an upgrade to an existing Astro 5 static site, replacing a D3 force-directed graph with a semantically meaningful embedding map. The core innovation is an offline pipeline: markdown documents are embedded via Ollama (`nomic-embed-text`), reduced to 2D via UMAP, and committed as `embeddings.json` — a pre-computed artifact that Cloudflare's build reads without any server-side dependencies. The browser renders those 2D coordinates on a Canvas element with interactive filter lenses, a Gaussian-opacity timeline slider, and a terminal-style search overlay. This architecture cleanly separates offline AI computation (local machine only) from static deployment (Cloudflare Pages), which is both the central design constraint and its primary strength.

The recommended approach is a six-phase build sequence driven by a hard dependency chain: the embedding pipeline must exist before the map can be built, the map must render before filter lenses can be wired, and the global shell features (search overlay, keyboard nav) must be stable before the home page or Claude skills can reference them. All four research files converge on the same sequence, validating it as the correct build order. The data island pattern (JSON serialized into `<script type="application/json">` at Astro build time) is already established in the codebase (`graph.astro`) and should be extended rather than replaced.

The primary risks are operational (Ollama not running silently corrupting pipeline state, Canvas SSR boundary violations causing build failures) and experiential (HiDPI blurriness undermining the aesthetic, keyboard handlers accumulating across navigations). These risks are well-understood and have concrete prevention strategies — none require architectural pivots, only disciplined initial setup. The Gaussian opacity timeline slider is the only genuinely novel UX pattern without prior art; all other features map cleanly to established library capabilities.

---

## Key Findings

### Recommended Stack

The v1.1 additions require four new npm packages on top of the existing Astro 5 stack. For the offline pipeline (runs locally, never on Cloudflare): `ollama@^0.6.3` (official JS SDK for Ollama REST API), `umap-js@^1.4.0` (Google PAIR's JS UMAP port), and `gray-matter@^4.x` (frontmatter parsing outside Astro's build context). For the browser (bundled by Vite): `regl-scatterplot@^1.15.0` (purpose-built WebGL scatter plot — scales to 20M points, built-in opacity encoding and hit testing, v1.15.0 released January 2026) and `fuse.js@^7.1.0` (zero-dependency fuzzy search, 7KB, builds index from plain JSON at runtime). Keyboard navigation and cyberpunk CSS effects require no new packages — ~20 lines of vanilla JS and existing CSS custom properties cover them entirely.

**Core technologies:**
- `regl-scatterplot@^1.15.0`: WebGL dot map — purpose-built for 2D scatter at scale, instanced rendering, built-in opacity encoding and hit testing
- `fuse.js@^7.1.0`: Client-side fuzzy search — zero deps, lazy-indexed from the same JSON the map already loaded
- `ollama@^0.6.3`: Embedding pipeline — official Ollama JS SDK, local-only, Node.js `>=18`
- `umap-js@^1.4.0`: Dimensionality reduction — run offline in Node.js, synchronous API, stable
- `gray-matter@^4.x`: Frontmatter parsing — offline script only, version 4 stable for years

### Expected Features

**Must have (table stakes — v1.1 is incomplete without these):**
- Embedding similarity map replacing the force graph — the core milestone deliverable
- Side panel on dot click — standard UX for embedding explorers (TensorFlow Projector, Atlas, etc.)
- Tag filter + search filter lenses with ANY/ALL toggle — extends existing tag mental model to the new map
- Terminal `/` search overlay — the navigation backbone for keyboard-first users
- Home page with search prompt and recently-added articles — replaces the current dead-end landing page
- `/loom:add` skill — closes the content capture loop
- `/loom:deploy` skill — single command that validates, re-embeds, and pushes
- Cyberpunk aesthetic enhancements (scanlines, CRT vignette, typewriter headings) — completes the visual identity started in v1.0

**Should have (add after core is stable):**
- Vim keyboard navigation (`j/k/Enter/Esc/gg/G`) — high value but not blocking
- Timeline slider with Gaussian opacity — novel UX, complex to implement, depends on stable map rendering
- Neighbor lines on click — nice-to-have map interaction
- Play button for temporal animation — depends on timeline slider
- `/loom:retag` and `/loom:gaps` skills — maintenance and strategy tools

**Defer (v1.2+):**
- WebGL upgrade via `regl-scatterplot` if Canvas 2D degrades at 500+ docs (Canvas 2D is sufficient at current scale)
- Parametric UMAP for position stability (explicitly resolved as "not required" in US01.md)
- Chronological list sidebar during timeline scrub

### Architecture Approach

The architecture is a strict three-tier separation: offline pipeline (local machine, Ollama + Node.js) writes a committed JSON artifact; Astro build time reads that artifact and serializes it as a data island in static HTML; the browser reads the island once on load and runs all interaction client-side with no additional fetches. Cross-component communication uses the CustomEvent bus pattern (`loom:dot-click`, `loom:filter-change`, `loom:time-change`, `loom:search-open`) — loose coupling that enables independent component development. Each map UI feature (canvas, filter bar, timeline, side panel) owns its own `<script>` block; `map/index.astro` is a thin orchestrator. Global shell features (search overlay, keyboard nav) mount once in `Base.astro` and persist across all pages.

**Major components:**
1. `scripts/embed.mjs` — offline pipeline: frontmatter parse → Ollama embed → UMAP reduce → write `src/data/embeddings.json`
2. `src/pages/map/index.astro` — thin orchestrator: reads committed JSON at Astro build time, serializes data island, mounts map components
3. `src/components/MapCanvas.astro` — Canvas rendering, hover/click/filter/timeline opacity logic, cleanup lifecycle
4. `src/components/SearchOverlay.astro` + `src/components/KeyboardNav.astro` — global shell, mounted once in `Base.astro`
5. `src/components/FilterBar.astro`, `TimelineSlider.astro`, `MapSidePanel.astro` — map interaction components communicating via CustomEvents
6. `.claude/commands/loom-*.md` — four Claude Code skills for content capture and deployment

### Critical Pitfalls

1. **Canvas SSR `window`/`document` undefined during Astro build** — Guard all browser API access inside lifecycle callbacks, or mark the canvas component `client:only="vanilla"`. Never access `window` or `document` at module scope. Establish this boundary pattern before writing any canvas initialization code.

2. **Ollama not running silently corrupting embedding state** — Add an explicit Ollama health check (`GET localhost:11434/api/version`) as the first step of the pipeline. Write the output file atomically (temp file + rename) only after all documents in the batch succeed. `/loom:deploy` must fail loudly, not quietly continue with partial data.

3. **UMAP full re-run on every deploy becoming too slow** — Separate the pipeline into two phases from day one: (1) embed only new/changed docs (track content hashes), (2) re-run UMAP on the full cached vector set. Keep raw vectors in a gitignored cache file. Build this caching architecture in Phase 1 before any documents accumulate.

4. **Canvas HiDPI/Retina blurriness** — Apply `devicePixelRatio` scaling in the initial canvas setup (`canvas.width = cssWidth * dpr`, then `ctx.scale(dpr, dpr)`). Do this before implementing any interactions — retrofitting it later requires rechecking all hit detection coordinate math.

5. **Keyboard handler accumulating multiple listeners across navigations** — Add a singleton guard (`window.__loomKeyboardInitialized`) as the first line of the keyboard nav module. Initialize once in `Base.astro`, not on individual pages. Guard all key handlers with an input-context check (`if (target.tagName === 'INPUT') return`).

---

## Implications for Roadmap

Based on combined research, the dependency chain is unambiguous and all four research files agree on the same build sequence. The suggested phase structure follows directly from the architecture's critical path.

### Phase 1: Data Foundation (Embedding Pipeline)

**Rationale:** Everything else in v1.1 depends on `embeddings.json` existing. The pipeline is also where the most operationally risky decisions must be made correctly from the start — incremental caching, Ollama health check, atomic writes. Getting this wrong creates technical debt that is expensive to fix after map interactions are built on top of it.

**Delivers:** `scripts/embed.mjs` (offline pipeline with content-hash-based incremental updates), `src/data/embeddings.json` (initial seed from current corpus), `src/lib/embeddings.js` (build-time validator/accessor). Verified end-to-end: pipeline runs, JSON is committed, Astro build reads it without errors.

**Addresses:** Offline embedding pipeline (P1 table stakes), foundation for `/loom:deploy`
**Avoids:** Pitfall 2 (UMAP full re-run on every deploy), Pitfall 3 (Ollama corrupt state)
**Research flag:** Standard — incremental pipeline patterns (content hashing, atomic writes) are well-documented. No additional research needed.

---

### Phase 2: Map Page Skeleton

**Rationale:** Validates that pipeline output reaches the browser correctly before any interaction logic is built on top. Static dot rendering with no interactions is the fastest way to verify the data island pattern, canvas setup, and HiDPI scaling are all correct.

**Delivers:** `/map` route with Canvas 2D dot rendering, hover tooltip (title + tags), correct HiDPI scaling, SSR boundary properly established. No interactions yet — just data flowing end-to-end.

**Uses:** `regl-scatterplot` (or Canvas 2D for initial pass), data island pattern from `map/index.astro`
**Avoids:** Pitfall 1 (Canvas SSR boundary), Pitfall 4 (HiDPI blurriness), Pitfall 8 (memory leak — establish cleanup pattern before interactions)
**Research flag:** Standard — Canvas 2D and data island patterns are already established in the codebase (`graph.astro`). No additional research needed.

---

### Phase 3: Map Interactions

**Rationale:** Filter lenses and timeline compose together — tag filter opacity and Gaussian time filter both feed into the per-dot opacity calculation. Building them in separate phases would require touching the opacity logic twice. Doing all map interactions in one phase validates the CustomEvent bus architecture and the composed filter predicate.

**Delivers:** `FilterBar` (tag chips + text input + ANY/ALL toggle), `TimelineSlider` (Gaussian opacity + play button), `MapSidePanel` (slide-in article preview), nearest-neighbor lines on click. All four wired via CustomEvents. Filter, timeline, and click compose correctly.

**Uses:** CustomEvent bus (`loom:filter-change`, `loom:time-change`, `loom:dot-click`), Gaussian opacity formula (`exp(-0.5 * ((t-center)/sigma)^2)`, floor at 10%)
**Avoids:** Performance trap of repainting on every slider tick (use `requestAnimationFrame` + debounce), UX pitfall of opacity going to zero at edges
**Research flag:** The Gaussian opacity timeline has no prior art as a reusable component — needs implementation from scratch per UC-008 spec. A targeted research pass on timeline slider UX and sidebar list virtualization is recommended during phase planning.

---

### Phase 4: Global Shell Features

**Rationale:** Search overlay, keyboard nav, and cyberpunk CSS all require modifying `Base.astro`. Batching these changes minimizes layout churn. The search overlay must exist before the home page can reference it, and keyboard nav must be stable before the map page's `j/k`-vs-canvas-pan conflict can be resolved.

**Delivers:** `SearchOverlay` (terminal `loom>` prompt, Fuse.js index, Esc/Enter behavior), `KeyboardNav` (singleton handler, `j/k/gg/G/Esc`, status bar, input guard), `Base.astro` modifications (overlay mounts, `/map` nav link, `pageType` prop), cyberpunk CSS layer (scanlines, CRT vignette, typewriter `@keyframes`, neon glow utilities).

**Uses:** `fuse.js@^7.1.0`, vanilla JS keyboard handler, static CSS `repeating-linear-gradient` pseudo-element (not animated)
**Avoids:** Pitfall 5 (keyboard/input conflict), Pitfall 6 (listener accumulation), Pitfall 7 (CSS animation GPU layer explosion — scanlines must be static, not animated)
**Research flag:** Standard — all patterns are well-documented.

---

### Phase 5: Home Page Redesign

**Rationale:** Depends on `SearchOverlay` (Phase 4) being stable. Once the overlay exists, wiring the home page search prompt to it is straightforward. This phase is intentionally short and separated from Phase 4 only to keep `Base.astro` changes isolated from `index.astro` changes.

**Delivers:** Redesigned `src/pages/index.astro` with terminal search prompt (invokes search overlay), recently-added articles list (last 10 by date from content collection). Removes the current category-grid landing page.

**Addresses:** Home page with search prompt and recent articles (P1 table stakes)
**Research flag:** No research needed — standard Astro content collection query.

---

### Phase 6: Claude Code Skills

**Rationale:** Skills depend on a stable pipeline (Phase 1) and a working site (Phases 2-5). `/loom:deploy` calls `scripts/embed.mjs` from Phase 1. `/loom:add` creates documents the pipeline must process. Building skills last ensures the underlying system they orchestrate is fully tested.

**Delivers:** `.claude/commands/loom-add.md` (URL to markdown with tag normalization against existing vocabulary), `.claude/commands/loom-deploy.md` (validate + embed + commit + push with Ollama health check), `.claude/commands/loom-retag.md` (taxonomy reshaping), `.claude/commands/loom-gaps.md` (thin-coverage identification).

**Addresses:** All four Claude Code skills (P1 `/loom:add` and `/loom:deploy`, P2 `/loom:retag` and `/loom:gaps`)
**Avoids:** Integration gotcha: `/loom:add` must pass the current tag list to Claude to prevent tag vocabulary drift
**Research flag:** No research needed — skills are Claude prompt files, not code.

---

### Phase Ordering Rationale

- **Pipeline before map:** `embeddings.json` must exist at Astro build time. There is no mock path — the real file must exist before the map route can be built.
- **Map skeleton before interactions:** Validating the SSR/client boundary and HiDPI scaling before interactions prevents expensive retrofitting of coordinate math.
- **Map interactions together:** Filter lenses and timeline both mutate per-dot opacity — they must be designed as a composed system, not bolted on sequentially.
- **Global shell before home page:** `SearchOverlay` mounted in `Base.astro` must exist before `index.astro` can invoke it.
- **Skills last:** Each skill wraps a fully functioning system. Skills written before the system is stable need to be updated when the system changes.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Gaussian timeline):** No prior art for Gaussian opacity timeline as a reusable component. The UC-008 spec defines the math; implementation details (slider UX, sidebar list virtualization, play-button loop architecture) benefit from a targeted research pass before implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Incremental embedding pipeline patterns are well-documented (content hashing, atomic writes, Ollama health check).
- **Phase 2:** Canvas 2D data island pattern already exists in the codebase (`graph.astro`).
- **Phase 4:** Fuse.js + Astro integration is extensively documented; keyboard nav is vanilla JS.
- **Phase 5:** Standard Astro content collection query.
- **Phase 6:** Claude Code skill files are prompt documents, not code.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified against npm registry. Existing stack (Astro 5, Cloudflare Pages) is in production. |
| Features | HIGH | Features defined by US01.md (primary source, decisions already resolved). Technical feasibility confirmed for all features. |
| Architecture | HIGH | Based on direct codebase analysis of existing patterns (`graph.astro` data island, `astro.config.mjs` static output). No speculation. |
| Pitfalls | MEDIUM-HIGH | Core patterns verified against official docs (MDN HiDPI, Astro troubleshooting, umap-learn docs, Ollama API). Implementation specifics require testing; all recovery costs are LOW to MEDIUM. |

**Overall confidence:** HIGH

### Gaps to Address

- **`umap-js` vs Python `umap-learn`:** `umap-js` is stable but last published 2 years ago. For 15-200 docs it is sufficient. If the pipeline runs slowly in practice during Phase 1, falling back to Python `umap-learn` is a documented alternative — document this decision point in the Phase 1 plan.

- **Canvas 2D vs `regl-scatterplot` for initial implementation:** FEATURES.md defers the WebGL upgrade to v1.2+, but STACK.md recommends `regl-scatterplot` from the start given the 1000+ node scale requirement in US01.md. Resolve during Phase 2 planning: if the collection is unlikely to exceed 500 docs near-term, Canvas 2D is simpler to start with; if the canonical design target is 1000+ nodes, start with `regl-scatterplot` directly.

- **`embeddings.json` location — `src/data/` vs `public/`:** ARCHITECTURE.md recommends `src/data/embeddings.json` (read via `readFileSync` in frontmatter, serialized as data island, no additional fetch). STACK.md examples use `public/embeddings.json` (served as a static file, fetched client-side asynchronously). These are meaningfully different trade-offs: `src/data/` avoids a fetch but inflates HTML at scale; `public/` is lazier and better at 300+ docs. Decide during Phase 2 planning based on projected corpus size.

---

## Sources

### Primary (HIGH confidence)
- `.planning/docs/US01.md` — explicit design decisions, resolved questions, scale targets
- Direct codebase analysis: `astro.config.mjs`, `src/content/config.ts`, `src/pages/graph.astro`, `src/lib/graph.js`, `src/layouts/Base.astro`
- [regl-scatterplot npm](https://www.npmjs.com/package/regl-scatterplot) — v1.15.0, January 2026
- [fuse.js npm](https://www.npmjs.com/package/fuse.js) — v7.1.0
- [ollama npm](https://www.npmjs.com/package/ollama) — v0.6.3, official Ollama JS SDK
- [MDN devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) — HiDPI canvas guidance
- [web.dev Canvas HiDPI](https://web.dev/articles/canvas-hidipi) — DPR scaling patterns
- [Astro Troubleshooting Guide](https://docs.astro.build/en/guides/troubleshooting/) — SSR boundary documentation
- [umap-learn transform()](https://umap-learn.readthedocs.io/en/latest/transform.html) — incremental embedding
- [nomic-embed-text Ollama library](https://ollama.com/library/nomic-embed-text) — `search_document:` prefix requirement
- [Ollama API docs](https://docs.ollama.com/api/errors) — health check endpoint and error handling

### Secondary (MEDIUM confidence)
- [GitHub: flekschas/regl-scatterplot](https://github.com/flekschas/regl-scatterplot) — 20M point scale claim, active maintenance
- [umap-js npm](https://www.npmjs.com/package/umap-js) — v1.4.0, Google PAIR (stable but last published 2 years ago)
- Astro GitHub Issues #5601, #8849 — `client:only` and SSR failure modes
- umap-learn GitHub Issues #263, #771 — incremental embedding stability discussion
- Smashing Magazine CSS GPU animation — composite layer guidance (principles still apply, article is older)

### Tertiary (LOW confidence)
- Gaussian opacity timeline — no prior art; feasibility is HIGH (pure math + Canvas opacity), but reference implementations do not exist
- CYBERCORE CSS framework — reference only; project implements its own cyberpunk CSS

---

*Research completed: 2026-03-10*
*Ready for roadmap: yes*
