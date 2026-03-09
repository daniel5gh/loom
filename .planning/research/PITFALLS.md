# Domain Pitfalls

**Domain:** Static knowledge base with graph visualization (digital garden)
**Researched:** 2026-03-09

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Graph Visualization Choking on DOM-based Rendering

**What goes wrong:** Projects pick a graph library (often D3 force-directed or vis.js) and render nodes as SVG/DOM elements. This works beautifully with 20 nodes. At 100+ nodes with edges computed from shared tags, the browser crawls -- frame rates drop below 10fps, interactions become unusable, and mobile devices lock up entirely.

**Why it happens:** Tag-based relationship graphs are deceptively dense. If 15 documents share 30 unique tags, and each shared tag creates an edge, you quickly get O(n^2) edges. Every node and edge is a DOM element receiving layout calculations each frame. Force-directed layouts recalculate positions continuously.

**Consequences:** Either the graph visualization -- the project's flagship feature -- gets cut to a simplified version, or the entire rendering approach needs to be rewritten to use Canvas/WebGL.

**Prevention:**
- Use a Canvas/WebGL-based graph renderer from the start (e.g., force-graph which wraps three.js/2D canvas, or Sigma.js). Avoid pure SVG/D3 force layouts for the primary visualization.
- Pre-compute graph layout at build time rather than running force simulation on every page load. Store node positions as JSON, render them statically, let users interact with a pre-settled graph.
- Implement edge bundling or threshold: only show edges when documents share 2+ tags, or cluster by tag and show inter-cluster connections rather than every node-to-node edge.

**Detection:** Test with 50+ nodes early. If the graph takes more than 1 second to settle or stutters during drag, you have a rendering architecture problem.

**Phase relevance:** Must be addressed in the first phase that introduces graph visualization. Changing rendering backend later means rewriting all interaction code.

---

### Pitfall 2: Frontmatter Parsing Failures Silently Dropping Documents

**What goes wrong:** The build pipeline parses YAML frontmatter but handles malformed frontmatter by silently skipping the document or treating the entire file as body text with no metadata. Documents vanish from navigation, tag indexes, and the graph -- with no build error.

**Why it happens:** YAML is indent-sensitive and surprisingly fragile. This project already has this exact bug: `airllm.md` and `langflow.md` have ` date:` with a leading space, which breaks standard YAML parsers. As the document collection grows, frontmatter errors will multiply: missing closing `---`, tabs vs spaces, unquoted special characters in titles, bare colons in values.

**Consequences:** Users add documents that never appear on the site. The tag index silently becomes incomplete. The graph shows fewer nodes than expected. Debugging requires diffing the document list against the rendered output.

**Prevention:**
- Add a frontmatter validation step to the build pipeline that runs before rendering. It should: (1) confirm every `.md` file in content directories has valid YAML frontmatter, (2) confirm required fields (`title`, `date`, `tags`) are present and correctly typed, (3) fail the build with a clear error message naming the file and the problem.
- Fix existing malformed files before building the first version. The two known issues (airllm.md, langflow.md leading spaces) should be fixed in Phase 1.
- Use a strict YAML parser (gray-matter with strict mode or js-yaml with schema validation) rather than a lenient one that silently coerces bad data.

**Detection:** If `document count in rendered site !== .md file count in content dirs`, something was silently dropped.

**Phase relevance:** Phase 1 (content pipeline setup). This must be solved before any rendering work begins.

---

### Pitfall 3: Tag Taxonomy Entropy

**What goes wrong:** Tags become inconsistent and unusable as a navigation mechanism. "ai" vs "AI" vs "artificial-intelligence" all refer to the same concept but create three separate tag nodes. The tag cloud/filter becomes cluttered with near-duplicates, and the graph visualization shows disconnected clusters that should be connected.

**Why it happens:** No tag normalization or controlled vocabulary. This project already shows early signs: existing documents use both `AI` and `ai`, both `framework` and `agents` as standalone tags with no taxonomy. With Claude Code skills generating documents, different prompts will produce different tag styles.

**Consequences:** The graph visualization -- which computes relationships via shared tags -- becomes noisy and misleading. Tag-based navigation shows 50+ tags when there are really 15 concepts. Users lose trust in the browsing experience.

**Prevention:**
- Normalize tags at build time: lowercase, trim whitespace, replace spaces with hyphens. `"AI"` and `"ai"` should resolve to the same tag.
- Define a canonical tag list (a `tags.yaml` or similar file) that maps aliases to canonical forms. The build step warns when unknown tags appear rather than silently creating new ones.
- The Claude Code slash commands for document creation should validate tags against the canonical list and suggest existing tags before creating new ones.

**Detection:** If the tag index has more than ~2x the number of truly distinct concepts, entropy has set in. Run `sort | uniq -c` on all tags early and often.

**Phase relevance:** Must be designed in Phase 1 (data pipeline) and enforced via Claude Code skills. Retrofitting tag normalization after 50+ documents is painful.

---

### Pitfall 4: Building an SPA When a Static Site Will Do

**What goes wrong:** The project reaches for a full SPA framework (React/Vue/Svelte) with client-side routing, hydration, and a heavy JavaScript bundle. The resulting site is 500KB+ of JS for what is essentially a collection of rendered markdown pages with one interactive visualization. Initial load is slow. Cloudflare Pages serves a blank page until JS parses. SEO and shareability suffer (though less important for a personal tool).

**Why it happens:** Developers default to the framework they know. "I need interactive graph viz" gets mentally expanded to "I need a full SPA." The graph is one component on one page, but the framework tax applies to every page.

**Consequences:** Slow initial page loads. Large bundle sizes for what should be lightweight static pages. Unnecessary complexity in build configuration. Hydration bugs where content renders, disappears, then re-renders.

**Prevention:**
- Use a static site generator that produces HTML files with optional JS islands for interactivity: Astro is the ideal choice here (static HTML by default, JS only where you opt in via `client:load` directives). 11ty (Eleventy) is another strong option for pure static output with JS added manually.
- The graph visualization should be a single interactive island on the graph page, not a reason to ship a framework runtime to every page.
- Set a JS budget: the document pages should load with near-zero JS. Only the graph/filter pages need significant client-side code.

**Detection:** If `node_modules` exceeds 200MB or the built JS bundle exceeds 100KB for document pages, you have over-engineered the frontend.

**Phase relevance:** Phase 1 (framework selection). This decision is nearly impossible to reverse later.

---

## Moderate Pitfalls

### Pitfall 5: Cloudflare Pages Build Gotchas

**What goes wrong:** The site builds locally but fails on Cloudflare Pages, or deploys but behaves differently. Common issues: (1) Cloudflare's build environment uses an older Node.js version than your local machine, (2) build output directory is misconfigured, (3) SPA fallback routing doesn't work as expected for static sites with dynamic-looking paths, (4) asset paths break because the site assumes it's served from root but Cloudflare preview deployments use subpaths.

**Why it happens:** Cloudflare Pages has specific expectations about build output structure. The build environment is containerized with specific Node/npm versions. Preview deployments on branches use different URL structures than production.

**Prevention:**
- Pin the Node.js version explicitly in the Cloudflare Pages dashboard or via `.node-version` / `engines` in `package.json`. Use Node 20 LTS.
- Test the production build locally with `npx wrangler pages dev dist/` (or equivalent output dir) before pushing. Wrangler simulates the Cloudflare Pages environment.
- Use relative asset paths or a configurable base URL. Avoid hardcoded absolute paths.
- For a static site (not SPA): do NOT add a `_redirects` file with `/* /index.html 200` -- this is for SPAs only and will break direct navigation to static HTML pages.

**Detection:** First deploy fails or shows blank page. Preview deployments show broken assets while production works (or vice versa).

**Phase relevance:** Deployment phase. Set up CI/CD early (even with a placeholder page) to catch environment issues before the full build pipeline exists.

---

### Pitfall 6: Over-Engineering the Tag Navigation UI

**What goes wrong:** The tag-based navigation becomes a complex faceted search system with AND/OR logic, tag hierarchies, nested filters, and saved filter states. Weeks get spent on filter UX when the actual document count is 15-50.

**Why it happens:** Tag systems invite feature creep. Every new filtering capability feels like a small addition but compounds into a complex state management problem. "What if they want to see documents tagged both X AND Y?" leads to a full query builder.

**Prevention:**
- Start with click-to-filter: click a tag, see documents with that tag. Click another tag, see documents with that tag. That's it for v1.
- The graph visualization IS the advanced navigation. Users explore connections visually rather than through filter logic. Don't duplicate the graph's purpose with a text-based query system.
- Add multi-tag filtering (AND logic) only after real usage reveals the need. For 15-50 documents, single-tag filtering is sufficient.

**Detection:** If you're implementing filter state management with URL query parameters and undo/redo before you have 50 documents, you're over-engineering.

**Phase relevance:** Phase 2 (navigation UI). Scope must be actively constrained.

---

### Pitfall 7: Build-Time vs. Runtime Data Processing Confusion

**What goes wrong:** Tag indexes, document relationship graphs, and search indexes get computed at runtime in the browser instead of at build time. The site loads, then freezes for 500ms while JavaScript parses frontmatter, builds the tag index, and computes graph edges.

**Why it happens:** It's easier to write "fetch all markdown, parse it, build index" as client-side JS than to set up a proper build pipeline that pre-computes everything into static JSON. Developers prototype with runtime logic and never move it to the build step.

**Consequences:** Slow page loads. Flash of empty content. Unnecessary computation repeated on every visit. Larger client-side bundles because you're shipping markdown parsers and YAML parsers to the browser.

**Prevention:**
- Process ALL markdown and frontmatter at build time. Output: (1) rendered HTML for each document, (2) a `tags.json` with the complete tag-to-document index, (3) a `graph.json` with pre-computed nodes and edges (and optionally pre-computed layout positions).
- The client-side code should only do: fetch JSON, render it. No parsing, no computation.
- Astro and 11ty both support this pattern natively through their data pipeline / collections system.

**Detection:** If your client-side JS imports `gray-matter`, `marked`, or any markdown parsing library, you're doing build work at runtime.

**Phase relevance:** Phase 1 (build pipeline architecture). Getting this boundary right early prevents a painful migration later.

---

### Pitfall 8: Aesthetic Over Function (Dark Theme Accessibility)

**What goes wrong:** The "dark hacker aesthetic with neon accents" produces a site that is beautiful in screenshots but painful to actually read. Neon green (#00FF00) on dark backgrounds causes eye strain. Low contrast text is unreadable. Neon colors clash when adjacent in the graph. Links are indistinguishable from body text. Code blocks disappear into the background.

**Why it happens:** Aesthetic goals ("hacker vibe") conflict with readability requirements for long-form research documents. Neon colors have notoriously poor contrast ratios against both dark and light backgrounds.

**Prevention:**
- Use neon accents sparingly: tag pills, graph nodes, interactive hover states, section dividers. NOT for body text, headings, or large text areas.
- Body text should be light gray (#C8C8C8 to #E0E0E0) on dark gray (#1A1A2E to #0F0F23), not pure white on pure black (which also causes strain).
- Test all text against WCAG AA contrast ratio (4.5:1 minimum). Neon green (#00FF00) against dark backgrounds often fails this.
- Design the document reading experience first (readable, comfortable for long sessions), then add neon accents to the chrome (navigation, graph, interactive elements).

**Detection:** If you squint when reading a document page, or if you can't distinguish links from regular text, the aesthetic has won over function.

**Phase relevance:** Phase 2 (theming/CSS). Establish the design system with contrast-checked color tokens before building pages.

---

## Minor Pitfalls

### Pitfall 9: Forgetting Incremental Build Performance

**What goes wrong:** Every change triggers a full rebuild of all documents. With 15 documents this takes 2 seconds. With 200 documents and graph computation, it takes 30+ seconds. Developer iteration speed collapses.

**Prevention:** Choose an SSG with incremental/partial rebuild support (Astro and 11ty both handle this). Structure the data pipeline so the tag index and graph JSON can be incrementally updated rather than fully recomputed.

**Phase relevance:** Phase 1 (SSG selection). Not urgent at 15 docs but becomes painful quickly.

---

### Pitfall 10: Coupling Claude Code Skills to Site Structure

**What goes wrong:** Claude Code slash commands for document management (research, write, organize, tag) hardcode assumptions about the site's directory structure, frontmatter schema, or build process. When the site structure evolves, the skills break silently -- generating documents that don't appear on the site or using outdated tag formats.

**Prevention:**
- Skills should read the canonical schema (TEMPLATE.md, tags.yaml) rather than hardcoding formats.
- Keep document management skills independent from site rendering. A skill creates a valid markdown file; the build pipeline handles the rest.
- Test skills by running a build after skill-generated document creation.

**Detection:** A skill-created document that doesn't appear on the rendered site.

**Phase relevance:** Phase where Claude Code skills are implemented. Design skill interfaces against the schema, not against implementation details.

---

### Pitfall 11: No Link/Reference Integrity Between Documents

**What goes wrong:** Documents reference each other with relative markdown links. Files get renamed, moved between directories, or deleted. Links break silently. The rendered site shows 404s for internal links with no build-time warning.

**Prevention:** Add a link validation step to the build pipeline (most SSGs have plugins for this, or use a post-build link checker like `hyperlink` or `broken-link-checker`). Prefer linking by document slug/ID rather than file path if the SSG supports it.

**Detection:** Run a link checker as part of the build. Treat broken internal links as build errors.

**Phase relevance:** Phase 1 (build pipeline). Cheap to add early, expensive to retrofit.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| SSG/Framework Selection | SPA over-engineering (#4) | Choose Astro or 11ty; reject full SPA frameworks |
| Content Pipeline | Silent frontmatter failures (#2) | Strict validation, fail-fast build errors |
| Content Pipeline | Build vs runtime confusion (#7) | All parsing at build time, JSON output for client |
| Tag System | Tag entropy (#3) | Normalize at build time, canonical tag list |
| Tag Navigation | Over-engineering filters (#6) | Single-tag filter for v1, graph handles complex nav |
| Graph Visualization | DOM rendering performance (#1) | Canvas/WebGL renderer, pre-computed layouts |
| Theming | Dark theme readability (#8) | Contrast-first design, neon only for accents |
| Deployment | Cloudflare build env mismatch (#5) | Pin Node version, test with Wrangler locally |
| Claude Skills | Coupling to site structure (#10) | Skills read schema files, not hardcoded formats |
| Content Growth | Broken internal links (#11) | Link checker in build pipeline |

## Sources

- Direct codebase analysis of existing Loom documents and frontmatter issues (airllm.md, langflow.md YAML errors)
- Existing concerns audit in `.planning/codebase/CONCERNS.md`
- Domain knowledge: force-directed graph rendering performance characteristics (SVG vs Canvas vs WebGL)
- Domain knowledge: Cloudflare Pages deployment model, Astro/11ty static site generation patterns
- Domain knowledge: WCAG contrast ratio requirements for dark theme design
- Confidence: MEDIUM-HIGH (based on established patterns in the static site / data visualization ecosystem; specific library version details should be verified during implementation phases)

---

*Pitfalls analysis: 2026-03-09*
