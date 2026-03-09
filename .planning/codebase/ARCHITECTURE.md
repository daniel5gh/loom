# Architecture

**Analysis Date:** 2026-03-09

## Pattern Overview

**Overall:** Content repository (documentation-only, no application code)

**Key Characteristics:**
- Pure Markdown document collection with no runtime, no build process, and no application code
- Flat-to-shallow directory hierarchy organized by research topic
- Standardized document template with YAML frontmatter for metadata
- Git-backed version control as the sole persistence and history mechanism
- Designed for single-user local access via file explorer or code editor

## Layers

**Meta Layer (Project Governance):**
- Purpose: Defines project purpose, standards, and agent guidelines for document creation
- Location: `/home/daniel/codes/loom/` (root)
- Contains: `PRD.md`, `AGENTS.md`, `INDEX.md`, `TEMPLATE.md`
- Depends on: Nothing
- Used by: Human author and AI agents when creating or organizing documents

**Content Layer (Research Documents):**
- Purpose: Stores all research documents organized by topic category
- Location: `/home/daniel/codes/loom/ai-tools-and-services/`, `/home/daniel/codes/loom/cloud-ai-platforms/`, `/home/daniel/codes/loom/companies/`
- Contains: Markdown files following `TEMPLATE.md` structure with YAML frontmatter (title, date, tags)
- Depends on: `TEMPLATE.md` for structure, `AGENTS.md` for content guidelines
- Used by: End user for research retrieval; searchable via editor "find in all files"

## Data Flow

**Document Creation:**

1. Author (human or AI agent) reads `TEMPLATE.md` for required structure and `AGENTS.md` for content guidelines
2. New `.md` file is created in the appropriate topic directory with YAML frontmatter (title, date, tags) and standardized sections (Summary, Content)
3. `INDEX.md` may be updated to reference the new document (currently partially maintained)
4. Document is committed to git for version history

**Document Retrieval:**

1. User opens project folder in file explorer or code editor
2. User navigates directory structure by topic, or uses "find in all files" search
3. YAML frontmatter tags provide additional discoverability metadata

**State Management:**
- No runtime state; all state is the file system itself
- Git provides version history and change tracking
- No database, cache, or external storage

## Key Abstractions

**Document Template:**
- Purpose: Enforces consistent structure across all research documents
- Definition: `TEMPLATE.md`
- Pattern: YAML frontmatter (title, date, tags) followed by Markdown body with Summary and Content sections

**Topic Categories:**
- Purpose: Logical grouping of research by subject area
- Examples: `ai-tools-and-services/`, `cloud-ai-platforms/`, `companies/`
- Pattern: Each category is a top-level directory containing related Markdown documents

**Index:**
- Purpose: Central navigation and project context document
- Definition: `INDEX.md`
- Pattern: Describes project purpose, links to key references, contains draft role definition

## Entry Points

**INDEX.md:**
- Location: `/home/daniel/codes/loom/INDEX.md`
- Triggers: User opening project for first time or seeking orientation
- Responsibilities: Provides project overview, structure description, references, and role definition draft

**AGENTS.md:**
- Location: `/home/daniel/codes/loom/AGENTS.md`
- Triggers: AI agent beginning work on the repository
- Responsibilities: Points to PRD for context; mandates use of `TEMPLATE.md`; defines content quality guidelines

**PRD.md:**
- Location: `/home/daniel/codes/loom/PRD.md`
- Triggers: Understanding project goals and constraints
- Responsibilities: Defines product vision, functional requirements, user stories, and success metrics

## Error Handling

**Strategy:** Not applicable -- no runtime code exists

**Patterns:**
- Document quality is enforced by convention (AGENTS.md guidelines) rather than automated validation
- No linting, CI, or automated checks on document content or structure

## Cross-Cutting Concerns

**Logging:** Not applicable (no application code)
**Validation:** Manual; relies on author adherence to `TEMPLATE.md` and `AGENTS.md` guidelines. No automated frontmatter or structure validation.
**Authentication:** Not applicable; single-user local repository with no access control beyond file system permissions
**Search:** Delegated to editor/OS "find in all files" capability; YAML tags in frontmatter aid discoverability but are not programmatically indexed

---

*Architecture analysis: 2026-03-09*
