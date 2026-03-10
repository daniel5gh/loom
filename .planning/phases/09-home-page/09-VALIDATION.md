---
phase: 9
slug: home-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None — scripts run directly |
| **Quick run command** | `node --test test/home.test.mjs` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/home.test.mjs`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | HOME-02 | unit | `node --test test/home.test.mjs` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | HOME-02 | unit | `node --test test/home.test.mjs` | ✅ after W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | HOME-01 | manual | browser click test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/home.test.mjs` — covers HOME-02: sort+slice logic produces at most 10 docs in descending date order, drawing from all three collections

*Existing `test/shell.test.mjs` and `test/contrast.test.mjs` require no changes for this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Terminal prompt visible on home page | HOME-01 | Requires live browser DOM | Load http://localhost:4321, verify `loom> _` prompt visible above recent list |
| Click on prompt opens search overlay | HOME-01 | Requires browser click event | Click the `loom> _` prompt, verify shell overlay opens |
| `/` keypress opens overlay | HOME-01 | Requires browser keyboard event | Press `/` on home page, verify overlay opens (already wired globally) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
