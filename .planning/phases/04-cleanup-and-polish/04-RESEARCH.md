# Phase 4: Cleanup and Polish - Research

**Researched:** 2026-03-09
**Domain:** Build tooling (Node.js script), CSS layout, Wrangler/Cloudflare Pages config
**Confidence:** HIGH

---

## Summary

Phase 4 closes three discrete, well-understood tech debt items identified in the v1.0 milestone audit (MC-01, MC-02, MC-04). None of these items involve new libraries or architectural decisions — each is a targeted, localized fix to an existing file. The research task is primarily one of inspection: confirm the exact current state of each file so the planner knows precisely what one-line or few-line change is needed.

**MC-01** (`validate-output.mjs` missing graph page check) is a straightforward addition of an `existsSync` assertion for `dist/graph/index.html` matching the pattern already used for `dist/index.html`. The fix is 5–8 lines.

**MC-02** (double padding on document pages) is caused by `main { padding: 2rem }` in `global.css` (line 111) stacking with `.doc-layout { padding: 2rem 1rem }` (line 347). The established pattern is already in the codebase: `main:has(.graph-page)` removes `main` padding when the graph page is active (line 415). An identical override for `.doc-layout` eliminates the double-padding without touching the base `main` rule.

**MC-04** (`wrangler.toml` missing `pages_build_output_dir`) requires adding one TOML key. Wrangler 3.x (project uses 3.114.17) reads `pages_build_output_dir` from `wrangler.toml` to determine the static files directory for `wrangler pages dev` without requiring a positional argument.

**Primary recommendation:** All three fixes belong in a single plan (04-01-PLAN.md) as independent tasks. Each fix is self-contained and testable immediately.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-006 | Generate build-time relationship graph | MC-01 fix ensures `dist/graph/index.html` is asserted by validator — confirms graph page was built |
| REQ-030 | Dark background with high-contrast typography | MC-02 fix removes double padding that degrades document page layout quality |
| REQ-043 | Local preview via Wrangler (`wrangler pages dev`) | MC-04 fix adds `pages_build_output_dir = "dist"` so `npx wrangler pages dev` works without a positional argument |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)

| File/Tool | Version | Purpose |
|-----------|---------|---------|
| `scripts/validate-output.mjs` | existing | Build output assertion script |
| `public/styles/global.css` | existing | Site-wide CSS |
| `wrangler.toml` | existing | Wrangler/Cloudflare Pages config |
| Wrangler CLI | 3.114.17 (local) | Cloudflare Pages local dev |

**No new packages required.** All three fixes are edits to existing files.

---

## Architecture Patterns

### Pattern 1: Validator assertion (MC-01)

**Current state of `scripts/validate-output.mjs`:** The script has checks for:
- `dist/` directory existence (exits early if missing)
- Document pages count (`dist/{category}/*/` directories)
- Tag pages (`dist/tags/`)
- Root index (`dist/index.html`)
- Tag links in a sampled HTML file
- Shiki markup in a sampled HTML file

**What is missing:** No check for `dist/graph/index.html`. The graph page is a distinct Astro route (`src/pages/graph/index.astro`) that builds to `dist/graph/index.html`, but the validator never asserts this file exists.

**Fix pattern** (mirrors existing `dist/index.html` check at line 52):
```javascript
// Source: scripts/validate-output.mjs — existing pattern at line 52
if (!existsSync(join(DIST, 'graph', 'index.html'))) {
  errors.push('Missing dist/graph/index.html');
} else {
  console.log('OK: dist/graph/index.html exists');
  passed++;
}
```

**Placement:** Insert immediately after the existing `dist/index.html` check block (after line 57, before line 59 "Spot-check a document page").

### Pattern 2: CSS layout override for double padding (MC-02)

**Current state of `public/styles/global.css`:**

```css
/* Line 108 — base main rule */
main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

/* Line 341 — .doc-layout with its own padding */
.doc-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Line 415 — existing graph page override (the pattern to mirror) */
main:has(.graph-page) {
  max-width: none;
  margin: 0;
  padding: 0;
}
```

**Problem:** Document pages use `.doc-layout` inside `main`. The `main` rule applies `padding: 2rem` to the outer container, then `.doc-layout` adds another `padding: 2rem 1rem` inside. Result: 4rem vertical padding total on document pages.

**Fix pattern** (mirror the graph page override):
```css
/* Reset main container padding when doc-layout is present */
main:has(.doc-layout) {
  padding: 0;
}
```

**Placement:** Immediately after the `main:has(.graph-page)` block (after line 419). The `max-width` and `margin: 0 auto` on `main` should be preserved — only `padding` needs to be zeroed since `.doc-layout` already has `padding: 2rem 1rem` and `margin: 0 auto` of its own.

**Important:** Do NOT remove `max-width` or `margin` from the `main:has(.doc-layout)` override. The `.doc-layout` class already manages its own centering. Only suppress the padding.

### Pattern 3: Wrangler pages_build_output_dir (MC-04)

**Current state of `wrangler.toml`:**
```toml
compatibility_date = "2025-07-18"
```

**Required addition:**
```toml
pages_build_output_dir = "dist"
```

**How it works:** When `pages_build_output_dir` is present in `wrangler.toml`, `wrangler pages dev` reads it and serves files from that directory without requiring a positional `dist/` argument on the command line. This is the documented Cloudflare Pages behavior for Wrangler 3.x.

**Source:** [Cloudflare Pages Wrangler configuration docs](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) — "Pages will only use your `wrangler.toml` file if the `pages_build_output_dir` option is set."

**Result `wrangler.toml`:**
```toml
compatibility_date = "2025-07-18"
pages_build_output_dir = "dist"
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| CSS specificity for layout override | Complex selector chains or JS-driven class toggling | CSS `:has()` pseudo-class — already used in codebase for graph page |
| Wrangler config discovery | Custom scripts to locate dist/ | Native `pages_build_output_dir` key in `wrangler.toml` |

---

## Common Pitfalls

### Pitfall 1: Removing padding from `.doc-layout` instead of overriding `main`

**What goes wrong:** Editing `.doc-layout { padding }` directly would break the layout when the viewport is narrow (the media query at line 350 collapses to single column and relies on that padding for spacing).
**How to avoid:** Use the `main:has(.doc-layout)` override pattern — it suppresses the redundant `main` padding without touching `.doc-layout`'s own padding rules.

### Pitfall 2: Setting `max-width: none` in the doc-layout override

**What goes wrong:** The graph page override uses `max-width: none; margin: 0; padding: 0` because the graph needs to fill the full viewport. Document pages should retain their centered, max-width-constrained layout — `.doc-layout` already has `max-width: 1100px; margin: 0 auto`. Adding `max-width: none` to the `main:has(.doc-layout)` rule would have no visual effect (since `.doc-layout` overrides it anyway) but is misleading.
**How to avoid:** Only set `padding: 0` in the `main:has(.doc-layout)` override.

### Pitfall 3: Using `wrangler pages dev dist` in documentation after the fix

**What goes wrong:** After adding `pages_build_output_dir`, the positional argument becomes redundant. Documentation or scripts still using `wrangler pages dev dist` will pass an explicit path that overrides the config — this is not harmful but creates confusion.
**How to avoid:** Verify the success criterion exactly as stated: `npx wrangler pages dev` (no argument) should start correctly.

### Pitfall 4: Placing the graph validator check after the summary

**What goes wrong:** The `validate-output.mjs` script exits with code 1 if `errors.length > 0`. The passed/errors counters are printed in the summary block at line 103. If the graph check is placed after line 103, it still runs but after the summary is already printed — misleading output.
**How to avoid:** Insert the graph check before the summary block (the `console.log(\`\nValidation:...\`)` line).

---

## Code Examples

### Adding the graph page check to validate-output.mjs

```javascript
// Source: scripts/validate-output.mjs — insert after index.html check block

// Check graph page exists
if (!existsSync(join(DIST, 'graph', 'index.html'))) {
  errors.push('Missing dist/graph/index.html');
} else {
  console.log('OK: dist/graph/index.html exists');
  passed++;
}
```

### CSS override for document layout double-padding

```css
/* Source: public/styles/global.css — insert after main:has(.graph-page) block */

/* Remove main container padding when doc-layout is present (avoids double-padding) */
main:has(.doc-layout) {
  padding: 0;
}
```

### Complete wrangler.toml after fix

```toml
compatibility_date = "2025-07-18"
pages_build_output_dir = "dist"
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in (no test framework) |
| Config file | none |
| Quick run command | `node scripts/validate-output.mjs` (requires prior `npm run build`) |
| Full suite command | `npm run build && node scripts/validate-output.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-006 | `dist/graph/index.html` exists after build | smoke | `npm run build && node scripts/validate-output.mjs` | ✅ (script exists; assertion is Wave 0 gap) |
| REQ-030 | Document pages have no double padding | manual visual | Browser inspection of a doc page | N/A |
| REQ-043 | `npx wrangler pages dev` starts without positional arg | smoke | `npx wrangler pages dev` (manual check, starts server) | N/A |

### Sampling Rate

- **Per task commit:** `npm run build && node scripts/validate-output.mjs`
- **Per wave merge:** Same
- **Phase gate:** All three success criteria verified before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/validate-output.mjs` — add `dist/graph/index.html` assertion (MC-01 fix, covers REQ-006 gap)

*(Other two fixes — CSS padding and wrangler.toml — have no automated test coverage needed; they are verifiable by visual inspection and CLI invocation.)*

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `wrangler pages dev dist/` (positional arg) | `pages_build_output_dir = "dist"` in `wrangler.toml` | Config-driven, no argument required |
| No validator assertion for graph page | `existsSync(join(DIST, 'graph', 'index.html'))` | Validator catches missing graph build |
| Double padding via stacked `main` + `.doc-layout` | `main:has(.doc-layout) { padding: 0 }` override | Matches pattern established for graph page |

---

## Open Questions

None. All three fixes are fully understood from direct code inspection. No unknowns remain.

---

## Sources

### Primary (HIGH confidence)

- Direct file inspection: `scripts/validate-output.mjs` — current assertions confirmed line by line
- Direct file inspection: `public/styles/global.css` — double-padding source identified at lines 111 and 347; existing override pattern at line 415
- Direct file inspection: `wrangler.toml` — current content confirmed as single-line `compatibility_date` only
- Direct file inspection: `.planning/v1.0-MILESTONE-AUDIT.md` — MC-01, MC-02, MC-04 findings confirmed verbatim

### Secondary (MEDIUM confidence)

- [Cloudflare Pages Wrangler configuration docs](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) — `pages_build_output_dir` key confirmed as the correct mechanism for `wrangler pages dev` without positional argument

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- All three fixes: HIGH — based on direct file inspection of current codebase state, no inference required
- Wrangler `pages_build_output_dir` key: MEDIUM — confirmed by official Cloudflare docs; also aligns with wrangler 3.114.17 installed locally

**Research date:** 2026-03-09
**Valid until:** Stable — changes only if wrangler.toml schema changes (unlikely at 3.x)
