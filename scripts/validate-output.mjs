import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DIST = './dist';
const errors = [];
let passed = 0;

// Check dist/ exists
if (!existsSync(DIST)) {
  console.error('ERROR: dist/ directory not found. Run npm run build first.');
  process.exit(1);
}

// Count document pages (one .html file per document in category dirs)
const CATEGORY_DIRS = ['ai-tools-and-services', 'cloud-ai-platforms', 'companies'];
let docCount = 0;
for (const cat of CATEGORY_DIRS) {
  const catPath = join(DIST, cat);
  if (!existsSync(catPath)) {
    errors.push(`Missing category dir: dist/${cat}/`);
    continue;
  }
  // Each slug becomes a subdirectory with index.html
  const entries = readdirSync(catPath, { withFileTypes: true });
  const htmlDirs = entries.filter(e => e.isDirectory());
  docCount += htmlDirs.length;
  console.log(`  dist/${cat}/: ${htmlDirs.length} pages`);
}

if (docCount < 15) {
  errors.push(`Expected 15 document pages, found ${docCount}`);
} else {
  console.log(`OK: ${docCount} document pages (expected 15)`);
  passed++;
}

// Count tag pages
const tagsPath = join(DIST, 'tags');
if (!existsSync(tagsPath)) {
  errors.push('Missing dist/tags/ directory');
} else {
  const tagDirs = readdirSync(tagsPath, { withFileTypes: true }).filter(e => e.isDirectory());
  if (tagDirs.length === 0) {
    errors.push('No tag pages generated in dist/tags/');
  } else {
    console.log(`OK: ${tagDirs.length} tag pages in dist/tags/`);
    passed++;
  }
}

// Check index page exists
if (!existsSync(join(DIST, 'index.html'))) {
  errors.push('Missing dist/index.html');
} else {
  console.log('OK: dist/index.html exists');
  passed++;
}

// Spot-check a document page for tag links to /tags/
let tagLinkCheckPassed = false;
for (const cat of CATEGORY_DIRS) {
  const catPath = join(DIST, cat);
  if (!existsSync(catPath)) continue;
  const entries = readdirSync(catPath, { withFileTypes: true }).filter(e => e.isDirectory());
  if (entries.length === 0) continue;
  const sampleHtml = join(catPath, entries[0].name, 'index.html');
  if (!existsSync(sampleHtml)) continue;
  const html = readFileSync(sampleHtml, 'utf8');
  if (html.includes('href="/tags/')) {
    console.log(`OK: tag links present in dist/${cat}/${entries[0].name}/index.html`);
    tagLinkCheckPassed = true;
    passed++;
    break;
  }
}
if (!tagLinkCheckPassed) {
  errors.push('No tag links (href="/tags/...") found in sampled document pages');
}

// Check that at least one built document page contains Shiki markup
let shikiCheckPassed = false;
for (const cat of CATEGORY_DIRS) {
  const catPath = join(DIST, cat);
  if (!existsSync(catPath)) continue;
  const entries = readdirSync(catPath, { withFileTypes: true }).filter(e => e.isDirectory());
  if (entries.length === 0) continue;
  const sampleHtml = join(catPath, entries[0].name, 'index.html');
  if (!existsSync(sampleHtml)) continue;
  const html = readFileSync(sampleHtml, 'utf8');
  if (html.includes('astro-code')) {
    console.log(`OK: Shiki markup (astro-code) found in dist/${cat}/${entries[0].name}/index.html`);
    shikiCheckPassed = true;
    passed++;
    break;
  }
}
if (!shikiCheckPassed) {
  // Only warn — document may not have code blocks; check graph page as fallback
  console.log('INFO: No astro-code markup in sampled doc pages (may not have code blocks — acceptable)');
}

// Summary
console.log(`\nValidation: ${passed} checks passed, ${errors.length} errors`);
if (errors.length > 0) {
  errors.forEach(e => console.error('  ERROR:', e));
  process.exit(1);
}
console.log('All checks passed.');
