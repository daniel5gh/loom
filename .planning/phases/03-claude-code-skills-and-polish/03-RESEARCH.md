# Phase 3: Claude Code Skills and Polish — Research

**Researched:** 2026-03-09
**Domain:** Claude Code Skills system, Astro Shiki syntax highlighting, CSS neon glow effects, Wrangler local preview
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-016 | Syntax highlighting for code blocks (Shiki, build-time) | Astro 5 has built-in Shiki; one `shikiConfig` block in `astro.config.mjs` enables it. `css-variables` theme integrates with the existing CSS custom properties. |
| REQ-033 | Glow/bloom effects on graph elements and accent highlights (CSS, not affecting text readability) | SVG `<feGaussianBlur>` glow filter already exists on graph nodes. CSS `box-shadow` multi-layer technique for tag pills, cards, nav links. Must preserve WCAG AA contrast — glow applies to borders/elements, not text. |
| REQ-043 | Local preview via Wrangler (`wrangler pages dev`) | `wrangler` is already in `devDependencies`. Command is `npx wrangler pages dev dist/`. Requires `npm run build` first, then wrangler serves from `dist/`. |
| REQ-050 | `/research` skill: given a topic, research it and create a new document following TEMPLATE.md | Claude Code Skills (`.claude/skills/research/SKILL.md`). Uses `$ARGUMENTS` for topic. Skill reads `TEMPLATE.md`, applies tag normalization rule. |
| REQ-051 | `/organize` skill: audit existing documents for missing/inconsistent tags and suggest fixes | Claude Code Skills (`.claude/skills/organize/SKILL.md`). Reads all markdown files from the three category dirs, audits frontmatter, reports inconsistencies. |
| REQ-052 | `/validate` skill: check all documents for frontmatter errors and template non-conformance | Claude Code Skills (`.claude/skills/validate/SKILL.md`). Checks required frontmatter fields (`title`, `date`, `tags`), validates against `TEMPLATE.md` structure. |
| REQ-053 | Skills enforce tag normalization (lowercase, hyphenated, canonical form) | Tag normalization rule is `tag.toLowerCase().trim().replace(/\s+/g, '-')` — already in `src/content/config.ts`. Skills must mirror this exact rule in their instructions. |
</phase_requirements>

---

## Summary

Phase 3 has two distinct work streams. The first — Claude Code Skills — involves creating three SKILL.md files in `.claude/skills/`. The skills system is well-documented in the current Claude Code docs: a folder per skill, a `SKILL.md` file with YAML frontmatter, and markdown instructions. No new npm packages are required for skills themselves; they are pure instruction documents that Claude interprets.

The second stream — visual polish — covers three independent tasks: (1) enabling Shiki syntax highlighting in `astro.config.mjs` with a theme that complements the existing dark/neon CSS custom properties, (2) adding CSS glow/bloom effects to interactive elements (tag pills, cards, nav links) using layered `box-shadow`, and (3) verifying the `wrangler pages dev` preview workflow. The graph node glow via SVG `<feGaussianBlur>` is already implemented in Phase 2. The CSS glow work extends this aesthetic to the rest of the site.

The tag normalization rule that all skills must enforce is already codified in `src/content/config.ts`: `tag.toLowerCase().trim().replace(/\s+/g, '-')`. Skills must replicate this rule verbatim in their instructions so they produce canonical tags.

**Primary recommendation:** Build each skill as a separate `.claude/skills/<name>/SKILL.md` with `disable-model-invocation: true` (user-invoked tools with side effects). For Shiki, use the `css-variables` theme and map CSS variables to the existing `--neon-cyan`, `--bg-elevated`, and `--text-primary` custom properties.

---

## Standard Stack

### Core (already in project)
| Library/Tool | Version | Purpose | Notes |
|---|---|---|---|
| Astro | ^5.18.0 | Static site framework | Built-in Shiki support via `markdown.shikiConfig` |
| Shiki | built into Astro | Syntax highlighting | No separate install needed |
| Wrangler | ^3.0.0 (devDep) | Local Cloudflare Pages preview | Already installed |
| Claude Code Skills | system feature | AI slash commands | No install; SKILL.md files only |

### No New npm Dependencies Required
Phase 3 requires no new packages. All capabilities are either built into Astro 5 or are part of the Claude Code runtime.

**Installation:** Nothing new to install.

---

## Architecture Patterns

### Recommended Skills Structure
```
.claude/
└── skills/
    ├── research/
    │   ├── SKILL.md         # Main instructions (required)
    │   └── template.md      # Copy of TEMPLATE.md for reference
    ├── organize/
    │   └── SKILL.md
    └── validate/
        └── SKILL.md
```

Each skill is a directory. The directory name becomes the `/slash-command`. A supporting `template.md` file in the `research/` skill gives Claude direct access to the document template without relying on it finding `TEMPLATE.md` in the project root.

### Pattern 1: Skill Frontmatter for User-Invoked Side-Effect Tools

All three skills create or modify files — they should use `disable-model-invocation: true` so Claude does not auto-trigger them.

```yaml
# Source: https://code.claude.com/docs/en/skills
---
name: research
description: Research a topic and create a new document following the project TEMPLATE.md
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash
---
```

### Pattern 2: `$ARGUMENTS` for Topic Input (`/research`)

```yaml
---
name: research
description: Research a topic and create a new document following TEMPLATE.md
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash
---

Research the topic: $ARGUMENTS

1. Read [template.md](template.md) to understand required document structure
2. Research "$ARGUMENTS" thoroughly using WebSearch
3. Determine which category directory to use (ai-tools-and-services/, cloud-ai-platforms/, or companies/)
4. Create a slug: lowercase, hyphen-separated, e.g. "my-topic" → "my-topic.md"
5. Write the document to the correct category directory
6. Tags must be normalized: lowercase, trim whitespace, replace spaces with hyphens
   - Rule: tag.toLowerCase().trim().replace(/\s+/g, '-')
   - Examples: "Large Language Models" → "large-language-models", "API" → "api"
7. Confirm the file was created and show the frontmatter
```

### Pattern 3: Audit-and-Report Pattern (`/organize`, `/validate`)

These skills read all documents and report findings without modifying files automatically. Present a structured report and ask for confirmation before writing any changes.

```yaml
---
name: validate
description: Validate all documents for frontmatter errors and template conformance
disable-model-invocation: true
allowed-tools: Read, Glob, Bash
---

Validate all documents in the knowledge base.

Required frontmatter fields: title (string), date (YYYY-MM-DD), tags (list)
Required document sections: H1 heading matching title, ## Summary, ## Content

Steps:
1. Use Glob to find all *.md files in ai-tools-and-services/, cloud-ai-platforms/, companies/
2. For each file: parse frontmatter, check required fields exist and are non-empty
3. Check H1 heading matches frontmatter title
4. Check ## Summary section exists
5. Check ## Content section exists
6. Report all errors in a structured table
7. Do NOT modify any files — report only
```

### Pattern 4: Shiki Configuration via CSS Variables

```javascript
// Source: https://docs.astro.build/en/guides/syntax-highlighting/
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://loom-7kv.pages.dev',
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: false,
    },
  },
});
```

Then in `public/styles/global.css`, map Shiki CSS variables to the project's custom properties:

```css
/* Shiki css-variables theme mapping to Loom neon palette */
:root {
  --shiki-color-background: var(--bg-elevated);  /* #1A1A3A */
  --shiki-color-text:        var(--text-primary); /* #D0D0D0 */
  --shiki-token-keyword:     var(--neon-cyan);    /* #00E5FF */
  --shiki-token-string:      var(--neon-green);   /* #39FF14 */
  --shiki-token-comment:     var(--text-secondary);/* #8888AA */
  --shiki-token-function:    var(--neon-magenta); /* #FF2D78 */
  --shiki-token-constant:    #FFD700;             /* gold — distinct from neon accents */
  --shiki-token-parameter:   var(--text-primary);
  --shiki-token-punctuation: var(--text-secondary);
}
```

Note: Shiki wraps highlighted code in `.astro-code` blocks. The existing `global.css` already has `.doc-content pre` and `.doc-content pre code` rules — the Shiki output targets `.astro-code` as the `<pre>` element, so the existing pre styling will still apply to layout. The `css-variables` approach means no hard-coded colors in the Astro config.

### Pattern 5: CSS Neon Glow for Interactive Elements

Multi-layer `box-shadow` creates the neon bloom effect on borders and containers:

```css
/* Neon glow on tag pills — layered box-shadow */
.tag-pill {
  /* existing border or background styles */
  transition: box-shadow 0.2s ease;
}

.tag-pill:hover {
  box-shadow:
    0 0  4px var(--neon-cyan),
    0 0 10px var(--neon-cyan),
    0 0 20px rgba(0, 229, 255, 0.3);
}

/* Subtle always-on glow for active/selected states */
.tag-filter-btn.active {
  box-shadow:
    0 0  3px var(--neon-cyan),
    0 0  8px rgba(0, 229, 255, 0.4);
}
```

The graph node SVG glow is already implemented using `<feGaussianBlur stdDeviation="2.5">`. No changes needed there.

Do NOT apply `text-shadow` to body text — this would compromise the WCAG AA contrast that was achieved in Phase 1.

### Pattern 6: Wrangler Pages Dev Preview

```bash
# Build first, then serve the static output
npm run build
npx wrangler pages dev dist/
# Serves at http://127.0.0.1:8788
```

The `package.json` already has wrangler as a devDependency. No configuration file is needed for a pure static site (no Workers/Functions). The `dist/` directory is Astro's default output.

### Anti-Patterns to Avoid

- **Using `context: fork` for skills that need file system writes:** Forked subagents may not have correct working directory. These skills should run inline.
- **Auto-triggering research/organize/validate:** Always use `disable-model-invocation: true`. These tools modify or audit the file system and must be user-invoked.
- **Using `text-shadow` for glow on body text:** Breaks WCAG contrast. Glow only on borders, backgrounds, and SVG elements.
- **Using a named Shiki theme (e.g., `dracula`) instead of `css-variables`:** Hard-codes colors that conflict with the custom dark palette. Use `css-variables` to integrate with the CSS custom property system already in place.
- **Putting tag normalization logic only in skill instructions:** The canonical rule is in `src/content/config.ts`. Skills must state the exact rule (`tag.toLowerCase().trim().replace(/\s+/g, '-')`) so output is build-time compatible.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom regex highlighter | Astro built-in Shiki | 200+ languages, edge cases, token accuracy |
| Skill argument parsing | Bash argument parsing | `$ARGUMENTS` placeholder | Native Claude Code feature, no extra code |
| Markdown frontmatter parsing in validate skill | Custom YAML parser | Read tool + instruct Claude to parse | Claude can read and interpret YAML natively |
| SVG glow on graph nodes | Custom canvas draw calls | Existing `<feGaussianBlur>` (already done) | Already implemented in Phase 2 |

---

## Common Pitfalls

### Pitfall 1: `.claude/commands/` vs `.claude/skills/` Naming Conflict
**What goes wrong:** Creating both `.claude/commands/research.md` and `.claude/skills/research/SKILL.md` — the skill takes precedence over the command, but having both causes confusion.
**Why it happens:** Legacy commands format and new skills format coexist. The project currently has no commands directory.
**How to avoid:** Use only `.claude/skills/` — this is the current recommended format. Do not create a `.claude/commands/` directory.
**Warning signs:** `/research` not appearing in the slash command menu.

### Pitfall 2: Shiki CSS Variables Theme Needs Full Variable Set
**What goes wrong:** Using `theme: 'css-variables'` without defining the required CSS variables → code blocks render without any color or with fallback browser defaults.
**Why it happens:** The `css-variables` theme delegates all color decisions to the CSS layer. If variables are undefined, colors are empty strings.
**How to avoid:** Define all `--shiki-token-*` variables in `:root` before deploying. Check with `astro build` and inspect the output HTML.
**Warning signs:** All code block text appears as `--text-primary` color (no token differentiation).

### Pitfall 3: Wrangler Serves Stale Build
**What goes wrong:** Running `wrangler pages dev dist/` after changing source files but before rebuilding → changes not visible.
**Why it happens:** Wrangler serves the static `dist/` directory, not the source. It does not watch for source changes.
**How to avoid:** Always `npm run build` before `wrangler pages dev dist/`. For development iteration, use `npm run dev` (Astro dev server); use wrangler only for final Cloudflare-environment verification.
**Warning signs:** Changes in `.astro` files not reflected in wrangler output.

### Pitfall 4: Skills Applying Non-Canonical Tags
**What goes wrong:** The `/research` skill creates a document with tags like `["LLM", "Open Source"]` — Astro's Zod transform normalizes them at build time, but the source file has non-canonical values. The `/validate` skill then correctly flags them as inconsistent.
**Why it happens:** Skills author documents by hand and may not apply the normalization rule correctly.
**How to avoid:** State the exact rule in skill instructions and include examples. The rule: `tag.toLowerCase().trim().replace(/\s+/g, '-')`.
**Warning signs:** Running `/validate` after `/research` shows tag inconsistency warnings on newly created documents.

### Pitfall 5: Glow Effects Causing Performance Issues on Low-End Devices
**What goes wrong:** Too many simultaneous `box-shadow` glows cause paint thrashing during scroll.
**Why it happens:** CSS `box-shadow` triggers paint (not composite), and many glowing elements scrolling simultaneously is expensive.
**How to avoid:** Limit always-on glow to maximum 2-3 element types (e.g., active tag filter button, hovered card). Hover-only glows are fine since only one element glows at a time. Two to five shadow layers is the practical maximum per element.
**Warning signs:** Janky scroll performance on the index page with many DocCards.

---

## Code Examples

### Skill SKILL.md Structure
```yaml
# Source: https://code.claude.com/docs/en/skills
---
name: research
description: Research a topic and create a new document following TEMPLATE.md
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash, Glob
---

# Research Skill

Research "$ARGUMENTS" and create a new Loom document.

## Tag normalization rule
All tags must follow: tag.toLowerCase().trim().replace(/\s+/g, '-')
Examples: "Machine Learning" → "machine-learning", "API" → "api", "LLM" → "llm"

## Steps
1. Read [template.md](template.md) to confirm required document structure
2. Research the topic using available tools
3. Select category: ai-tools-and-services/, cloud-ai-platforms/, or companies/
4. Create filename: lowercase, hyphen-separated, e.g. "$ARGUMENTS" → "<slug>.md"
5. Write the complete document to <category>/<slug>.md
6. Confirm creation and display the resulting frontmatter
```

### Astro Config with Shiki
```javascript
// Source: https://docs.astro.build/en/guides/syntax-highlighting/
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://loom-7kv.pages.dev',
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: false,
    },
  },
});
```

### CSS Glow Effect Pattern (box-shadow layering)
```css
/* Source: CSS-Tricks neon glow pattern */
/* Applied to interactive elements only, never body text */
.tag-pill:hover,
a.tag-pill:focus {
  box-shadow:
    0 0  3px var(--neon-cyan),
    0 0  8px var(--neon-cyan),
    0 0 16px rgba(0, 229, 255, 0.25);
  outline: none; /* box-shadow replaces default outline */
}

/* DocCard hover glow (border-radius aware) */
.doc-card:hover {
  border-color: var(--neon-cyan);
  box-shadow:
    0 0  4px var(--neon-cyan),
    0 0 12px rgba(0, 229, 255, 0.2);
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| `.claude/commands/file.md` | `.claude/skills/<name>/SKILL.md` | Skills add supporting files, invocation control, auto-discovery |
| Prism (manual stylesheet) | Shiki (Astro built-in, build-time) | Zero runtime JS, no FOUC, token-accurate |
| `astro preview` | `wrangler pages dev dist/` | Tests actual Cloudflare Pages environment (Workers, headers, etc.) |

**Deprecated/outdated:**
- `.claude/commands/` format: still works but Skills are the recommended replacement (March 2026 docs). Since this project has no existing commands, go straight to `.claude/skills/`.
- Prism highlighting in Astro: Shiki is the default since Astro 2.x. Do not use Prism.

---

## Open Questions

1. **Which Shiki built-in theme to use as fallback if `css-variables` proves difficult**
   - What we know: `github-dark` is the Astro default; `dracula` and `dark-plus` are popular dark themes
   - What's unclear: Whether `css-variables` renders correctly in Cloudflare Pages builds without additional CSS variable configuration
   - Recommendation: Start with `css-variables` + CSS variable block. If token colors are wrong after `astro build`, fall back to `github-dark` (most compatible, already tested in Astro core).

2. **Whether the `/organize` skill should auto-apply fixes or report-only**
   - What we know: REQ-051 says "suggest fixes", not "apply fixes"
   - What's unclear: Whether the user wants an interactive approval step
   - Recommendation: Report-only by default; skill instructions should end with "Present a proposed diff. Do not write files unless the user confirms."

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` (no test runner) |
| Config file | none — tests run directly with `node` |
| Quick run command | `node src/lib/graph.test.mjs` |
| Full suite command | `node src/lib/graph.test.mjs && node scripts/validate-output.mjs` (requires `npm run build` first) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-016 | Code blocks in built HTML have Shiki-generated markup | smoke | `node scripts/validate-output.mjs` (spot-check `<code>` in HTML) | ❌ Wave 0: extend validate-output.mjs |
| REQ-033 | Glow CSS rules present in built CSS | smoke | `grep "box-shadow" dist/styles/global.css` (or manual browser check) | manual-only |
| REQ-043 | `wrangler pages dev dist/` starts without error | smoke | `npx wrangler pages dev dist/ &` (manual port check) | manual-only |
| REQ-050 | `/research` skill exists at `.claude/skills/research/SKILL.md` | unit | `ls .claude/skills/research/SKILL.md` | ❌ Wave 0 |
| REQ-051 | `/organize` skill exists at `.claude/skills/organize/SKILL.md` | unit | `ls .claude/skills/organize/SKILL.md` | ❌ Wave 0 |
| REQ-052 | `/validate` skill exists at `.claude/skills/validate/SKILL.md` | unit | `ls .claude/skills/validate/SKILL.md` | ❌ Wave 0 |
| REQ-053 | Skills reference exact tag normalization rule | unit | `grep "toLowerCase" .claude/skills/*/SKILL.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node src/lib/graph.test.mjs`
- **Per wave merge:** `npm run build && node src/lib/graph.test.mjs && node scripts/validate-output.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `scripts/validate-output.mjs` to check for Shiki output (`<code class="astro-code">`) in at least one built document page — covers REQ-016
- [ ] Skill file existence checks can be validated manually; no test framework addition needed

---

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills docs — code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) — Full skills system specification, frontmatter reference, argument substitution
- [Astro Syntax Highlighting docs — docs.astro.build/en/guides/syntax-highlighting/](https://docs.astro.build/en/guides/syntax-highlighting/) — Shiki configuration options, css-variables theme

### Secondary (MEDIUM confidence)
- [Cloudflare Wrangler Pages dev — developers.cloudflare.com/pages/functions/local-development/](https://developers.cloudflare.com/pages/functions/local-development/) — `wrangler pages dev <dist>` command
- [CSS neon glow technique — css-tricks.com/how-to-create-neon-text-with-css/](https://css-tricks.com/how-to-create-neon-text-with-css/) — Multi-layer `box-shadow` pattern; verified against MDN box-shadow spec

### Tertiary (LOW confidence — needs validation)
- WebSearch result: Shiki `css-variables` theme requires all `--shiki-token-*` variables to be defined or tokens render without color — not directly verified in Astro 5 docs but consistent with Shiki upstream behavior

---

## Metadata

**Confidence breakdown:**
- Skills system (REQ-050/051/052/053): HIGH — Official Claude Code docs fetched directly, format confirmed
- Shiki configuration (REQ-016): HIGH — Official Astro docs fetched directly; css-variables theme approach is MEDIUM (plausible but not end-to-end verified in Astro 5 context)
- CSS glow effects (REQ-033): HIGH — Standard CSS technique, well-documented, consistent with existing Phase 2 SVG glow approach
- Wrangler preview (REQ-043): HIGH — Official Cloudflare docs; wrangler already in devDependencies

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — Skills API stable; Astro minor updates possible but shikiConfig stable since Astro 2)
