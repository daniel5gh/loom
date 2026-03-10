---
phase: 8
slug: global-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) |
| **Config file** | none — Wave 0 creates test files |
| **Quick run command** | `node --test test/shell.test.mjs` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/shell.test.mjs`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 0 | SHELL-02 | unit | `node --test test/shell.test.mjs` | ❌ W0 | ⬜ pending |
| 8-01-02 | 01 | 0 | AESTH-04 | unit | `node --test test/contrast.test.mjs` | ❌ W0 | ⬜ pending |
| 8-02-01 | 02 | 1 | AESTH-01 | manual | — | N/A | ⬜ pending |
| 8-02-02 | 02 | 1 | AESTH-02 | manual | — | N/A | ⬜ pending |
| 8-02-03 | 02 | 1 | AESTH-03 | manual | — | N/A | ⬜ pending |
| 8-03-01 | 03 | 1 | SHELL-01 | manual | — | N/A | ⬜ pending |
| 8-03-02 | 03 | 1 | SHELL-02 | unit | `node --test test/shell.test.mjs` | ❌ W0 | ⬜ pending |
| 8-03-03 | 03 | 1 | SHELL-03 | manual | — | N/A | ⬜ pending |
| 8-03-04 | 03 | 1 | SHELL-06 | manual | — | N/A | ⬜ pending |
| 8-04-01 | 04 | 2 | SHELL-04 | manual | — | N/A | ⬜ pending |
| 8-04-02 | 04 | 2 | SHELL-05 | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/shell.test.mjs` — Fuse.js multi-key search returns expected results for sample queries (SHELL-02)
- [ ] `test/contrast.test.mjs` — Verifies all aesthetic colors meet 4.5:1 WCAG AA against `--bg-base` (AESTH-04)

*No framework install needed — Node 18+ built-in `--test` runner is available.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/` opens overlay with blinking cursor; Esc closes | SHELL-01 | Requires browser DOM + keyboard events | Open any page, press `/`, verify overlay appears; press Esc, verify it closes |
| Arrow keys navigate results; Enter opens selected | SHELL-03 | Requires browser interaction | Open overlay, type a query, use arrows to navigate, press Enter to navigate |
| j/k moves selection; gg/G jumps top/bottom; Enter opens | SHELL-04 | Requires browser DOM + keyboard events | On index page, press j/k, verify selection moves; press G for bottom; gg for top |
| Status bar shows current mode | SHELL-05 | Requires browser DOM | Load any list page, verify status bar visible at bottom |
| Esc returns focus to previous context | SHELL-06 | Requires browser focus management | Focus a link, press `/`, press Esc, verify original element is focused |
| Scanline overlay visible on all pages | AESTH-01 | Visual verification only | Load multiple pages, verify horizontal scanlines visible |
| Typewriter animation fires on h1 on page load | AESTH-02 | Visual/animation verification | Load index page, verify h1 has typewriter effect |
| ASCII dividers render in layouts | AESTH-03 | Visual verification | Check dividers render correctly in all page layouts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
