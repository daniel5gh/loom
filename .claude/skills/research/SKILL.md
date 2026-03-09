---
name: loom:research
description: Research a topic and create a new Loom knowledge base document
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Read, Write, WebSearch, Bash, Glob
---

# /loom:research

Research "$ARGUMENTS" and create a new Loom knowledge base document.

## Tag normalization rule (REQUIRED)
ALL tags MUST follow exactly: tag.toLowerCase().trim().replace(/\s+/g, '-')
- "Machine Learning" → "machine-learning"
- "LLM" → "llm"
- "Open Source" → "open-source"
- "API" → "api"

## Steps

1. Read [template.md](template.md) to confirm required document structure and frontmatter fields.

2. Research "$ARGUMENTS" using WebSearch. Gather: what it is, key capabilities, use cases,
   how it relates to AI/ML if applicable, external references (at least one URL).
   If WebSearch is unavailable, scaffold based on available knowledge and note sources are unverified.

3. Choose the correct category directory:
   - ai-tools-and-services/ — tools, platforms, frameworks, libraries
   - cloud-ai-platforms/    — cloud provider AI services (AWS, GCP, Azure, etc.)
   - companies/             — companies as subjects (not their tools)

4. Create the filename: lowercase, hyphen-separated slug of the topic.
   Example: "Hugging Face Transformers" → "hugging-face-transformers.md"

5. Write the complete document to <category>/<slug>.md with this structure:
   - YAML frontmatter: title (string), date (today as YYYY-MM-DD), tags (list of normalized strings)
   - H1 heading matching the title field exactly
   - ## Summary section: 2-4 sentences describing what it is and why it matters
   - ## Content section: substantive content with subsections as needed
   - At least one ## References or ## External Links section with URLs

6. Apply tag normalization before writing. Every tag must pass:
   tag.toLowerCase().trim().replace(/\s+/g, '-')
   Do not write tags like "LLM", "Open Source", or "Machine Learning" — write "llm", "open-source", "machine-learning".

7. After writing, display the created file path and the resulting YAML frontmatter block.
