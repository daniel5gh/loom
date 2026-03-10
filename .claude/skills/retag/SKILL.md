---
name: loom:retag
description: Rename or split a tag across all documents in the knowledge base
argument-hint: "<old-tag> <new-tag> [second-new-tag]"
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Bash
---

# /loom:retag

Rename or split a tag across every document in the Loom knowledge base.

## Step 1: PARSE ARGUMENTS

Parse $ARGUMENTS. Split on whitespace:
- If 2 tokens: **MERGE MODE** — replace old-tag with new-tag
- If 3 tokens: **SPLIT MODE** — replace old-tag with both new-tag-1 AND new-tag-2 (add both to tags array)
- If fewer than 2 tokens: print `Usage: /loom:retag <old-tag> <new-tag> [second-new-tag]` and stop.

Normalize the new tag(s) immediately: `tag.toLowerCase().trim().replace(/\s+/g, '-')`

Print the active mode and the normalized new tag(s):
```
Mode: MERGE  new-tag: <normalized-tag>
```
or
```
Mode: SPLIT  new-tags: <normalized-tag-1>, <normalized-tag-2>
```

## Step 2: FIND AFFECTED FILES

Glob all `*.md` files in:
- `ai-tools-and-services/`
- `cloud-ai-platforms/`
- `companies/`

For each file: Read it. Check if old-tag appears in the `tags` frontmatter array.

Build a list of affected files (files that contain old-tag in their tags array).

Print: `Found N files containing tag: <old-tag>`

If N is 0: print `No documents use tag '<old-tag>'. Nothing to do.` and stop.

## Step 3: UPDATE EACH FILE

For each affected file, use Bash with an inline node script using gray-matter to update the tags.

**MERGE MODE** (2 tokens — replace old-tag with single new-tag):
```bash
node -e "
const matter = require('./node_modules/gray-matter');
const fs = require('fs');
const raw = fs.readFileSync('FILEPATH', 'utf8');
const parsed = matter(raw);
const oldTag = 'OLD_TAG';
const newTags = ['NEW_TAG'];
parsed.data.tags = [...new Set(
  parsed.data.tags.flatMap(t => t === oldTag ? newTags : [t])
)];
fs.writeFileSync('FILEPATH', matter.stringify(parsed.content, parsed.data));
"
```

**SPLIT MODE** (3 tokens — replace old-tag with two new tags):
```bash
node -e "
const matter = require('./node_modules/gray-matter');
const fs = require('fs');
const raw = fs.readFileSync('FILEPATH', 'utf8');
const parsed = matter(raw);
const oldTag = 'OLD_TAG';
const newTags = ['NEW_TAG_1', 'NEW_TAG_2'];
parsed.data.tags = [...new Set(
  parsed.data.tags.flatMap(t => t === oldTag ? newTags : [t])
)];
fs.writeFileSync('FILEPATH', matter.stringify(parsed.content, parsed.data));
"
```

Substitute the actual file path, old tag, and new tag(s) into the script for each file.

Print the file path after each successful update:
```
Updated: ai-tools-and-services/example.md
```

## Step 4: REPORT

Print a summary:
```
Updated N files: replaced '<old-tag>' with '<new-tag>'
```
(or both new tags in split mode: `replaced '<old-tag>' with '<new-tag-1>' and '<new-tag-2>'`)

List the modified file paths.

Print: `Run /loom:deploy to re-embed and publish changes.`

## Critical Guardrails

- Normalize new tag(s) before writing: `tag.toLowerCase().trim().replace(/\s+/g, '-')`
- Use gray-matter for frontmatter rewriting to handle all YAML formats correctly.
- Deduplicate tags after replacement.
- Never modify file content outside the `tags` frontmatter field.
- Never create new files — only update existing documents that already contain the old tag.
