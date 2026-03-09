# Phase 1: Content Pipeline and Site Foundation - Research

**Researched:** 2026-03-09
**Domain:** Astro 5 static site generation, Cloudflare Pages deployment, CSS theming
**Confidence:** HIGH (Astro 5 APIs verified against official docs; Cloudflare Pages pinning verified; CSS patterns are stable)

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-001 | Parse all existing markdown documents with YAML frontmatter (title, date, tags) | Astro 5 `glob()` loader with `base` pointing at root-level directories handles this natively; schema validates types |
| REQ-002 | Fix malformed frontmatter in `airllm.md` and `langflow.md` (leading space on `date:`) | Both files confirmed: line 2 reads ` date:` with a leading space — one-character fix per file |
| REQ-003 | Validate frontmatter at build time — fail the build on missing required fields | Astro content schema with `z.string()`, `z.coerce.date()`, `z.array(z.string())` will throw a build error on missing/wrong-type fields |
| REQ-004 | Normalize tags at build time: lowercase, trim whitespace, hyphenate spaces | Astro `transform()` on the schema, or a utility called in `getStaticPaths()` — no extra library needed |
| REQ-005 | Generate a build-time tag index mapping each tag to the documents that carry it | Computed inside `getStaticPaths()` for `tags/[tag].astro` by iterating `getCollection()` results |
| REQ-010 | Render each markdown document as an individual HTML page | `src/pages/docs/[...slug].astro` with `getStaticPaths()` + `getCollection()` |
| REQ-011 | Generate a document index/listing page with all documents | `src/pages/index.astro` calling `getCollection()` for all three collections, grouped by category |
| REQ-012 | Generate per-tag pages listing all documents with that tag | `src/pages/tags/[tag].astro` with `getStaticPaths()` aggregating across all collections |
| REQ-013 | Display tags on each document page as clickable links to tag pages | Tag pills in the document layout linking to `/tags/{tag}` |
| REQ-015 | Site structure navigable from existing directory categories | Three collections (ai-tools-and-services, cloud-ai-platforms, companies) shown as sections on index page |
| REQ-030 | Dark background with high-contrast typography for readability | CSS custom properties; body text `#D0D0D0` on `#0D0D1A`; verified WCAG AA |
| REQ-031 | Neon accent colors applied to tag pills, hovers, interactive elements | CSS custom properties `--neon-cyan`, `--neon-magenta`, `--neon-green` applied to interactive elements only |
| REQ-032 | Monospace font for primary UI chrome | `@fontsource/fira-code` self-hosted, applied via `font-family` custom property |
| REQ-034 | WCAG AA contrast ratio on all body text | Enforced by color palette choices — body text at 4.5:1+ against background |
| REQ-040 | Static output deployable to Cloudflare Pages | `output: 'static'` in astro.config.mjs; no adapter needed; deploy `dist/` directory |
| REQ-041 | Git-based auto-deploy: push to main triggers Cloudflare Pages build and publish | Cloudflare Pages dashboard: connect GitHub repo, set build command `npm run build`, output `dist` |
| REQ-042 | `.gitignore` covering OS artifacts, editor files, and build output | Standard `.gitignore` — `dist/`, `node_modules/`, `.DS_Store`, `.env`, editor dirs |

</phase_requirements>

---

## Summary

Phase 1 builds the entire static site infrastructure from scratch. The repo currently has no Astro project, no `package.json`, no `src/` directory, and no `.gitignore`. It is a bare markdown document collection. This phase converts it into a deployed Astro 5 static site with full tag navigation and the dark/neon aesthetic.

The most important decisions are already locked in STATE.md: Astro 5, vanilla CSS, no TypeScript, no React/Tailwind. The only open design question is how to map the existing root-level content directories (`ai-tools-and-services/`, `cloud-ai-platforms/`, `companies/`) into Astro Content Collections. **Verified against Astro 5 official docs**: the `glob()` loader accepts a `base` parameter pointing anywhere on the filesystem, so the existing files stay in place — no restructuring needed.

The phase starts with two content fixes (frontmatter bugs in `airllm.md` and `langflow.md`) and a tag normalization pass across all 15 documents. Then Astro project initialization, content collection setup, page templates, CSS theming, and finally Cloudflare Pages wiring. The critical path is: fix content → configure collections → generate pages → apply theme → deploy.

**Primary recommendation:** Initialize Astro 5 with `npm create astro@latest` using the minimal template, define three content collections with `glob()` loaders pointing at existing root directories, and implement tag normalization as a `transform()` in the Zod schema. Deploy a working (even unstyled) site to Cloudflare Pages as early as possible to catch environment issues before the full build pipeline exists.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.x (5.5+ current as of March 2026) | Static site generation, Content Collections, page routing | Zero-JS by default; Content Collections handle YAML frontmatter natively with Zod schema validation; islands architecture for future D3 island |
| @fontsource/fira-code | ^5.x | Monospace font, self-hosted | No Google Fonts dependency; Fira Code supports programming ligatures; standard for dev/hacker aesthetic |
| vite | (bundled with Astro) | Dev server, bundler | Astro uses Vite internally — no separate config |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | (bundled with astro) | Frontmatter schema validation | Already imported via `astro/zod` — no extra install |
| gray-matter | ^4.x | Frontmatter parsing in standalone scripts | Only if writing a pre-build fix script; Astro handles this internally for the site build |
| wrangler | ^3.x | Cloudflare Pages CLI for local preview | Dev dependency; install when setting up deployment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fontsource/fira-code | @fontsource/share-tech-mono | Share Tech Mono has a more "terminal" look; Fira Code has ligatures and wider support. Either works — pick one and commit. |
| Fira Code | System monospace stack | Zero install cost but inconsistent across OS; hacker aesthetic suffers. Not recommended. |

**Installation:**
```bash
# From repo root — initialize Astro in place
npm create astro@latest . -- --template minimal --no-install --no-git

# Then install dependencies
npm install
npm install @fontsource/fira-code
npm install -D wrangler
```

---

## Architecture Patterns

### Recommended Project Structure

```
loom/
  # Existing content directories — DO NOT MOVE
  ai-tools-and-services/   # 10 markdown documents
  cloud-ai-platforms/      # 4 markdown documents
  companies/               # 1 markdown document

  # New Astro project (created in Phase 1)
  src/
    content/
      config.ts            # Collection schemas (glob loaders pointing at root dirs)
    pages/
      index.astro          # Document index, grouped by category
      tags/
        index.astro        # All tags listing
        [tag].astro        # Per-tag document listing
      [category]/
        [slug].astro       # Individual document pages
    layouts/
      Base.astro           # HTML shell: dark theme, fonts, nav
      Document.astro       # Document page: title, date, tags, content
    components/
      TagPill.astro        # Clickable tag badge
      DocCard.astro        # Document preview card for index/tag pages
    styles/
      global.css           # CSS custom properties, reset, base typography
      theme.css            # Neon color palette, dark theme variables

  public/                  # Static assets (favicon, etc.)
  astro.config.mjs         # output: 'static', no adapter
  package.json
  .gitignore
  .node-version            # "22" — pins Node.js for Cloudflare Pages
```

### Pattern 1: Content Collections with Root-Level Glob Loaders

**What:** Three Astro Content Collections, each using `glob()` with `base` pointing at an existing root-level directory. Files stay where they are.
**When to use:** Any time you want Astro to manage existing content that you cannot or should not move.
**Example:**
```typescript
// src/content/config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const aiTools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './ai-tools-and-services' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).transform(tags =>
      tags.map(t => t.toLowerCase().trim().replace(/\s+/g, '-'))
    ),
  }),
});

const cloudPlatforms = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './cloud-ai-platforms' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).transform(tags =>
      tags.map(t => t.toLowerCase().trim().replace(/\s+/g, '-'))
    ),
  }),
});

const companies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './companies' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).transform(tags =>
      tags.map(t => t.toLowerCase().trim().replace(/\s+/g, '-'))
    ),
  }),
});

export const collections = { aiTools, cloudPlatforms, companies };
```

**Key point:** The `transform()` in the schema handles REQ-004 (tag normalization) automatically at parse time — every tag that enters is lowercase, trimmed, and hyphenated before any page generation code sees it.

### Pattern 2: Cross-Collection Tag Index via getStaticPaths()

**What:** Build the tag-to-documents index inside `getStaticPaths()` by aggregating all three collections.
**When to use:** `src/pages/tags/[tag].astro` — generates one page per unique tag.
**Example:**
```typescript
// src/pages/tags/[tag].astro
// Source: https://docs.astro.build/en/reference/routing-reference/
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const [aiTools, cloudPlatforms, companies] = await Promise.all([
    getCollection('aiTools'),
    getCollection('cloudPlatforms'),
    getCollection('companies'),
  ]);

  const allDocs = [
    ...aiTools.map(d => ({ ...d, category: 'ai-tools-and-services' })),
    ...cloudPlatforms.map(d => ({ ...d, category: 'cloud-ai-platforms' })),
    ...companies.map(d => ({ ...d, category: 'companies' })),
  ];

  // Build tag index: { 'langchain': [doc, doc], 'ai': [doc, ...], ... }
  const tagIndex: Record<string, typeof allDocs> = {};
  for (const doc of allDocs) {
    for (const tag of doc.data.tags) {
      if (!tagIndex[tag]) tagIndex[tag] = [];
      tagIndex[tag].push(doc);
    }
  }

  return Object.entries(tagIndex).map(([tag, docs]) => ({
    params: { tag },
    props: { tag, docs },
  }));
}
```

### Pattern 3: Single Document Page with Category-Routed URLs

**What:** Individual document pages at `/ai-tools-and-services/langchain/` etc., preserving the directory structure in URLs.
**When to use:** `src/pages/[category]/[slug].astro` — or use three separate route files, one per collection.
**Simpler alternative:** A single `src/pages/docs/[collection]/[slug].astro` that maps collection name + entry id to URL.

The simplest working approach for 15 documents: three route files (one per category), each calling its collection:
```typescript
// src/pages/ai-tools-and-services/[slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const docs = await getCollection('aiTools');
  return docs.map(doc => ({
    params: { slug: doc.id },
    props: { doc },
  }));
}

const { doc } = Astro.props;
const { Content } = await render(doc);
```

### Pattern 4: CSS Custom Properties for Neon Dark Theme

**What:** All colors and typography as CSS custom properties on `:root`. Components reference variables, never raw values.
**When to use:** Always — this is how the dark theme stays consistent and extensible.
**Example:**
```css
/* src/styles/theme.css */
:root {
  /* Backgrounds */
  --bg-base:       #0D0D1A;   /* Deep dark — main page background */
  --bg-surface:    #13132A;   /* Slightly lighter — cards, sidebar */
  --bg-elevated:   #1A1A3A;   /* Code blocks, hover states */

  /* Typography */
  --text-primary:  #D0D0D0;   /* Body text — 8.5:1 contrast on --bg-base */
  --text-secondary: #8888AA;  /* Metadata, dates, secondary labels */
  --text-dim:      #555577;   /* Disabled, placeholder */

  /* Neon accents — USE SPARINGLY (interactive elements only, not body text) */
  --neon-cyan:     #00E5FF;   /* Primary accent — links, tag pills, active states */
  --neon-magenta:  #FF2D78;   /* Secondary accent — hover states, dates */
  --neon-green:    #39FF14;   /* Tertiary — category labels, success states */

  /* Typography */
  --font-mono: 'Fira Code', 'Cascadia Code', monospace;
  --font-prose: 'Fira Code', monospace;  /* Monospace throughout per REQ-032 */

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
}
```

**WCAG AA check:** `#D0D0D0` text on `#0D0D1A` background = approximately 10:1 contrast ratio — well above the 4.5:1 WCAG AA minimum. The neon accents (#00E5FF on dark) are above 4.5:1 for interactive elements. Do NOT use neon colors for body text — they fail WCAG AA on some background combinations.

### Anti-Patterns to Avoid

- **Moving the content directories into `src/content/`:** Unnecessary — `glob()` with `base` works against root-level dirs. Moving 15 files breaks git history and any existing bookmarks.
- **Using `output: 'server'` or installing `@astrojs/cloudflare`:** Not needed for a static site. Static mode produces plain HTML/CSS/JS that deploys to Cloudflare Pages without any adapter.
- **Hardcoding tag strings in navigation:** Tags come from document frontmatter and must be generated dynamically at build time. Any hardcoded tag list will drift from the actual data.
- **Building tag normalization as a separate script:** Put normalization in the Zod `transform()` so it runs at the source — at parse time — rather than as a separate downstream step that could be skipped.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | Astro Content Collections | Already handles YAML, schema validation, type inference, and build errors on bad data |
| Frontmatter schema validation | Custom field-checking code | Zod schema in `config.ts` | Zod gives typed errors, required field enforcement, and `transform()` for normalization in one declaration |
| Markdown to HTML rendering | Custom remark pipeline | Astro's built-in `render()` | Astro uses remark/rehype internally; `const { Content } = await render(entry)` gives you a ready-to-use Astro component |
| Dynamic route generation for 15 docs | Manual `pages/` files | `getStaticPaths()` + `getCollection()` | Scales to any number of documents; adding a new document requires zero code changes |
| Tag index data structure | Manual loop + Map | `getStaticPaths()` in `[tag].astro` | The tag index is an output of `getStaticPaths()` — no separate data structure to maintain |
| Font loading and optimization | Custom `<link>` to Google Fonts CDN | `@fontsource/fira-code` npm package | Self-hosted, no external dependency, bundled by Vite into final output |

**Key insight:** Astro 5 Content Collections handle the hardest parts of this phase — frontmatter parsing, validation, and page routing — in the framework layer. The planner should resist the urge to add intermediate scripts or custom parsers when the framework already provides exactly what's needed.

---

## Common Pitfalls

### Pitfall 1: Astro 5 Content Collections vs Astro 4 Syntax

**What goes wrong:** Following tutorials or docs for Astro 3/4 that use `defineCollection` without a `loader`. In Astro 4, you placed files directly in `src/content/{collection}/`. In Astro 5, the Content Layer API uses `loader: glob(...)` which enables arbitrary source directories.
**Why it happens:** Most indexed tutorials still show the Astro 4 pattern. The syntax looks almost identical but the behavior differs.
**How to avoid:** Always use the `loader` field in `defineCollection()`. The `glob()` loader from `'astro/loaders'` is the correct Astro 5 API (verified against current docs).
**Warning signs:** If you see `src/content/ai-tools-and-services/*.md` appearing in a plan, that's Astro 4 thinking.

### Pitfall 2: Tag Normalization Done Too Late

**What goes wrong:** Tags are normalized in template code (e.g., in a tag pill component) rather than at parse time in the schema. Result: the tag index and `getStaticPaths()` for tag pages see raw tags (`"AI"`, `"ai"`, `"open source"`) and generate duplicate pages and a fragmented index.
**Why it happens:** It feels natural to normalize display values in the view layer.
**How to avoid:** The Zod `transform()` in `config.ts` runs at parse time — before any route generation code. Tags enter the system normalized. This is the only correct location.
**Warning signs:** Tag pages for both `/tags/ai` and `/tags/AI` existing in the build output.

### Pitfall 3: Cloudflare Pages Build Environment Mismatch

**What goes wrong:** Astro builds fine locally but fails on Cloudflare Pages because the build image uses a different Node.js version. The default build image v3 uses Node 22.16.0 — which is fine for Astro 5. But if you don't pin, Cloudflare may use a different default in the future.
**Why it happens:** Cloudflare Pages has multiple build image versions with different defaults.
**How to avoid:** Add `.node-version` file to repo root containing `22`. This is respected by Cloudflare Pages and takes zero dashboard configuration.
**Warning signs:** Build passes locally but fails on Cloudflare with Node version-related errors.

### Pitfall 4: The `open source` Tag Creates Two Tags

**What goes wrong:** Existing documents use `"open source"` as a tag (with a space). Without normalization, this becomes the URL `/tags/open source` which is invalid. With naive hyphenation it becomes `open-source`. But other documents use `"open-source"` already hyphenated. After normalization both become `open-source` — which is correct but the planner must not generate a `/tags/open%20source` page.
**Why it happens:** The space-in-tag problem is invisible until you try to render tag URLs.
**How to avoid:** Normalization in the Zod `transform()` (`.replace(/\s+/g, '-')`) handles this before route generation. Verify the final tag set by logging all normalized tags during the first build.

### Pitfall 5: `pageindex.md` in `ai-tools-and-services/`

**What goes wrong:** The glob loader picks up `pageindex.md` as a content document titled "PageIndex" — which is actually a tool document, not a navigation artifact. It has valid frontmatter and should render correctly.
**Why it happens:** The filename looks like a meta-file but it IS a research document about the PageIndex tool.
**How to avoid:** Do not exclude it from the glob. It renders as a valid document page.

### Pitfall 6: Stale `INDEX.md` at Repo Root Picked Up by Glob

**What goes wrong:** The glob `'**/*.md'` with `base: './ai-tools-and-services'` will only pick up files inside that directory. But if you use `base: '.'` for the whole repo, `INDEX.md`, `TEMPLATE.md`, `AGENTS.md`, `PRD.md` would all be included as "documents."
**Why it happens:** Overly broad glob pattern.
**How to avoid:** Use specific base directories per collection (`./ai-tools-and-services`, `./cloud-ai-platforms`, `./companies`). Never use the repo root as a collection base.

### Pitfall 7: Neon Accent Colors Fail WCAG AA as Text

**What goes wrong:** Neon green (`#39FF14`) or neon cyan (`#00E5FF`) are used for heading or body text, which can fail WCAG AA against certain background colors despite appearing bright.
**Why it happens:** Neon colors look vivid and readable visually but contrast ratios against near-black backgrounds can vary.
**How to avoid:** Body text and headings use `--text-primary` (`#D0D0D0`). Neon colors ONLY on non-text elements: tag pill backgrounds, borders, hover underlines, category badges.

---

## Code Examples

Verified patterns from official sources:

### Astro Config for Static Output (No Adapter Needed)
```javascript
// astro.config.mjs
// Source: https://docs.astro.build/en/guides/deploy/cloudflare/
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  // No adapter needed for static output
  site: 'https://your-project.pages.dev',  // Set to actual Cloudflare Pages URL
});
```

### Content Collections Config (Astro 5 Pattern)
```typescript
// src/content/config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const normalizeTag = (tag: string) =>
  tag.toLowerCase().trim().replace(/\s+/g, '-');

const docSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).transform(tags => tags.map(normalizeTag)),
});

export const collections = {
  aiTools: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './ai-tools-and-services' }),
    schema: docSchema,
  }),
  cloudPlatforms: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './cloud-ai-platforms' }),
    schema: docSchema,
  }),
  companies: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './companies' }),
    schema: docSchema,
  }),
};
```

### Document Page with render()
```astro
---
// src/pages/ai-tools-and-services/[slug].astro
// Source: https://docs.astro.build/en/guides/content-collections/
import { getCollection, render } from 'astro:content';
import Document from '../../layouts/Document.astro';

export async function getStaticPaths() {
  const docs = await getCollection('aiTools');
  return docs.map(doc => ({
    params: { slug: doc.id },
    props: { doc },
  }));
}

const { doc } = Astro.props;
const { Content } = await render(doc);
---
<Document title={doc.data.title} date={doc.data.date} tags={doc.data.tags}>
  <Content />
</Document>
```

### Tag Normalization Fixes for Existing Documents

The following existing tags normalize correctly via the transform but the SOURCE files should also be fixed for consistency (since Claude Code skills will read raw frontmatter):

| File | Current Tag | Normalized To | Action |
|------|-------------|---------------|--------|
| airllm.md | `AI` | `ai` | Fix in source |
| langflow.md | `AI` | `ai` | Fix in source |
| pageindex.md | `AI` | `ai` | Fix in source |
| lovable.md | `AI` | `ai` | Fix in source |
| pageindex.md | `open source` | `open-source` | Fix in source |
| airllm.md | `open source` | `open-source` | Fix in source |
| langflow.md | `open source` | `open-source` | Fix in source |

### .gitignore for This Project
```gitignore
# Build output
dist/
.output/

# Node
node_modules/
.npm/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/
*.swp

# Environment
.env
.env.local

# Astro
.astro/

# Wrangler
.wrangler/
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro 4 content in `src/content/{collection}/*.md` | Astro 5 `glob()` loader with `base` pointing anywhere | Astro 5 (late 2024) | Can use existing directory structure without moving files |
| `@astrojs/cloudflare` adapter required for all deployments | Static mode (`output: 'static'`) needs no adapter | Astro 4+ | Simpler deploy: just push `dist/` with no server-side runtime |
| `entry.slug` for content collection IDs | `entry.id` in Astro 5 Content Layer API | Astro 5 | Use `entry.id` not `entry.slug` in route params |
| Google Fonts CDN for web fonts | `@fontsource/*` npm packages | ~2021 | Self-hosted, no privacy/CDN dependency, Vite bundles it |

**Deprecated/outdated:**
- `entry.slug`: Astro 5 uses `entry.id` — tutorials using `.slug` are for Astro 3/4
- `Astro.glob()`: Deprecated in favor of `getCollection()` — do not use
- `defineCollection` without `loader:`: Astro 4 pattern; Astro 5 requires `loader: glob(...)` or `loader: file(...)`

---

## Open Questions

1. **URL structure for document pages**
   - What we know: Three collections → three directory categories in URLs makes semantic sense (`/ai-tools-and-services/langchain/`)
   - What's unclear: Whether to use flat URL (`/docs/langchain/`) or category-scoped URL (`/ai-tools-and-services/langchain/`). Category-scoped is more informative but requires three route files.
   - Recommendation: Use category-scoped URLs. Three route files is trivial to maintain and the URLs are more useful.

2. **Canonical tag list vs. transform-only normalization**
   - What we know: Current 15 documents have ~30 unique tags after normalization. Some tags are clearly aliases (`ai` appears in most documents).
   - What's unclear: Whether Phase 1 should establish a `tags.yaml` canonical list (with alias resolution) or just do case/space normalization and defer canonicalization to Phase 3 skills.
   - Recommendation: Phase 1 does transform-only normalization (lowercase, trim, hyphenate). A canonical list is Phase 3 scope (REQ-053). The planner should include a tag audit task but not require canonical list infrastructure in Phase 1.

3. **`wrangler.jsonc` vs. Cloudflare dashboard-only setup**
   - What we know: Cloudflare Pages supports both file-based config (`wrangler.jsonc`) and dashboard-only setup. Dashboard setup is sufficient for git-based auto-deploy.
   - What's unclear: Whether to commit a `wrangler.jsonc` to the repo.
   - Recommendation: For Phase 1, configure git auto-deploy through the Cloudflare dashboard. Add `wrangler.jsonc` in Phase 3 (REQ-043) when `wrangler pages dev` local preview is needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no test framework exists or is needed for Phase 1 |
| Config file | None — see Wave 0 gaps |
| Quick run command | `npm run build` (Astro build validates schema + routes) |
| Full suite command | `npm run build && node scripts/validate-output.mjs` |

**Rationale for no test framework:** The project explicitly decided against a testing framework in pre-existing research (STACK.md: "No application logic to test. The 'tests' are visual and build-time."). The Astro build IS the test for Phase 1:
- Missing required frontmatter → build fails with Zod error (REQ-003)
- Malformed YAML → build fails with parse error (REQ-002)
- Missing documents → verifiable by counting output pages vs source files

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-001 | All 15 `.md` files parsed with frontmatter | build-verify | `npm run build` (Zod schema errors fail build) | ❌ Wave 0 — `package.json` |
| REQ-002 | `airllm.md` and `langflow.md` date field is valid | build-verify | `npm run build` (schema rejects missing `date`) | ❌ Wave 0 — fix files first |
| REQ-003 | Build fails on missing required frontmatter field | build-verify | `npm run build` with a test doc missing `title` | ❌ Wave 0 — `package.json` |
| REQ-004 | Tags are lowercase, trimmed, hyphenated in output | output-check | `node scripts/validate-output.mjs --check-tags` | ❌ Wave 0 |
| REQ-005 | Tag index: each tag page lists correct documents | output-count | Check `dist/tags/*/index.html` count matches unique tags | ❌ Wave 0 |
| REQ-010 | 15 document HTML pages generated | output-count | `ls dist/ai-tools-and-services dist/cloud-ai-platforms dist/companies \| wc -l` | ❌ Wave 0 |
| REQ-011 | Index page exists with all 15 documents listed | manual | Visual inspect `dist/index.html` | manual |
| REQ-012 | Per-tag pages generated for all tags | output-count | `ls dist/tags/ \| wc -l` | ❌ Wave 0 |
| REQ-013 | Tags on document pages link to `/tags/{tag}` | output-check | `node scripts/validate-output.mjs --check-tag-links` | ❌ Wave 0 |
| REQ-015 | Category sections on index page | manual | Visual inspect `dist/index.html` for three category groups | manual |
| REQ-030 | Dark background applied to all pages | manual | Visual inspect rendered pages | manual |
| REQ-031 | Neon accent on tag pills, hovers | manual | Visual inspect rendered pages | manual |
| REQ-032 | Monospace font loaded | manual | Browser devtools: computed `font-family` on body | manual |
| REQ-034 | WCAG AA contrast on body text | manual | Browser contrast checker on `--text-primary` vs `--bg-base` | manual |
| REQ-040 | Static HTML output in `dist/` | build-verify | `ls dist/` after `npm run build` | ❌ Wave 0 |
| REQ-041 | Cloudflare Pages auto-deploy on push | deploy-test | Push a commit, verify build completes in CF dashboard | manual |
| REQ-042 | `.gitignore` covers dist/, node_modules/ | manual | `git status` after build — `dist/` should not appear | ❌ Wave 0 — create `.gitignore` |

### Sampling Rate

- **Per task commit:** `npm run build` — Astro's build validates schema and routing
- **Per wave merge:** `npm run build && node scripts/validate-output.mjs` (when output validator exists)
- **Phase gate:** Full build passes + all 15 document pages exist in `dist/` + Cloudflare Pages URL is live before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `package.json` — Astro project does not exist yet; `npm run build` requires initialization
- [ ] `src/content/config.ts` — Content collections config; created in Wave 1
- [ ] `.node-version` — Pin Node.js 22 for Cloudflare Pages
- [ ] `.gitignore` — Does not exist yet (confirmed from codebase audit)
- [ ] `scripts/validate-output.mjs` — Output verification script; simple file count checks
- [ ] Fix `airllm.md` and `langflow.md` — Must be done BEFORE Astro initialization per STATE.md

---

## Sources

### Primary (HIGH confidence)
- Astro 5 Content Collections docs (`https://docs.astro.build/en/guides/content-collections/`) — verified `glob()` loader, `base` parameter, Zod schema pattern
- Astro deploy to Cloudflare docs (`https://docs.astro.build/en/guides/deploy/cloudflare/`) — confirmed no adapter needed for static output, build command `npm run build`, output dir `dist`
- Cloudflare Pages build image docs (`https://developers.cloudflare.com/pages/configuration/build-image/`) — confirmed default Node.js 22.16.0 on build image v3; `.node-version` file supported
- Direct codebase inspection — confirmed `airllm.md` line 2 and `langflow.md` line 2 have ` date:` with leading space; 15 total documents; full tag list audited

### Secondary (MEDIUM confidence)
- Astro routing reference (`https://docs.astro.build/en/reference/routing-reference/`) — `getStaticPaths()` + `getCollection()` pattern verified; `entry.id` confirmed as correct field in Astro 5
- Pre-existing project research in `.planning/research/` (STACK.md, ARCHITECTURE.md, PITFALLS.md) — HIGH alignment with verified current docs

### Tertiary (LOW confidence)
- Specific npm package versions for `@fontsource/fira-code` and `wrangler` — version numbers from training data; verify with `npm info` before installing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Astro 5 APIs verified against official docs; Cloudflare Pages config verified
- Architecture: HIGH — Content Collections with root-level glob loaders confirmed working; routing patterns confirmed
- Pitfalls: HIGH — Pitfalls 1–4 derived from direct codebase inspection (actual tag data, actual frontmatter bugs) and Astro 5 API verification; Pitfalls 5–7 are well-established CSS/deployment patterns

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (Astro docs are stable; Cloudflare Pages build config changes infrequently)
