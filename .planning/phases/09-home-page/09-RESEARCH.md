# Phase 9: Home Page - Research

**Researched:** 2026-03-10
**Domain:** Astro static page, content collection sorting, terminal prompt UI, existing component reuse
**Confidence:** HIGH

---

## Summary

Phase 9 rebuilds `src/pages/index.astro` from a category-grid landing page into a terminal-focused entry point. The change has two parts: (1) a visible `loom> _` prompt on the page itself — distinct from the global shell overlay that lives in Base.astro — which acts as a call-to-action that opens the overlay on click or on `/` keypress, and (2) a list of the 10 most recently added articles sorted in reverse-chronological order by the `date` frontmatter field.

Both requirements are pure Astro + vanilla CSS work. No new npm packages are needed. The data layer already exists: all three content collections (`aiTools`, `cloudPlatforms`, `companies`) are fetched in the frontmatter of the current `index.astro`; merging and sorting them is a straightforward JavaScript array operation at build time. The `DocCard` component already renders title, date, and tags, matching the display requirement exactly. The `AsciiDivider` component is available for visual separation. The global shell overlay and its `/` keyboard shortcut already live in Base.astro and are active on every page — the home page prompt is a static UI element that invokes that already-working system.

The key design constraint is that the home page prompt must feel like an invitation to search, not a second overlay. It is rendered directly on the page (not in a modal), styled with the project's existing `loom>` terminal aesthetic, and should trigger `openOverlay()` in the global shell script when clicked or when the user presses `/` (which is already wired by the global handler). No new keyboard or overlay logic is required.

**Primary recommendation:** Rewrite `index.astro` to show a styled `.home-prompt` div (displaying `loom> _` with a blinking cursor) above a flat list of the 10 most recent DocCards. The global shell opens on `/` or a click handler that calls the overlay open logic defined in Base.astro.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOME-01 | Home page shows terminal search prompt (`loom> _`) as primary entry point | Static `.home-prompt` element styled with existing CSS variables; click opens global shell overlay via dispatched event or shared open function |
| HOME-02 | Home page shows recently added articles (last 10 by date) | Merge all three collections at build time, sort by `doc.data.date` descending, slice(0, 10); render with existing `DocCard` component |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro `getCollection` | 5.x (installed) | Fetch all documents at build time | Established pattern in `index.astro`, `Base.astro`, `map.astro` |
| `DocCard.astro` | project component | Render article cards with title, date, tags | Already handles all display requirements; `data-vim-item` included |
| `AsciiDivider.astro` | project component | Visual section separator | Added in Phase 8; available project-wide |
| Vanilla JS | ES2020 | Click handler to open shell overlay | Project convention; no React, no TS |
| CSS custom properties | Native | Styling prompt to match existing aesthetic | All colors/fonts already defined in `global.css` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `TagPill.astro` | project component | Tag rendering inside DocCard | Used automatically by DocCard; no direct import needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Flat merged+sorted list of 10 | Keep category-grid, add "recent" section above it | Phase requirement is to REPLACE the grid, not supplement it |
| Click handler dispatching custom event | Expose `openOverlay` as a named export from shell script | Dispatching a custom event is cleaner; avoids coupling index.astro to Base.astro internals |
| Hard-coding a `loom> _` string | Using the same shell overlay HTML fragment | Home prompt is static display-only; the overlay handles interaction |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── layouts/
│   └── Base.astro          # Unchanged — shell overlay already here
├── pages/
│   └── index.astro         # REWRITE: replace category-grid with prompt + recent list
public/
└── styles/
    └── global.css          # ADD: .home-prompt, .home-recent-list CSS rules
```

### Pattern 1: Merge and Sort All Collections at Build Time

**What:** Combine all three `getCollection` results into a single array, sort by `doc.data.date` descending, take the first 10.

**When to use:** Any time cross-collection ordering is needed. Astro evaluates this at build time — zero runtime cost.

**Example:**
```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import DocCard from '../components/DocCard.astro';
import AsciiDivider from '../components/AsciiDivider.astro';

const aiTools      = await getCollection('aiTools');
const cloudPlatforms = await getCollection('cloudPlatforms');
const companies    = await getCollection('companies');

const CATEGORY_MAP = {
  aiTools:       'ai-tools-and-services',
  cloudPlatforms: 'cloud-ai-platforms',
  companies:     'companies',
};

const allDocs = [
  ...aiTools.map(d => ({ ...d, category: CATEGORY_MAP.aiTools })),
  ...cloudPlatforms.map(d => ({ ...d, category: CATEGORY_MAP.cloudPlatforms })),
  ...companies.map(d => ({ ...d, category: CATEGORY_MAP.companies })),
];

const recentDocs = allDocs
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  .slice(0, 10);
---
```

**Note:** The `category` property is not part of the Astro entry object. It must be computed from the collection name. The pattern `doc.collection` is available on Astro content entries (e.g., `'aiTools'`), which maps to the category slug via the `CATEGORY_MAP` above. Alternatively, spread each collection separately with the category pre-attached as shown.

### Pattern 2: Static Terminal Prompt Element

**What:** A `<div class="home-prompt">` element visible on the page that displays `loom> _`, styled identically to the shell overlay's prompt label, but rendered as static page content (not in a modal). Clicking it opens the global shell overlay.

**When to use:** Entry-point call-to-action for search. The visual styling signals to the user that pressing `/` will activate search.

**Example (HTML in index.astro):**
```html
<div class="home-prompt" id="home-prompt" role="button" tabindex="0"
     aria-label="Open search (press / or click)">
  <span class="home-prompt-label">loom&gt;</span>
  <span class="home-prompt-cursor" aria-hidden="true">_</span>
</div>
```

**CSS (in global.css):**
```css
.home-prompt {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--neon-cyan);
  border-radius: 4px;
  background: var(--bg-surface);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 1.25rem;
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.15);
  transition: box-shadow 0.15s ease;
  margin-bottom: 2rem;
}
.home-prompt:hover {
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.35);
}
.home-prompt-label {
  color: var(--neon-cyan);
}
.home-prompt-cursor {
  color: var(--neon-cyan);
  animation: cursor-blink 1s step-end infinite;  /* reuses Phase 8 keyframe */
}
```

**JavaScript (inline `<script>` in index.astro, NOT is:inline):**

The home prompt click handler must invoke the shell overlay. The global shell script in Base.astro defines `openOverlay()` inside a module-scoped closure — it is not accessible as a global. The cleanest approach is to dispatch a custom event that the Base.astro script listens for:

```javascript
// In index.astro bundled <script>
document.getElementById('home-prompt')?.addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent('loom:open-search'));
});
document.getElementById('home-prompt')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('loom:open-search'));
  }
});
```

```javascript
// In Base.astro bundled <script> — add listener
document.addEventListener('loom:open-search', () => openOverlay());
```

**Alternative if custom event coordination is unwanted:** Expose `openOverlay` by attaching it to a non-global but accessible mechanism. However, the custom event pattern is idiomatic for cross-script communication in vanilla JS and avoids the need to expose internals.

### Pattern 3: Recent Docs List with DocCard

**What:** Render the sorted `recentDocs` array using `DocCard`, inside a `data-vim-list` container. `DocCard` already has `data-vim-item` on its article root, so vim navigation works automatically.

**Example:**
```astro
<section class="home-recent">
  <h2 class="home-recent-heading">// recent</h2>
  <div class="home-recent-list" data-vim-list>
    {recentDocs.map(doc => (
      <DocCard
        title={doc.data.title}
        slug={doc.id}
        category={doc.category}
        date={doc.data.date}
        tags={doc.data.tags}
      />
    ))}
  </div>
</section>
```

**CSS:**
```css
.home-recent-heading {
  font-size: 0.85rem;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
  font-weight: 400;
}
.home-recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

### Anti-Patterns to Avoid

- **Rendering DocCards in a grid:** HOME-02 is a list, not a grid. The existing `.doc-grid` uses `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`. For the recent list, use `flex-direction: column` instead — simpler, date-ordered, and reads as a feed.
- **Keeping the category-grid sections:** The phase goal explicitly replaces the category-grid landing. Remove the `.category-section` blocks and the three category-scoped maps entirely.
- **Calling `openOverlay()` directly across module boundaries:** The Base.astro script is bundled separately. Module-scoped functions are not accessible from other scripts. Use a custom DOM event (`loom:open-search`) dispatched on `document`.
- **Using `is:inline` for the index script:** `is:inline` prevents Astro from processing the script and disables npm imports. The click handler for the prompt is simple and doesn't need npm imports, but for consistency with project convention use a regular bundled `<script>`.
- **Sorting after slicing:** Always sort the full merged array first, then slice. Sorting after slicing would yield 10 arbitrarily ordered docs sorted locally.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Article card display | Custom article list HTML | `DocCard` component | Already has title, date, tags, `data-vim-item`, hover styles |
| Section separator | Custom `<hr>` with inline styles | `AsciiDivider` component | Phase 8 component exists, consistent styling |
| Blinking cursor animation | Custom JS interval toggling opacity | `cursor-blink` CSS `@keyframes` | Already defined in `global.css` from Phase 8 |
| Cross-script communication | Global variable on `window` | `CustomEvent` on `document` | Clean, no namespace pollution, works with Astro bundling |

**Key insight:** Phase 8 built all the CSS primitives and component infrastructure. Phase 9 is primarily a data operation (sort + slice) and layout rearrangement, not a new feature build.

---

## Common Pitfalls

### Pitfall 1: `doc.collection` vs custom category slug
**What goes wrong:** `doc.collection` is `'aiTools'`, `'cloudPlatforms'`, or `'companies'` — not the URL slug format (`'ai-tools-and-services'`, `'cloud-ai-platforms'`, `'companies'`). Passing `doc.collection` directly as the `category` prop to `DocCard` produces broken URLs.
**Why it happens:** Astro content collection names use camelCase; URL slugs use kebab-case with expansion.
**How to avoid:** Define a `CATEGORY_MAP` constant in the frontmatter and map each collection entry as it is spread into `allDocs`. The current `index.astro` already does this implicitly by mapping each collection separately — carry the pattern forward.
**Warning signs:** Article links 404 on the home page but work from tag pages.

### Pitfall 2: `openOverlay` not accessible from index.astro script
**What goes wrong:** The developer tries to call `openOverlay()` from a script in `index.astro`, but the function is defined inside a module closure in Base.astro's bundled `<script>`. The call throws `ReferenceError: openOverlay is not defined`.
**Why it happens:** Astro bundles each `<script>` block as an ES module. Module-scoped variables are not on `window`.
**How to avoid:** Add a `CustomEvent` listener in Base.astro (`document.addEventListener('loom:open-search', () => openOverlay())`), and dispatch that event from the index.astro script on click. The Base.astro change is a one-liner addition.
**Warning signs:** Console error on prompt click; overlay does not open.

### Pitfall 3: `date` is a `Date` object, not a string — comparison works correctly
**What we know:** Astro's `z.coerce.date()` in `content/config.ts` transforms the frontmatter string to a JavaScript `Date`. Sorting with `.getTime()` is correct. Do NOT sort by string comparison — ISO date strings do sort lexicographically, but using `.getTime()` is explicit and safe.
**How to avoid:** `allDocs.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())` — newest first.

### Pitfall 4: Removing `data-vim-list` from the index page
**What goes wrong:** The old `index.astro` had `data-vim-list` on its outer wrapper. If the new layout forgets to include it on the `.home-recent-list`, vim navigation (`j`/`k`) stops working on the home page.
**Why it happens:** The global shell script in Base.astro queries `[data-vim-list]` to find navigable items. If the attribute is absent, `getVimItems()` returns `[]` and all vim keys are no-ops.
**How to avoid:** Place `data-vim-list` on the `.home-recent-list` container div. Since `DocCard` already has `data-vim-item` on its `<article>`, vim selection works automatically.
**Warning signs:** `j`/`k` keys do nothing on the home page; status bar shows `0/0`.

### Pitfall 5: Subtitle doc count becomes stale if removed
**What goes wrong:** The current `index.astro` shows `{total} documents` in the subtitle. If the rewrite removes this, users lose the corpus size indicator. If it's kept but the count logic is dropped, it shows 0.
**Why it happens:** The count was computed from the three `getCollection` results. After rewrite, all three collections are still fetched for sorting — the count can still be computed as `allDocs.length`.
**How to avoid:** Keep `allDocs.length` computed from the merged array and display it in the hero subtitle if desired.

---

## Code Examples

### Complete Frontmatter for New index.astro

```astro
---
// Source: project conventions — index.astro + Base.astro patterns
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import DocCard from '../components/DocCard.astro';
import AsciiDivider from '../components/AsciiDivider.astro';

const aiTools        = await getCollection('aiTools');
const cloudPlatforms = await getCollection('cloudPlatforms');
const companies      = await getCollection('companies');

const allDocs = [
  ...aiTools.map(d => ({ ...d, category: 'ai-tools-and-services' })),
  ...cloudPlatforms.map(d => ({ ...d, category: 'cloud-ai-platforms' })),
  ...companies.map(d => ({ ...d, category: 'companies' })),
];

const recentDocs = allDocs
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  .slice(0, 10);

const totalDocs = allDocs.length;
---
```

### Base.astro Addition (one line in existing script)

```javascript
// Add inside existing Base.astro <script>, alongside the existing keydown listener
document.addEventListener('loom:open-search', () => openOverlay());
```

### index.astro Script Block

```javascript
// Bundled <script> in index.astro (not is:inline)
const prompt = document.getElementById('home-prompt');
if (prompt) {
  prompt.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('loom:open-search'));
  });
  prompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('loom:open-search'));
    }
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Category-grid landing page | Terminal prompt + recent feed | Phase 9 | Home page becomes search-first instead of browse-first |
| Per-collection rendering in index.astro | Merged, sorted, cross-collection list | Phase 9 | Single feed ordered by recency, not by category |

**Deprecated/outdated (for this phase):**
- `.category-section` blocks: removed by this phase.
- `.doc-grid` CSS class on home page: replaced with `.home-recent-list` flex column. The class itself stays in `global.css` because it may still be used on tag pages.

---

## Open Questions

1. **Should the home page prompt show hint text?**
   - What we know: The global overlay shows `loom> _` with no placeholder. The map search input has no placeholder either.
   - What's unclear: Whether a hint like `press / to search` should appear below or alongside the prompt.
   - Recommendation: Keep prompt minimal (`loom> _` only). The vim status bar already displays context. A hint is nice-to-have but is not required by HOME-01.

2. **Should the home page hero retain the "Loom" h1 heading?**
   - What we know: The current `index.astro` has `.index-hero` with an h1 "Loom" and a subtitle showing doc count.
   - What's unclear: Phase description says "replacing the current category-grid landing page" — it does not specify removing the hero.
   - Recommendation: Keep a minimal hero (`h1 class="index-title"` with "Loom" text) above the prompt. This maintains the Phase 8 `h1` heading-appear animation and gives the page an anchor. The subtitle doc count can remain, recalculated from `allDocs.length`.

3. **What does "clicking opens the global search overlay" mean precisely?**
   - What we know: The global `/` shortcut already works everywhere. HOME-01 says "clicking or pressing `/` opens the global search overlay".
   - What's unclear: Whether the click target is the whole prompt div or only the cursor.
   - Recommendation: The entire `.home-prompt` div should be the click target (`cursor: pointer`). This is the most user-friendly interpretation.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None — scripts run directly |
| Quick run command | `node --test test/shell.test.mjs` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Terminal prompt visible; click opens overlay | manual-only | — | N/A |
| HOME-02 | 10 most recent articles shown in reverse-chronological order | unit | `node --test test/home.test.mjs` | Wave 0 |

**Rationale for HOME-01 manual-only:** Opening the shell overlay requires a live browser DOM and keyboard/click events. No headless browser test infrastructure exists in the project.

**HOME-02 can be unit-tested:** The sort+slice logic is a pure function over an array of objects with `data.date` fields. A Node.js unit test can verify: (a) result length is at most 10, (b) result is sorted newest-first, (c) all docs from all three collections are eligible.

### Sampling Rate
- **Per task commit:** `node --test test/home.test.mjs`
- **Per wave merge:** `node --test test/`
- **Phase gate:** Manual visual verification in browser before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/home.test.mjs` — covers HOME-02: sort+slice logic produces at most 10 docs in descending date order, drawing from all three collections

*(Existing `test/shell.test.mjs` and `test/contrast.test.mjs` require no changes for this phase.)*

---

## Sources

### Primary (HIGH confidence)
- `/home/daniel/codes/loom/src/pages/index.astro` — current implementation, direct inspection
- `/home/daniel/codes/loom/src/layouts/Base.astro` — shell overlay script, direct inspection
- `/home/daniel/codes/loom/src/components/DocCard.astro` — component interface, direct inspection
- `/home/daniel/codes/loom/public/styles/global.css` — existing CSS variables and `cursor-blink` keyframe
- `/home/daniel/codes/loom/src/content/config.ts` — `z.coerce.date()` confirms `date` is a `Date` object
- `/home/daniel/codes/loom/.planning/phases/08-global-shell/08-RESEARCH.md` — Phase 8 decisions and patterns

### Secondary (MEDIUM confidence)
- MDN: [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent) — cross-script communication pattern
- Astro docs: Content Collections `getCollection` API — sorting at build time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all required components and APIs are already in the project; no new dependencies
- Architecture: HIGH — sort+slice is a proven build-time Astro pattern; custom event pattern is well-understood vanilla JS
- Pitfalls: HIGH — category slug mismatch and cross-script closure issues are verified against actual code; `data-vim-list` requirement is verified against Base.astro script logic

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain; Astro content API and CSS primitives are stable)
