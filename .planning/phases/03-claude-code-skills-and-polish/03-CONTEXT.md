# Phase 3: Claude Code Skills and Polish - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Three Claude Code slash commands enable AI-assisted document creation, organization, and validation for the Loom knowledge base. Visual polish completes the neon aesthetic with Shiki syntax highlighting and CSS glow/bloom effects on interactive elements.

</domain>

<decisions>
## Implementation Decisions

### Skill naming convention
- All skills use the `/loom:` namespace prefix
- Command names: `/loom:research`, `/loom:organize`, `/loom:validate`
- Skill directories: `.claude/skills/loom:research/` or `.claude/skills/research/` with name field set to `loom:research` in frontmatter

### Claude's Discretion
- /research skill: whether to do live web research or scaffold a template (researcher/planner to decide based on Claude Code skill capabilities)
- /organize: exact output format and level of granularity for tag audit report
- /validate: strictness on optional TEMPLATE.md sections
- Shiki theme selection (css-variables for palette integration vs named dark theme)
- Which interactive elements receive glow effects beyond tag pills and doc cards
- CSS glow intensity and spread values

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TagPill.astro`: Neon-cyan border/color pill — `.tag-pill` and `.tag-pill:hover` CSS rules exist in global.css; hover glow should extend this existing hover rule
- `DocCard.astro`: Card with `.doc-card:hover` border-color rule — hover glow extends this rule
- `TEMPLATE.md` (root): Frontmatter fields `title`, `date`, `tags` + H1/Summary/Content sections — skills must reference this file

### Established Patterns
- Vanilla CSS only, no Tailwind
- No TypeScript — plain JS throughout
- Neon palette via CSS custom properties: `--neon-cyan` (#00E5FF), `--neon-magenta` (#FF2D78), `--neon-green` (#39FF14)
- Tag normalization canonical rule: `tag.toLowerCase().trim().replace(/\s+/g, '-')` (already in `src/content/config.ts`)
- WCAG AA contrast required — glow via `box-shadow` on borders/elements only, never on body text

### Integration Points
- Skills live in `.claude/skills/<name>/SKILL.md` — no existing skills directory yet
- Shiki config goes in `astro.config.mjs` `markdown.shikiConfig` block
- CSS token variables (`--shiki-token-*`) map to existing neon palette in `public/styles/global.css`

</code_context>

<specifics>
## Specific Ideas

- Skills use `/loom:` prefix — this is the key naming decision from this discussion session
- Tag normalization rule is already canonical and must be mirrored verbatim in all skill instructions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-claude-code-skills-and-polish*
*Context gathered: 2026-03-09*
