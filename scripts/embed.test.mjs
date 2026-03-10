/**
 * Tests for scripts/embed.mjs
 * Run with: node scripts/embed.test.mjs
 *
 * Wave 0 scaffold: tests for EMBED-01 through EMBED-04.
 * Tests that depend on embed.mjs are gracefully stubbed when the file
 * does not exist yet — they print "STUB: ..." and are skipped.
 * This allows `node scripts/embed.test.mjs` to exit 0 today and turn
 * fully green when implementation lands in Plan 02.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const EMBED_MJS = join(__dirname, 'embed.mjs');

// Conditional import: stub gracefully if embed.mjs doesn't exist yet
let embedModule = null;
if (existsSync(EMBED_MJS)) {
  embedModule = await import('./embed.mjs');
}

function stubSkip(testName) {
  console.log(`  STUB: embed.mjs not yet implemented — skipping: ${testName}`);
}

let passed = 0;
let skipped = 0;

// --- Test 1: EMBED-04 — placeholder embeddings.json schema ---
{
  const outputPath = join(ROOT, 'src', 'data', 'embeddings.json');
  assert.ok(existsSync(outputPath), 'src/data/embeddings.json must exist');
  const data = JSON.parse(readFileSync(outputPath, 'utf8'));
  assert.ok(typeof data.version === 'number', 'embeddings.json must have numeric version');
  assert.ok(typeof data.generated === 'string', 'embeddings.json must have generated string');
  assert.ok(Array.isArray(data.documents), 'embeddings.json must have documents array');
  console.log('  PASS: embeddings.json schema valid');
  passed++;
}

// --- Test 2: EMBED-01 — readDocs returns expected shape ---
if (!embedModule) {
  stubSkip('readDocs returns correct doc shape');
  skipped++;
} else {
  const { readDocs } = embedModule;
  const docs = readDocs(ROOT);
  assert.ok(Array.isArray(docs), 'readDocs must return an array');
  assert.ok(docs.length > 0, 'readDocs must find at least one document');
  const doc = docs[0];
  assert.ok(typeof doc.id === 'string', 'doc.id must be string');
  assert.ok(typeof doc.category === 'string', 'doc.category must be string');
  assert.ok(typeof doc.title === 'string', 'doc.title must be string');
  assert.ok(Array.isArray(doc.tags), 'doc.tags must be array');
  assert.ok(typeof doc.content === 'string', 'doc.content must be string');
  assert.ok(typeof doc.raw === 'string', 'doc.raw must be string');
  assert.ok(typeof doc.relPath === 'string', 'doc.relPath must be string');
  console.log(`  PASS: readDocs returned ${docs.length} docs with correct shape`);
  passed++;
}

// --- Test 3: EMBED-02 — loadCache returns empty cache for missing file ---
if (!embedModule) {
  stubSkip('loadCache returns cache hit correctly');
  skipped++;
} else {
  const { loadCache } = embedModule;
  // loadCache with non-existent path returns empty cache
  const empty = loadCache('/tmp/nonexistent-embed-cache-12345.json');
  assert.equal(empty.version, 1, 'empty cache must have version 1');
  assert.deepEqual(empty.entries, {}, 'empty cache must have empty entries');
  console.log('  PASS: loadCache returns empty cache for missing file');
  passed++;
}

// --- Test 4: EMBED-01 — reduce produces [x,y] pairs ---
if (!embedModule) {
  stubSkip('reduce produces correct shape');
  skipped++;
} else {
  const { reduce } = embedModule;
  // Use 5 vectors of 3 dims (small enough to be fast, enough for nNeighbors clamp)
  const vectors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
    [0, 1, 1],
  ];
  const coords = reduce(vectors);
  assert.equal(coords.length, vectors.length, 'reduce must return same number of entries');
  assert.equal(coords[0].length, 2, 'each entry must be an [x, y] pair');
  console.log(`  PASS: reduce produced ${coords.length} [x,y] pairs`);
  passed++;
}

// --- Test 5: EMBED-03 — assertOllamaRunning fails loudly on ECONNREFUSED ---
// This test is intent-documented but cannot be directly asserted in-process:
// process.exit(1) would kill the test runner itself. Verified via manual check in Plan 03.
// The plan calls for a subprocess spawn pattern; that test lives in the Plan 03 integration suite.
console.log('  NOTE: EMBED-03 (Ollama failure → exit 1) verified via subprocess check in Plan 03');

console.log(`\nResults: ${passed} passed, ${skipped} skipped (stubs)`);
if (passed + skipped === 0) {
  console.error('No tests ran — unexpected');
  process.exit(1);
}
