import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * Pure function that mirrors the index.astro home page implementation.
 * Merges all docs, sorts by date descending, and slices to at most n results.
 *
 * @param {Array<{collection: string, data: {title: string, date: Date}}>} allDocs
 * @param {number} n - maximum number of docs to return (default 10)
 * @returns {Array}
 */
function getRecentDocs(allDocs, n = 10) {
  return [...allDocs]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Fixture data: 15 docs spanning all three collections with varied dates.
// Some docs share the same date to verify stable-output (no exception).
// ---------------------------------------------------------------------------
const FIXTURE_DOCS = [
  // aiTools (6 docs)
  { collection: 'aiTools', data: { title: 'GPT-4o',            date: new Date('2024-05-13') } },
  { collection: 'aiTools', data: { title: 'Claude 3 Opus',     date: new Date('2024-03-04') } },
  { collection: 'aiTools', data: { title: 'Gemini 1.5 Pro',    date: new Date('2024-02-15') } },
  { collection: 'aiTools', data: { title: 'Llama 3',           date: new Date('2024-04-18') } },
  { collection: 'aiTools', data: { title: 'Mistral 7B',        date: new Date('2023-09-27') } },
  { collection: 'aiTools', data: { title: 'Stable Diffusion',  date: new Date('2022-08-22') } },

  // cloudPlatforms (5 docs)
  { collection: 'cloudPlatforms', data: { title: 'Vertex AI',       date: new Date('2024-06-01') } },
  { collection: 'cloudPlatforms', data: { title: 'Azure OpenAI',    date: new Date('2024-04-18') } }, // same date as Llama 3
  { collection: 'cloudPlatforms', data: { title: 'AWS Bedrock',     date: new Date('2023-11-28') } },
  { collection: 'cloudPlatforms', data: { title: 'Google Colab',    date: new Date('2023-05-10') } },
  { collection: 'cloudPlatforms', data: { title: 'Hugging Face',    date: new Date('2022-06-15') } },

  // companies (4 docs)
  { collection: 'companies', data: { title: 'OpenAI',       date: new Date('2024-05-13') } }, // same date as GPT-4o
  { collection: 'companies', data: { title: 'Anthropic',    date: new Date('2024-03-04') } }, // same date as Claude 3 Opus
  { collection: 'companies', data: { title: 'DeepMind',     date: new Date('2024-01-10') } },
  { collection: 'companies', data: { title: 'Mistral AI',   date: new Date('2023-12-11') } },
];

describe('getRecentDocs — sort + slice logic', () => {
  test('Result contains at most 10 docs when input has 15 docs', () => {
    const result = getRecentDocs(FIXTURE_DOCS);
    assert.equal(result.length, 10, `Expected 10 docs, got ${result.length}`);
  });

  test('Result is sorted newest-first (each adjacent pair satisfies result[i].date >= result[i+1].date)', () => {
    const result = getRecentDocs(FIXTURE_DOCS);
    for (let i = 0; i < result.length - 1; i++) {
      const curr = result[i].data.date.getTime();
      const next = result[i + 1].data.date.getTime();
      assert.ok(
        curr >= next,
        `Expected result[${i}] (${result[i].data.title}, ${result[i].data.date.toISOString()}) ` +
        `to be >= result[${i + 1}] (${result[i + 1].data.title}, ${result[i + 1].data.date.toISOString()})`
      );
    }
  });

  test('All three collections are eligible — fixture top 10 spans aiTools, cloudPlatforms, and companies', () => {
    const result = getRecentDocs(FIXTURE_DOCS);
    const collections = new Set(result.map((d) => d.collection));
    assert.ok(
      collections.has('aiTools'),
      `Expected aiTools in top 10, got collections: ${[...collections].join(', ')}`
    );
    assert.ok(
      collections.has('cloudPlatforms'),
      `Expected cloudPlatforms in top 10, got collections: ${[...collections].join(', ')}`
    );
    assert.ok(
      collections.has('companies'),
      `Expected companies in top 10, got collections: ${[...collections].join(', ')}`
    );
  });

  test('If total docs <= 10, result length equals total count (no over-slicing)', () => {
    const smallSet = FIXTURE_DOCS.slice(0, 7);
    const result = getRecentDocs(smallSet);
    assert.equal(
      result.length,
      7,
      `Expected 7 docs when input has 7, got ${result.length}`
    );
  });

  test('Docs with identical dates are included without error (stable output, no exception)', () => {
    // Docs that share dates: Llama 3 + Azure OpenAI (2024-04-18), GPT-4o + OpenAI (2024-05-13),
    // Claude 3 Opus + Anthropic (2024-03-04)
    assert.doesNotThrow(() => {
      const result = getRecentDocs(FIXTURE_DOCS);
      assert.equal(result.length, 10);
    }, 'getRecentDocs should not throw when docs share the same date');
  });
});
