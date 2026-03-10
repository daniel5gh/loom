import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import Fuse from 'fuse.js';

const FUSE_CONFIG = {
  keys: [
    { name: 'title',   weight: 0.6 },
    { name: 'tags',    weight: 0.3 },
    { name: 'summary', weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: false,
};

const SAMPLE_DOCS = [
  {
    title: 'OpenAI API Overview',
    tags: ['llm', 'api'],
    summary: 'Overview of the OpenAI REST API for completions and chat.',
  },
  {
    title: 'Vertex AI',
    tags: ['inference', 'cloud'],
    summary: 'Google cloud ML platform for model serving and inference.',
  },
  {
    title: 'Anthropic Claude',
    tags: ['safety', 'llm'],
    summary: 'AI safety research and constitutional AI methods.',
  },
  {
    title: 'Embeddings and Semantic Search',
    tags: ['embeddings', 'search'],
    summary: 'How to build semantic search using vector embeddings.',
  },
];

describe('Fuse.js search configuration', () => {
  const fuse = new Fuse(SAMPLE_DOCS, FUSE_CONFIG);

  test('Query "openai" matches document with "OpenAI" in title', () => {
    const results = fuse.search('openai');
    assert.ok(results.length > 0, 'Expected at least one result for "openai"');
    const titles = results.map((r) => r.item.title);
    assert.ok(
      titles.some((t) => t.toLowerCase().includes('openai')),
      `Expected a result with "OpenAI" in title, got: ${titles.join(', ')}`
    );
  });

  test('Query "inference" matches document tagged "inference" even if title does not match', () => {
    const results = fuse.search('inference');
    assert.ok(results.length > 0, 'Expected at least one result for "inference"');
    const matchedTags = results.flatMap((r) => r.item.tags);
    assert.ok(
      matchedTags.includes('inference'),
      `Expected a result with tag "inference", got tags: ${matchedTags.join(', ')}`
    );
  });

  test('Query "zzzznothing" returns 0 results (no false positives above threshold)', () => {
    const results = fuse.search('zzzznothing');
    assert.equal(results.length, 0, `Expected 0 results for gibberish query, got ${results.length}`);
  });

  test('Results are returned as an array (not null/undefined)', () => {
    const results = fuse.search('openai');
    assert.ok(Array.isArray(results), 'Expected results to be an array');
  });

  test('Each result object has item property with title, tags, and summary fields', () => {
    const results = fuse.search('openai');
    assert.ok(results.length > 0, 'Need at least one result to inspect structure');
    const result = results[0];
    assert.ok('item' in result, 'Expected result to have an "item" property');
    assert.ok('title' in result.item, 'Expected item to have "title"');
    assert.ok('tags' in result.item, 'Expected item to have "tags"');
    assert.ok('summary' in result.item, 'Expected item to have "summary"');
  });
});
