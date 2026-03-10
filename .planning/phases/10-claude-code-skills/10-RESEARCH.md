# Phase 10: Claude Code Skills - Research

**Researched:** 2026-03-11
**Domain:** Claude Code slash command skills (SKILL.md format), URL fetching, frontmatter validation, tag manipulation, git automation
**Confidence:** HIGH

## Summary

Phase 10 adds four new Claude Code slash commands to wrap the fully functioning Loom system. The project already has three working skills from Phase 3 (`/loom:research`, `/loom:organize`, `/loom:validate`) — Phase 10 adds `/loom:add`, `/loom:deploy`, `/loom:retag`, and `/loom:gaps`. All skills follow the established pattern: a SKILL.md file in `.claude/skills/<name>/` with YAML frontmatter declaring name, description, allowed tools, and markdown instructions.

The skills in this phase are substantially more complex than the Phase 3 skills. `/loom:add` must fetch external URLs, summarize content, infer tags from the existing vocabulary, and write a well-formed document. `/loom:deploy` must orchestrate a pipeline — frontmatter validation, Ollama re-embedding, git commit, and push — and refuse to proceed if validation fails. `/loom:retag` must find-and-replace a tag across all markdown files. `/loom:gaps` must analyze tag frequency and produce structured recommendations.

**Primary recommendation:** Each skill is a standalone SKILL.md file. The skills themselves are prose instructions for Claude to follow — they are not scripts. The heavy lifting (validation, embedding, git) is done by Claude invoking `Bash` tool commands calling existing scripts (`validate`, `node scripts/embed.mjs`, `git`). No new Node.js scripts are required unless the planner determines a dedicated validation script is cleaner than inline Bash.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SKILL-01 | `/loom:add <url>` fetches URL, summarizes, creates formatted doc with inferred tags | WebFetch tool in allowed-tools; tag vocabulary extracted from existing docs; template.md in research skill provides doc format |
| SKILL-02 | `/loom:deploy` validates, re-embeds changed docs, commits embeddings.json, pushes | embed.mjs already callable via `node scripts/embed.mjs`; git commands available via Bash; validate logic can be done inline or via a dedicated script |
| SKILL-03 | `/loom:deploy` refuses and prints errors if any doc fails frontmatter check | Validation must run first and short-circuit; pattern: run validation, capture output, only continue on zero exit code |
| SKILL-04 | `/loom:retag <old> <new>` updates every doc using old tag to use new tag | Glob to find all markdown, Read each, string replace in tags array, Write back; gray-matter already installed for parsing |
| SKILL-05 | `/loom:gaps` lists tags with 1-2 docs, suggests research topics | Glob all docs, aggregate tag frequency map, filter thin tags, generate topic suggestions per tag |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | ^4.0.3 | Parse YAML frontmatter from markdown | Already used in embed.mjs; project dependency |
| node:fs | built-in | File read/write for skills using Bash | No install needed |
| git CLI | system | Commit and push from deploy skill | Bash tool has git:* permission |

### Claude Code Skill Toolset Available
Skills may declare these tools in `allowed-tools`:
| Tool | Use in Phase 10 |
|------|----------------|
| Read | Read markdown files for validation, retag, gaps |
| Write | Create new document (add skill), update documents (retag) |
| Glob | Find all *.md files across content dirs |
| Bash | Run embed.mjs, run git commands, run validate script |
| WebFetch | Fetch URL content for /loom:add |
| WebSearch | Fallback if WebFetch unavailable |

**No new npm packages required.** gray-matter, ollama, and umap-js are already in package.json.

### Content Directory Layout (established)
```
ai-tools-and-services/   # tools, platforms, frameworks, libraries
cloud-ai-platforms/      # cloud provider AI services (AWS, GCP, Azure)
companies/               # companies as subjects (not their tools)
```

All three dirs are walked by `readDocs()` in embed.mjs using `CONTENT_DIRS` constant.

## Architecture Patterns

### Skill File Structure
```
.claude/skills/
├── add/
│   └── SKILL.md          # /loom:add skill
├── deploy/
│   └── SKILL.md          # /loom:deploy skill
├── retag/
│   └── SKILL.md          # /loom:retag skill
├── gaps/
│   └── SKILL.md          # /loom:gaps skill
├── research/             # existing from Phase 3
│   ├── SKILL.md
│   └── template.md
├── organize/             # existing from Phase 3
│   └── SKILL.md
└── validate/             # existing from Phase 3
    └── SKILL.md
```

### Pattern 1: Skill YAML Frontmatter
Every skill starts with a YAML block. All four new skills follow this pattern exactly:

```yaml
---
name: loom:add
description: Fetch a URL and create a new Loom knowledge base document
argument-hint: "<url>"
disable-model-invocation: true
allowed-tools: Read, Write, Glob, WebFetch, WebSearch, Bash
---
```

Key fields:
- `name`: matches the slash command (e.g., `loom:add` → `/loom:add`)
- `disable-model-invocation: true`: skill runs in current conversation, not a subagent
- `allowed-tools`: whitelist of tools Claude may use when executing the skill
- `argument-hint`: shown in autocomplete (optional but good practice)

### Pattern 2: /loom:add — URL Fetch and Document Creation
**What:** Fetch URL with WebFetch, extract title + content, summarize, infer tags from existing vocabulary, write to correct category dir
**When to use:** Operator has a URL to capture into the knowledge base

Key behaviors:
1. Use WebFetch to retrieve the URL and extract title, summary, key concepts
2. Read existing tags from all docs (Glob + Read frontmatter) to build vocabulary
3. Infer 3-6 tags from existing vocabulary that match the content
4. Determine category from content type (tool/framework → ai-tools-and-services, cloud service → cloud-ai-platforms, company → companies)
5. Create slug from title (lowercase, hyphen-separated)
6. Write to `<category>/<slug>.md` with full template structure
7. DO NOT commit (per SKILL-01: "file is created but not committed")

Tag normalization rule (established in all Phase 3 skills):
```
tag.toLowerCase().trim().replace(/\s+/g, '-')
```

### Pattern 3: /loom:deploy — Pipeline Orchestration
**What:** Validate → embed → commit → push, with hard stop if validation fails
**Sequence:**
1. Run frontmatter validation across all docs (Bash, read and check each file)
2. If any errors → print them, stop (do not proceed to embed or commit)
3. Run `node scripts/embed.mjs` to re-embed any changed docs
4. Stage `src/data/embeddings.json`: `git add src/data/embeddings.json`
5. Check if there are staged changes: `git diff --cached --quiet` (exit 0 = nothing to commit)
6. If changes: `git commit -m "chore: update embeddings"`, then `git push`
7. Report result to user

**Validation approach:** The skill can do inline validation (Glob all docs, Read each, check frontmatter) rather than calling a separate script — this avoids needing a new standalone validate script. But if planner prefers separation of concerns, a `scripts/validate-docs.mjs` script is a clean option.

**Git commands needed** (Bash has `git:*` permission per settings.local.json):
```bash
git add src/data/embeddings.json
git diff --cached --quiet
git commit -m "chore: update embeddings [skip ci]"
git push
```

**Ollama dependency:** embed.mjs uses remote Ollama at `http://10.0.1.3:11434`. If Ollama is unreachable, embed.mjs exits non-zero with a clear error. The deploy skill should surface this error and stop.

### Pattern 4: /loom:retag — Tag Find-and-Replace
**What:** Replace `<old>` tag with `<new>` tag (or add `<new>` if splitting) across all documents
**When to use:** Merging duplicate tags OR splitting an overly broad tag into two

Two modes from SKILL-04:
- **Merge**: `/loom:retag old-tag new-tag` — replace every occurrence of `old-tag` with `new-tag`
- **Split**: implied — the skill instructions should note that adding a second `<new>` argument enables split mode where `old-tag` is replaced with both tags

Implementation approach:
1. Glob all *.md files in all three content dirs
2. For each file: Read content, parse YAML frontmatter (read the tags array)
3. If `old` tag is in the tags array: replace it with `new` tag(s), apply normalization, deduplicate
4. Write the updated file back (preserve all content below frontmatter)
5. Report which files were modified

**String replacement strategy:** The skill instructions should tell Claude to use Read/Write with careful frontmatter rewriting. Since gray-matter is not available in Claude Code tool context (only Bash), the simplest approach is:
- Read file, identify the `tags:` line in frontmatter
- Replace the tag string directly using string manipulation
- Write back the file

Alternatively, instructions can tell Claude to run a short inline Node.js script via Bash that uses gray-matter for clean parsing. This is more reliable for edge cases (multi-line tag arrays, YAML quirks).

### Pattern 5: /loom:gaps — Tag Coverage Analysis
**What:** Find tags with 1-2 documents, suggest research topics for each thin area
**Output:** Structured list of thin tags + suggested research directions

Implementation:
1. Glob all docs, Read each, extract tags arrays
2. Build tag → [document titles] map
3. Filter to tags where count <= 2
4. For each thin tag: output the tag name, list the 1-2 docs that use it, and suggest 2-3 related topics to research
5. Use Claude's knowledge to suggest research topics (no external search needed)

### Anti-Patterns to Avoid
- **Committing the new file in /loom:add**: SKILL-01 explicitly requires the file is created but NOT committed. The skill must not run any `git add` or `git commit`.
- **Deploying despite validation errors in /loom:deploy**: SKILL-03 requires a hard stop. Skill instructions must make this a named explicit check with conditional exit.
- **Using global tag replace without normalization in /loom:retag**: New tags must pass the normalization rule. Instructions must include the normalization step.
- **Inventing new tags in /loom:add**: SKILL-01 says tags must be "drawn from the existing tag vocabulary." The skill must read existing tags before inferring, not freestyle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL content extraction | Custom HTML parser | WebFetch tool | Claude Code has WebFetch built-in; it handles redirects, encoding, markdown conversion |
| Markdown frontmatter parsing | Custom YAML parser | gray-matter (already installed) via Bash | gray-matter handles multi-line values, arrays, edge cases; already in package.json |
| Embedding re-run | Inline Ollama calls | `node scripts/embed.mjs` (existing) | embed.mjs already handles incremental caching, atomic writes, Ollama health check |
| Frontmatter validation | Duplicate logic | Inline in skill instructions OR extract to `scripts/validate-docs.mjs` | validate-output.mjs validates built output; a doc-level validator belongs in scripts/ for reuse |
| Git operations | Custom git wrapper | `git` CLI via Bash | Bash tool has `git:*` permission; no wrapper needed |

**Key insight:** Skills are prose instructions for Claude — they orchestrate existing tools and scripts rather than implementing logic. The project already has embed.mjs (pipeline), gray-matter (parsing), and git CLI access. The skills wire these together.

## Common Pitfalls

### Pitfall 1: WebFetch vs WebSearch for /loom:add
**What goes wrong:** If `WebFetch` is not in `allowed-tools`, the skill falls back to WebSearch which returns snippets, not full content — leading to thin summaries
**Why it happens:** Allowed-tools whitelist is easy to omit tools from
**How to avoid:** Include `WebFetch` AND `WebSearch` in allowed-tools (WebSearch as fallback if WebFetch fails for paywalled/auth-required URLs)
**Warning signs:** Summaries that are too generic, no URL-specific content

### Pitfall 2: /loom:deploy commits ALL staged changes
**What goes wrong:** If operator has other staged files when they run deploy, those get included in the embeddings commit
**Why it happens:** `git commit` commits all staged files by default
**How to avoid:** Skill instructions should: (1) only `git add src/data/embeddings.json` explicitly, (2) check `git status --porcelain` for other staged files and warn the user before committing
**Warning signs:** Unexpected files in commit

### Pitfall 3: /loom:retag breaks YAML multi-line arrays
**What goes wrong:** Tags stored as YAML block sequences (using `-` per line) vs inline arrays (`[tag1, tag2]`) require different string replacement patterns
**Why it happens:** YAML supports both formats; the project uses inline `[tag1, tag2]` format but there is no enforcement
**How to avoid:** Skill instructions should use a small inline Node.js script via Bash with gray-matter to parse and reserialize frontmatter — handles both YAML formats correctly
**Warning signs:** Files where tags disappear or become malformed after retag

### Pitfall 4: /loom:add category inference is ambiguous
**What goes wrong:** A URL about "AWS Bedrock" could be category `cloud-ai-platforms` (AWS) or `ai-tools-and-services` (it's also an AI service). Claude guesses wrong.
**Why it happens:** Category distinctions are nuanced
**How to avoid:** Skill instructions should include explicit decision rules matching the research skill: "cloud provider AI services (AWS, GCP, Azure) → cloud-ai-platforms; companies as subjects → companies; everything else → ai-tools-and-services"
**Warning signs:** Documents in wrong category dir

### Pitfall 5: /loom:deploy with no changed docs still tries to commit
**What goes wrong:** If embed.mjs runs but all docs were cache hits, embeddings.json is unchanged. `git add` + `git commit` fails with "nothing to commit" exit code 1 — skill reports failure even though everything is fine.
**Why it happens:** `git commit` exits 1 when there's nothing to commit
**How to avoid:** After `git add`, check `git diff --cached --quiet` exit code before committing. Exit 0 = no changes = skip commit step and report "embeddings up to date"
**Warning signs:** False failure messages when corpus hasn't changed

### Pitfall 6: Tag inference in /loom:add invents new tags
**What goes wrong:** Claude creates new tags ("generative-ai", "transformer") not in the existing vocabulary, leading to tag proliferation
**Why it happens:** Claude defaults to generating descriptive tags rather than matching existing ones
**How to avoid:** Skill instructions must say: "ONLY use tags from the existing vocabulary. Build the vocabulary list by reading all documents first. If no existing tag fits, use the closest match."
**Warning signs:** New tags that appear on only one document

## Code Examples

### Skill YAML Frontmatter Pattern
```yaml
# Source: established pattern from .claude/skills/research/SKILL.md
---
name: loom:deploy
description: Validate documents, re-embed changed docs, commit and push
disable-model-invocation: true
allowed-tools: Read, Glob, Bash
---
```

### Git Sequence for /loom:deploy
```bash
# Source: git CLI, Bash tool (git:* permission in settings.local.json)

# 1. Run embed pipeline
node scripts/embed.mjs

# 2. Stage only embeddings.json
git add src/data/embeddings.json

# 3. Check if anything actually changed
git diff --cached --quiet
# exit 0 = no changes; exit 1 = changes staged

# 4. Commit and push (only if exit code was 1 above)
git commit -m "chore: update embeddings"
git push
```

### Frontmatter Validation Pattern (inline in skill)
```javascript
// Source: pattern from scripts/embed.mjs readDocs() and .claude/skills/validate/SKILL.md
// For each .md file:
// - Check file starts with "---"
// - Check title: non-empty string
// - Check date: matches /^\d{4}-\d{2}-\d{2}$/
// - Check tags: array exists (may be empty)
// - Check H1 heading exists
// - Check ## Summary section exists
// - Check ## Content section exists
```

### Tag Manipulation via gray-matter (Bash inline Node)
```bash
# Source: gray-matter docs; gray-matter@^4.0.3 already in package.json
node -e "
const matter = require('./node_modules/gray-matter');
const fs = require('fs');
const raw = fs.readFileSync('path/to/file.md', 'utf8');
const parsed = matter(raw);
// Replace tag in array
parsed.data.tags = parsed.data.tags.map(t => t === 'old-tag' ? 'new-tag' : t);
// Reserialize
const output = matter.stringify(parsed.content, parsed.data);
fs.writeFileSync('path/to/file.md', output);
"
```

Note: The require path must be `./node_modules/gray-matter` when invoked from the project root, since inline `node -e` scripts don't resolve bare specifiers via package.json `type: module`.

Alternatively, the skill instructions can tell Claude to use Write tool after building the new content string manually — simpler but requires careful YAML handling.

### Tag Frequency Map for /loom:gaps
```javascript
// Source: derived from embed.mjs readDocs() pattern
// Build: { tagName: [doc1, doc2, ...] }
// Filter: entries where value.length <= 2
// Output: formatted markdown table
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual document creation | /loom:research skill (Phase 3) | Phase 3 (v1.0) | Creates formatted docs from topic prompt |
| Manual validation | /loom:validate skill (Phase 3) | Phase 3 (v1.0) | Reports frontmatter/template errors |
| Manual embed.mjs invocation | /loom:deploy skill (this phase) | Phase 10 | Orchestrates full pipeline in one command |
| Manual URL-to-doc workflow | /loom:add skill (this phase) | Phase 10 | Captures external content automatically |

**Established project patterns:**
- `disable-model-invocation: true` on all skills (avoids subagent spawning)
- Tag normalization enforced in skill instructions (matches Zod transform in config.ts)
- Skills do NOT modify files without being instructed to (validate/organize are read-only)
- Bash tool available with `git:*` permission (settings.local.json)

## Open Questions

1. **Validation script: inline in skill vs dedicated script**
   - What we know: /loom:deploy needs to validate all docs before deploying; existing validate-output.mjs validates built output (wrong tool)
   - What's unclear: Should a new `scripts/validate-docs.mjs` be created for reuse, or should /loom:deploy contain inline validation logic in its SKILL.md instructions?
   - Recommendation: Create `scripts/validate-docs.mjs` that exits 0 on success, exits 1 with printed errors on failure — deploy skill then just runs `node scripts/validate-docs.mjs` via Bash. Cleaner separation, testable.

2. **gray-matter for /loom:retag: inline node -e vs Bash script**
   - What we know: gray-matter is installed; require() works in CJS context; package.json has `"type": "module"` (ESM)
   - What's unclear: `node -e "require('./node_modules/gray-matter')"` works in ESM projects but is fragile
   - Recommendation: Skill instructions should tell Claude to use Write tool with direct string manipulation for the simple case, and fall back to a `node --input-type=commonjs` or a small CJS helper if YAML format is complex

3. **Ollama remote host in /loom:deploy**
   - What we know: embed.mjs hardcodes `http://10.0.1.3:11434` (LAN Ollama); assertOllamaRunning() exits loudly if unreachable
   - What's unclear: Should deploy skill check Ollama availability before running embed.mjs, or let embed.mjs handle it?
   - Recommendation: Let embed.mjs handle it (it already asserts Ollama running). Deploy skill just runs embed.mjs and surfaces any non-zero exit.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, no install needed) |
| Config file | none — tests are standalone .mjs files |
| Quick run command | `node scripts/validate-docs.test.mjs` |
| Full suite command | `node scripts/embed.test.mjs && node scripts/validate-docs.test.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKILL-01 | `/loom:add` creates file with correct frontmatter structure | manual-only | N/A — skill behavior depends on Claude + WebFetch; not automatable | N/A |
| SKILL-02 | `/loom:deploy` runs embed.mjs, commits, pushes | manual-only | N/A — requires live Ollama + git remote | N/A |
| SKILL-03 | `/loom:deploy` stops on validation error | unit (validation logic) | `node scripts/validate-docs.test.mjs` | ❌ Wave 0 |
| SKILL-04 | `/loom:retag` updates tags across all docs | manual-only | N/A — skill behavior tested by inspection | N/A |
| SKILL-05 | `/loom:gaps` identifies thin-coverage tags | unit (tag frequency logic) | `node scripts/gaps.test.mjs` | ❌ Wave 0 |

**Manual-only justification:** Skills SKILL-01, SKILL-02, SKILL-04 are prose instructions executed by Claude. Their correctness depends on Claude's tool invocations (WebFetch, Bash, Write) in a live session. The only automatable behavior is the underlying logic extracted into testable scripts (validate-docs.mjs, gaps analysis).

### Sampling Rate
- **Per task commit:** `node scripts/validate-docs.test.mjs` (if validate-docs.mjs is created)
- **Per wave merge:** `node scripts/embed.test.mjs && node scripts/validate-docs.test.mjs`
- **Phase gate:** Both test files green + human verification of all four skills before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `scripts/validate-docs.test.mjs` — covers SKILL-03 validation logic (stub pattern like embed.test.mjs)
- [ ] `scripts/validate-docs.mjs` — the validate script itself (tested by above)

*If validate-docs.mjs is NOT created as a separate script (validation done inline in skill), then no test scaffolding is needed for SKILL-03 — it becomes manual-only like the other skill behaviors.*

## Sources

### Primary (HIGH confidence)
- Project codebase — `.claude/skills/*/SKILL.md` (three existing skills examined directly)
- Project codebase — `scripts/embed.mjs` (full embed pipeline read)
- Project codebase — `src/content/config.ts` (Zod schema and tag normalization confirmed)
- Project codebase — `.claude/settings.local.json` (Bash tool permissions confirmed: `git:*`)
- Project codebase — `package.json` (gray-matter, ollama, umap-js confirmed installed)

### Secondary (MEDIUM confidence)
- Claude Code skill format — YAML frontmatter fields (`name`, `description`, `allowed-tools`, `disable-model-invocation`) confirmed by three working examples in project
- gray-matter v4 — require() usage confirmed by existing embed.mjs import pattern

### Tertiary (LOW confidence)
- `node -e` with require() in ESM project — standard Node.js behavior but edge cases around module resolution in ESM projects should be validated during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in package.json; skill format confirmed by three working examples
- Architecture: HIGH — clear precedent from Phase 3 skills; deploy pipeline maps directly to existing embed.mjs
- Pitfalls: HIGH for deploy/retag (concrete edge cases from git and YAML behavior); MEDIUM for /loom:add (URL fetch behavior depends on site structure)

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable domain — Claude Code skill format, git CLI, gray-matter are stable)
