# Feature Research

**Domain:** Personal knowledge base — cyberpunk terminal aesthetic, semantic embedding map, vim navigation, content management skills
**Researched:** 2026-03-10
**Confidence:** HIGH (features defined by US01.md; research confirms technical feasibility of implementation approaches)

---

## Context: This Is a v1.1 Research File

v1.0 delivered: tag browsing, related-docs sidebar, force-directed D3 graph, dark/neon theme, `/loom:research`, `/loom:organize`, `/loom:validate`, Cloudflare Pages deploy.

This file covers **new features only** for v1.1: embedding map, filter lenses, terminal search, home page, vim nav, timeline slider, new skills (add/deploy/retag/gaps), and cyberpunk aesthetic enhancements.

---

## Feature Landscape

### Table Stakes (Users Expect These)

For a v1.1 upgrade to an existing knowledge base site, these are the features that must work correctly for the milestone to feel complete and coherent. Missing any = the upgrade feels broken or half-shipped.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Embedding similarity map replaces force graph | The v1.1 milestone is explicitly positioned around this replacement. Shipping v1.1 without it means the core upgrade never happened. | HIGH | Offline pipeline (Ollama + nomic-embed-text + UMAP/t-SNE) outputs JSON; Astro consumes at build time. Canvas/WebGL rendering required for scale past ~500 nodes. |
| Side panel on dot click | Standard UX for scatter plot exploration — clicking a point reveals detail without losing the map context. Every modern embedding explorer (TensorFlow Projector, Atlas, etc.) does this. | MEDIUM | Panel shows title, tags, summary, link. Slide-in from right or bottom. Must not obscure most of the map. |
| Tag filter on the map | Users who navigate by tag today expect that lens to carry over to the new map view. | MEDIUM | Matching dots glow/brighten, non-matching dims to ~20% opacity. Layout does NOT change — only visual emphasis. |
| Search filter on the map | Complement to tag filter. Users type a term, matching docs highlight. | MEDIUM | Uses the same search index as the `/` global search. Composable with tag filter via ANY/ALL toggle. |
| Terminal-style `/` search overlay | The PRD explicitly frames this as the entry point for navigation. Without it, keyboard-first users have no fast path to content. | MEDIUM | `loom> _` prompt with blinking cursor. Fuse.js against pre-built JSON index (title + tags + summary). Esc dismisses, Enter navigates. |
| Home page with search + recent articles | An index page that does nothing useful is a dead end. A home page with a visible search prompt and recent articles provides immediate orientation for the returning user. | LOW | Search prompt invokes the same `/` overlay. Recent articles = last N by date from content collection. |
| `/loom:add` skill (URL to article) | Filling the content loop: without a fast capture mechanism, the embedding map has no new content to show. | MEDIUM | Fetch URL, Claude summarizes, creates markdown following TEMPLATE.md with inferred tags and category. File not committed — curator reviews first. |
| `/loom:deploy` skill (validate + embed + push) | The pipeline for making new content visible on the live site. Without it, the offline embedding step has no trigger. | MEDIUM | Runs `/loom:validate`, refuses if errors. Re-embeds new/changed docs via Ollama. Commits + pushes. Cloudflare auto-builds. |

### Differentiators (What Makes This More Than a Standard Knowledge Graph Site)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Semantic layout (not force layout) | Force-directed graphs produce arbitrary layouts — same data, different random seed, different picture. Embedding-derived positions are *meaningful*: spatially close = semantically similar. This is the core epistemic upgrade of v1.1. | HIGH | UMAP/t-SNE from nomic-embed-text 768d vectors. Position stability is NOT required (per resolved decisions), so positions can shift between runs as collection grows. |
| Neighbor lines on click | On-demand connectivity view: click a dot, see lines to its 5 nearest neighbors. Gives the "connection view" feel without cluttering the default map with edges. | MEDIUM | Computed from nearest-neighbor data in the embedding JSON. Draw with Canvas lines or SVG overlay. Lines disappear when another dot is clicked or panel is dismissed. |
| Gaussian opacity timeline slider | Binary appear/disappear is jarring. Gaussian falloff means documents at the edge of a time window fade gracefully — the user always sees *where* documents are, even outside the window. Preserves spatial context while emphasizing time range. | HIGH | This is novel UX. No library provides it out of the box. Must implement opacity-per-dot logic: `opacity = exp(-((doc_date - center)^2) / (2 * sigma^2))` where sigma scales with window width. |
| Play button (temporal animation) | Watching the knowledge base grow over time is satisfying and reveals research burst patterns. | LOW | Auto-scrub: increment timeline center by fixed interval, re-apply gaussian, requestAnimationFrame loop. |
| ANY/ALL toggle for multi-tag filter | Power-user filtering without building a full query language. ANY = union (show anything touching any selected tag), ALL = intersection (show only docs with all selected tags). | LOW | Boolean logic on tag arrays. Toggle rendered in filter bar next to tag chips. |
| Composable filter lenses | Timeline + tag filter + search filter all apply simultaneously. The user doesn't have to choose — they layer. | MEDIUM | Single filter predicate composed from: time range (gaussian weight), tag match, text match. All three feeds into the dot opacity/glow calculation. |
| Vim keyboard navigation | Turns the site into a terminal-native experience. `j/k` to move through lists, `Enter` to open, `gg/G` for top/bottom, `/` to search, `Esc` to close/back. Status bar shows current mode. | MEDIUM | Global `keydown` handler. Focus management via a "focused item" index. Works on index pages, tag pages, article pages, and the map. Must be disabled when typing in text inputs. |
| Cyberpunk aesthetic enhancements | Scanlines, CRT overlay, typewriter headings, ASCII dividers, neon glow on interactive elements. Not cosmetic extras — these are what make the site feel like a piece of fiction rather than a standard static site. | MEDIUM | CSS-only for static effects (scanlines via repeating-linear-gradient + pseudo-element). Typewriter via JS character-by-character reveal on page load. ASCII dividers as static strings. CRT flicker via CSS animation. |
| `/loom:retag` skill | Tag hygiene at scale. As the collection grows from 15 to hundreds of docs, tags drift — synonyms accumulate, broad tags get unwieldy. Retag is the power tool for taxonomy reshaping. | MEDIUM | Claude reads all frontmatter, identifies merge candidates or split opportunities, rewrites tags across affected files. |
| `/loom:gaps` skill | Proactive content strategy. Shows tags with 1-2 docs and suggests research directions. Closes the loop between the knowledge map (what exists) and what to add next. | LOW | Read all frontmatter, count tag frequencies, flag thin coverage, generate suggestions via Claude. Output as a list, not a commit. |

### Anti-Features (Explicitly Avoid)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaborative editing | Seems like a "nice to have" for sharing | Single-user tool — adds auth, CRDT, WebSocket complexity with zero value | Git + Claude skills for all content management |
| Server-side search / vector search API | "More powerful" than client-side fuzzy | Requires a server; breaks the static + Cloudflare Pages deployment model | Pre-built Fuse.js index at build time. Sufficient for hundreds of docs. |
| Position stability between UMAP runs | Users may expect consistent map geography | Not required per resolved decisions. Parametric UMAP or fixed reference points add significant complexity for a personal tool with 15-200 docs. | Accept position drift. The collection is too small for users to have memorized positions. |
| SVG for the dot map | Familiar, DOM-accessible | SVG degrades past ~500 nodes. The map must scale to thousands of documents. | Canvas (for now) with WebGL as upgrade path (regl-scatterplot is the reference library). |
| Mobile-optimized map | Broad accessibility | Map is inherently desktop-first (drag, zoom, hover). The PRD explicitly defers mobile. Canvas/WebGL interactions are particularly awkward on touch. | Ensure the site doesn't break on mobile but don't optimize it. |
| Full UMAP/t-SNE in the browser | Avoid a server-side step | UMAP in JS (umap-js) is slow on large datasets and runs in the main thread. For 200+ docs, this blocks the UI. | Offline pipeline at build time via Python (umap-learn). Output 2D coords as JSON. Browser only renders pre-computed positions. |
| Wikilinks `[[...]]` | Familiar from Obsidian | Would require modifying existing markdown content. Tag-based relationships already serve this purpose. | Tag overlap as the relationship primitive (already built in v1.0). |
| Theme toggle (light mode) | Accessibility instinct | The cyberpunk aesthetic IS the dark theme. A light mode halves CSS work, undermines visual identity, and isn't needed for a single-user personal tool. | Dark only. If contrast is a concern, ensure WCAG AA on body text within the dark theme. |
| RSS/Atom feed | Blog-ish feature | This is a personal archive, not a publication. No audience. | Skip unless the curator wants to make it public someday. |
| Separate timeline page | Initial design option | Merging timeline into the map view as a slider is strictly better — context (spatial layout) is preserved while scrubbing time. A standalone timeline page provides less information. | Timeline slider composable with the map (per resolved decisions). |

---

## Feature Dependencies

```
[Offline Embedding Pipeline]
    ├──produces──> embeddings.json (2D coords + metadata per doc)
    │                   │
    │                   ├──required by──> [Embedding Similarity Map] (UC-003)
    │                   │                       │
    │                   │                       ├──enables──> [Side Panel on Click] (UC-003)
    │                   │                       ├──enables──> [Neighbor Lines on Click] (UC-003)
    │                   │                       ├──enables──> [Map Filter Lenses] (UC-004)
    │                   │                       └──enables──> [Timeline Slider] (UC-008)
    │                   │
    │                   └──required by──> [/loom:deploy] triggers re-embed (UC-010)
    │
    └──triggered by──> [/loom:deploy skill] (UC-010)
                            │
                            └──requires──> [/loom:validate] passes first (already built)

[Search Index JSON] (pre-built at Astro build time)
    ├──required by──> [Terminal `/` Search Overlay] (UC-005)
    ├──required by──> [Map Search Filter] (UC-004)
    └──required by──> [Home Page Search Prompt] (UC-006)

[Home Page] (UC-006)
    └──enhances──> [Terminal `/` Search] — search prompt on home page invokes same overlay

[Vim Keyboard Nav] (UC-007)
    └──integrates with──> [Terminal `/` Search] — `/` key opens the overlay

[Tag Filter] (already in v1.0, tag index exists)
    └──extends into──> [Map Filter Lenses] — same tag data, new visual application

[Map Filter Lenses] (UC-004)
    └──composes with──> [Timeline Slider] (UC-008)
                             └──requires──> [Embedding Map] for gaussian opacity per dot

[Cyberpunk Aesthetic] (UC-015/016)
    └──enhances──> All visual components — scanlines + CRT as global overlay, typewriter on headings,
                   ASCII dividers between content sections, neon glow on interactive dots/nav items
```

### Dependency Notes

- **Offline embedding pipeline is the critical dependency**: UC-003, UC-004, and UC-008 all require the pre-computed `embeddings.json`. The pipeline (Ollama + nomic-embed-text + UMAP + Python script) must be built and documented before the map can be developed.
- **`/loom:deploy` requires `/loom:validate`**: Already built in v1.0. The deploy skill wraps it — no separate work needed for validation.
- **Search index is shared**: The same pre-built Fuse.js-compatible JSON index feeds the global search overlay, the map search filter, and the home page prompt. Build once, use three places.
- **Vim nav and terminal search are tightly coupled**: The `/` keybinding opens the terminal search overlay. Vim nav must yield focus to the search overlay when it's open, and resume when Esc is pressed. Implement them together.
- **Map filter lenses require the map to exist**: Cannot develop UC-004 until UC-003 canvas/WebGL rendering is functional.
- **Timeline slider requires per-dot opacity control**: The gaussian opacity logic must be integrated into the map rendering loop. Timeline cannot be bolted on top after the fact — it needs to be designed into the rendering architecture from the start.

---

## MVP Definition

This is a v1.1 milestone on an existing site — "MVP" here means the minimum for the milestone to feel complete and worth shipping.

### Launch With (v1.1 core)

- [ ] **Offline embedding pipeline** — the foundation. Without it, nothing else in v1.1 ships.
- [ ] **Embedding similarity map** (Canvas, basic dot rendering, click → side panel) — the flagship feature of v1.1.
- [ ] **Tag + search filter lenses with ANY/ALL toggle** — extends existing tag mental model to the new map.
- [ ] **Terminal `/` search overlay** — provides fast navigation that the home page and vim nav build on.
- [ ] **Home page with search prompt and recent articles** — replaces the current landing experience.
- [ ] **`/loom:add` skill** — completes the capture loop.
- [ ] **`/loom:deploy` skill** — makes new content deployable without manual steps.
- [ ] **Cyberpunk aesthetic enhancements** — scanlines and CRT complete the visual identity started in v1.0.

### Add After Core Is Stable (v1.1 polish)

- [ ] **Vim keyboard navigation** — high value but not blocking. Add once search overlay and home page work.
- [ ] **Timeline slider with gaussian opacity** — complex UX; add after map rendering is stable.
- [ ] **Neighbor lines on click** — nice-to-have map interaction; add after basic click + side panel works.
- [ ] **Play button for timeline** — depends on timeline slider existing.
- [ ] **`/loom:retag` skill** — useful but not urgent; add when tag drift becomes noticeable.
- [ ] **`/loom:gaps` skill** — strategic tool; add last.

### Future Consideration (v1.2+)

- [ ] **WebGL upgrade for the map** — if Canvas performance degrades at 500+ docs, migrate to regl-scatterplot.
- [ ] **Parametric UMAP** — if position stability becomes important as collection reaches hundreds of docs.
- [ ] **Chronological list sidebar on timeline** — the UC-008 spec mentions a scrollable article list alongside the map during timeline scrub. Useful but complex; defer until timeline slider ships and feels stable.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Offline embedding pipeline | HIGH | HIGH | P1 — blocks everything |
| Embedding similarity map (Canvas) | HIGH | HIGH | P1 — flagship |
| Tag + search filter lenses | HIGH | MEDIUM | P1 — core navigation |
| Terminal `/` search overlay | HIGH | MEDIUM | P1 — navigation backbone |
| Home page (search + recent) | MEDIUM | LOW | P1 — entry point |
| `/loom:add` skill | HIGH | MEDIUM | P1 — content capture |
| `/loom:deploy` skill | HIGH | MEDIUM | P1 — deployment automation |
| Cyberpunk aesthetic (scanlines, CRT, typewriter) | MEDIUM | MEDIUM | P1 — visual identity |
| Vim keyboard navigation | HIGH | MEDIUM | P2 — polish layer |
| Timeline slider (gaussian) | HIGH | HIGH | P2 — complex UX |
| Neighbor lines on click | MEDIUM | LOW | P2 — map interaction |
| Play button | LOW | LOW | P2 — depends on slider |
| ANY/ALL toggle | MEDIUM | LOW | P2 — bundled with filter lenses |
| `/loom:retag` skill | MEDIUM | MEDIUM | P2 — maintenance tool |
| `/loom:gaps` skill | LOW | LOW | P3 — strategy tool |
| WebGL map upgrade | LOW | HIGH | P3 — future scale concern |

**Priority key:** P1 = must have for v1.1 launch, P2 = should have, add when core is stable, P3 = defer to v1.2+

---

## Competitor Feature Analysis

This is a personal tool with no direct competitors, but these reference products inform expected UX behaviors:

| Feature | TensorFlow Projector | Obsidian (graph view) | Our Approach |
|---------|---------------------|----------------------|--------------|
| Embedding map | UMAP/t-SNE/PCA, 3D WebGL, click for detail | Force-directed, tag-based edges, click to open | 2D Canvas, semantic positions, side panel (not navigation) |
| Search overlay | None | Command palette (Cmd+P) | Terminal `/` prompt with blinking cursor — role-play aesthetic |
| Tag filtering on map | Color by category only | Filter by tag to subgraph | Highlight (glow/dim) without changing layout |
| Timeline | None | None | Gaussian opacity slider — novel, not found elsewhere |
| Keyboard navigation | None | Partial | Full vim-style with status bar |
| Content management | None | Built-in editor + plugins | Claude Code skills (`/loom:add`, `/loom:deploy`) |
| Aesthetic | Functional / research tool | Clean, minimal | Cyberpunk terminal — intentional personality |

---

## Sources

- Project context: `.planning/PROJECT.md` and `.planning/docs/US01.md` — HIGH confidence (primary source, design decisions already resolved)
- nomic-embed-text model: `https://ollama.com/library/nomic-embed-text` — HIGH confidence (official Ollama library page)
- regl-scatterplot for Canvas/WebGL scatter: `https://github.com/flekschas/regl-scatterplot` — MEDIUM confidence (GitHub, active project)
- PAIR scatter-gl for WebGL: `https://github.com/PAIR-code/scatter-gl` — MEDIUM confidence (Google PAIR, well-maintained)
- Fuse.js fuzzy search: `https://www.fusejs.io/` — HIGH confidence (stable, well-known library)
- CRT scanline CSS patterns: `https://dev.to/ekeijl/retro-crt-terminal-screen-in-css-js-4afh` — MEDIUM confidence (community implementation)
- CYBERCORE CSS framework reference: `https://dev.to/sebyx07/introducing-cybercore-css-a-cyberpunk-design-framework-for-futuristic-uis-2e6c` — LOW confidence (reference only; project will implement its own CSS)
- Gaussian opacity timeline: no existing reference implementation found — this is a custom UX pattern derived from the UC-008 spec. Confidence in *feasibility* is HIGH (pure math + Canvas opacity), confidence in *prior art* is LOW.

---
*Feature research for: Loom v1.1 — cyberpunk knowledge terminal*
*Researched: 2026-03-10*
