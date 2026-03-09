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
| **Framework** | vitest (already in devDependencies) |
| **Config file** | vitest.config.ts or inline in vite config |
| **Quick run command** | `npm run build` (Astro build catches Shiki/config errors) |
| **Full suite command** | `npm run build && npx wrangler pages dev dist/ --port 8788 --once` |
| **Estimated runtime** | ~15 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npx wrangler pages dev dist/ --port 8788 --once`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | REQ-016 | build | `npm run build` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | REQ-033 | build | `npm run build` | ✅ | ⬜ pending |
| 3-01-03 | 01 | 1 | REQ-043 | manual | see manual table | N/A | ⬜ pending |
| 3-02-01 | 02 | 2 | REQ-050 | manual | see manual table | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | REQ-051 | manual | see manual table | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 2 | REQ-052 | manual | see manual table | ❌ W0 | ⬜ pending |
| 3-02-04 | 02 | 2 | REQ-053 | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.claude/skills/research/SKILL.md` — stub for REQ-050
- [ ] `.claude/skills/organize/SKILL.md` — stub for REQ-051
- [ ] `.claude/skills/validate/SKILL.md` — stub for REQ-052

*Wave 0 creates the skill files that later tasks will populate with full instructions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/research <topic>` creates valid document | REQ-050 | Claude Code skill invocation, no programmatic test | Run `/research "test topic"` in Claude Code; verify file created in correct dir with proper frontmatter and normalized tags |
| `/organize` reports tag issues | REQ-051 | LLM output evaluation required | Run `/organize` in Claude Code; verify it lists actual tag inconsistencies in sample docs |
| `/validate` reports frontmatter errors | REQ-052 | LLM output evaluation required | Run `/validate` in Claude Code; introduce a doc with missing `title` field; verify it appears in report |
| Wrangler local preview | REQ-043 | Requires local server + browser | Run `npm run build && npx wrangler pages dev dist/`; open browser at localhost:8787; verify site loads |
| Syntax highlighting renders | REQ-016 | Visual check required | Load any doc with code blocks in local preview; verify tokens are colored matching neon theme |
| Glow effects on accent elements | REQ-033 | Visual check required | Hover tag pills, doc cards, nav links in browser; verify glow/bloom without WCAG contrast degradation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
