# Pitfalls Research

**Domain:** Adding embedding pipeline, canvas map, timeline, keyboard nav, and Ollama integration to existing Astro 5 static site
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH (core patterns verified against official docs and community issues; implementation specifics require testing)

---

## Critical Pitfalls

### Pitfall 1: Canvas Component Accessing `window`/`document` During Astro SSR Build

**What goes wrong:**
The canvas-based embedding map component initializes at the top level of the module — setting up `ResizeObserver`, reading `window.devicePixelRatio`, or calling `document.getElementById` — and Astro's static build phase executes component code server-side where these globals do not exist. The build crashes with `ReferenceError: window is not defined` or `document is not defined`, or worse, silently produces a broken page.

**Why it happens:**
Astro renders all components server-side at build time to produce static HTML, even for interactive islands. Code at module scope or in the component's setup runs during SSR before `client:*` hydration kicks in. Developers familiar with browser-only environments don't expect this boundary.

**How to avoid:**
- Mark the canvas map component with `client:only="vanilla"` (or the framework equivalent). This skips SSR entirely for that component and only renders it in the browser.
- Alternatively, guard all browser API access with `if (typeof window !== 'undefined')` or use Astro's `import.meta.env.SSR` flag.
- Put canvas initialization, `ResizeObserver`, and `devicePixelRatio` reads inside event handlers or lifecycle callbacks that only run after mount, never at module scope.
- The embedding JSON data should be passed to the component as a prop serialized at build time — never fetched inside the component.

**Warning signs:**
- Build output includes `window is not defined` or `document is not defined`
- Astro GitHub issues #5601 and #8849 show this as one of the most common `client:only` failure modes
- Component renders blank in production but works fine in dev (`astro dev` may mask the issue if it detects browser mode)

**Phase to address:**
Embedding map phase (Phase 2 or equivalent). Establish the SSR/client boundary pattern before writing any canvas initialization code.

---

### Pitfall 2: UMAP Full Re-run on Every Deploy Destroys Incremental Performance

**What goes wrong:**
The `/loom:deploy` skill calls the embedding pipeline, which re-embeds all documents and re-runs UMAP from scratch on the full corpus every time. With 15 documents this takes 10 seconds. With 200 documents, it takes 90+ seconds and blocks the deploy. The developer starts skipping embeds, positions drift, or the pipeline gets abandoned.

**Why it happens:**
Incremental embedding requires fitting the UMAP model on the full corpus once, saving the fitted model, and then using `transform()` on new documents only. Most "embedding pipeline scripts" in tutorials do a full fit-transform every run. The US01 spec mentions incremental updates but doesn't specify the mechanism.

**How to avoid:**
- Separate the pipeline into two operations:
  1. **Embed only**: call Ollama to get 768-d vectors for new/changed docs, append to a `embeddings_raw.json` cache file.
  2. **Reduce only**: run UMAP on the full `embeddings_raw.json` to produce 2D positions, output to `embeddings_2d.json`.
- Save the fitted UMAP model after the first full run (`reducer.save(path)` in umap-learn). On subsequent runs, use `reducer.transform(new_vectors)` to project new points without refitting. Note: `transform()` positions new points relative to the existing learned space but does not update the model — this is an approximation, not an exact re-fit.
- The US01 spec already states position stability is NOT required. Accept that adding 10 new docs triggers a full UMAP re-fit, but cache raw embeddings so only the 10 new docs call Ollama.
- Track document content hashes (MD5 of frontmatter + body) in the cache file. Only re-embed when hash changes.

**Warning signs:**
- Embed pipeline takes more than 30 seconds for 50 documents
- No `embeddings_raw.json` or equivalent cache file in the pipeline design
- Pipeline script has a single `fit_transform()` call with no caching step

**Phase to address:**
Embedding pipeline phase (Phase 1 of milestone). Build the two-phase pipeline (embed separately from reduce) from the start.

---

### Pitfall 3: Ollama Not Running Silently Corrupts the Embedding State

**What goes wrong:**
`/loom:deploy` calls the embedding script. Ollama is not running. The script gets a connection error for each document, logs the error, and either: (a) skips those documents silently, leaving the cache with stale/missing entries, or (b) crashes mid-way, leaving the cache in a partial state. The deploy proceeds with an incomplete `embeddings_2d.json` where some documents have positions and others are missing.

**Why it happens:**
Scripts written without defensive pre-checks assume the service is available. Python's `requests` raises exceptions that are easy to swallow, and the partial state problem only manifests when you later view the map and notice documents are missing.

**How to avoid:**
- Add an explicit Ollama health check at the start of the embedding script: `GET http://localhost:11434/api/version` with a short timeout (2-3s). If it fails, abort immediately with a clear error message: "Ollama is not running. Start it with `ollama serve` and retry."
- Never write to the cache file until all documents in a batch have been successfully embedded. Use a temp file and atomic rename.
- Add a `--dry-run` flag to `/loom:deploy` that validates Ollama is available and previews what would be re-embedded without making changes.
- The `/loom:deploy` skill prompt should explicitly state the Ollama check as step 1, not buried in the embedding script.

**Warning signs:**
- Embedding script has `try/except` that logs and continues rather than aborts
- Cache file is updated incrementally (document by document) rather than atomically
- No pre-flight check in the pipeline

**Phase to address:**
Embedding pipeline phase. The health check and atomic write pattern must be built into the pipeline before first use.

---

### Pitfall 4: Canvas HiDPI / Retina Rendering Blurriness

**What goes wrong:**
The canvas-based dot map looks sharp on a 1x display and blurry on a MacBook or any HiDPI display. Node dots appear fuzzy, text labels are unreadable, and the cyberpunk aesthetic is undermined by low-resolution rendering.

**Why it happens:**
`<canvas>` has two distinct dimensions: the CSS display size (pixels on screen) and the drawing buffer resolution (actual canvas pixels). On a 2x device, if you set `canvas.width = 800` and draw at that resolution, the OS scales the canvas up 2x to fill the CSS display area — resulting in a blurry image. The fix is `canvas.width = 800 * devicePixelRatio`.

**How to avoid:**
- On resize and initial mount, compute:
  ```js
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  ctx.scale(dpr, dpr);
  ```
- Re-apply after every resize event (use ResizeObserver, not window resize).
- Critical: mouse and touch event coordinates come in CSS pixels, not canvas pixels. Do NOT multiply input coordinates by dpr when computing hit detection — the ctx.scale() already handles coordinate space. Only the canvas dimensions get scaled.
- Use `window.matchMedia('(resolution: 2dppx)')` to listen for resolution changes (e.g., user moves window between monitors).

**Warning signs:**
- Map looks fine on development machine but blurry on screenshots or when shown on a MacBook
- Dot-click hit detection is offset by a factor of 2x on HiDPI displays (symptom: clicks register in wrong locations)

**Phase to address:**
Canvas map phase. Get the DPR scaling right in the initial rendering setup before implementing any interaction.

---

### Pitfall 5: Keyboard Navigation Conflicting with Browser Shortcuts and Input Fields

**What goes wrong:**
`j`/`k` vim navigation is attached as a global `keydown` listener. When the user is typing in the `/` search input or any text field, pressing `j` or `k` navigates the page instead of typing a character. When the user presses `/` on a page with a text field that has focus, both the search overlay opens AND the character is typed into the field. On Firefox, `/` is the browser's built-in quick find shortcut — both fire simultaneously.

**Why it happens:**
Global `keydown` listeners with no context checking. The listener does not check whether the active element is an input, textarea, or contenteditable element before acting on the keypress.

**How to avoid:**
- Before handling any vim key, check: `const target = event.target; if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;`
- For `/` specifically, call `event.preventDefault()` to suppress browser quick-find, but only when the loom search overlay is handling it.
- Use `event.key` not `event.keyCode` (deprecated). The key values for vim nav are: `'j'`, `'k'`, `'g'`, `'G'`, `'/'`, `'Escape'`, `'Enter'`.
- Test specifically on Firefox where `/` triggers the browser's find-in-page.
- Avoid Ctrl/Alt/Meta combinations — these have extensive browser reservations. Stick to bare letter keys and Escape.
- `Escape` should close the search overlay and defocus the search input using `document.activeElement.blur()` before returning to nav mode.

**Warning signs:**
- Typing in the search box causes the page to scroll
- `/` opens both the loom search overlay and the browser find bar simultaneously on Firefox
- Status bar shows wrong "mode" when user has search input focused

**Phase to address:**
Keyboard navigation phase. The input-context guard must be the first line of every key handler.

---

### Pitfall 6: Global Keyboard Handler Accumulating Multiple Listeners

**What goes wrong:**
The keyboard navigation module is initialized when the page loads. In Astro's view transitions (if used) or when components re-mount, the initialization code runs again — adding a second (then third, etc.) `keydown` listener to `document`. Pressing `j` once scrolls the page twice, then four times, doubling with each navigation. The only fix is a full page reload.

**Why it happens:**
`document.addEventListener('keydown', handler)` is additive. Without cleanup, every navigation event that re-runs the init code stacks another listener. This is especially common when the keyboard nav is initialized in an Astro `<script>` tag on each page — Astro's partial page transitions can re-execute scripts.

**How to avoid:**
- Use a module-level guard: `if (window.__loomKeyboardInitialized) return; window.__loomKeyboardInitialized = true;`
- Or use the `{ once: false }` pattern with explicit cleanup: store the handler reference and call `removeEventListener` before adding a new one.
- Prefer initializing keyboard nav once in the base layout (`Base.astro`) rather than on individual pages.
- If Astro view transitions are used, listen for `astro:page-load` to re-initialize and `astro:before-swap` to clean up.

**Warning signs:**
- Navigation actions double-fire (pressing `j` twice scrolls by 2 items)
- Behavior degrades progressively as the user navigates between pages
- Keyboard handler works correctly on hard reload but misbehaves after soft navigation

**Phase to address:**
Keyboard navigation phase. Build the singleton guard pattern from the first line of the keyboard nav module.

---

### Pitfall 7: CSS Scanline / CRT Overlay Causing Composite Layer Explosion

**What goes wrong:**
The scanline overlay (a fixed-position pseudo-element with repeating-linear-gradient) and the CRT flicker animation both force full-page GPU layer promotions. On lower-end hardware, this causes: (a) the canvas map to stutter because it is competing with the overlay for GPU memory, (b) scrolling jank on article pages from the overlay repainting, (c) on battery, visible power drain. The aesthetic looks great in development on a MacBook Pro and terrible in practice.

**Why it happens:**
Animations that modify `background-position`, `opacity`, or non-compositable properties on large fixed elements trigger paint operations on every frame. If `will-change: transform` is applied naively to force layer promotion, it can accidentally promote too many elements, consuming GPU memory faster than compositing saves.

**How to avoid:**
- Scanlines: Use a fixed `::before` pseudo-element on `body` with `pointer-events: none`, `position: fixed`, full viewport coverage, and a static `repeating-linear-gradient`. Do NOT animate the scanlines — static scanlines achieve the aesthetic at zero animation cost.
- CRT flicker: If included at all, implement as a very subtle `opacity` animation (0.97 to 1.0, not 0 to 1) on an element that contains only the overlay, isolated from content. Confine `will-change: opacity` to this element only.
- Typewriter effects: Animate only `width` (for the cursor underline) or use `steps()` timing with `overflow: hidden`. Avoid animating `clip-path` on text — it's expensive.
- Test animation performance with Chrome DevTools Performance tab → look for "Paint" entries in the main thread. If scanlines cause recurring paints, they are not composited correctly.
- The canvas map and the CSS overlays must not overlap in z-index in ways that force the browser to composite them together.

**Warning signs:**
- Chrome DevTools shows "Paint" flashing on frames during canvas interaction
- Canvas map frame rate drops when scanlines are added
- Mobile devices (if tested) show severe jank with overlays enabled

**Phase to address:**
Cyberpunk CSS phase. Establish the no-animate-scanlines rule before the canvas map is built, since changing overlay implementation after canvas integration requires re-testing the interaction between them.

---

### Pitfall 8: Canvas Map Memory Leak from Unreleased Event Listeners and Animation Frames

**What goes wrong:**
The canvas map registers `mousemove`, `click`, `wheel`, and `touchstart` listeners on the canvas element, and starts a `requestAnimationFrame` loop. When the user navigates away (or Astro replaces the page component), the canvas element is removed from the DOM but the `requestAnimationFrame` loop keeps running, the event listeners on the removed canvas keep references alive, and JavaScript objects hold references to the embedding data. With 1000 documents, the embedding data is non-trivial in size. After several page navigations, memory climbs visibly.

**Why it happens:**
Canvas components that manage their own animation loop need explicit cleanup. Without a `destroy()` method that cancels the RAF loop and removes event listeners, garbage collection cannot reclaim the canvas and its associated data.

**How to avoid:**
- Maintain a reference to the RAF id: `const rafId = requestAnimationFrame(draw);`
- Export a `cleanup()` function from the canvas module that calls `cancelAnimationFrame(rafId)` and `canvas.removeEventListener(...)` for all registered listeners.
- If using Astro View Transitions, call `cleanup()` on `astro:before-swap`.
- If the map is a `client:only` component, the component's cleanup lifecycle (unmount callback) should call `cleanup()`.
- For the timeline play button: use a `setInterval` reference that is stored and `clearInterval`-ed on stop or unmount.

**Warning signs:**
- Chrome DevTools Memory tab shows heap growing after navigating away from and back to the map page
- Multiple frames rendered per draw tick (RAF accumulation)
- Timeline play continues animating after navigating away

**Phase to address:**
Canvas map phase. Add `cleanup()` as a required export from the canvas module before any event listeners are attached.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Embed all docs on every deploy (no caching) | Simpler pipeline code | Deploying becomes slow at 50+ docs; developer skips embeds and map drifts | Never — build the cache from day one |
| Full UMAP re-run on every new document | Correct positions for all docs | UMAP fit time scales with corpus; slow at 100+ docs | Acceptable only at < 30 docs, plan the incremental path |
| Hardcode `localhost:11434` for Ollama | Works immediately | Breaks when user runs Ollama on a different port or host | OK for personal tool — document as known limitation |
| Inline embedding JSON directly in HTML as `<script type="application/json">` | No extra fetch | At 500 docs with metadata, JSON can reach 200KB in the HTML head | OK up to ~300 docs; plan lazy fetch at scale |
| Single global keyboard handler function | Simple to write | Hard to disable for specific pages or contexts (e.g., disable on canvas when canvas has its own key events) | OK if context-checking (input guard) is built in from the start |
| CSS `backdrop-filter` for CRT glass effect | Looks great | Forces composite layer on every element behind it; causes perf issues on older hardware | OK — just do not apply to full-page overlays |
| Fetch article URL in `/loom:add` using Claude's built-in WebFetch | No extra tooling needed | JavaScript-rendered content is not fetched; paywalled sites fail silently | Acceptable limitation for v1 — document it |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Ollama embedding API | Sending entire article as a single string without the `search_document: ` prefix | Prepend `"search_document: "` to all text before calling the embeddings API. This is nomic-embed-text's documented instruction prefix for document embedding (different from query embedding which uses `"search_query: "`). |
| Ollama embedding API | Not chunking articles that exceed 8192 tokens | nomic-embed-text has an 8192 token context. Articles longer than ~6000 words will be silently truncated. Either chunk and average embeddings, or truncate deliberately. Log a warning when truncation occurs. |
| Ollama embedding API | Assuming the model is loaded and treating cold-start latency as an error | First embed call after Ollama starts loads the model (~2-5s). Implement a retry with backoff (3 attempts, 2s delay) rather than a hard fail on timeout. |
| `/loom:add` URL fetch | Treating a 200 response as valid article content | Paywalled sites return 200 with a login wall. JavaScript-rendered sites return 200 with a bare HTML shell. Check that the fetched content contains meaningful text (> 500 chars of non-boilerplate content) before proceeding. |
| `/loom:add` tag generation | Generating tags from the article in isolation | Claude generates tags without knowledge of the existing tag vocabulary. The generated tags will diverge from existing tags. Pass the current tag list to Claude in the `/loom:add` prompt so it normalizes to existing vocabulary. |
| UMAP Python script | Installing `umap-learn` without specifying version | `umap-learn` depends on `numba` which has specific LLVM requirements. Unpinned installs can produce version conflicts. Pin: `umap-learn==0.5.6` (verify current stable). |
| Cloudflare Pages build | Including the Python embedding script in the build | The embedding pipeline runs locally, not on Cloudflare. The `scripts/` directory must be excluded from the Cloudflare build command. Cloudflare runs only `npm run build` (Astro), not the embedding pipeline. |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering timeline gaussian opacity by looping over all docs on every slider tick | Slider drag causes 100-200ms freezes; animation is jerky | Pre-compute gaussian weights as a lookup: store `{docId: opacity}` maps at key slider positions. Or batch slider updates with `requestAnimationFrame` and debounce to 16ms intervals | ~200 documents |
| Attaching `mousemove` hit detection to every canvas frame (checking all dots) | Mouse movement on the map consumes 15-30% CPU even when nothing is hovered | Use a spatial index (quadtree or simple grid bucketing) for hit detection. D3's `d3-quadtree` is a natural fit. `O(log n)` instead of `O(n)` per frame | ~300 documents |
| Loading the full embedding JSON in the HTML `<head>` as inline script | First Contentful Paint is delayed; HTML document size exceeds 100KB | Fetch `embeddings_2d.json` asynchronously after page load; show a loading state on the canvas while fetching | ~400 documents |
| Building the Fuse.js search index on every search overlay open | First `/` press has 200-500ms lag | Build the index once on page load and cache it; only update on content change events | ~500 documents |
| Virtualized timeline list rendering via DOM replacement on every slider tick | Frequent DOM mutations cause layout thrashing alongside canvas animation | Use a single DOM update on `pointerup` (end of drag) rather than on every tick during drag; keep the canvas animation and DOM update on separate event paths | ~100 documents |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passing raw URL from `/loom:add <url>` directly to the embedding script without sanitization | Script injection if the URL contains shell metacharacters; log pollution | The Claude Code skill constructs the document, not a shell command. The URL is a context value, not a shell argument. If a subprocess is involved, always use argument arrays, never string concatenation. |
| Committing Ollama API keys or tokens to git | Credential exposure | Ollama is local-only by default (no API keys). If ever using a remote Ollama instance, store the host URL in an env var, not in the script. The embedding script reads `OLLAMA_HOST` from environment, defaulting to `localhost:11434`. |
| Including full document body text in `embeddings_2d.json` | The JSON is committed to git and served publicly via Cloudflare | The JSON should contain: document ID, 2D coordinates, date, tags, title, summary. NOT the full body. The summary (already planned in US01) is acceptable. Full body would expose content to anyone who fetches the JSON. |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all 1000+ documents in the timeline sidebar list during map scrubbing | List re-renders on every slider tick; browser chokes | Show a max of 20 items in the sidebar list, with a count: "Showing 20 of 47 matching documents." Update the list only on drag end, not during drag. |
| Gaussian opacity going to zero for documents outside the time window | Documents near the time window edge become invisible — user doesn't know if the feature is broken or those documents don't exist | Floor opacity at 10% (as spec states). Additionally, fade very slowly — gaussian with a wide sigma. Test: a document 3 months outside the window should still be faintly visible. |
| `j`/`k` navigation on the map page conflicting with canvas pan | Pressing `j` both advances keyboard focus AND pans the canvas | When canvas has mouse-entered focus, disable page-level `j`/`k` navigation. Restore when mouse leaves the canvas. Use a `canvasHasFocus` boolean in the keyboard handler. |
| Search overlay (`/`) disappearing on `Escape` while user is mid-typing | User presses Escape thinking it will clear the search field; instead the overlay closes | First Escape press: clear the input field content. Second Escape press: close the overlay. Standard pattern from VS Code and browser address bars. |
| Typewriter effect on headings running every time the page is in view | Repeated typewriter animations feel glitchy when user scrolls back up | Run the typewriter animation only once per page session, not every time the element enters the viewport. Use a `data-animated` attribute to mark elements as played. |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Embedding pipeline:** Runs successfully on initial corpus — but verify it detects changed documents (not just new). Test by editing a document title and re-running; confirm the embedding updates and position changes.
- [ ] **Canvas map:** Dots render and are clickable — but verify HiDPI on a 2x display. Check that click target centers align with visible dot centers. Check that the canvas resizes correctly when the browser window is resized.
- [ ] **Canvas memory:** Map looks correct — but open DevTools Memory tab, navigate away, and back 5 times. Verify heap does not grow by more than 10MB per cycle.
- [ ] **Keyboard navigation:** `j`/`k` works on the article index page — but verify it is disabled when the search input has focus. Verify `Escape` works from every depth (search overlay, side panel, article page).
- [ ] **Search overlay:** Opens with `/` and closes with `Escape` — but verify Firefox's built-in find-in-page is suppressed (`event.preventDefault()`). Verify `Tab` key inside the overlay stays within the overlay (focus trap).
- [ ] **Timeline slider:** Gaussian opacity looks correct — but test the edge case: corpus has only articles from one week. Does the slider still show a full range, or does it collapse to a point?
- [ ] **`/loom:add`:** Creates a valid document — but verify the generated tags appear in the existing tag index and are normalized to the canonical format. Verify the document appears on the map after the next deploy.
- [ ] **`/loom:deploy`:** Succeeds when Ollama is running — but test the explicit failure case: run `/loom:deploy` with Ollama stopped. Confirm the error is clear and no partial state is written.
- [ ] **CSS scanlines:** Look correct in Chrome — but test in Firefox and Safari. Check that the overlay does not intercept mouse clicks on elements beneath it (`pointer-events: none` is required).
- [ ] **Cloudflare build:** Succeeds with embedding JSON committed — but verify the JSON file size. At current scale (15 docs), it is trivial. Establish a size alert threshold (warn if > 500KB).

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SSR `window` undefined crash | LOW | Add `client:only` directive to the canvas component; move browser API calls inside a lifecycle callback. 30-minute fix. |
| Corrupt partial embedding cache | LOW | Delete `embeddings_raw.json`, re-run full embed. Cost = time to re-embed all documents. At 15-50 docs: minutes. At 200 docs: 10-20 minutes. |
| Canvas memory leak discovered after canvas is built | MEDIUM | Retrofit a `cleanup()` function and wire it to navigation events. Requires testing across all navigation paths. Estimated: 2-4 hours. |
| Multiple keyboard handler instances accumulating | LOW | Add the singleton guard (`window.__loomKeyboardInitialized`) to the handler init. Single-line fix, 15 minutes. |
| HiDPI blurriness discovered after map interactions are built | LOW-MEDIUM | Add DPR scaling to canvas init. May require adjusting hit detection coordinates if they were hardcoded to canvas pixel space. 1-3 hours. |
| CSS animation causing performance regression on canvas | MEDIUM | Identify the culprit animation with DevTools, convert to static or reduce scope. May require redesigning CRT effect. 2-6 hours. |
| UMAP pipeline too slow to run on deploy | MEDIUM | Add embedding cache (content hash tracking). Requires restructuring the pipeline script. 4-8 hours. |
| `/loom:add` generating divergent tags | LOW | Update the skill prompt to include the current tag list as context. Requires re-tagging a few documents manually. 30 minutes for prompt fix. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Canvas SSR `window` undefined (#1) | Embedding map phase — initial canvas component setup | Build succeeds; `astro build` produces no server-side errors |
| UMAP full re-run on every deploy (#2) | Embedding pipeline phase — pipeline architecture | Re-running deploy with no changes takes < 5 seconds |
| Ollama not running corrupts state (#3) | Embedding pipeline phase — pre-flight checks | Run `/loom:deploy` with Ollama stopped; verify clear error and no file changes |
| Canvas HiDPI blurriness (#4) | Embedding map phase — canvas rendering setup | Map renders sharp on a 2x display; click targets align with visible dots |
| Keyboard conflicts with input fields (#5) | Keyboard navigation phase — key handler setup | Type in search box with no nav side effects; `/` works correctly in Firefox |
| Keyboard handler accumulation (#6) | Keyboard navigation phase — singleton guard | Navigate away and back 10 times; verify no double-fire |
| CSS overlay performance (#7) | Cyberpunk CSS phase — animation implementation | Canvas map FPS does not drop when CSS overlays are enabled |
| Canvas memory leak (#8) | Canvas map phase — cleanup/lifecycle | Heap remains stable after 10 navigate-away-and-back cycles |

---

## Sources

- Astro GitHub Issues #5601, #8849 — `client:only` and `window` undefined patterns (MEDIUM confidence — GitHub issues, not official docs)
- Astro Troubleshooting Guide: https://docs.astro.build/en/guides/troubleshooting/ — SSR environment guidance (HIGH confidence)
- umap-learn documentation: https://umap-learn.readthedocs.io/en/latest/transform.html — `transform()` for new points (HIGH confidence)
- umap-learn GitHub Issues #263, #771 — incremental embedding stability discussion (MEDIUM confidence)
- MDN Web Docs — `window.devicePixelRatio`: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio (HIGH confidence)
- web.dev — High DPI Canvas: https://web.dev/articles/canvas-hidipi (HIGH confidence)
- Ollama API docs — errors and health check endpoint: https://docs.ollama.com/api/errors (HIGH confidence)
- MDN — Keyboard-navigable JavaScript widgets: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Keyboard-navigable_JavaScript_widgets (HIGH confidence)
- Smashing Magazine — CSS GPU Animation: https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/ (MEDIUM confidence — older article, principles still apply)
- nomic-embed-text Ollama library page: https://ollama.com/library/nomic-embed-text — prefix documentation (HIGH confidence)
- Direct analysis of existing Loom codebase (`graph.js`, `astro.config.mjs`, existing component structure)

---

*Pitfalls research for: Loom v1.1 — embedding map, canvas rendering, timeline, keyboard nav, Ollama pipeline on Astro 5*
*Researched: 2026-03-10*
