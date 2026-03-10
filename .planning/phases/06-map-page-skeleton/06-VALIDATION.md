---
phase: 6
slug: map-page-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `assert` (no external test runner) |
| **Config file** | none — tests are standalone `.mjs` scripts run with `node` |
| **Quick run command** | `npm run build` |
| **Full suite command** | `node src/lib/map.test.mjs && npm run build` |
| **Estimated runtime** | ~30 seconds (build dominates) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `node src/lib/map.test.mjs && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green + manual visual check on HiDPI display
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | MAP-01 | unit | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | MAP-01 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 1 | MAP-01 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 2 | MAP-02 | unit | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 2 | MAP-02 | manual | Visual check on HiDPI display | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/map.test.mjs` — unit tests for coordinate normalization (buildScales) and hit detection logic (MAP-01, MAP-02)

*Note: `src/pages/map.astro` itself is created in Wave 1, not Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dots are sharp on HiDPI display | MAP-01 | Requires physical Retina/HiDPI screen; cannot automate devicePixelRatio visual check | Open `/map` in browser on HiDPI display; zoom in — dots should be crisp, not blurry |
| Hover tooltip renders with title and tags | MAP-02 | DOM interaction and visual tooltip rendering requires browser | Open `/map`, hover each dot — tooltip with document title and tags must appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
