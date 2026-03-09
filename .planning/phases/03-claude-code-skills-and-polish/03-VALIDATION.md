---
phase: 3
slug: claude-code-skills-and-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `assert` (no test runner) |
| **Config file** | none — tests run directly with `node` |
| **Quick run command** | `node src/lib/graph.test.mjs` |
| **Full suite command** | `npm run build && node src/lib/graph.test.mjs && node scripts/validate-output.mjs` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node src/lib/graph.test.mjs`
- **After every plan wave:** Run `npm run build && node src/lib/graph.test.mjs && node scripts/validate-output.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | REQ-016 | smoke | `node scripts/validate-output.mjs` (check for `astro-code` in HTML) | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | REQ-033 | smoke | `grep "box-shadow" public/styles/global.css` | manual-only | ⬜ pending |
| 3-01-03 | 01 | 1 | REQ-043 | manual | see manual table | N/A | ⬜ pending |
| 3-02-01 | 02 | 2 | REQ-050 | unit | `grep "name: loom:research" .claude/skills/research/SKILL.md` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | REQ-051 | unit | `grep "name: loom:organize" .claude/skills/organize/SKILL.md` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 2 | REQ-052 | unit | `grep "name: loom:validate" .claude/skills/validate/SKILL.md` | ❌ W0 | ⬜ pending |
| 3-02-04 | 02 | 2 | REQ-053 | unit | `grep "toLowerCase" .claude/skills/*/SKILL.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `scripts/validate-output.mjs` to check for `<pre class="astro-code">` in at least one built document page — covers REQ-016
- [ ] Skill file existence and `name:` field checks are fast shell commands; no new test framework needed

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/loom:research <topic>` creates valid document | REQ-050 | Claude Code skill invocation, no programmatic test | Run `/loom:research "test topic"` in Claude Code; verify file created in correct dir with proper frontmatter and normalized tags |
| `/loom:organize` reports tag issues | REQ-051 | LLM output evaluation required | Run `/loom:organize` in Claude Code; verify it lists actual tag inconsistencies in sample docs |
| `/loom:validate` reports frontmatter errors | REQ-052 | LLM output evaluation required | Run `/loom:validate` in Claude Code; introduce a doc with missing `title` field; verify it appears in report |
| Wrangler local preview | REQ-043 | Requires local server + browser | Run `npm run build && npx wrangler pages dev dist/`; open browser at localhost:8788; verify site loads |
| Syntax highlighting renders | REQ-016 | Visual check required | Load any doc with code blocks in local preview; verify tokens are colored matching neon theme (cyan keywords, green strings, magenta functions) |
| Glow effects on accent elements | REQ-033 | Visual check required | Hover tag pills and doc cards in browser; verify glow/bloom visible without WCAG contrast degradation on body text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
