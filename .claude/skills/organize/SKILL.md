---
name: loom:organize
description: Audit all Loom documents for missing or inconsistent tags and suggest fixes
disable-model-invocation: true
allowed-tools: Read, Glob
---

# /loom:organize

Audit all Loom knowledge base documents for tag consistency issues and suggest fixes.

## Tag normalization rule
Canonical form: tag.toLowerCase().trim().replace(/\s+/g, '-')
Non-canonical examples: "LLM" (should be "llm"), "Open Source" (should be "open-source"), "Machine Learning" (should be "machine-learning")

## Steps

1. Use Glob to find all *.md files in these directories:
   - ai-tools-and-services/
   - cloud-ai-platforms/
   - companies/

2. For each document, read the file and extract the `tags` array from YAML frontmatter.

3. For each tag, apply the normalization rule and compare to the original.
   Flag any tag where the normalized form differs from the stored form.

4. Also check for:
   - Missing `tags` field (frontmatter has no tags key)
   - Empty tags list (tags: [])
   - Tags that are semantically duplicate after normalization (e.g., "llm" and "LLM" in same doc)

5. Compile and display a structured audit report:

   ## Tag Audit Report

   ### Non-canonical tags found
   | File | Current Tag | Canonical Form |
   |------|-------------|----------------|
   | ...  | ...         | ...            |

   ### Documents with missing or empty tags
   | File | Issue |
   |------|-------|
   | ...  | ...   |

   ### Summary
   N documents audited. M issues found.

6. After the report, list suggested fixes as YAML snippets showing the corrected tags array for each affected document.

7. DO NOT modify any files. Present the report and proposed fixes, then ask the user to confirm
   before applying any changes.
