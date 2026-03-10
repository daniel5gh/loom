/**
 * Tests for map page helper functions: buildScales and hitTest
 * Run with: node src/lib/map.test.mjs
 */

import assert from 'node:assert/strict';
import { buildScales, hitTest, gaussianOpacity, kNearest, composedOpacity } from './map.mjs';

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

// --- gaussianOpacity tests ---

// null docDate → 1.0 (no filter active)
assert.strictEqual(gaussianOpacity(null, new Date('2026-03-05'), 5), 1.0,
  'gaussianOpacity: null docDate should return 1.0');

// null selectedDate → 1.0 (no filter active)
assert.strictEqual(gaussianOpacity(new Date('2026-03-05'), null, 5), 1.0,
  'gaussianOpacity: null selectedDate should return 1.0');

// same date → 1.0 (delta=0)
assert.strictEqual(gaussianOpacity(new Date('2026-03-05'), new Date('2026-03-05'), 5), 1.0,
  'gaussianOpacity: same date should return 1.0');

// delta=sigmaDays → ~0.6065
{
  const result = gaussianOpacity(new Date('2026-03-05'), new Date('2026-03-10'), 5);
  assert.ok(Math.abs(result - 0.6065) < 0.001,
    `gaussianOpacity: delta=sigma should be ~0.6065, got ${result}`);
}

// delta=2*sigmaDays → ~0.1353
{
  const result = gaussianOpacity(new Date('2026-03-05'), new Date('2026-03-15'), 5);
  assert.ok(Math.abs(result - 0.1353) < 0.001,
    `gaussianOpacity: delta=2*sigma should be ~0.1353, got ${result}`);
}

// --- kNearest tests ---

const dots = [
  { cx: 0, cy: 0 },
  { cx: 10, cy: 0 },
  { cx: 20, cy: 0 },
  { cx: 30, cy: 0 },
  { cx: 100, cy: 0 },
];
const self = dots[0];

// k=3 → returns 3 nearest, not including self
{
  const result = kNearest(self, dots, 3);
  assert.strictEqual(result.length, 3, 'kNearest: should return k=3 results');
  assert.ok(!result.includes(self), 'kNearest: should not include self');
  assert.ok(result.some(d => d.cx === 10), 'kNearest: should include cx=10');
  assert.ok(result.some(d => d.cx === 20), 'kNearest: should include cx=20');
  assert.ok(result.some(d => d.cx === 30), 'kNearest: should include cx=30');
}

// k > available → returns all available (4 others)
{
  const result = kNearest(self, dots, 10);
  assert.strictEqual(result.length, 4, 'kNearest: k>available should return all available (n-1)');
}

// only self in dotPositions → []
{
  const result = kNearest(self, [self], 3);
  assert.strictEqual(result.length, 0, 'kNearest: only self in array should return []');
}

// --- composedOpacity tests ---

assert.strictEqual(composedOpacity(1.0, 1.0, 1.0), 1.0,
  'composedOpacity(1,1,1) should be 1.0');
assert.strictEqual(composedOpacity(0.2, 1.0, 1.0), 0.2,
  'composedOpacity(0.2,1,1) should be 0.2');
{
  const result = composedOpacity(0.5, 0.3, 0.8);
  assert.ok(Math.abs(result - 0.3) < 0.0001,
    `composedOpacity(0.5,0.3,0.8) should be ~0.3, got ${result}`);
}

console.log('All tests passed');
