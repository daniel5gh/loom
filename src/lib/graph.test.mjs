/**
 * Tests for src/lib/graph.js
 * Run with: node src/lib/graph.test.mjs
 */

import assert from 'node:assert/strict';
import { buildGraphData, getRelatedDocs } from './graph.js';

const docs = [
  { id: 'doc-a', data: { title: 'A', tags: ['llm', 'python', 'api'] }, category: 'ai-tools-and-services' },
  { id: 'doc-b', data: { title: 'B', tags: ['llm', 'python', 'chat'] }, category: 'ai-tools-and-services' },
  { id: 'doc-c', data: { title: 'C', tags: ['cloud', 'api'] }, category: 'cloud-ai-platforms' },
];

// --- buildGraphData tests ---

const { nodes, edges } = buildGraphData(docs);

// Node shape tests
assert.equal(nodes.length, 3, 'nodes: expected 3');

const nodeA = nodes.find(n => n.id === 'doc-a');
assert.ok(nodeA, 'node doc-a should exist');
assert.equal(nodeA.title, 'A', 'node title');
assert.deepEqual(nodeA.tags, ['llm', 'python', 'api'], 'node tags');
assert.equal(nodeA.url, '/ai-tools-and-services/doc-a/', 'node url');
assert.equal(nodeA.tagCount, 3, 'node tagCount');
assert.ok(typeof nodeA.color === 'string', 'node color should be a string');
assert.ok('cluster' in nodeA, 'node should have cluster field');

// Edge tests
assert.equal(edges.length, 1, 'edges: expected 1 (only doc-a/doc-b with 2 shared tags)');
assert.equal(edges[0].weight, 2, 'edge weight: expected 2');
assert.ok(edges[0].sharedTags.includes('llm'), 'sharedTags: should include llm');
assert.ok(edges[0].sharedTags.includes('python'), 'sharedTags: should include python');
assert.ok('source' in edges[0], 'edge should have source');
assert.ok('target' in edges[0], 'edge should have target');

// Color/cluster assignment: 'llm' and 'python' both appear 2x, 'api' 2x too
// Top tag logic assigns cluster colors to the top 3 frequent tags
// doc-a should have a color assigned (one of the neon colors or fallback)
const validColors = ['#00E5FF', '#FF2D78', '#39FF14', '#8888AA'];
assert.ok(validColors.includes(nodeA.color), `color should be one of ${validColors.join(', ')}, got ${nodeA.color}`);

// --- getRelatedDocs tests ---

const related = getRelatedDocs(docs[0], docs);
// doc-b shares 2 tags ('llm','python'), doc-c shares 1 tag ('api') — both have > 0 shared tags
assert.equal(related.length, 2, 'related: expected 2 results (doc-b with 2 tags, doc-c with 1 tag)');
// First result should be the one with most shared tags (doc-b)
assert.equal(related[0].sharedTags.length, 2, 'related: first result should have 2 shared tags');
assert.ok(related[0].sharedTags.includes('llm'), 'related: sharedTags should include llm');
assert.equal(related[0].category, 'ai-tools-and-services', 'related: category should be present');
assert.ok('doc' in related[0], 'related item should have doc field');

// Self-exclusion
const relatedIds = related.map(r => r.doc.id);
assert.ok(!relatedIds.includes('doc-a'), 'related: should not include self');

// Sorting by sharedTags descending
const docsForSort = [
  { id: 'base', data: { title: 'Base', tags: ['a', 'b', 'c', 'd'] }, category: 'x' },
  { id: 'one', data: { title: 'One', tags: ['a'] }, category: 'x' },
  { id: 'three', data: { title: 'Three', tags: ['a', 'b', 'c'] }, category: 'x' },
  { id: 'two', data: { title: 'Two', tags: ['a', 'b'] }, category: 'x' },
];
const sortedRelated = getRelatedDocs(docsForSort[0], docsForSort);
assert.equal(sortedRelated[0].sharedTags.length, 3, 'sorted: first result should have most shared tags');
assert.equal(sortedRelated[1].sharedTags.length, 2, 'sorted: second result should have 2 shared tags');
assert.equal(sortedRelated[2].sharedTags.length, 1, 'sorted: third result should have 1 shared tag');

// Max 5 results
const manyDocs = Array.from({ length: 10 }, (_, i) => ({
  id: `doc-${i}`,
  data: { title: `Doc ${i}`, tags: ['shared', `unique-${i}`] },
  category: 'x',
}));
manyDocs.push({ id: 'current', data: { title: 'Current', tags: ['shared', 'extra'] }, category: 'x' });
const top5 = getRelatedDocs(manyDocs[manyDocs.length - 1], manyDocs);
assert.ok(top5.length <= 5, 'related: should return at most 5 results');

console.log('graph.js tests: PASS');
