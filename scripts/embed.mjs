/**
 * scripts/embed.mjs — Offline embedding pipeline
 *
 * Reads markdown docs, calls Ollama for embeddings, runs UMAP, writes
 * src/data/embeddings.json with 2D coordinates for visualization.
 *
 * Run: node scripts/embed.mjs
 * Import: import { readDocs, loadCache, ... } from './embed.mjs'
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  mkdirSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { Ollama } from 'ollama';

const require = createRequire(import.meta.url);
const { UMAP } = require('umap-js');
const matter = require('gray-matter');

// --- Constants ---
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE_PATH = join(ROOT, '.cache', 'embed-vectors.json');
const OUTPUT_PATH = join(ROOT, 'src', 'data', 'embeddings.json');
const MODEL = 'nomic-embed-text';
const CONTENT_DIRS = [
  { dir: 'ai-tools-and-services', category: 'ai-tools-and-services' },
  { dir: 'cloud-ai-platforms',    category: 'cloud-ai-platforms' },
  { dir: 'companies',             category: 'companies' },
];

// --- Exported pure functions ---

/**
 * Assert Ollama is running at the given host.
 * Exits process with code 1 and an actionable error message if not.
 */
export async function assertOllamaRunning(host = 'http://10.0.1.3:11434') {
  try {
    const res = await fetch(host, { signal: AbortSignal.timeout(3000) });
    const text = await res.text();
    if (!text.includes('Ollama is running')) {
      throw new Error(`Unexpected response: ${text}`);
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

/**
 * Read all markdown documents from the three content dirs.
 * Returns array of { id, category, filePath, relPath, title, tags, content, raw }.
 *
 * @param {string} rootDir - Root dir (defaults to ROOT; injectable for tests)
 */
export function readDocs(rootDir = ROOT) {
  const docs = [];
  for (const { dir, category } of CONTENT_DIRS) {
    const dirPath = join(rootDir, dir);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const filePath = join(dirPath, file);
      const raw = readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      const slug = file.replace(/\.md$/, '');
      const relPath = `${dir}/${file}`;
      docs.push({
        id: slug,
        category,
        filePath,
        relPath,
        title: parsed.data.title || slug,
        tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
        content: parsed.content.trim(),
        raw,
      });
    }
  }
  return docs;
}

/**
 * Load the vector cache from disk.
 * Returns { version: 1, entries: {} } if the file doesn't exist.
 *
 * @param {string} cachePath - Cache file path (defaults to CACHE_PATH; injectable for tests)
 */
export function loadCache(cachePath = CACHE_PATH) {
  if (!existsSync(cachePath)) {
    return { version: 1, entries: {} };
  }
  return JSON.parse(readFileSync(cachePath, 'utf8'));
}

/**
 * Get 768-dim embedding vectors for all docs, using the cache where possible.
 * Returns { vectors, allCached }.
 *
 * @param {Array}  docs   - Output of readDocs()
 * @param {object} cache  - Output of loadCache()
 * @param {object} ollama - Ollama client instance (injectable for tests)
 */
export async function getVectors(docs, cache, ollama) {
  const vectors = [];
  let allCached = true;

  for (const doc of docs) {
    const hash = createHash('sha256').update(doc.raw).digest('hex').slice(0, 16);

    if (cache.entries[doc.relPath]?.hash === hash) {
      console.log(`  [cache hit] ${doc.relPath}`);
      vectors.push(cache.entries[doc.relPath].vector);
    } else {
      allCached = false;
      const text = `${doc.title}\n\n${doc.tags.join(' ')}\n\n${doc.content}`;
      try {
        const res = await ollama.embed({ model: MODEL, input: text });
        const vector = res.embeddings[0];
        vectors.push(vector);
        cache.entries[doc.relPath] = { hash, vector };
        console.log(`  [embedding] ${doc.relPath}`);
      } catch (e) {
        if (e.status === 404 || (e.message && e.message.includes('model not found'))) {
          console.error(`ERROR: Model '${MODEL}' not found. Run: ollama pull ${MODEL}`);
          process.exit(1);
        }
        throw e;
      }
    }
  }

  return { vectors, allCached };
}

/**
 * Reduce 768-dim vectors to 2D coordinates via UMAP.
 *
 * @param {number[][]} vectors - Array of embedding vectors
 * @returns {number[][]} Array of [x, y] pairs
 */
export function reduce(vectors) {
  const nNeighbors = Math.min(15, vectors.length - 1);
  const umap = new UMAP({ nComponents: 2, nNeighbors, minDist: 0.1 });
  const embedding = umap.fit(vectors);
  console.log(`  UMAP: ${vectors.length} docs, nNeighbors=${nNeighbors}`);
  return embedding;
}

/**
 * Atomically write JSON data to targetPath (write .tmp then rename).
 * Creates parent dirs as needed.
 *
 * @param {string} targetPath - Destination file path
 * @param {object} data       - Data to serialize as JSON
 */
export function atomicWriteJSON(targetPath, data) {
  const dir = join(targetPath, '..');
  mkdirSync(dir, { recursive: true });
  const tmp = targetPath + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  renameSync(tmp, targetPath);
}

// --- Main orchestration (not exported) ---

async function main() {
  const ollama = new Ollama({ host: 'http://10.0.1.3:11434' });

  console.log('embed.mjs: checking Ollama…');
  await assertOllamaRunning();

  console.log('embed.mjs: reading docs…');
  const docs = readDocs();
  console.log(`  found ${docs.length} documents`);

  const cache = loadCache();

  console.log('embed.mjs: getting vectors…');
  const { vectors, allCached } = await getVectors(docs, cache, ollama);

  if (allCached) {
    console.log('All documents cached — skipping UMAP and output write');
    return;
  }

  // Persist updated cache
  atomicWriteJSON(CACHE_PATH, cache);

  console.log('embed.mjs: running UMAP…');
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
  console.log(`embed.mjs: wrote ${output.documents.length} documents to ${OUTPUT_PATH}`);
}

// Main guard — only run when invoked directly, not on import
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
