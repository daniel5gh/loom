# Loom

## What This Is

A personal knowledge management system that combines a tagged markdown document repository with a static website for visualization and navigation. The repo contains AI research documents in a structured markdown format (with YAML frontmatter tags), Claude Code skills for managing those documents, and a static site generator that produces an interactive website with tag-based navigation, relationship graph visualization, and a dark hacker aesthetic with neon accents.

## Core Value

Turn a flat collection of tagged markdown documents into a navigable, visual knowledge graph — making connections between research topics discoverable at a glance.

## Current Milestone: v1.1 Visualization

**Goal:** Transform the site into an immersive cyberpunk knowledge terminal — semantic embedding map, terminal-style search and keyboard navigation, timeline scrubbing, and AI-powered content management skills.

**Target features:**
- Embedding similarity map (Ollama + nomic-embed-text + UMAP/t-SNE) replacing force-directed graph
- Tag/search filter lenses with ANY/ALL toggle, composable with timeline
- Timeline slider with gaussian opacity and play button
- Terminal-style `/` search from anywhere
- Home page with search prompt and recently added articles
- Vim-style keyboard navigation (j/k, Enter, /, Esc) with status bar
- Cyberpunk aesthetic: scanlines, CRT overlay, typewriter effects, ASCII dividers
- New skills: `/loom:add` (URL → article), `/loom:deploy` (validate + embed + push), `/loom:retag`, `/loom:gaps`

## Requirements

### Validated

- Markdown documents with YAML frontmatter (title, date, tags) — existing
- Logical directory organization by topic category — existing
- Document template (`TEMPLATE.md`) defining standard structure — existing
- 15 research documents across 3 categories — existing
- ✓ Static site generation from markdown documents — v1.0 Phase 1
- ✓ Tag-based filtering and navigation — v1.0 Phase 1
- ✓ Interactive force-directed graph showing document relationships — v1.0 Phase 2
- ✓ Dark/neon hacker aesthetic — v1.0 Phases 1-3
- ✓ Cloudflare Pages deployment with auto-deploy — v1.0 Phase 1
- ✓ Claude Code skills: /loom:research, /loom:organize, /loom:validate — v1.0 Phase 3
- ✓ Frontmatter processing pipeline (tags, index, relationships) — v1.0 Phases 1-2

### Active

- [ ] Embedding similarity map (Ollama + nomic-embed-text + UMAP/t-SNE, offline pipeline)
- [ ] Map filter lenses: tag filter + search filter, ANY/ALL toggle, composable
- [ ] Timeline slider with gaussian opacity curve, play button, composable with filters
- [ ] Terminal-style `/` search overlay from any page
- [ ] Home page with search prompt and recently added articles
- [ ] Vim-style keyboard navigation across all pages with status bar
- [ ] Cyberpunk aesthetic enhancements: scanlines, CRT overlay, typewriter effects, ASCII dividers
- [ ] /loom:add skill: fetch URL, summarize, create document with inferred tags/category
- [ ] /loom:deploy skill: validate + re-embed changed docs + commit + push
- [ ] /loom:retag skill: merge or split tags across all documents
- [ ] /loom:gaps skill: identify thin-coverage tags, suggest research topics

### Out of Scope

- Multi-user collaboration — single user only
- Server-side processing — static site only
- Full-text search engine — browser-native search or simple client-side filter is sufficient for v1
- Mobile-optimized layout — desktop-first personal tool
- CMS or admin interface — documents managed via git and Claude Code skills

## Context

The repo already contains 15 research documents about AI tools, cloud platforms, and companies. Documents use YAML frontmatter with `title`, `date`, and `tags` fields. The existing PRD described a simple file-based research collection with no UI — this project evolves it into a visual knowledge base.

Current document categories:
- `ai-tools-and-services/` — LangChain, LlamaIndex, LiteLLM, OpenRouter, n8n, etc.
- `cloud-ai-platforms/` — Azure Foundry AI, Google Vertex AI, AWS SageMaker, comparison doc
- `companies/` — AI Foundry

Known issues from codebase mapping:
- Some documents don't follow TEMPLATE.md structure (pageindex, lovable, airllm, langflow)
- YAML frontmatter errors in airllm.md and langflow.md (leading space before `date:`)
- INDEX.md is stale and has broken links
- No .gitignore file
- Tags are inconsistently applied with no browsing mechanism (the website solves this)

## Constraints

- **Static only**: No server-side code — everything runs client-side or at build time
- **Existing content**: Must work with the current markdown format and frontmatter schema
- **Deployment**: Cloudflare Pages (learning opportunity, free tier)
- **AI skills**: Claude Code slash commands (not external scripts or APIs)
- **Aesthetic**: Dark theme with neon accents, rich interactive visualizations — not a plain terminal emulator

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site generator TBD | Need one that handles markdown well and supports interactive JS components (for graph viz) | — Pending |
| Cloudflare Pages for hosting | Free, fast CDN, good developer experience, learning opportunity | — Pending |
| Graph visualization library TBD | Need interactive node-link diagram for tag relationships | — Pending |
| Claude Code skills for AI | Already using Claude Code for development, natural fit for document management | — Pending |

---
*Last updated: 2026-03-10 after v1.1 milestone start*
