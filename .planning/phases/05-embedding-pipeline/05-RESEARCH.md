# Phase 5: Embedding Pipeline - Research

**Researched:** 2026-03-10
**Domain:** Offline embedding script — Ollama + nomic-embed-text + umap-js, incremental caching, atomic write, static JSON artifact
**Confidence:** HIGH

## Summary

Phase 5 is a pure offline Node.js script (`scripts/embed.mjs`) that reads all markdown documents, calls Ollama's local embedding API, reduces the resulting high-dimensional vectors to 2D via UMAP, and writes a committed JSON artifact (`src/data/embeddings.json`) that the Astro build reads at compile time. No browser code is involved. The deliverable is fully isolated from the Astro build graph — the build just reads the file.

The stack is fully decided in STATE.md: `ollama@^0.6.3`, `umap-js@^1.4.0`, `gray-matter@^4.x`. All three have been verified to install and work in an ESM `.mjs` script context. The primary technical risks are: (1) umap-js being CJS-only requires `createRequire` in an `.mjs` file, (2) `nNeighbors` must be clamped to `n_samples - 1` to prevent a fatal UMAP error on small corpora, (3) gray-matter is also CJS-only and needs the same treatment.

The data island pattern for passing build-time JSON to client scripts is already established in `graph.astro` and should be mirrored for the map page in Phase 6. This phase only produces the file; Phase 6 consumes it.

**Primary recommendation:** Implement `scripts/embed.mjs` as a single-file ESM script that runs health check, reads docs via gray-matter + glob, diffs against a `.cache/embed-vectors.json` cache file (gitignored), calls Ollama for cache misses only, runs umap-js on all vectors, and atomically writes `src/data/embeddings.json`. No third-party helpers needed beyond the three decided libraries.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EMBED-01 | Operator runs `scripts/embed.mjs` to generate 2D coordinates for all documents via Ollama + nomic-embed-text + UMAP | Script reads markdown via gray-matter, calls `ollama.embed()`, fits with `umap-js`, writes `src/data/embeddings.json` |
| EMBED-02 | Pipeline only re-embeds new/changed documents (content-hash incremental caching) | SHA-256 of raw file content is cheap, fast, and reliable; cache stored in `.cache/embed-vectors.json` (gitignored); 90KB for 15 docs |
| EMBED-03 | Pipeline fails loudly if Ollama not running; no partial or stale output file written | Health check via `GET localhost:11434` returns "Ollama is running"; atomic write via `writeFileSync(tmp) + renameSync(tmp, target)` prevents partial output |
| EMBED-04 | `src/data/embeddings.json` committed to git and consumed by Astro at build time | Astro can `import embeddingsJson from '../data/embeddings.json'` or read via `fs.readFileSync`; data island pattern already established in graph.astro |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ollama | ^0.6.3 | Call Ollama's local embedding API from Node.js | Official Ollama JS client; dual ESM/CJS; decided in STATE.md |
| umap-js | ^1.4.0 | Reduce 768-dim embedding vectors to 2D x/y | Only pure-JS UMAP implementation; decided in STATE.md |
| gray-matter | ^4.0.3 | Parse YAML frontmatter from markdown files | Battle-tested, used by Astro, Gatsby, Netlify; decided in STATE.md |

### Supporting (Node.js built-ins — no install required)
| Module | Purpose |
|--------|---------|
| `node:fs` (`readFileSync`, `writeFileSync`, `renameSync`, `existsSync`, `mkdirSync`) | Read docs, atomic write |
| `node:crypto` (`createHash`) | SHA-256 content hashing for incremental cache |
| `node:path` (`join`, `relative`) | Path manipulation |
| `node:module` (`createRequire`) | Import CJS packages (umap-js, gray-matter) from `.mjs` |
| `node:url` (`fileURLToPath`) | `__dirname` equivalent in ESM: `fileURLToPath(new URL('.', import.meta.url))` |

### Module System Caveat (CRITICAL)
`umap-js` and `gray-matter` are **CJS-only** packages (no `exports` field, `"use strict"` + `module.exports` output). They cannot be imported with a bare ESM `import` statement in a `.mjs` file. Use `createRequire`:

```javascript
// Source: verified in /tmp/umap-test during research
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { UMAP } = require('umap-js');
const matter = require('gray-matter');
```

`ollama` is dual ESM/CJS and can be imported normally:
```javascript
import { Ollama } from 'ollama';
```

**Installation:**
```bash
npm install ollama@^0.6.3 umap-js@^1.4.0 gray-matter@^4.0.3
```

## Architecture Patterns

### Script Structure
```
scripts/
└── embed.mjs          # Single offline script — all logic here

src/data/
└── embeddings.json    # Committed artifact — produced by embed.mjs

.cache/
└── embed-vectors.json # Gitignored raw vector cache — speeds up re-runs

.gitignore             # Add: .cache/
```

### Pattern 1: Ollama Health Check (Run First)
**What:** Fetch `GET http://localhost:11434` and verify response body contains "Ollama is running". Fail loudly if connection refused or unexpected response.
**When to use:** Always first — before reading any files or touching the cache.
**Example:**
```javascript
// Source: verified pattern from Ollama GitHub issue #1378 + local testing
async function assertOllamaRunning(host = 'http://localhost:11434') {
  try {
    const res = await fetch(host, { signal: AbortSignal.timeout(3000) });
    const text = await res.text();
    if (!text.includes('Ollama is running')) {
      throw new Error(`Unexpected Ollama response: ${text}`);
    }
  } catch (e) {
    if (e.cause?.code === 'ECONNREFUSED') {
      console.error('ERROR: Ollama is not running. Start it with: ollama serve');
    } else {
      console.error('ERROR: Cannot reach Ollama:', e.message);
    }
    process.exit(1);
  }
}
```

### Pattern 2: Content-Hash Incremental Cache
**What:** SHA-256 first 16 hex chars of each file's raw content as the cache key. Cache file stores `{ entries: { "relative/path.md": { hash, vector } } }`. On each run, compare file hash to cached hash — skip Ollama call on hit.
**When to use:** For every document before calling Ollama.
**Example:**
```javascript
// Source: verified in research — Node.js crypto built-in
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function contentHash(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

// Cache hit check:
const hash = contentHash(filePath);
const cached = cache.entries[relPath];
if (cached && cached.hash === hash) {
  // Use cached.vector — no Ollama call needed
  console.log(`  [cache hit] ${relPath}`);
  return cached.vector;
}
```

### Pattern 3: Ollama Embedding Call
**What:** Call `ollama.embed()` with `model: 'nomic-embed-text'` and `input: text`. Response is `{ embeddings: [[...768 floats...]] }`.
**When to use:** For documents not found in cache (cache miss).
**Example:**
```javascript
// Source: Ollama JS library official API
import { Ollama } from 'ollama';
const ollama = new Ollama({ host: 'http://localhost:11434' });

async function embed(text) {
  const res = await ollama.embed({
    model: 'nomic-embed-text',
    input: text,
  });
  return res.embeddings[0]; // 768-element float array
}
```

**Text input to embed:** Concatenate `title + '\n\n' + tags.join(' ') + '\n\n' + content`. This gives UMAP richer signal than title alone.

### Pattern 4: UMAP 2D Reduction
**What:** Run `umap.fit(vectors)` on all 768-dim vectors to get 2D coordinates. Must clamp `nNeighbors` to `Math.min(15, n - 1)` to avoid a fatal crash on small corpora.
**When to use:** After all embeddings are collected (cache hits + fresh).
**Example:**
```javascript
// Source: verified against umap-js README + local testing with 15 docs at 768-dim
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { UMAP } = require('umap-js');

function reduceToCoords(vectors) {
  const nNeighbors = Math.min(15, vectors.length - 1);
  const umap = new UMAP({ nComponents: 2, nNeighbors, minDist: 0.1 });
  // fitAsync gives progress callbacks; fit() is synchronous and fine for <500 docs
  const embedding = umap.fit(vectors);
  return embedding; // Array of [x, y] pairs
}
```

**Performance (verified):** `umap.fit()` on 15 docs at 768 dims takes ~100ms. `fitAsync()` on same takes ~900ms (500 epochs with callbacks). Use `fit()` for simplicity — it is fast enough.

### Pattern 5: Atomic File Write
**What:** Write to a `.tmp` file first, then `renameSync` to target. If the script crashes mid-write, the target file is never corrupted or partially written.
**When to use:** For all final outputs — `src/data/embeddings.json` and `.cache/embed-vectors.json`.
**Example:**
```javascript
// Source: verified pattern — Node.js fs.rename is atomic on same filesystem
import { writeFileSync, renameSync } from 'node:fs';

function atomicWriteJSON(targetPath, data) {
  const tmpPath = targetPath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  renameSync(tmpPath, targetPath); // atomic on same filesystem
}
```

### Output Schema for embeddings.json
```javascript
// embeddings.json — committed to git, read by Astro at build time
{
  "version": 1,
  "generated": "2026-03-10T15:33:44.787Z",  // ISO timestamp
  "documents": [
    {
      "id": "langchain",                       // doc slug (Astro collection entry id)
      "title": "LangChain Overview",
      "category": "ai-tools-and-services",     // Astro collection name mapped back to dir
      "tags": ["langchain", "ai", "framework"],
      "x": -14.466,                            // UMAP 2D coordinate
      "y": 0.648
    }
    // ... one entry per document
  ]
}
```

**Estimated size:** ~4KB for 15 documents. Negligible. Committed to git.

### Cache Schema for .cache/embed-vectors.json (gitignored)
```javascript
{
  "version": 1,
  "entries": {
    "ai-tools-and-services/langchain.md": {
      "hash": "a3f5b2c1d4e6f7a8",  // sha256 first 16 hex chars
      "vector": [0.1, 0.2, ...]      // 768-element float array from nomic-embed-text
    }
  }
}
```

**Estimated size:** ~90KB for 15 documents (768 floats × 8 chars/float × 15 docs). Acceptable to gitignore.

### Anti-Patterns to Avoid
- **Direct `writeFileSync` to target path:** Leaves a partial/corrupt file if the script crashes mid-write. Always write to `.tmp` then rename.
- **Calling `umap.fit()` with default `nNeighbors: 15` on <16 docs:** Throws `"Not enough data points"`. Always clamp to `Math.min(15, n - 1)`.
- **Using `import matter from 'gray-matter'` in `.mjs`:** gray-matter is CJS-only and will throw `ERR_REQUIRE_ESM` or fail silently. Use `createRequire`.
- **Embedding only the title:** Title-only embeddings produce poor separation. Include tags and body content for meaningful UMAP clustering.
- **Calling Ollama before health check:** If Ollama is stopped, the error from the client library is generic (`TypeError: fetch failed`). The pre-flight health check produces the actionable error message.
- **Writing `src/data/embeddings.json` before UMAP completes:** If UMAP or any intermediate step fails, the old (valid) embeddings.json should remain untouched until the new one is fully ready. Atomic write handles this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex YAML parser | gray-matter | Handles edge cases: multi-line values, escaped colons, TOML, excerpts |
| Dimensionality reduction | Custom PCA or t-SNE | umap-js | UMAP preserves both local and global structure; hand-rolling is months of work |
| Ollama API calls | Custom fetch wrapper | ollama npm package | Handles base URL, serialization, streaming, typed responses |
| Content hashing | Custom hash | `node:crypto` createHash | Built-in, no install, SHA-256 is collision-resistant |
| Atomic file write | fsync + truncate | rename pattern with `.tmp` | `fs.rename` is atomic on same filesystem in all POSIX systems and Windows NTFS |

**Key insight:** The entire script is ~150 lines using these building blocks. Custom solutions for any of these problems balloon to 500+ lines with subtle correctness bugs.

## Common Pitfalls

### Pitfall 1: nNeighbors Crash on Small Corpus
**What goes wrong:** `umap.fit()` throws `"Not enough data points (15) to create nNeighbors: 15"` when `nNeighbors >= n_samples`.
**Why it happens:** umap-js default is `nNeighbors: 15`. Current corpus is exactly 15 documents.
**How to avoid:** Always compute `nNeighbors = Math.min(15, vectors.length - 1)` before constructing UMAP. Log the value so it is visible in console output.
**Warning signs:** Any corpus under 16 documents will hit this. The error message is clear but only appears at UMAP fit time, not at import time.

### Pitfall 2: CJS Packages in ESM Script
**What goes wrong:** `import { UMAP } from 'umap-js'` or `import matter from 'gray-matter'` in a `.mjs` file either silently imports `undefined` or throws a module resolution error.
**Why it happens:** Both libraries ship CJS-only distributions (verified: `"use strict"; Object.defineProperty(exports, ...)`). They have no `exports` field.
**How to avoid:** Use `createRequire(import.meta.url)` to get a CJS `require` function and use it to load both packages. `ollama` is dual ESM/CJS and imports normally.
**Warning signs:** `TypeError: UMAP is not a constructor` or `TypeError: matter is not a function`.

### Pitfall 3: UMAP Non-Determinism
**What goes wrong:** Running the script twice with identical inputs produces different x/y coordinates, causing the committed `embeddings.json` to show as modified in `git diff` even when no documents changed.
**Why it happens:** umap-js seeds with a random embedding (not spectral, unlike Python UMAP). No random seed API is exposed.
**How to avoid:** Accept non-determinism as a known property. The incremental cache means UMAP only re-runs when documents actually change. Document this behavior in script output. For Phase 6, the map page should normalize coordinates to a fixed viewport at render time, making small positional variations invisible.
**Warning signs:** `git diff src/data/embeddings.json` shows changes on every run even with no doc changes.

### Pitfall 4: Stale embeddings.json on Ollama Failure
**What goes wrong:** Script starts, Ollama goes down mid-run, some documents get new embeddings but UMAP/write fail — the old embeddings.json remains (or a partial one gets written).
**Why it happens:** Without atomic write, a crash mid-`writeFileSync` leaves a partial file.
**How to avoid:** (1) Health check before processing, (2) atomic write so the target file is never touched until the new content is complete, (3) write cache file first, then embeddings.json — if embeddings.json write fails, the cache is still intact for the next run.
**Warning signs:** `src/data/embeddings.json` exists but has missing documents or malformed JSON.

### Pitfall 5: nomic-embed-text Model Not Pulled
**What goes wrong:** `ollama.embed({ model: 'nomic-embed-text', ... })` returns a 404-like error if the model has not been `ollama pull nomic-embed-text` beforehand.
**Why it happens:** Ollama does not auto-pull models on first use via the API.
**How to avoid:** Detect the error and print an actionable message: `"ERROR: Model nomic-embed-text not found. Run: ollama pull nomic-embed-text"`. Check `e.status === 404` or `e.message.includes('model not found')`.
**Warning signs:** Ollama API returns HTTP 404 or similar during the first `embed()` call.

### Pitfall 6: umap-js Performance at Scale (Future)
**What goes wrong:** At >500 documents, `umap.fit()` on 768-dim vectors may take 10-60 seconds or more.
**Why it happens:** UMAP is O(n log n) for neighbor graph construction plus O(n × epochs) for optimization; JavaScript is slower than Python's numpy.
**How to avoid (now):** Not an issue at 15 docs (~100ms verified). Document the Python fallback threshold in script comments. The STATE.md note flags this concern: "if umap-js runs too slowly, Python umap-learn is the fallback."
**Warning signs:** Script takes >30 seconds on a corpus under 200 documents.

## Code Examples

### Complete Script Skeleton
```javascript
// scripts/embed.mjs
// Source: verified patterns from research, all imports tested

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Ollama } from 'ollama';

const require = createRequire(import.meta.url);
const { UMAP } = require('umap-js');
const matter = require('gray-matter');

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE_PATH = join(ROOT, '.cache', 'embed-vectors.json');
const OUTPUT_PATH = join(ROOT, 'src', 'data', 'embeddings.json');
const CONTENT_DIRS = [
  { dir: 'ai-tools-and-services', category: 'ai-tools-and-services' },
  { dir: 'cloud-ai-platforms',    category: 'cloud-ai-platforms' },
  { dir: 'companies',             category: 'companies' },
];
const MODEL = 'nomic-embed-text';

// Step 1: Health check
async function assertOllamaRunning() { /* ... see Pattern 1 ... */ }

// Step 2: Read documents
function readDocs() {
  const docs = [];
  for (const { dir, category } of CONTENT_DIRS) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;
    for (const file of readdirSync(dirPath)) {
      if (!file.endsWith('.md')) continue;
      const filePath = join(dirPath, file);
      const raw = readFileSync(filePath, 'utf8');
      const { data, content } = matter(raw);
      docs.push({
        id: file.replace(/\.md$/, ''),
        category,
        filePath,
        relPath: `${dir}/${file}`,
        title: data.title ?? '',
        tags: data.tags ?? [],
        content,
        raw,
      });
    }
  }
  return docs;
}

// Step 3: Load cache
function loadCache() {
  if (!existsSync(CACHE_PATH)) return { version: 1, entries: {} };
  return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
}

// Step 4: Embed with cache
async function getVectors(docs, cache, ollama) {
  const vectors = [];
  for (const doc of docs) {
    const hash = createHash('sha256').update(doc.raw).digest('hex').slice(0, 16);
    const cached = cache.entries[doc.relPath];
    if (cached && cached.hash === hash) {
      console.log(`  [cache hit] ${doc.relPath}`);
      vectors.push(cached.vector);
    } else {
      console.log(`  [embedding] ${doc.relPath}`);
      const text = `${doc.title}\n\n${doc.tags.join(' ')}\n\n${doc.content}`;
      const res = await ollama.embed({ model: MODEL, input: text });
      const vector = res.embeddings[0];
      cache.entries[doc.relPath] = { hash, vector };
      vectors.push(vector);
    }
  }
  return vectors;
}

// Step 5: UMAP
function reduce(vectors) {
  const nNeighbors = Math.min(15, vectors.length - 1);
  console.log(`  UMAP: ${vectors.length} docs, nNeighbors=${nNeighbors}`);
  const umap = new UMAP({ nComponents: 2, nNeighbors, minDist: 0.1 });
  return umap.fit(vectors);
}

// Step 6: Write outputs atomically
function atomicWriteJSON(path, data) {
  const tmp = path + '.tmp';
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  renameSync(tmp, path);
}

// Main
const ollama = new Ollama({ host: 'http://localhost:11434' });
await assertOllamaRunning();
const docs = readDocs();
console.log(`Found ${docs.length} documents`);
const cache = loadCache();
const vectors = await getVectors(docs, cache, ollama);
mkdirSync(join(ROOT, '.cache'), { recursive: true });
atomicWriteJSON(CACHE_PATH, cache);
const coords = reduce(vectors);
const output = {
  version: 1,
  generated: new Date().toISOString(),
  documents: docs.map((doc, i) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    tags: doc.tags,
    x: coords[i][0],
    y: coords[i][1],
  })),
};
atomicWriteJSON(OUTPUT_PATH, output);
console.log(`Done. Wrote ${docs.length} document coordinates to src/data/embeddings.json`);
```

### How Astro Reads embeddings.json at Build Time
```javascript
// In a future map.astro page (Phase 6) — data island pattern from graph.astro
---
import embeddingsData from '../data/embeddings.json';
const embeddingsJson = JSON.stringify(embeddingsData);
---
<script type="application/json" id="embeddings-data" set:html={embeddingsJson}></script>
<script is:inline type="module">
  const data = JSON.parse(document.getElementById('embeddings-data').textContent);
  // data.documents is the array of { id, title, category, tags, x, y }
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ollama.embeddings()` (deprecated) | `ollama.embed()` | ollama-js v0.5+ | `embed()` accepts `input` (string or string[]); `embeddings()` accepted `prompt` (string only) |
| Spectral initialization in UMAP | Random initialization in umap-js | umap-js always | Less stable across runs than Python UMAP; not fixable without forking umap-js |
| `fs.writeFile` direct | Atomic write via `.tmp` + rename | Best practice, always | Prevents partial writes on crash |

**Deprecated/outdated:**
- `ollama.embeddings({ model, prompt })`: Older API. Use `ollama.embed({ model, input })`.
- Importing umap-js with bare ESM `import`: Fails — package is CJS. Use `createRequire`.

## Open Questions

1. **umap-js non-determinism and git noise**
   - What we know: umap-js does not expose a random seed API. Each run produces different coordinates.
   - What's unclear: Whether the planner should scope the script to only write `embeddings.json` when documents actually changed (skip UMAP if all cache hits) — this would eliminate git noise entirely.
   - Recommendation: Implement an "all cache hits → skip UMAP → no output write" fast path. Log `"All documents cached — skipping UMAP and output write"`. This satisfies EMBED-02's "second run completes without calling Ollama" requirement cleanly.

2. **embeddings.json location: src/data/ vs public/**
   - What we know: STATE.md defers this to Phase 6. Phase 5 must pick a location to write to.
   - What's unclear: Phase 6 will determine whether the map page reads via Astro import (src/data/) or static URL fetch (public/).
   - Recommendation: Write to `src/data/embeddings.json` per the phase goal description. Astro can import JSON from src/data/ at build time via `import data from '../data/embeddings.json'`. Phase 6 can adjust if needed.

3. **nomic-embed-text model version: v1 vs v1.5**
   - What we know: v1 produces fixed 768-dim vectors. v1.5 supports 64-768 dims via matryoshka learning.
   - What's unclear: Which version will be pulled on operator's machine. `nomic-embed-text` without a tag resolves to v1.5 as of 2026.
   - Recommendation: Hard-code `model: 'nomic-embed-text'` (no tag). Both v1 and v1.5 return 768-dim by default. UMAP handles whatever dimension it receives.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` (no external test runner) |
| Config file | none — tests are standalone `.mjs` scripts run with `node` |
| Quick run command | `node scripts/embed.test.mjs` |
| Full suite command | `node src/lib/graph.test.mjs && node scripts/embed.test.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EMBED-01 | `embed.mjs` produces valid `embeddings.json` with x/y for all docs | integration (with Ollama mocked) | `node scripts/embed.test.mjs` | ❌ Wave 0 |
| EMBED-02 | Second run with no doc changes skips Ollama calls | unit (mock Ollama spy) | `node scripts/embed.test.mjs` | ❌ Wave 0 |
| EMBED-03 | Ollama not running → explicit error + exit 1 + no output written | unit (ECONNREFUSED mock) | `node scripts/embed.test.mjs` | ❌ Wave 0 |
| EMBED-04 | `src/data/embeddings.json` is valid JSON with expected schema | smoke (file inspection after build) | `node scripts/embed.test.mjs` | ❌ Wave 0 |

**Note on test strategy:** `scripts/embed.mjs` should be written as a set of exported pure functions (health check, readDocs, loadCache, getVectors, reduce, atomicWriteJSON) with a `main()` guard (`if (process.argv[1] === fileURLToPath(import.meta.url)) { main(); }`). The test file imports these functions and tests them with stubs for Ollama calls.

### Sampling Rate
- **Per task commit:** `node scripts/embed.test.mjs`
- **Per wave merge:** `node src/lib/graph.test.mjs && node scripts/embed.test.mjs`
- **Phase gate:** All tests green + `npm run build` succeeds + `src/data/embeddings.json` committed

### Wave 0 Gaps
- [ ] `scripts/embed.test.mjs` — covers EMBED-01, EMBED-02, EMBED-03, EMBED-04
- [ ] `src/data/embeddings.json` — initial placeholder or first real run committed (EMBED-04 requires file exists for build to succeed)
- [ ] `.cache/` directory — add to `.gitignore`

## Sources

### Primary (HIGH confidence)
- Verified via local installation and execution in `/tmp/umap-test`:
  - `umap-js@1.4.0` — CJS-only, `createRequire` required, `nNeighbors` clamp verified, `fit()` timing on 15 docs × 768-dim (~100ms)
  - `gray-matter@4.0.3` — CJS-only, `createRequire` required, parses YAML frontmatter correctly
  - `ollama@0.6.3` — dual ESM/CJS, `embed()` API verified, `ECONNREFUSED` error structure verified
  - Atomic write via `renameSync` — verified
  - Content hash via `createHash('sha256')` — verified
  - Health check via `fetch('http://localhost:11434')` — returns ECONNREFUSED when Ollama is down
- [Ollama GitHub issue #1378](https://github.com/ollama/ollama/issues/1378) — confirms `GET /` health check endpoint
- [PAIR-code/umap-js README](https://github.com/PAIR-code/umap-js) — `fit()`, `fitAsync()`, constructor params

### Secondary (MEDIUM confidence)
- [nomic-embed-text Ollama page](https://ollama.com/library/nomic-embed-text) — model sizes, context window (2K)
- [Hugging Face nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) — 768-dim default output

### Tertiary (LOW confidence)
- umap-js performance at >500 docs — not tested; extrapolated from 15-doc timing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all three libraries installed and tested locally
- Architecture: HIGH — all patterns verified in isolation via Node.js execution
- Pitfalls: HIGH — nNeighbors crash and CJS import issues directly reproduced
- UMAP non-determinism: HIGH — known documented behavior of umap-js

**Research date:** 2026-03-10
**Valid until:** 2026-09-10 (stable libraries; umap-js is unmaintained but frozen at 1.4.0, ollama-js updates frequently but API is stable)
