# Codebase Structure

**Analysis Date:** 2026-03-09

## Directory Layout

```
loom/
├── ai-tools-and-services/  # Research on AI tools, frameworks, and services
├── cloud-ai-platforms/      # Research on cloud AI/ML platforms (Azure, AWS, GCP)
├── companies/               # Research on specific companies
├── .planning/               # GSD planning and codebase analysis (not content)
│   └── codebase/            # Codebase mapping documents
├── AGENTS.md                # AI agent guidelines and document standards
├── INDEX.md                 # Project overview, navigation, and role definition
├── PRD.md                   # Product Requirements Document
└── TEMPLATE.md              # Standard template for all research documents
```

## Directory Purposes

**ai-tools-and-services/:**
- Purpose: Research documents about AI development tools, frameworks, and services
- Contains: Markdown files, one per tool/service
- Key files: `langchain.md`, `llamaindex.md`, `litellm.md`, `openrouter.md`, `n8n.md`, `lovable.md`, `langflow.md`, `airllm.md`, `weaviate.md`, `pageindex.md`

**cloud-ai-platforms/:**
- Purpose: Research documents about major cloud provider AI/ML platforms
- Contains: Individual platform documents plus a comparison document
- Key files: `azure-foundry-ai.md`, `google-vertex-ai.md`, `aws-sagemaker-ai.md`, `cloud-ai-platforms-comparison.md`

**companies/:**
- Purpose: Research documents about specific companies in the AI space
- Contains: One Markdown file per company
- Key files: `ai-foundry.md`

**Root files:**
- Purpose: Project governance, navigation, and document standards
- Contains: Meta-documents that guide the project itself (not research content)
- Key files: `AGENTS.md`, `INDEX.md`, `PRD.md`, `TEMPLATE.md`

## Key File Locations

**Entry Points:**
- `INDEX.md`: Start here for project orientation, structure overview, and references
- `AGENTS.md`: Start here when acting as an AI agent contributing to the repo

**Configuration:**
- `TEMPLATE.md`: Defines the required structure for all new research documents
- `PRD.md`: Defines project goals, requirements, and constraints

**Core Content:**
- `ai-tools-and-services/*.md`: All AI tool/service research
- `cloud-ai-platforms/*.md`: All cloud platform research
- `companies/*.md`: All company research

## Naming Conventions

**Files:**
- Lowercase with hyphens (kebab-case): `langchain.md`, `azure-foundry-ai.md`, `ai-foundry.md`
- Root meta-files use UPPERCASE: `AGENTS.md`, `INDEX.md`, `PRD.md`, `TEMPLATE.md`
- All research documents use `.md` extension

**Directories:**
- Lowercase with hyphens (kebab-case): `ai-tools-and-services/`, `cloud-ai-platforms/`
- Named by topic category, not by document type

**Document Titles (in frontmatter):**
- Title Case: `title: LangChain Overview`, `title: Cloud AI Platforms Comparison`

## Where to Add New Code

**New Research Document (existing category):**
- Place in the matching topic directory: `ai-tools-and-services/`, `cloud-ai-platforms/`, or `companies/`
- Use `TEMPLATE.md` structure: YAML frontmatter with title, date, tags, then Summary and Content sections
- Name file in kebab-case: `{topic-name}.md`

**New Research Document (new category):**
- Create a new top-level directory in kebab-case: e.g., `agent-frameworks/`
- Add research documents following `TEMPLATE.md`
- Consider updating `INDEX.md` to reference the new category

**New Meta/Governance Document:**
- Place in root directory with UPPERCASE name: e.g., `GLOSSARY.md`

**Comparison or Cross-Cutting Document:**
- Place in the most relevant topic directory
- Follow the pattern of `cloud-ai-platforms/cloud-ai-platforms-comparison.md`

## Special Directories

**.planning/:**
- Purpose: GSD planning artifacts and codebase analysis documents
- Generated: Yes (by GSD tooling)
- Committed: Yes

**.git/:**
- Purpose: Git version control data
- Generated: Yes
- Committed: No (internal to git)

---

*Structure analysis: 2026-03-09*
