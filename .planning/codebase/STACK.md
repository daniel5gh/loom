# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- Markdown (.md) - All content and documentation

**Secondary:**
- YAML (frontmatter only) - Document metadata in frontmatter blocks

## Runtime

**Environment:**
- No runtime - This is a pure documentation/content repository with no executable code

**Package Manager:**
- None - No package management required
- Lockfile: Not applicable

## Frameworks

**Core:**
- None - Plain Markdown files managed via filesystem and Git

**Testing:**
- None - No test framework; no executable code to test

**Build/Dev:**
- None - No build step required

## Key Dependencies

**Critical:**
- Git - Version control for the document collection
- Any Markdown-capable editor (e.g., VS Code) - For authoring and searching documents

**Infrastructure:**
- None - No external packages or libraries

## Configuration

**Environment:**
- No environment variables required
- No `.env` files present
- No secrets or credentials needed

**Build:**
- No build configuration
- `.gitignore` not present at root level

## Content Structure

This repository is a **documentation-only project** -- a curated collection of AI/agent research documents. There is no application code, no package manifests, no CI/CD, and no deployment target.

**Key organizational files:**
- `PRD.md`: Product Requirements Document defining the project scope
- `AGENTS.md`: Guidelines for AI agents contributing to the repository
- `TEMPLATE.md`: Standard Markdown template with YAML frontmatter (title, date, tags)
- `INDEX.md`: Living index and reference hub

**Content directories:**
- `ai-tools-and-services/`: Research documents on AI tools (LangChain, LlamaIndex, n8n, etc.)
- `cloud-ai-platforms/`: Research on cloud AI platforms (AWS SageMaker, Azure Foundry, Google Vertex)
- `companies/`: Company-specific research documents

## Platform Requirements

**Development:**
- Any operating system with a text editor and Git
- Markdown preview capability recommended (VS Code, Obsidian, etc.)

**Production:**
- Local filesystem storage only (per PRD: no cloud or external storage by default)
- Single-user access model

---

*Stack analysis: 2026-03-09*
