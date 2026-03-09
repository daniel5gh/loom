# Coding Conventions

**Analysis Date:** 2026-03-09

## Project Nature

This is a **documentation-only** research collection. There is no application source code, no build system, and no programming language. All content is authored in Markdown. Conventions below apply to Markdown document authoring.

## Naming Patterns

**Files:**
- Use lowercase kebab-case for all document filenames: `aws-sagemaker-ai.md`, `langchain.md`, `litellm.md`
- Single-word names are acceptable when unambiguous: `n8n.md`, `weaviate.md`
- Comparison/index documents use descriptive kebab-case: `cloud-ai-platforms-comparison.md`, `pageindex.md`

**Directories:**
- Use lowercase kebab-case: `ai-tools-and-services/`, `cloud-ai-platforms/`, `companies/`
- Group by category, not by subtopic or date

**Document Titles (in frontmatter and H1):**
- Use title case with the product/service proper name: `LangChain Overview`, `AWS SageMaker AI Overview`
- The H1 heading must match the frontmatter `title` field exactly

## Document Structure

**Template:** All new research documents must follow the structure in `TEMPLATE.md`.

**Required Frontmatter:**
```yaml
---
title: [Document Title]
date: [YYYY-MM-DD]
tags: [comma-separated, lowercase, relevant-tags]
---
```

**Standard Section Order:**
1. `# Title` (H1, matches frontmatter title)
2. `## Summary` - Brief overview of the subject
3. `## Content` - Main body with subsections
   - `### What is [Subject]?` - Introductory explanation
   - `### Key Features` - Bulleted list of capabilities
   - `### Use Cases` - Bulleted list of applications
   - `### Privacy and Security` (optional) - When relevant
   - `### Legal and Compliance` (optional) - When relevant
4. `## References` or `### References` - External links

**Deviations observed:** Some newer documents (e.g., `ai-tools-and-services/pageindex.md`, `ai-tools-and-services/lovable.md`) omit the `## Summary` and `## Content` wrapper sections, placing content directly under the H1. The prescribed convention per `TEMPLATE.md` and `AGENTS.md` is to include both `## Summary` and `## Content`.

## Content Style

**Formatting:**
- No automated formatter or linter configured
- Consistent manual formatting throughout documents
- Use standard Markdown syntax (no HTML)

**Linting:**
- Not configured. No `.markdownlint.json`, `markdownlint-cli`, or equivalent detected.

## Writing Style

**Language:**
- Use clear, precise, professional language
- Write in third person, present tense
- Avoid jargon unless defining or explaining it
- Focus on factual, evidence-backed statements

**Lists:**
- Use bullet points (`-`) for feature lists and use cases
- Keep list items concise (one line preferred)
- Start each item with a capital letter; no trailing period unless full sentences

**Links:**
- Use inline Markdown links: `[Display Text](URL)`
- Place external reference links in a `## References` or `### References` section at the end
- Internal cross-references use relative paths: `[PRD.md](PRD.md)`

**Tables:**
- Use standard Markdown table syntax with header separators
- Example in `cloud-ai-platforms/cloud-ai-platforms-comparison.md`

**Blockquotes:**
- Use `>` for important callouts or disambiguation notes
- Example: `ai-foundry.md` uses `> **Note:**` for disambiguation

## Tags Convention

**Frontmatter tags:**
- Use lowercase
- Comma-separated within square brackets: `[aws, ai, cloud, sagemaker]`
- Include the product/tool name as a tag
- Include broad category tags: `ai`, `cloud`, `framework`, `automation`
- Keep tags relevant and minimal (3-6 tags typical)

## Meta/Project Documents

**Root-level documents** serve project-wide purposes:
- `INDEX.md`: Project overview, purpose, and references
- `PRD.md`: Product requirements document
- `TEMPLATE.md`: Standard document template
- `AGENTS.md`: Guidelines for AI agents contributing to the project

These files do not follow the research document template and have their own structures.

## Where to Apply Conventions

When adding a new research document:
1. Copy `TEMPLATE.md` as a starting point
2. Place the file in the appropriate category directory (or create a new one if needed)
3. Use kebab-case filename matching the subject name
4. Fill in frontmatter: title, today's date, relevant tags
5. Follow the Summary/Content/References section structure
6. Include at least one external reference link

---

*Convention analysis: 2026-03-09*
