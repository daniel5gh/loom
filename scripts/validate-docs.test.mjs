/**
 * Tests for scripts/validate-docs.mjs
 * Run with: node scripts/validate-docs.test.mjs
 *
 * Tests use in-memory fixture strings passed to validateContent(raw, filePath).
 * No temp files are created — all fixtures are inline strings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContent } from './validate-docs.mjs';

// --- Fixtures ---

const VALID_DOC = `---
title: Test Document
date: 2024-01-15
tags:
  - machine-learning
  - ai
---

# Test Document

## Summary

This is the summary section.

## Content

This is the content section.
`;

const makeDoc = (overrides = {}) => {
  const fm = Object.assign(
    { title: 'Test Document', date: '2024-01-15', tags: ['ai'] },
    overrides.fm ?? {}
  );
  const body = overrides.body ?? '# Test Document\n\n## Summary\n\nSummary text.\n\n## Content\n\nContent text.\n';

  let frontmatter = '---\n';
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      frontmatter += `${k}:\n`;
      for (const item of v) {
        // Quote tag values that contain spaces or special chars so YAML preserves them
        const needsQuoting = /[\s:]/.test(item);
        frontmatter += `  - ${needsQuoting ? `"${item}"` : item}\n`;
      }
    } else if (v === undefined || v === null) {
      // skip the key entirely
    } else {
      frontmatter += `${k}: ${v}\n`;
    }
  }
  frontmatter += '---\n\n';
  return frontmatter + body;
};

// --- Tests ---

test('valid document returns no errors', () => {
  const errors = validateContent(VALID_DOC, 'test/doc.md');
  assert.deepEqual(errors, []);
});

test('missing title field returns error', () => {
  const raw = makeDoc({ fm: { title: undefined, date: '2024-01-15', tags: ['ai'] } });
  const errors = validateContent(raw, 'test/doc.md');
  assert.ok(errors.length > 0, 'should have errors');
  const titleError = errors.find((e) => e.field === 'title');
  assert.ok(titleError, 'should have a title error');
  assert.equal(titleError.file, 'test/doc.md');
  assert.ok(titleError.issue.length > 0);
});

test('empty title returns error', () => {
  const raw = makeDoc({ fm: { title: '', date: '2024-01-15', tags: ['ai'] } });
  const errors = validateContent(raw, 'test/doc.md');
  const titleError = errors.find((e) => e.field === 'title');
  assert.ok(titleError, 'should have a title error for empty string');
});

test('malformed date (YYYY/MM/DD) returns error', () => {
  const raw = makeDoc({ fm: { title: 'Test', date: '2024/01/01', tags: ['ai'] } });
  const errors = validateContent(raw, 'test/doc.md');
  const dateError = errors.find((e) => e.field === 'date');
  assert.ok(dateError, 'should have a date error for slash format');
  assert.equal(dateError.file, 'test/doc.md');
});

test('missing date field returns error', () => {
  const raw = makeDoc({ fm: { title: 'Test', date: undefined, tags: ['ai'] } });
  const errors = validateContent(raw, 'test/doc.md');
  const dateError = errors.find((e) => e.field === 'date');
  assert.ok(dateError, 'should have a date error for missing field');
});

test('missing tags key returns error', () => {
  const raw = makeDoc({ fm: { title: 'Test', date: '2024-01-15', tags: undefined } });
  const errors = validateContent(raw, 'test/doc.md');
  const tagsError = errors.find((e) => e.field === 'tags');
  assert.ok(tagsError, 'should have a tags error for missing key');
});

test('empty tags array is valid (key exists)', () => {
  const raw = makeDoc({ fm: { title: 'Test', date: '2024-01-15', tags: [] } });
  const errors = validateContent(raw, 'test/doc.md');
  const tagsError = errors.find((e) => e.field === 'tags');
  assert.equal(tagsError, undefined, 'empty tags array should be valid');
});

test('tag that fails normalization returns error', () => {
  const raw = makeDoc({ fm: { title: 'Test', date: '2024-01-15', tags: ['Machine Learning'] } });
  const errors = validateContent(raw, 'test/doc.md');
  const tagError = errors.find((e) => e.field === 'tag');
  assert.ok(tagError, 'should have tag normalization error for "Machine Learning"');
  assert.equal(tagError.file, 'test/doc.md');
  assert.ok(tagError.issue.includes('machine-learning'), 'error should show canonical form');
});

test('tag with leading/trailing spaces fails normalization', () => {
  const raw = makeDoc({ fm: { title: 'Test', date: '2024-01-15', tags: [' ai '] } });
  const errors = validateContent(raw, 'test/doc.md');
  const tagError = errors.find((e) => e.field === 'tag');
  assert.ok(tagError, 'should have tag normalization error for tag with spaces');
});

test('missing H1 heading returns error', () => {
  const body = '## Summary\n\nSummary text.\n\n## Content\n\nContent text.\n';
  const raw = makeDoc({ body });
  const errors = validateContent(raw, 'test/doc.md');
  const h1Error = errors.find((e) => e.field === 'h1');
  assert.ok(h1Error, 'should have H1 heading error');
  assert.equal(h1Error.file, 'test/doc.md');
});

test('missing ## Summary section returns error', () => {
  const body = '# Test Document\n\n## Content\n\nContent text.\n';
  const raw = makeDoc({ body });
  const errors = validateContent(raw, 'test/doc.md');
  const summaryError = errors.find((e) => e.field === 'summary');
  assert.ok(summaryError, 'should have ## Summary section error');
  assert.equal(summaryError.file, 'test/doc.md');
});

test('missing ## Content section returns error', () => {
  const body = '# Test Document\n\n## Summary\n\nSummary text.\n';
  const raw = makeDoc({ body });
  const errors = validateContent(raw, 'test/doc.md');
  const contentError = errors.find((e) => e.field === 'content');
  assert.ok(contentError, 'should have ## Content section error');
  assert.equal(contentError.file, 'test/doc.md');
});

test('document without frontmatter returns error', () => {
  const raw = '# Test Document\n\n## Summary\n\nSummary.\n\n## Content\n\nContent.\n';
  const errors = validateContent(raw, 'test/doc.md');
  assert.ok(errors.length > 0, 'should have errors for missing frontmatter');
  const fmError = errors.find((e) => e.field === 'frontmatter');
  assert.ok(fmError, 'should have a frontmatter error');
});

test('multiple validation errors are all returned', () => {
  // Missing date, malformed tag, missing H1
  const body = '## Summary\n\nSummary text.\n\n## Content\n\nContent text.\n';
  const raw = makeDoc({ fm: { title: 'Test', date: undefined, tags: ['Bad Tag'] }, body });
  const errors = validateContent(raw, 'test/doc.md');
  assert.ok(errors.length >= 2, `should have at least 2 errors, got ${errors.length}`);
});
