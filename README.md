# Loom

A personal knowledge management system: a tagged markdown document repository combined with an Astro static site that renders an interactive D3 knowledge graph. Documents are organized by topic, linked by shared tags, and browsable as a visual graph. The site deploys automatically to Cloudflare Pages at https://loom-7kv.pages.dev.

## Tech stack

- Astro 5 (static site generator)
- D3.js 7 (SVG graph visualization)
- Vanilla CSS with dark/neon aesthetic
- Shiki (syntax highlighting via Astro built-in)
- Cloudflare Pages (hosting)
- Node 22 (pinned via `.node-version`)

## Content structure

Documents live in three collections at the repo root:

- `ai-tools-and-services/` — LLM frameworks, orchestration tools, API gateways
- `cloud-ai-platforms/` — Cloud provider AI offerings and comparisons
- `companies/` — AI company profiles

Each document is a markdown file with YAML frontmatter:

```yaml
---
title: "Document Title"
date: "2025-01-01"
tags: ["tag-one", "tag-two"]
---
```

See `TEMPLATE.md` for the standard document structure.

## Local development

1. Check Node version — must be 22+ (uses `.node-version`; install [fnm](https://github.com/Schniz/fnm) if needed):
   ```bash
   node --version
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server at http://localhost:4321:
   ```bash
   npm run dev
   ```
4. Production build into `dist/`:
   ```bash
   npm run build
   ```
5. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Claude Code skills

Three `/loom:` slash commands are available when using Claude Code:

- `/loom:research <topic>` — Research a topic and create a new document following `TEMPLATE.md`
- `/loom:validate` — Report-only check of all documents for frontmatter compliance and tag consistency (does not modify files)
- `/loom:organize` — Report-only analysis of document organization and tag patterns (does not modify files)

## Adding a document

Two options:

**Option A — Use Claude Code:**
```
/loom:research <topic>
```

**Option B — Manual:**
Copy `TEMPLATE.md`, fill in the frontmatter and content, and place it in the appropriate collection directory.

## Deployment

Cloudflare Pages auto-deploys from the `master` branch. Production URL: https://loom-7kv.pages.dev
