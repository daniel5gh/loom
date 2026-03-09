---
phase: 2
slug: graph-visualization-and-relationship-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — see Wave 0 (vitest optional) |
| **Config file** | None — Wave 0 may install |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual browser review of `/graph/` page and one document page
- **Before `/gsd:verify-work`:** Build green + visual review of all interactive behaviors
- **Max feedback latency:** ~10 seconds (build check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-W0-01 | W0 | 0 | REQ-006, REQ-024 | unit | `npm run build` | ❌ W0 | ⬜ pending |
| 2-01-01 | 01 | 1 | REQ-006, REQ-007 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | REQ-006, REQ-024 | unit | `npm run build` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | REQ-020 | manual | Visual check of `/graph/` in browser | N/A | ⬜ pending |
| 2-02-02 | 02 | 1 | REQ-021, REQ-022, REQ-023 | manual | Browser interaction test | N/A | ⬜ pending |
| 2-02-03 | 02 | 1 | REQ-025, REQ-026 | manual | Visual check of neon styling and tag filter | N/A | ⬜ pending |
| 2-03-01 | 03 | 2 | REQ-014 | manual | Visual check of Related Documents on document page | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/graph.js` — extract graph data logic (`buildGraphData()`, `getRelatedDocs()`) for testability (covers REQ-006, REQ-024)
- [ ] No test runner installed — manual browser testing is primary for D3 interactions
- [ ] Optional: `npm install --save-dev vitest` — enables unit testing of `graph.js` logic (planner decides)

*Note: If vitest is not set up, `npm run build` + manual browser QA is sufficient for this phase's scope.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Force-directed graph renders nodes and edges | REQ-020 | Requires browser/D3 rendering | Open `/graph/` in browser; verify nodes and edges visible |
| Node click navigates to document page | REQ-021 | Browser interaction required | Click a node; verify navigation to correct document URL |
| Hover dims non-adjacent nodes | REQ-022 | Browser interaction required | Hover a node; verify non-adjacent nodes dim to ~15% opacity |
| Zoom and pan work | REQ-023 | Browser interaction required | Zoom in/out and pan; verify node labels remain visible when zoomed in |
| Neon styling applied | REQ-025 | Visual verification | Verify cyan/magenta/green palette on nodes and edges |
| Tag filter highlights correct nodes | REQ-026 | Browser interaction required | Select a tag filter; verify only matching nodes highlighted |
| Related documents section visible | REQ-014 | Visual verification | Open any document page; verify "Related Documents" section with 3-5 entries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
