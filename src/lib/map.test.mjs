/**
 * Tests for map page helper functions: buildScales and hitTest
 * Run with: node src/lib/map.test.mjs
 */

import assert from 'node:assert/strict';
import { buildScales, hitTest } from './map.mjs';

// --- buildScales tests ---

// Basic: two-point corpus, no padding
const scales = buildScales([{ x: 0, y: 0 }, { x: 10, y: 10 }], 100, 100, 0);
assert.strictEqual(scales.scaleX(0), 0, 'scaleX(xMin) should be 0 with padding=0');
assert.strictEqual(scales.scaleX(10), 100, 'scaleX(xMax) should be canvasW with padding=0');
assert.strictEqual(scales.scaleY(0), 0, 'scaleY(yMin) should be 0 with padding=0');
assert.strictEqual(scales.scaleY(10), 100, 'scaleY(yMax) should be canvasH with padding=0');

// With padding: endpoints should be at PAD and canvasW - PAD
const scaled = buildScales([{ x: 0, y: 0 }, { x: 10, y: 10 }], 100, 100, 40);
assert.strictEqual(scaled.scaleX(0), 40, 'scaleX(xMin) should equal padding');
assert.strictEqual(scaled.scaleX(10), 60, 'scaleX(xMax) should equal canvasW - padding');
assert.strictEqual(scaled.scaleY(0), 40, 'scaleY(yMin) should equal padding');
assert.strictEqual(scaled.scaleY(10), 60, 'scaleY(yMax) should equal canvasH - padding');

// Single-point corpus: guard against divide-by-zero, must return finite number
const single = buildScales([{ x: 5, y: 5 }], 100, 100, 0);
const singleX = single.scaleX(5);
const singleY = single.scaleY(5);
assert.ok(Number.isFinite(singleX), `scaleX for single-point corpus must be finite, got ${singleX}`);
assert.ok(Number.isFinite(singleY), `scaleY for single-point corpus must be finite, got ${singleY}`);

// --- hitTest tests ---

const dotPositions = [
  { doc: { title: 'A' }, cx: 50, cy: 50 },
  { doc: { title: 'B' }, cx: 100, cy: 100 },
];

// Hit within radius
const hit = hitTest(50, 50, dotPositions, 8);
assert.ok(hit !== null, 'hitTest should return a dot when within HIT_RADIUS');
assert.strictEqual(hit.doc.title, 'A', 'hitTest should return the correct dot');

// Miss when all dots farther than HIT_RADIUS
const miss = hitTest(0, 0, dotPositions, 8);
assert.strictEqual(miss, null, 'hitTest should return null when all dots are outside HIT_RADIUS');

// Empty dotPositions
const empty = hitTest(50, 50, [], 8);
assert.strictEqual(empty, null, 'hitTest should return null for empty dotPositions');

console.log('All tests passed');
