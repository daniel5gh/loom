# Technology Stack

**Project:** Loom - Static Knowledge Base with Graph Visualization
**Researched:** 2026-03-09
**Verification note:** Web search and Context7 were unavailable during research. Recommendations are based on training data (cutoff May 2025). Version numbers should be verified against npm/official docs before installing.

## Recommended Stack

### Static Site Generator

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro | ^5.x | Static site generation from markdown | Purpose-built for content-driven static sites. Ships zero JS by default (critical for performance), has first-class markdown/MDX support via Content Collections, handles YAML frontmatter natively (including `title`, `date`, `tags`), and has an official Cloudflare Pages adapter. Unlike Next.js or Gatsby, Astro does not impose a heavy client-side framework -- you opt into interactivity only where needed (graph viz) via "islands architecture." | MEDIUM -- Astro 5 was releasing around late 2024/early 2025; verify current stable version |

**Why not alternatives:**

| Rejected | Reason |
|----------|--------|
| Next.js | Overkill. Server-side rendering capabilities are wasted on a static knowledge base. Heavier build output, more complex configuration, ships more client JS than needed. |
| Gatsby | Ecosystem has been declining since 2023. Plugin ecosystem is stale. GraphQL data layer adds unnecessary complexity for simple markdown processing. |
| Hugo | Extremely fast builds but templating language (Go templates) is painful for interactive components. Poor story for embedding D3/JS visualizations. No component model. |
| 11ty (Eleventy) | Good static generator but lacks Astro's component model and island architecture. Harder to integrate interactive JS components cleanly. Less opinionated about content structure. |
| VitePress | Designed for documentation sites, not knowledge bases. Limited layout flexibility. Vue-only component model. |
| Obsidian Publish | Proprietary, no custom graph visualization control, limited theming. |

### Graph Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| D3.js | ^7.x | Interactive force-directed graph of document relationships | Industry standard for data visualization. Force-directed layouts are ideal for showing tag-based document clusters. Full control over styling (essential for the neon/hacker aesthetic). Massive ecosystem of examples. Works purely client-side. | HIGH -- D3 v7 has been stable since 2021, unlikely to have breaking changes |
| d3-force | (included in D3) | Force simulation for node-link diagrams | Submodule of D3 specifically for force-directed graphs. Handles physics simulation, collision detection, link forces. | HIGH |

**Why not alternatives:**

| Rejected | Reason |
|----------|--------|
| vis.js / vis-network | Simpler API but far less customizable. Cannot achieve the specific neon aesthetic without fighting the library. Less maintained. |
| Cytoscape.js | Better for biological/scientific networks. Heavier than needed for ~50-200 node graphs. API is more complex than raw D3 for this scale. |
| Sigma.js | Optimized for large graphs (10K+ nodes). Overkill and harder to style for small knowledge bases. WebGL rendering makes custom styling harder. |
| React Flow | Designed for node-based editors (flowcharts, pipelines), not knowledge graphs. Wrong mental model. Also imposes React dependency. |
| Force Graph (force-graph npm) | Nice D3 wrapper but abstracts away the control needed for custom neon styling. If you want full aesthetic control, use D3 directly. |

### CSS & Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vanilla CSS with CSS custom properties | N/A | All styling | For a static site with a specific aesthetic, utility-class frameworks like Tailwind add build complexity without proportional value. CSS custom properties (variables) provide theming (neon color palette) cleanly. The site has ~5-8 page templates max -- not enough to justify a framework. | HIGH |
| CSS `@layer` | N/A | Style organization | Native CSS cascade layers for organizing base/component/utility styles without specificity wars. | HIGH |

**Why not Tailwind:** The hacker/neon aesthetic requires custom animations (glow effects, scanline overlays, pulsing nodes), custom color blending, and precise control over graph SVG styling. Tailwind's utility classes do not help with SVG styling or complex CSS animations. For a small site (< 10 templates), Tailwind adds config overhead without saving time.

### Markdown Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro Content Collections | (built-in) | Markdown + frontmatter processing | Astro's content layer handles markdown parsing, YAML frontmatter extraction, and schema validation natively. Defines a typed schema for frontmatter fields (`title: string`, `date: date`, `tags: string[]`), catches errors at build time. No additional markdown libraries needed. | MEDIUM |
| gray-matter | ^4.x | Frontmatter parsing (if needed outside Astro) | Only needed for standalone scripts (like Claude Code slash commands that process markdown outside the Astro build). Astro handles this internally for the site build. | HIGH -- very stable, version 4 has been current for years |
| remark / rehype | (Astro built-in) | Markdown-to-HTML pipeline | Astro uses remark/rehype internally. Extend with plugins for syntax highlighting, custom components, etc. | HIGH |

### Syntax Highlighting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Shiki | ^1.x | Code block syntax highlighting | Built into Astro by default. Generates highlighted HTML at build time (no client-side JS). Supports custom themes -- essential for matching the neon aesthetic. Much better than Prism for custom theming. | MEDIUM -- Shiki 1.x was current as of early 2025 |

### Build & Development

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js | ^22.x LTS | Runtime for build tooling | Required by Astro. Use current LTS version. | MEDIUM -- verify current LTS |
| Vite | (Astro built-in) | Dev server & bundler | Astro uses Vite internally. Fast HMR, handles asset processing. No separate config needed. | HIGH |

### Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @astrojs/cloudflare | latest | Cloudflare Pages adapter | Official Astro adapter for Cloudflare Pages deployment. For a fully static site, you can also use `output: 'static'` mode which needs no adapter (just deploy the `dist/` folder). The adapter is only needed if you want SSR on Cloudflare Workers. For this project, **static output mode is sufficient**. | MEDIUM |
| Wrangler | ^3.x | Cloudflare CLI for local preview and deployment | `wrangler pages dev` for local testing against Cloudflare runtime. `wrangler pages deploy` for manual deployments. Can also configure git-based auto-deploy from Cloudflare dashboard. | MEDIUM |

### Claude Code Slash Commands

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Claude Code slash commands | N/A | AI-powered document management | Defined as `.claude/commands/*.md` files. These are prompt templates, not code -- they instruct Claude Code to perform document operations (research new topics, write documents from template, organize/retag, validate frontmatter). No additional libraries needed. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | ^0.33.x | Image optimization at build time | Only if documents include images. Astro integrates sharp for `<Image>` component optimization. Install only when needed. |
| fuse.js | ^7.x | Client-side fuzzy search | If simple tag filtering is insufficient and you want search-as-you-type across document titles/tags. Lightweight (~5KB gzipped). Defer to phase 2+. |
| @fontsource/fira-code | latest | Monospace font for hacker aesthetic | Self-hosted font loading, no Google Fonts dependency. Fira Code has programming ligatures that enhance the hacker feel. |
| @fontsource/share-tech-mono | latest | Alternative mono font | Slightly more "terminal" feeling than Fira Code. Pick one. |

## Explicitly NOT Using

| Technology | Why Not |
|------------|---------|
| React / Vue / Svelte (as full framework) | No SPA needed. Astro islands handle the D3 graph component. Adding a full framework increases bundle size and build complexity for zero benefit on a content site. |
| Tailwind CSS | See detailed rationale above. Vanilla CSS is better for this project's needs. |
| TypeScript (for site code) | The site has minimal JS -- just the D3 graph visualization and maybe a tag filter. TypeScript overhead is not justified for ~200 lines of client JS. Astro config and content schemas use TS-like validation natively. |
| Database / CMS | Content lives in git as markdown files. No database. No headless CMS. |
| Prettier / ESLint | Minimal JS in the project. Not worth configuring for a few script files. Claude Code handles formatting. |
| Testing framework | No application logic to test. The "tests" are visual (does the site look right?) and build-time (does Astro build succeed?). |

## Architecture Decision: Astro Islands for D3

The key architectural decision is how to embed an interactive D3 graph in an otherwise static site. Astro's **islands architecture** solves this cleanly:

1. The entire site is static HTML/CSS (zero JS) by default
2. The graph component is marked with `client:load` or `client:visible` directive
3. Only the graph island ships JavaScript to the browser
4. The graph receives document/tag data as props (computed at build time)

This means the D3 visualization code lives in a single `.astro` component (or a vanilla JS `<script>` tag within an Astro page), and the rest of the site remains pure static HTML. No framework needed for the island -- Astro supports vanilla JS scripts with `is:inline` or as module scripts.

**Recommended approach:** Write the D3 graph as a vanilla JS module loaded via `<script>` in the graph page. Astro will serialize the document/tag data into a `<script type="application/json">` block at build time. The D3 script reads this data and renders the force-directed graph. This avoids any framework dependency entirely.

## Installation

```bash
# Initialize Astro project (run from repo root)
npm create astro@latest . -- --template minimal

# Core (Astro handles most dependencies internally)
npm install d3

# Fonts
npm install @fontsource/fira-code

# Dev tooling
npm install -D wrangler

# Optional (add when needed)
# npm install sharp          # image optimization
# npm install fuse.js        # client-side search
# npm install gray-matter    # frontmatter parsing for CLI scripts
```

## Project Structure (Astro Convention)

```
loom/
  src/
    content/                  # Astro Content Collections
      config.ts               # Schema definition for frontmatter
      docs/                   # Symlink or copy of markdown documents
    layouts/
      Base.astro              # Base HTML layout (dark theme, fonts)
      Document.astro          # Single document page layout
    pages/
      index.astro             # Landing page (graph or document list)
      tags/
        [tag].astro           # Dynamic tag pages
      docs/
        [...slug].astro       # Document pages from content collection
    components/
      Graph.astro             # D3 force-directed graph island
      TagCloud.astro          # Tag navigation component
      DocCard.astro           # Document preview card
    styles/
      global.css              # CSS custom properties, neon theme
      graph.css               # Graph-specific styles (glow, nodes)
  public/                     # Static assets
  astro.config.mjs            # Astro configuration
  # Existing content directories remain at repo root:
  ai-tools-and-services/
  cloud-ai-platforms/
  companies/
```

**Important note on content location:** The existing markdown files live at the repo root (`ai-tools-and-services/`, etc.). Astro Content Collections expect content in `src/content/`. Two approaches:

1. **Move documents into `src/content/docs/`** -- cleaner, but changes repo structure
2. **Configure Astro's content directory** -- Astro 5 allows configuring content collection sources to point at arbitrary directories

Recommend option 2 to avoid disrupting the existing repo structure. The Astro content config can reference the root-level directories directly.

## Sources

- Astro documentation (astro.build) -- Content Collections, Islands Architecture, Cloudflare deployment
- D3.js documentation (d3js.org) -- Force simulation API
- Cloudflare Pages documentation (developers.cloudflare.com) -- Framework guides for Astro
- Training data knowledge (May 2025 cutoff) -- all version numbers should be verified

**Confidence caveat:** All version recommendations are based on training data with a May 2025 cutoff. Before installing, run `npm info astro version` and `npm info d3 version` to confirm current stable versions. The architectural recommendations (Astro for content sites, D3 for custom graph viz, vanilla CSS for small sites) are high-confidence patterns unlikely to have changed.
