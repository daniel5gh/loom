---
name: loom:validate
description: Validate all Loom documents for frontmatter errors and template conformance
disable-model-invocation: true
allowed-tools: Read, Glob
---

# /loom:validate

Check all Loom knowledge base documents for frontmatter errors and template non-conformance.
Report all issues. Do NOT modify any files.

## Required frontmatter fields
- title: non-empty string
- date: YYYY-MM-DD format
- tags: list (may be empty, but key must exist)

## Required document sections
- H1 heading (line starting with "# ") — must match frontmatter title
- ## Summary section
- ## Content section

## Tag normalization check
Each tag must satisfy: tag === tag.toLowerCase().trim().replace(/\s+/g, '-')
Flag any tag that does not match its canonical form.

## Steps

1. Use Glob to find all *.md files in:
   - ai-tools-and-services/
   - cloud-ai-platforms/
   - companies/

2. For each file, read it and check:
   a. YAML frontmatter is present (file starts with "---")
   b. `title` field: exists and is a non-empty string
   c. `date` field: exists and matches YYYY-MM-DD (regex: /^\d{4}-\d{2}-\d{2}$/)
   d. `tags` field: exists (value may be empty list)
   e. H1 heading exists (line starting with "# ")
   f. "## Summary" section heading exists
   g. "## Content" section heading exists
   h. Each tag passes normalization rule

3. Compile and display a validation report:

   ## Validation Report

   ### Errors (must fix before build)
   | File | Field/Section | Issue |
   |------|---------------|-------|
   | ...  | ...           | ...   |

   ### Warnings (tag normalization)
   | File | Tag | Canonical Form |
   |------|-----|----------------|
   | ...  | ... | ...            |

   ### Summary
   N documents checked. M errors. K warnings.

4. DO NOT modify any files. Report only.
