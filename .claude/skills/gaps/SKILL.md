---
name: loom:gaps
description: Identify tags with thin coverage and suggest research topics to fill the gaps
disable-model-invocation: true
allowed-tools: Read, Glob
---

# /loom:gaps

Analyze the Loom knowledge base for thin-coverage tags (1-2 documents) and suggest research topics to fill the gaps.

This skill is **read-only**. It does NOT modify any files.

## Step 1: BUILD TAG FREQUENCY MAP

Glob all `*.md` files in:
- `ai-tools-and-services/`
- `cloud-ai-platforms/`
- `companies/`

For each file: Read it. Parse the `tags` array from frontmatter.

Build a frequency map: `{ tagName: [docTitle1, docTitle2, ...] }`

Use the `title` frontmatter field as the document title. If `title` is missing, use the filename (without extension).

Count total documents processed.

## Step 2: FIND THIN TAGS

Filter the frequency map to entries where the document count is **1 or 2**.

Sort the thin tags:
1. By count ascending (singletons first, then pairs)
2. Then alphabetically within each count group

## Step 3: GENERATE OUTPUT

If no thin tags found: print `No thin-coverage tags found. All tags have 3+ documents.` and stop.

Otherwise, print a structured report:

```
# Knowledge Gap Analysis

Found N thin-coverage tags (1-2 documents each).

## Tags with 1 document

### tag-name
Documents: doc-title-1
Suggested research topics:
- [specific topic 1 related to tag-name]
- [specific topic 2 related to tag-name]
- [specific topic 3 related to tag-name]

## Tags with 2 documents

### tag-name
Documents: doc-title-1, doc-title-2
Suggested research topics:
- [specific topic 1]
- [specific topic 2]
- [specific topic 3]
```

For each thin tag, suggest 2-3 **specific and actionable** research topics using your knowledge of the AI/ML domain. Topics must be concrete (e.g., "Mistral 7B architecture and deployment options" not "more AI content"). The topics should be things that would meaningfully expand coverage of that tag in the corpus.

Only include the "## Tags with 1 document" section if there are singletons. Only include "## Tags with 2 documents" if there are pairs. Omit empty sections entirely.

## Step 4: SUMMARY LINE

After the full report, print:

```
M documents analyzed. N thin tags found. Use /loom:add or /loom:research to fill gaps.
```

Where M is total documents processed and N is the count of thin tags.
