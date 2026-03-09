# Phase 3: Claude Code Skills and Polish — Research

**Researched:** 2026-03-09 (updated 2026-03-09)
**Domain:** Claude Code Skills system, Astro Shiki syntax highlighting, CSS neon glow effects, Wrangler local preview
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All skills use the `/loom:` namespace prefix
- Command names: `/loom:research`, `/loom:organize`, `/loom:validate`
- Skill directories: `.claude/skills/loom:research/` or `.claude/skills/research/` with name field set to `loom:research` in frontmatter

### Claude's Discretion
- /research skill: whether to do live web research or scaffold a template (researcher/planner to decide based on Claude Code skill capabilities)
- /organize: exact output format and level of granularity for tag audit report
- /validate: strictness on optional TEMPLATE.md sections
- Shiki theme selection (css-variables for palette integration vs named dark theme)
- Which interactive elements receive glow effects beyond tag pills and doc cards
- CSS glow intensity and spread values

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-016 | Syntax highlighting for code blocks (Shiki, build-time) | Astro 5 has built-in Shiki; one `shikiConfig` block in `astro.config.mjs` enables it. `css-variables` theme integrates with existing CSS custom properties via `--astro-code-*` variables. |
| REQ-033 | Glow/bloom effects on graph elements and accent highlights (CSS, not affecting text readability) | SVG `<feGaussianBlur>` glow filter already exists on graph nodes. CSS `box-shadow` multi-layer technique for tag pills, cards, nav links. Must preserve WCAG AA contrast — glow applies to borders/elements, not text. |
| REQ-043 | Local preview via Wrangler (`wrangler pages dev`) | `wrangler` is already in `devDependencies`. Command is `npx wrangler pages dev dist/`. Requires `npm run build` first, then wrangler serves from `dist/`. |
| REQ-050 | `/loom:research` skill: given a topic, research it and create a new document following TEMPLATE.md | Claude Code Skills (`.claude/skills/research/SKILL.md` with `name: loom:research`). Uses `$ARGUMENTS` for topic. Skill reads `TEMPLATE.md`, applies tag normalization rule. |
| REQ-051 | `/loom:organize` skill: audit existing documents for missing/inconsistent tags and suggest fixes | Claude Code Skills (`.claude/skills/organize/SKILL.md` with `name: loom:organize`). Reads all markdown files from the three category dirs, audits frontmatter, reports inconsistencies. |
| REQ-052 | `/loom:validate` skill: check all documents for frontmatter errors and template non-conformance | Claude Code Skills (`.claude/skills/validate/SKILL.md` with `name: loom:validate`). Checks required frontmatter fields (`title`, `date`, `tags`), validates against `TEMPLATE.md` structure. |
| REQ-053 | Skills enforce tag normalization (lowercase, hyphenated, canonical form) | Tag normalization rule is `tag.toLowerCase().trim().replace(/\s+/g, '-')` — already in `src/content/config.ts`. Skills must mirror this exact rule in their instructions. |
</phase_requirements>

---

## Summary

Phase 3 has two distinct work streams. The first — Claude Code Skills — involves creating three SKILL.md files in `.claude/skills/`. The skills system is documented at code.claude.com/docs/en/slash-commands: a folder per skill, a `SKILL.md` file with YAML frontmatter, and markdown instructions. The `name` field in frontmatter sets the slash command (e.g., `name: loom:research` creates `/loom:research`). No new npm packages are required for skills themselves; they are pure instruction documents that Claude interprets.

The second stream — visual polish — covers three independent tasks: (1) enabling Shiki syntax highlighting in `astro.config.mjs` with the `css-variables` theme and mapping `--astro-code-*` CSS variables to the existing neon palette, (2) adding CSS glow/bloom effects to interactive elements (tag pills, cards) using layered `box-shadow`, and (3) verifying the `wrangler pages dev` preview workflow. The graph node glow via SVG `<feGaussianBlur>` is already implemented in Phase 2.

**Critical correction from prior research:** Astro's `css-variables` Shiki theme uses `--astro-code-*` CSS custom property names, NOT `--shiki-token-*`. For example: `--astro-code-token-keyword`, `--astro-code-color-background`. Any implementation using `--shiki-token-*` names will produce code blocks with no token colors.

**Primary recommendation:** Build each skill as `.claude/skills/<dirname>/SKILL.md` with `name: loom:<verb>` in frontmatter and `disable-model-invocation: true`. For Shiki, use the `css-variables` theme and map `--astro-code-*` variables to the existing neon palette custom properties.

---

## Standard Stack

### Core (already in project)
| Library/Tool | Version | Purpose | Notes |
|---|---|---|---|
| Astro | ^5.x | Static site framework | Built-in Shiki support via `markdown.shikiConfig` |
| Shiki | built into Astro | Syntax highlighting | No separate install needed |
| Wrangler | ^3.x (devDep) | Local Cloudflare Pages preview | Already installed |
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
    │   ├── SKILL.md         # name: loom:research (required)
    │   └── template.md      # Copy of TEMPLATE.md for reference
    ├── organize/
    │   └── SKILL.md         # name: loom:organize
    └── validate/
        └── SKILL.md         # name: loom:validate
```

The directory name is used as a fallback if `name` is omitted, but since the locked decision requires the `/loom:` namespace prefix, the `name` field MUST be set explicitly in frontmatter (e.g., `name: loom:research`). A supporting `template.md` file in the `research/` skill gives Claude direct access to the document template without relying on it finding `TEMPLATE.md` in the project root.

### Pattern 1: Skill Frontmatter for User-Invoked Side-Effect Tools

All three skills create or modify files — they should use `disable-model-invocation: true` so Claude does not auto-trigger them. Only you can invoke them with `/loom:research`, `/loom:organize`, `/loom:validate`.

```yaml
# Source: https://code.claude.com/docs/en/slash-commands
---
name: loom:research
description: Research a topic and create a new document following TEMPLATE.md
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash, Glob
---
```

### Pattern 2: `$ARGUMENTS` for Topic Input (`/loom:research`)

```yaml
---
name: loom:research
description: Research a topic and create a new document following the Loom TEMPLATE.md
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash, Glob
---

Research the topic: $ARGUMENTS

1. Read [template.md](template.md) to understand required document structure
2. Research "$ARGUMENTS" thoroughly using WebSearch
3. Determine which category directory to use (ai-tools-and-services/, cloud-ai-platforms/, or companies/)
4. Create a slug: lowercase, hyphen-separated, e.g. "my topic" → "my-topic.md"
5. Write the document to the correct category directory
6. Tags MUST be normalized: tag.toLowerCase().trim().replace(/\s+/g, '-')
   - Examples: "Large Language Models" → "large-language-models", "API" → "api", "LLM" → "llm"
7. Confirm the file was created and show the resulting frontmatter
```

### Pattern 3: Audit-and-Report Pattern (`/loom:organize`, `/loom:validate`)

These skills read all documents and report findings without modifying files automatically. Present a structured report and ask for confirmation before writing any changes (per REQ-051: "suggest fixes").

```yaml
---
name: loom:validate
description: Validate all Loom documents for frontmatter errors and template conformance
disable-model-invocation: true
allowed-tools: Read, Glob
---

Validate all documents in the knowledge base.

Required frontmatter fields: title (string), date (YYYY-MM-DD), tags (list)
Required document sections: H1 heading, ## Summary, ## Content

Steps:
1. Use Glob to find all *.md files in ai-tools-and-services/, cloud-ai-platforms/, companies/
2. For each file: read it, parse frontmatter, check required fields exist and are non-empty
3. Check H1 heading exists
4. Check ## Summary section exists
5. Check ## Content section exists
6. Check tags are normalized: tag.toLowerCase().trim().replace(/\s+/g, '-')
7. Report all errors in a structured table
8. Do NOT modify any files — report only
```

### Pattern 4: Shiki Configuration via CSS Variables (CORRECTED)

**Important:** Astro wraps highlighted code in `<pre class="astro-code">`. The CSS variable names use the `--astro-code-*` prefix, NOT `--shiki-token-*`.

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

Then in `public/styles/global.css`, map `--astro-code-*` variables to the project's custom properties:

```css
/* Shiki css-variables theme mapping to Loom neon palette */
/* Variable prefix is --astro-code-* in Astro 5, NOT --shiki-token-* */
:root {
  --astro-code-color-background:        var(--bg-elevated);      /* #1A1A3A */
  --astro-code-color-text:              var(--text-primary);     /* #D0D0D0 */
  --astro-code-token-keyword:           var(--neon-cyan);        /* #00E5FF */
  --astro-code-token-string:            var(--neon-green);       /* #39FF14 */
  --astro-code-token-string-expression: var(--neon-green);       /* #39FF14 */
  --astro-code-token-comment:           var(--text-secondary);   /* #8888AA */
  --astro-code-token-function:          var(--neon-magenta);     /* #FF2D78 */
  --astro-code-token-constant:          #FFD700;                 /* gold */
  --astro-code-token-parameter:         var(--text-primary);
  --astro-code-token-punctuation:       var(--text-secondary);
  --astro-code-token-link:              var(--neon-cyan);
}
```

Additionally, override the `<pre class="astro-code">` background to prevent Shiki's inline style from conflicting with the dark palette:

```css
/* Shiki wraps highlighted code in .astro-code; override inline background */
.doc-content .astro-code {
  background: var(--bg-elevated) !important;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}
.doc-content .astro-code code {
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
}
```

### Pattern 5: CSS Neon Glow for Interactive Elements

Multi-layer `box-shadow` creates the neon bloom effect on borders and containers. Add `box-shadow` to existing hover rules — do not replace them.

```css
/* Neon glow on tag pills — extend existing .tag-pill:hover */
.tag-pill {
  /* Existing rules stay; add box-shadow to the transition property */
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.tag-pill:hover,
a.tag-pill:focus {
  /* Existing background/color rules stay; add: */
  box-shadow:
    0 0  3px var(--neon-cyan),
    0 0  8px var(--neon-cyan),
    0 0 16px rgba(0, 229, 255, 0.25);
  outline: none; /* box-shadow replaces default outline */
}

/* Neon glow on doc cards — extend existing .doc-card:hover */
.doc-card {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.doc-card:hover {
  /* Existing border-color rule stays; add: */
  box-shadow:
    0 0  4px var(--neon-cyan),
    0 0 12px rgba(0, 229, 255, 0.2);
}
```

The graph node SVG glow is already implemented using `<feGaussianBlur stdDeviation="2.5">`. No changes needed there.

Do NOT apply `text-shadow` to body text — this would compromise WCAG AA contrast.

### Pattern 6: Wrangler Pages Dev Preview

```bash
# Build first, then serve the static output
npm run build
npx wrangler pages dev dist/
# Serves at http://127.0.0.1:8788
```

The `package.json` already has wrangler as a devDependency. No configuration file is needed for a pure static site. The `dist/` directory is Astro's default output.

### Anti-Patterns to Avoid

- **Using `--shiki-token-*` variable names:** Astro 5 uses `--astro-code-*` prefix. `--shiki-token-*` will produce uncolored code blocks.
- **Using `context: fork` for these skills:** These skills read and write the working project directory. Forked subagents have isolated context which may cause them to lose access to the project. Run inline.
- **Auto-triggering research/organize/validate:** Always use `disable-model-invocation: true`. These tools modify or audit the file system and must be user-invoked.
- **Using `text-shadow` for glow on body text:** Breaks WCAG contrast. Glow only on borders, backgrounds, and SVG elements.
- **Using a named Shiki theme (e.g., `dracula`) instead of `css-variables`:** Hard-codes colors that conflict with the custom dark palette.
- **Omitting `name:` in frontmatter:** Without the explicit `name: loom:research` field, the command will be `/research` not `/loom:research`. The namespace prefix requires the explicit `name` field.
- **Putting tag normalization logic only in skill instructions:** The canonical rule is in `src/content/config.ts`. Skills must state the exact rule (`tag.toLowerCase().trim().replace(/\s+/g, '-')`) so output is build-time compatible.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom regex highlighter | Astro built-in Shiki | 200+ languages, edge cases, token accuracy |
| Skill argument parsing | Bash argument parsing | `$ARGUMENTS` placeholder | Native Claude Code feature, no extra code |
| Markdown frontmatter parsing in validate skill | Custom YAML parser | Read tool + instruct Claude to parse | Claude reads and interprets YAML natively |
| SVG glow on graph nodes | Custom canvas draw calls | Existing `<feGaussianBlur>` (already done) | Already implemented in Phase 2 |

---

## Common Pitfalls

### Pitfall 1: Wrong CSS Variable Prefix for Shiki
**What goes wrong:** Using `--shiki-token-keyword` instead of `--astro-code-token-keyword` → all code block text renders as a single color with no token differentiation.
**Why it happens:** Shiki upstream docs use `--shiki-*` names, but Astro wraps Shiki and remaps to `--astro-code-*`. Multiple outdated tutorials still show the old names.
**How to avoid:** Always use `--astro-code-*` prefix. The full list: `--astro-code-color-background`, `--astro-code-color-text`, `--astro-code-token-keyword`, `--astro-code-token-string`, `--astro-code-token-string-expression`, `--astro-code-token-comment`, `--astro-code-token-function`, `--astro-code-token-constant`, `--astro-code-token-parameter`, `--astro-code-token-punctuation`, `--astro-code-token-link`.
**Warning signs:** Code blocks show all tokens in `--text-primary` color without any differentiation.

### Pitfall 2: Shiki CSS Variables Theme Needs Full Variable Set
**What goes wrong:** Using `theme: 'css-variables'` without defining the required CSS variables → tokens render without color or with browser defaults.
**Why it happens:** The `css-variables` theme delegates all color decisions to the CSS layer. If variables are undefined, colors are empty strings.
**How to avoid:** Define all `--astro-code-token-*` variables in `:root` before deploying. Check with `astro build` and inspect the output HTML.
**Warning signs:** All code block text appears as `--astro-code-color-text` color (no token differentiation).

### Pitfall 3: `/loom:research` Namespace Requires Explicit `name:` Field
**What goes wrong:** Creating a skill at `.claude/skills/research/SKILL.md` without setting `name: loom:research` in frontmatter → command is `/research` not `/loom:research`.
**Why it happens:** The directory name is the fallback when `name` is omitted. Since colons are not valid in directory names, the namespace prefix cannot come from the directory name alone.
**How to avoid:** Always set `name: loom:research` (or `loom:organize`, `loom:validate`) explicitly in frontmatter.
**Warning signs:** Commands show up as `/research`, `/organize`, `/validate` without the `loom:` prefix.

### Pitfall 4: Wrangler Serves Stale Build
**What goes wrong:** Running `wrangler pages dev dist/` after changing source files but before rebuilding → changes not visible.
**Why it happens:** Wrangler serves the static `dist/` directory, not the source. It does not watch for source changes.
**How to avoid:** Always `npm run build` before `wrangler pages dev dist/`. For development iteration, use `npm run dev` (Astro dev server); use wrangler only for final Cloudflare-environment verification.
**Warning signs:** Changes in `.astro` files not reflected in wrangler output.

### Pitfall 5: Skills Applying Non-Canonical Tags
**What goes wrong:** The `/loom:research` skill creates a document with tags like `["LLM", "Open Source"]` — Astro's Zod transform normalizes them at build time, but the source file has non-canonical values. The `/loom:validate` skill then correctly flags them as inconsistent.
**Why it happens:** Skills author documents by hand and may not apply the normalization rule correctly.
**How to avoid:** State the exact rule in skill instructions and include examples. The rule: `tag.toLowerCase().trim().replace(/\s+/g, '-')`.
**Warning signs:** Running `/loom:validate` after `/loom:research` shows tag inconsistency warnings on newly created documents.

### Pitfall 6: Glow Effects Causing Performance Issues on Low-End Devices
**What goes wrong:** Too many simultaneous `box-shadow` glows cause paint thrashing during scroll.
**Why it happens:** CSS `box-shadow` triggers paint (not composite), and many glowing elements scrolling simultaneously is expensive.
**How to avoid:** Limit always-on glow to maximum 2-3 element types. Hover-only glows are fine since only one element glows at a time. Two to five shadow layers is the practical maximum per element.
**Warning signs:** Janky scroll performance on the index page with many DocCards.

---

## Code Examples

Verified patterns from official sources:

### Skill SKILL.md Structure (loom:research)
```yaml
# Source: https://code.claude.com/docs/en/slash-commands
---
name: loom:research
description: Research a topic and create a new Loom knowledge base document following TEMPLATE.md
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash, Glob
---

# Research Skill

Research "$ARGUMENTS" and create a new Loom document.

## Tag normalization rule
All tags MUST follow: tag.toLowerCase().trim().replace(/\s+/g, '-')
Examples: "Machine Learning" → "machine-learning", "API" → "api", "LLM" → "llm"

## Steps
1. Read [template.md](template.md) to confirm required document structure
2. Research the topic using WebSearch and available tools
3. Select category: ai-tools-and-services/, cloud-ai-platforms/, or companies/
4. Create filename: lowercase, hyphen-separated slug, e.g. "my topic" → "my-topic.md"
5. Write the complete document to <category>/<slug>.md
6. Apply tag normalization before writing — all tags must be canonical
7. Confirm creation and display the resulting frontmatter
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

### CSS Variable Mapping for Shiki (CORRECT --astro-code-* names)
```css
/* Source: https://docs.astro.build/en/guides/syntax-highlighting/ */
/* Source: https://christianpenrod.com/blog/astro-shiki-syntax-highlighting-with-css-variables */
/* IMPORTANT: Astro uses --astro-code-* prefix, NOT --shiki-token-* */
:root {
  --astro-code-color-background:        var(--bg-elevated);
  --astro-code-color-text:              var(--text-primary);
  --astro-code-token-keyword:           var(--neon-cyan);
  --astro-code-token-string:            var(--neon-green);
  --astro-code-token-string-expression: var(--neon-green);
  --astro-code-token-comment:           var(--text-secondary);
  --astro-code-token-function:          var(--neon-magenta);
  --astro-code-token-constant:          #FFD700;
  --astro-code-token-parameter:         var(--text-primary);
  --astro-code-token-punctuation:       var(--text-secondary);
  --astro-code-token-link:              var(--neon-cyan);
}
```

### CSS Glow Effect Pattern (box-shadow layering)
```css
/* Source: standard CSS technique, consistent with Phase 2 SVG glow approach */
/* Applied to interactive elements only, never body text */

.tag-pill {
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.tag-pill:hover,
a.tag-pill:focus {
  box-shadow:
    0 0  3px var(--neon-cyan),
    0 0  8px var(--neon-cyan),
    0 0 16px rgba(0, 229, 255, 0.25);
  outline: none;
}

.doc-card {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.doc-card:hover {
  border-color: var(--neon-cyan);
  box-shadow:
    0 0  4px var(--neon-cyan),
    0 0 12px rgba(0, 229, 255, 0.2);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `.claude/commands/file.md` | `.claude/skills/<name>/SKILL.md` | Claude Code mid-2025 | Skills add supporting files, invocation control, auto-discovery. Commands still work but Skills are recommended. |
| Prism (manual stylesheet) | Shiki (Astro built-in, build-time) | Astro 2.x | Zero runtime JS, no FOUC, token-accurate |
| `astro preview` | `wrangler pages dev dist/` | N/A | Tests actual Cloudflare Pages environment |
| `--shiki-token-*` variables | `--astro-code-*` variables | Astro 2.x (Astro-specific) | Must use `--astro-code-*` or tokens render without color |

**Deprecated/outdated:**
- `.claude/commands/` format: still works but Skills are the recommended replacement. Since this project has no existing commands, go straight to `.claude/skills/`.
- `--shiki-token-*` variable names: Shiki upstream uses these, but Astro remaps them to `--astro-code-*`. Do not use the raw Shiki variable names.
- Prism highlighting in Astro: Shiki is the default since Astro 2.x. Do not use Prism.

---

## Open Questions

1. **Whether `/loom:research` should do live web research or scaffold a template**
   - What we know: Claude Code skills can call WebSearch; the CONTEXT.md leaves this to researcher/planner discretion
   - What's unclear: How reliable WebSearch is during skill execution for a personal tool context
   - Recommendation: Include WebSearch in `allowed-tools` and instruct the skill to use it, but also include fallback instructions for when WebSearch is unavailable. Live research is more useful than a blank scaffold.

2. **Which Shiki built-in theme to use as fallback if `css-variables` proves difficult**
   - What we know: `github-dark` is the Astro default; it is the most tested
   - What's unclear: Whether `css-variables` renders correctly in Cloudflare Pages builds without CI testing
   - Recommendation: Start with `css-variables` + CSS variable block. If token colors are wrong after `astro build`, fall back to `github-dark`.

3. **Whether the `/loom:organize` skill should auto-apply fixes or report-only**
   - What we know: REQ-051 says "suggest fixes", not "apply fixes"
   - Recommendation: Report-only by default; skill instructions should end with "Present a proposed diff. Do not write files unless the user confirms."

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` (no test runner) |
| Config file | none — tests run directly with `node` |
| Quick run command | `node src/lib/graph.test.mjs` |
| Full suite command | `npm run build && node src/lib/graph.test.mjs && node scripts/validate-output.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-016 | Code blocks in built HTML have `<pre class="astro-code">` Shiki markup | smoke | `node scripts/validate-output.mjs` (check for `astro-code` in HTML) | ❌ Wave 0: extend validate-output.mjs |
| REQ-033 | Glow CSS rules present in global.css | smoke | `grep "box-shadow" public/styles/global.css` | manual-only |
| REQ-043 | `wrangler pages dev dist/` starts without error | smoke | manual — start process, verify port 8788 responds | manual-only |
| REQ-050 | `/loom:research` skill exists with correct name field | unit | `grep "name: loom:research" .claude/skills/research/SKILL.md` | ❌ Wave 0 |
| REQ-051 | `/loom:organize` skill exists with correct name field | unit | `grep "name: loom:organize" .claude/skills/organize/SKILL.md` | ❌ Wave 0 |
| REQ-052 | `/loom:validate` skill exists with correct name field | unit | `grep "name: loom:validate" .claude/skills/validate/SKILL.md` | ❌ Wave 0 |
| REQ-053 | Skills reference exact tag normalization rule | unit | `grep "toLowerCase" .claude/skills/*/SKILL.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node src/lib/graph.test.mjs`
- **Per wave merge:** `npm run build && node src/lib/graph.test.mjs && node scripts/validate-output.mjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `scripts/validate-output.mjs` to check for `<pre class="astro-code">` in at least one built document page — covers REQ-016
- [ ] Skill file existence and `name:` field checks are fast shell commands; no new test framework needed

---

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills/Slash Commands — code.claude.com/docs/en/slash-commands](https://code.claude.com/docs/en/slash-commands) — Full skills system specification, frontmatter reference, argument substitution, `name:` field behavior, `disable-model-invocation:` semantics (fetched 2026-03-09)
- [Astro Syntax Highlighting docs — docs.astro.build/en/guides/syntax-highlighting/](https://docs.astro.build/en/guides/syntax-highlighting/) — Shiki configuration options, css-variables theme, `--astro-code-*` variable prefix confirmed

### Secondary (MEDIUM confidence)
- [Astro Shiki CSS Variables — christianpenrod.com](https://christianpenrod.com/blog/astro-shiki-syntax-highlighting-with-css-variables) — Complete `--astro-code-*` variable list; cross-referenced with Astro docs
- [Cloudflare Wrangler Pages dev — developers.cloudflare.com](https://developers.cloudflare.com/pages/functions/local-development/) — `wrangler pages dev <dist>` command

### Tertiary (LOW confidence — needs validation)
- Multiple WebSearch results confirming `--astro-code-*` prefix; consistent across sources but not exhaustively verified in Astro 5 source code

---

## Metadata

**Confidence breakdown:**
- Skills system (REQ-050/051/052/053): HIGH — Official Claude Code docs fetched directly, format confirmed; `name:` field for namespace prefix verified
- Shiki CSS variable names (REQ-016): HIGH — `--astro-code-*` prefix confirmed by Astro docs + secondary source; this corrects the prior MEDIUM finding that used wrong `--shiki-token-*` names
- CSS glow effects (REQ-033): HIGH — Standard CSS technique, consistent with existing Phase 2 SVG glow approach
- Wrangler preview (REQ-043): HIGH — Official Cloudflare docs; wrangler already in devDependencies

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — Skills API stable; Astro minor updates possible but shikiConfig stable since Astro 2)
