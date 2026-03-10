---
name: loom:add
description: Fetch a URL and create a new Loom knowledge base document
argument-hint: "<url>"
disable-model-invocation: true
allowed-tools: Read, Write, Glob, WebFetch, WebSearch, Bash
---

# /loom:add

Fetch "$ARGUMENTS" and create a new Loom knowledge base document.

## Tag normalization rule (REQUIRED)
Tag normalization is REQUIRED: tag.toLowerCase().trim().replace(/\s+/g, '-')
- "Machine Learning" → "machine-learning"
- "LLM" → "llm"
- "Open Source" → "open-source"
- "API" → "api"

## Steps

1. **Fetch the URL** using WebFetch with `$ARGUMENTS` as the URL. Extract: page title, main content,
   and key concepts. If WebFetch fails (paywall, auth error, or timeout), fall back to WebSearch
   using the URL as the query string to obtain a summary of the page content.

2. **Build the existing tag vocabulary.** Glob all `*.md` files in these three directories:
   - `ai-tools-and-services/`
   - `cloud-ai-platforms/`
   - `companies/`
   Read each file and collect all unique tag values from the YAML frontmatter `tags` field into
   a vocabulary list.

3. **Infer tags.** Select 3-6 tags from the vocabulary list that best match the fetched content.
   ONLY use tags from the existing vocabulary. Do NOT invent new tags. If no existing tag fits
   precisely, use the closest match from the vocabulary. Apply normalization to every tag:
   tag.toLowerCase().trim().replace(/\s+/g, '-')

4. **Choose the category directory** using these exact rules:
   - `cloud-ai-platforms/` — content primarily about a cloud provider AI service (AWS Bedrock,
     GCP Vertex AI, Azure AI, Google Cloud AI, Microsoft Azure AI)
   - `companies/` — content about a company as a subject (company profile, funding round,
     acquisition news)
   - `ai-tools-and-services/` — everything else (tools, frameworks, libraries, models, APIs,
     platforms, research papers)

5. **Create the filename.** Derive a lowercase, hyphen-separated slug from the page title.
   Remove special characters, collapse spaces to hyphens.
   Example: "Anthropic Claude 3.5 Sonnet" → "anthropic-claude-35-sonnet.md"

6. **Write the document** to `<category>/<slug>.md` with this exact structure:
   ```
   ---
   title: <string — must match H1 heading exactly>
   date: <today as YYYY-MM-DD>
   tags: [<tag1>, <tag2>, ...]
   ---
   # <title>

   ## Summary
   2-4 sentences describing what it is and why it matters for AI/ML practitioners.

   ## Content
   Substantive content with subsections as needed.

   ## References
   - <source URL>
   ```

7. **Do NOT run any git commands. No git add, no git commit.** The file is created on disk only.
   Do not stage or commit the file at any point during this skill's execution.

8. **Display a completion message** showing:
   - The created file path (relative to repo root)
   - The full YAML frontmatter block
   - The message: "File created (not committed). Run /loom:deploy when ready to publish."
