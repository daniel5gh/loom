# Phase 8: Global Shell - Research

**Researched:** 2026-03-10
**Domain:** Global keyboard UI, fuzzy search overlay, vim-style navigation, cyberpunk CSS effects
**Confidence:** HIGH

---

## Summary

Phase 8 adds two orthogonal concerns to the Loom site: a global interactive shell (search overlay + vim-style list navigation) mounted once in `Base.astro`, and a cyberpunk CSS layer (scanlines, typewriter headings, ASCII dividers) applied site-wide via `global.css`. Both concerns are pure vanilla JS + CSS — no new npm packages are required. Fuse.js 7.1.0 is already installed and used in `map.astro`; the same import can power the global search overlay. The keyboard system requires careful focus-guard logic so that global shortcuts (`/`, `j`, `k`, `gg`, `G`) are suppressed whenever an `<input>`, `<textarea>`, or `<select>` has focus.

The aesthetic layer is additive and purely CSS. Scanlines use a `body::before` fixed pseudo-element with `pointer-events: none`. Typewriter animation uses `@keyframes` with `steps()`. All existing project colors already exceed WCAG AA 4.5:1 — no color changes needed. ASCII dividers are static HTML strings (`─`, `═`, `░`, etc.) inserted by Astro components.

**Primary recommendation:** Mount one `<script>` in `Base.astro` that owns all global keyboard state; add CSS to `global.css` for aesthetic effects. No new dependencies.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHELL-01 | User presses `/` from any page to open `loom> _` terminal overlay with blinking cursor | Global keydown listener in Base.astro script; CSS for overlay + cursor blink |
| SHELL-02 | Search overlay fuzzy-matches title, tag, keyword across all documents | Fuse.js 7.1.0 (already installed); data island in Base.astro with title + tags + summary |
| SHELL-03 | Arrow keys navigate results; Enter opens selected | keydown handler within overlay scope; focus guard prevents map canvas conflicts |
| SHELL-04 | List pages support j/k (up/down), gg/G (top/bottom), Enter (open) | Global keydown with page-context detection; `data-vim-list` attribute on list containers |
| SHELL-05 | Vim-style status bar at page bottom shows current mode/context | Fixed-position `<div id="status-bar">` injected by Base.astro; updated by JS state |
| SHELL-06 | Esc dismisses overlays, returns focus to previous context | Esc handler in global script; `previousFocus` variable tracks last focused element |
| AESTH-01 | Scanline/CRT overlay on all pages, always-on, not animated | `body::before` fixed pseudo-element in global.css; `repeating-linear-gradient` |
| AESTH-02 | Headings typewriter animation on page load | `@keyframes typing` + `steps()` in global.css applied to h1, h2 selectors |
| AESTH-03 | ASCII-art dividers in page layouts | New `<AsciiDivider>` Astro component wrapping `<hr aria-hidden="true">` with CSS content |
| AESTH-04 | All aesthetic effects maintain WCAG AA contrast on body text | Verified: all project colors already pass (lowest: neon-magenta 5.41:1 on bg-base) |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Fuse.js | 7.1.0 (installed) | Client-side fuzzy search | Already in package.json; proven in map.astro |
| Vanilla JS | ES2020 | Global keyboard + overlay | Project convention: no React, no Tailwind, no TS |
| CSS @keyframes | Native | Typewriter + blink animations | No dependency; same approach as existing site animations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Astro `<script>` (bundled) | Astro 5.x | Module-scoped JS in Base.astro | Import Fuse.js from npm in Base.astro shell script |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `body::before` scanlines | Dedicated overlay `<div>` | Pseudo-element is cleaner; no DOM node needed; same result |
| `@keyframes steps()` typewriter | JS-driven typewriter | CSS-only is more reliable on page load; no FOUC; simpler |
| Custom fuzzy search | Fuse.js | Fuse.js is already installed and the precedent exists in map.astro |

**Installation:** No new packages needed. Fuse.js is already a dependency.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── layouts/
│   └── Base.astro          # Add: shell overlay HTML + <script>, status bar div
├── components/
│   └── AsciiDivider.astro  # New: <hr> with ASCII styling, accepts variant prop
├── pages/
│   ├── index.astro         # Add data-vim-list, data-vim-item attributes
│   └── tags/
│       └── [tag].astro     # Add data-vim-list, data-vim-item attributes
public/
└── styles/
    └── global.css          # Add: scanline, typewriter, status-bar, overlay CSS
```

### Pattern 1: Global Shell Script in Base.astro

**What:** A single bundled `<script>` at the bottom of `Base.astro` owns all global keyboard logic. It reads a search data island also injected by Base.astro (title + tags + summary for every doc, built at compile time via `getCollection`).

**When to use:** Any time a behavior must work across every page without per-page wiring.

**Example:**
```javascript
// In Base.astro bundled <script>
import Fuse from 'fuse.js';

const searchData = JSON.parse(document.getElementById('shell-data').textContent);
const fuse = new Fuse(searchData, {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'tags',  weight: 0.3 },
    { name: 'summary', weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: false,
});

// Focus guard — suppress global shortcuts when typing in any input
function isTypingContext() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !isTypingContext()) {
    e.preventDefault();
    openOverlay();
  }
  if (e.key === 'Escape') {
    closeOverlay();
  }
  // vim keys only on list pages, not in overlay, not in inputs
  if (!overlayOpen && !isTypingContext()) {
    handleVimKey(e);
  }
});
```

### Pattern 2: Vim-Style List Navigation via data-attributes

**What:** List pages annotate their list container with `data-vim-list` and each item with `data-vim-item`. The global script queries these attributes to navigate, keeping page-specific code minimal.

**When to use:** Any page with a navigable list of items (index, tag detail, tags index).

**Example:**
```javascript
// global shell script
function handleVimKey(e) {
  const list = document.querySelector('[data-vim-list]');
  if (!list) return; // not a list page — no-op
  const items = [...list.querySelectorAll('[data-vim-item]')];
  if (!items.length) return;

  let idx = items.findIndex(el => el.classList.contains('vim-selected'));
  if (idx === -1) idx = 0;

  if (e.key === 'j') { idx = Math.min(idx + 1, items.length - 1); }
  if (e.key === 'k') { idx = Math.max(idx - 1, 0); }
  if (e.key === 'G') { idx = items.length - 1; }
  // gg: detect double-g with a debounce variable
  if (e.key === 'Enter') {
    const link = items[idx]?.querySelector('a');
    if (link) window.location.href = link.href;
    return;
  }

  items.forEach(el => el.classList.remove('vim-selected'));
  items[idx].classList.add('vim-selected');
  items[idx].scrollIntoView({ block: 'nearest' });
  updateStatusBar(`NORMAL  ${idx + 1}/${items.length}`);
}
```

### Pattern 3: Scanline Overlay via CSS Pseudo-element

**What:** `body::before` creates a full-viewport fixed overlay with horizontal line pattern. `pointer-events: none` lets all clicks pass through.

**When to use:** Always-on non-animated effect on every page without DOM pollution.

**Example:**
```css
/* global.css */
body::before {
  content: '';
  display: block;
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.08) 3px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

### Pattern 4: Typewriter Animation via CSS steps()

**What:** `@keyframes` animates `max-width` from 0 to 100% using `steps(N)` where N matches character count. On headings, a simpler approach animates `width` with `steps()` and `overflow: hidden`.

**When to use:** Page-load heading animation only. NOT for body text (would harm readability).

**Constraint:** The `steps()` typewriter effect only works cleanly on single-line elements with a fixed character count OR with a generic "grow" animation that doesn't need to count characters. For dynamic heading text, use an animation that grows width from 0 to 100% with `steps(30)` as a reasonable approximation — it won't perfectly sync character-by-character but gives the visual impression.

**Example:**
```css
/* global.css */
@keyframes typewriter {
  from { max-width: 0; }
  to   { max-width: 100%; }
}

@keyframes blink-cursor {
  0%, 100% { border-right-color: transparent; }
  50%       { border-right-color: var(--neon-cyan); }
}

h1, h2 {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid transparent;
  animation:
    typewriter    0.6s steps(30) forwards,
    blink-cursor  0.8s step-end 4;
}
```

**Known issue:** `white-space: nowrap` breaks multi-word headings that wrap naturally. On document pages, h1 is always a title that may be long. Use `white-space: normal` with a fade-in alternative for headings that might wrap, OR scope the typewriter only to `h1` on pages where length is controlled (index, tags).

**Safer alternative for long headings:** Use an opacity fade + slight translateY to give a "text appearing" feel without the nowrap constraint:
```css
h1, h2 {
  animation: heading-appear 0.5s ease-out both;
}
@keyframes heading-appear {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Pattern 5: Status Bar

**What:** A fixed `<div id="vim-status-bar">` at the bottom of the viewport, injected by Base.astro, styled like a terminal status line. Updated by JS.

**Example HTML (in Base.astro):**
```html
<div id="vim-status-bar" class="vim-status-bar" aria-live="polite" aria-atomic="true">
  <span id="vim-mode-label">NORMAL</span>
  <span id="vim-context-label"></span>
</div>
```

```css
/* global.css */
.vim-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--bg-elevated);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.2rem 1rem;
  display: flex;
  gap: 1rem;
  z-index: 100;
}
```

### Anti-Patterns to Avoid

- **Listening for `keypress`:** Deprecated. Use `keydown` exclusively.
- **Blocking events without focus guard:** If `j`/`k` fire inside `map-search` input, the user can't type. Always check `isTypingContext()` first.
- **Animated scanlines:** Require GPU compositor layer; cause visual noise that competes with content. Use a static repeating-gradient only.
- **Typewriter on body text:** Harms readability. Scope strictly to `h1`/`h2` elements.
- **Injecting search data in every page:** Build the search data island once in `Base.astro` using `getCollection`. The island is ~10KB for 15 docs; acceptable static weight.
- **Using `is:inline` script for the shell:** Cannot import bare specifiers (Fuse.js). Use a regular bundled `<script>` in Base.astro, which supports npm imports.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy search | Custom trie or Levenshtein | Fuse.js 7.1.0 (installed) | Handles multi-key weighting, threshold tuning, edge cases |
| Typewriter char-by-char JS | Custom interval/timeout loop | CSS `@keyframes` + `steps()` | No layout thrash, works before JS loads, simpler |
| Scanlines as canvas | `<canvas>` overlay | CSS `repeating-linear-gradient` | Zero JS, no memory, no compositing cost |

**Key insight:** Every custom implementation in this domain has edge cases that existing CSS primitives or Fuse.js already handle correctly.

---

## Common Pitfalls

### Pitfall 1: Global keys firing inside map page inputs
**What goes wrong:** Pressing `j` while focused in `map-search` input navigates the list instead of typing the letter.
**Why it happens:** Global `document.addEventListener('keydown')` fires before the input handles the event.
**How to avoid:** Always check `isTypingContext()` at the top of the global handler. Return early if any input/textarea/select/contenteditable is focused.
**Warning signs:** Characters appear in inputs and also trigger navigation simultaneously.

### Pitfall 2: Map page canvas conflict with Escape
**What goes wrong:** The map page may have its own Escape handling (e.g., close panel). A global Escape handler fires first and breaks map UX.
**Why it happens:** Phase 7 decisions note keyboard/canvas conflict resolution was part of the dependency chain.
**How to avoid:** The global Escape handler should call `closeOverlay()` only if the overlay is open. Map page Escape handling (if any) attaches to map-specific elements via scoped listeners and should not conflict if the global handler is guarded. Check map.astro — it has no keydown handlers currently, only mouse events. No conflict exists.
**Warning signs:** Map panel not closable via Escape when overlay is also present.

### Pitfall 3: Typewriter animation on long/wrapping headings
**What goes wrong:** `white-space: nowrap` causes the heading to overflow horizontally or clip.
**Why it happens:** The classic typewriter CSS requires `nowrap` + `overflow: hidden` to work.
**How to avoid:** Either (a) scope typewriter to `h1` elements with known-short text (index page title "Loom"), or (b) use the fade+translateY approach for all headings, which has no `nowrap` constraint.
**Warning signs:** Document page h1 (full article title) overflows its container.

### Pitfall 4: `gg` double-keypress detection
**What goes wrong:** Pressing `G` accidentally triggers the double-`g` (go to top) logic.
**Why it happens:** Without a time window, the "last key was g" state persists indefinitely.
**How to avoid:** Track `lastGTime` timestamp. Only treat two `g` presses as `gg` if they arrive within 500ms.

### Pitfall 5: Search data island size grows with corpus
**What goes wrong:** Search data island slows page load as corpus grows.
**Why it happens:** All doc metadata (title + tags + summary) is serialized to inline JSON in every page.
**How to avoid:** For 15 docs, ~10-15KB is acceptable. If corpus grows past ~500 docs, switch to a static JSON file fetched lazily. For Phase 8, inline is correct.
**Warning signs:** HTML source shows large inline JSON blob (> 100KB).

### Pitfall 6: Status bar obscures page footer content
**What goes wrong:** `position: fixed; bottom: 0` status bar overlaps footer or bottom-positioned content.
**Why it happens:** Fixed positioning takes element out of flow.
**How to avoid:** Add `padding-bottom: 2rem` (or the status bar height) to `body` or `main` so content scrolls above the bar.

### Pitfall 7: Scanlines z-index conflicts with existing overlays
**What goes wrong:** Scanline pseudo-element renders on top of the map tooltip or search overlay.
**Why it happens:** `z-index: 9999` on `body::before` stacks above all in-flow children.
**How to avoid:** The search overlay and tooltip must have `z-index` at or above the scanline layer. Set scanline `z-index: 100` and overlay `z-index: 1000`. The existing map tooltip uses `z-index: 10` in global.css — update it to sit above scanlines.

---

## Code Examples

Verified patterns from project conventions and MDN/CSS-Tricks:

### Search Data Island in Base.astro
```astro
---
// Base.astro frontmatter
import { getCollection } from 'astro:content';
const aiTools = await getCollection('aiTools');
const cloudPlatforms = await getCollection('cloudPlatforms');
const companies = await getCollection('companies');
const allDocs = [...aiTools, ...cloudPlatforms, ...companies];
const shellData = JSON.stringify(allDocs.map(doc => {
  const body = doc.body || '';
  const summaryMatch = body.match(/## Summary\n\n([\s\S]*?)(\n##|$)/);
  return {
    id: doc.id,
    title: doc.data.title,
    tags: doc.data.tags,
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    // category and slug for URL construction
    category: doc.collection === 'aiTools' ? 'ai-tools-and-services'
             : doc.collection === 'cloudPlatforms' ? 'cloud-ai-platforms'
             : 'companies',
  };
}));
---
<!-- Inject into every page via Base.astro -->
<script type="application/json" id="shell-data" set:html={shellData}></script>
```

**Note:** The `doc.collection` field identifies which collection; map.astro already uses `doc.category` from embeddings.json. The shell data island needs the category from the Astro collection directly.

### Overlay HTML (Base.astro)
```html
<div id="shell-overlay" class="shell-overlay" aria-modal="true" role="dialog" aria-label="Search" hidden>
  <div class="shell-inner">
    <div class="shell-prompt">
      <span class="shell-prompt-label">loom&gt;</span>
      <input id="shell-input" class="shell-input" type="text" autocomplete="off" spellcheck="false" />
      <span class="shell-cursor" aria-hidden="true">_</span>
    </div>
    <ul id="shell-results" class="shell-results" role="listbox"></ul>
  </div>
</div>
```

### CSS Blinking Cursor
```css
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.shell-cursor {
  animation: cursor-blink 1s step-end infinite;
  color: var(--neon-cyan);
}
/* Hide cursor when input is non-empty (user is typing) */
.shell-input:not(:placeholder-shown) ~ .shell-cursor {
  display: none;
}
```

### Fuse.js Multi-Key Config (matches map.astro precedent)
```javascript
// Source: Fuse.js docs + existing map.astro pattern
const fuse = new Fuse(searchData, {
  keys: [
    { name: 'title',   weight: 0.6 },
    { name: 'tags',    weight: 0.3 },
    { name: 'summary', weight: 0.1 },
  ],
  threshold: 0.35,     // same as map.astro
  includeScore: false,
});
```

### Scanlines (static, no animation)
```css
/* Source: CSS-Tricks / MDN pseudo-element pattern */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.08) 3px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 100;
}
```

### gg Detection with Timeout
```javascript
let lastGKey = 0;
function handleVimKey(e) {
  if (e.key === 'g') {
    const now = Date.now();
    if (now - lastGKey < 500) {
      // gg — go to top
      selectItem(0);
      lastGKey = 0;
    } else {
      lastGKey = now;
    }
    return;
  }
  lastGKey = 0; // reset on any other key
  // ...j, k, G, Enter handling
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `keypress` event | `keydown` event | ~2020 | `keypress` deprecated in MDN; use `keydown` |
| Animated scanlines (scrolling) | Static `repeating-linear-gradient` | Design preference | Animated scanlines are distracting; static is correct for "always-on" requirement |
| Overlay via `visibility: hidden` | `hidden` attribute + `display: none` | N/A | `hidden` attribute is semantically correct for modal off state; screen readers ignore it |

**Deprecated/outdated:**
- `keypress` event: deprecated, unreliable for non-printable keys. Use `keydown`.
- JS-animated typewriter loops: replaced by CSS `@keyframes steps()` in modern practice.

---

## Open Questions

1. **Typewriter animation scope**
   - What we know: Classic `white-space: nowrap` approach breaks long doc titles
   - What's unclear: Should typewriter apply to `h1` only on index/tags pages, or globally to all `h1`/`h2`?
   - Recommendation: Apply typewriter to `h1` only; use fade+translateY for `h2` and below. This avoids the nowrap conflict on article pages.

2. **Map page Escape conflict**
   - What we know: map.astro currently has no keydown handlers (only mouse events)
   - What's unclear: Should pressing Escape on the map close the side panel in a future phase?
   - Recommendation: For Phase 8, global Escape closes the shell overlay only. Map panel already has a close button; no Escape behavior needed on map in this phase.

3. **List pages for vim navigation**
   - What we know: `index.astro` (category cards) and `tags/[tag].astro` (doc-grid) are list-style pages. `tags/index.astro` (tag list) is also list-like.
   - What's unclear: Should graph.astro and map.astro pages have vim navigation?
   - Recommendation: No. Graph and map are canvas-based. Add `data-vim-list` only to: index.astro, tags/index.astro, tags/[tag].astro.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must add Node test runner |
| Config file | None — Wave 0 creates `test/shell.test.mjs` |
| Quick run command | `node --test test/shell.test.mjs` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHELL-01 | `/` opens overlay, Esc closes | manual-only | — | N/A |
| SHELL-02 | Fuse.js returns results for title/tag/summary | unit | `node --test test/shell.test.mjs` | Wave 0 |
| SHELL-03 | Arrow keys navigate results, Enter opens | manual-only | — | N/A |
| SHELL-04 | j/k/gg/G/Enter navigate list items | manual-only | — | N/A |
| SHELL-05 | Status bar present and updates | manual-only | — | N/A |
| SHELL-06 | Esc returns focus to previous context | manual-only | — | N/A |
| AESTH-01 | Scanline overlay present on page | manual-only | — | N/A |
| AESTH-02 | Typewriter animation fires on load | manual-only | — | N/A |
| AESTH-03 | ASCII divider renders | manual-only | — | N/A |
| AESTH-04 | WCAG AA contrast verified | unit (offline) | `node --test test/contrast.test.mjs` | Wave 0 |

**Rationale for manual-only:** Shell behavior (keyboard events, overlay rendering, animation) requires a browser DOM. No headless browser test infrastructure exists in the project. The Fuse.js search logic and contrast calculations are the only unit-testable pieces.

### Sampling Rate
- **Per task commit:** `node --test test/shell.test.mjs` (Fuse config + contrast)
- **Per wave merge:** `node --test test/`
- **Phase gate:** Manual visual + keyboard verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/shell.test.mjs` — Fuse.js multi-key search returns expected results for sample queries
- [ ] `test/contrast.test.mjs` — Verifies all aesthetic colors meet 4.5:1 against `--bg-base`
- [ ] No framework install needed — Node 18+ built-in `--test` runner is available

---

## Sources

### Primary (HIGH confidence)
- Project codebase (`src/layouts/Base.astro`, `src/pages/map.astro`, `public/styles/global.css`) — direct inspection
- `package.json` — confirmed Fuse.js 7.1.0 installed
- Python luminance calculation — WCAG AA contrast ratios verified mathematically for all project colors

### Secondary (MEDIUM confidence)
- [CSS-Tricks: Typewriter Effect](https://css-tricks.com/snippets/css/typewriter-effect/) — `@keyframes` + `steps()` pattern
- [MDN ::before pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/::before) — fixed overlay pattern
- [DEV Community: Retro CRT terminal CSS](https://dev.to/ekeijl/retro-crt-terminal-screen-in-css-js-4afh) — scanlines via `repeating-linear-gradient`
- [Fuse.js Options docs](https://www.fusejs.io/api/options.html) — keys/weight/threshold config

### Tertiary (LOW confidence)
- WebSearch results on vim-style web navigation — not directly applicable; all browser extension results, not vanilla JS patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; Fuse.js and vanilla JS precedent established in project
- Architecture: HIGH — Base.astro mounting point is clearly established; CSS patterns are well-known primitives
- Pitfalls: HIGH — focus guard and z-index conflicts are verified against existing code; typewriter nowrap issue is a documented CSS limitation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain; CSS primitives and Fuse.js API are stable)
