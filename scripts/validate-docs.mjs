/**
 * scripts/validate-docs.mjs — Document validation script
 *
 * Validates all documents in the three content directories for correct
 * frontmatter and required sections. Exits 0 on success, 1 with printed
 * errors on failure.
 *
 * Run:    node scripts/validate-docs.mjs
 * Import: import { validateContent, validateDocs } from './validate-docs.mjs'
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');

// --- Constants ---
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIRS = [
  { dir: 'ai-tools-and-services', category: 'ai-tools-and-services' },
  { dir: 'cloud-ai-platforms',    category: 'cloud-ai-platforms' },
  { dir: 'companies',             category: 'companies' },
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a single document given its raw string content.
 *
 * @param {string} raw      - Raw file content
 * @param {string} filePath - Relative path used in error reporting (e.g. "ai-tools-and-services/foo.md")
 * @returns {{ file: string, field: string, issue: string }[]} Array of errors (empty = valid)
 */
export function validateContent(raw, filePath) {
  const errors = [];

  // Check frontmatter present (file must start with "---")
  if (!raw.trimStart().startsWith('---')) {
    errors.push({
      file: filePath,
      field: 'frontmatter',
      issue: 'YAML frontmatter missing (file must start with "---")',
    });
    // Cannot check frontmatter fields — return early
    return errors;
  }

  // Parse frontmatter
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    errors.push({ file: filePath, field: 'frontmatter', issue: `Failed to parse YAML: ${e.message}` });
    return errors;
  }

  const { data, content } = parsed;

  // --- Frontmatter field checks ---

  // title: non-empty string
  if (data.title === undefined || data.title === null || String(data.title).trim() === '') {
    errors.push({ file: filePath, field: 'title', issue: 'empty or missing' });
  }

  // date: must match YYYY-MM-DD
  if (data.date === undefined || data.date === null) {
    errors.push({ file: filePath, field: 'date', issue: 'missing' });
  } else {
    // gray-matter may parse date as a Date object; convert to string for regex check
    const dateStr = data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date);
    if (!DATE_RE.test(dateStr)) {
      errors.push({ file: filePath, field: 'date', issue: `"${dateStr}" does not match YYYY-MM-DD format` });
    }
  }

  // tags: key must exist (value may be empty array)
  if (!Object.prototype.hasOwnProperty.call(data, 'tags')) {
    errors.push({ file: filePath, field: 'tags', issue: 'missing (key must exist, even if empty)' });
  } else if (Array.isArray(data.tags)) {
    // Each tag must pass normalization: tag === tag.toLowerCase().trim().replace(/\s+/g, '-')
    for (const tag of data.tags) {
      const canonical = String(tag).toLowerCase().trim().replace(/\s+/g, '-');
      if (String(tag) !== canonical) {
        errors.push({
          file: filePath,
          field: 'tag',
          issue: `"${tag}" should be "${canonical}"`,
        });
      }
    }
  }

  // --- Body section checks ---
  // Use the raw content (after frontmatter) split into lines
  const lines = content.split('\n');

  // H1 heading: a line starting with "# "
  const hasH1 = lines.some((l) => /^# /.test(l));
  if (!hasH1) {
    errors.push({ file: filePath, field: 'h1', issue: 'H1 heading (line starting with "# ") is absent' });
  }

  // ## Summary section
  const hasSummary = lines.some((l) => /^## Summary/.test(l));
  if (!hasSummary) {
    errors.push({ file: filePath, field: 'summary', issue: '"## Summary" section heading is absent' });
  }

  // ## Content section
  const hasContent = lines.some((l) => /^## Content/.test(l));
  if (!hasContent) {
    errors.push({ file: filePath, field: 'content', issue: '"## Content" section heading is absent' });
  }

  return errors;
}

/**
 * Glob all *.md files in the three CONTENT_DIRS, validate each, and
 * aggregate all errors.
 *
 * @param {string} rootDir - Root directory (injectable for tests; defaults to project root)
 * @returns {{ file: string, field: string, issue: string }[]} All errors found
 */
export function validateDocs(rootDir = ROOT) {
  const allErrors = [];

  for (const { dir } of CONTENT_DIRS) {
    const dirPath = join(rootDir, dir);
    let files;
    try {
      files = readdirSync(dirPath).filter((f) => f.endsWith('.md'));
    } catch {
      // Directory doesn't exist — skip
      continue;
    }
    for (const file of files) {
      const filePath = join(dirPath, file);
      const relPath = `${dir}/${file}`;
      const raw = readFileSync(filePath, 'utf8');
      const errors = validateContent(raw, relPath);
      allErrors.push(...errors);
    }
  }

  return allErrors;
}

// --- Main entry point ---

async function main() {
  const errors = validateDocs();

  if (errors.length > 0) {
    // Count distinct files with errors
    const errorFiles = new Set(errors.map((e) => e.file));
    console.error('Validation errors:');
    for (const err of errors) {
      console.error(`  ${err.file} — ${err.field}: ${err.issue}`);
    }
    console.error(`${errors.length} error${errors.length === 1 ? '' : 's'} in ${errorFiles.size} document${errorFiles.size === 1 ? '' : 's'}.`);
    process.exit(1);
  }

  // Count all docs checked
  let total = 0;
  for (const { dir } of CONTENT_DIRS) {
    try {
      total += readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.md')).length;
    } catch {
      // skip
    }
  }
  console.log(`All ${total} documents valid.`);
  process.exit(0);
}

// Main guard — only run when invoked directly, not on import
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
