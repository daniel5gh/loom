---
phase: 7
slug: map-interactions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `assert` (no external test runner) |
| **Config file** | none — standalone `.mjs` scripts run with `node` |
| **Quick run command** | `node src/lib/map.test.mjs` |
| **Full suite command** | `node src/lib/map.test.mjs && npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node src/lib/map.test.mjs && npm run build`
- **After every plan wave:** Run `node src/lib/map.test.mjs && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green + manual visual check of all 6 interactions
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | MAP-04, MAP-05, MAP-07, MAP-08, MAP-10 | unit | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |
| 7-02-01 | 02 | 1 | MAP-03, MAP-08 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 7-03-01 | 03 | 1 | MAP-03 | manual | visual inspection | N/A | ⬜ pending |
| 7-04-01 | 04 | 1 | MAP-04 | unit | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |
| 7-05-01 | 05 | 2 | MAP-05, MAP-07 | unit + manual | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |
| 7-06-01 | 06 | 2 | MAP-06 | manual | visual inspection (browser) | N/A | ⬜ pending |
| 7-07-01 | 07 | 2 | MAP-08 | unit + manual | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |
| 7-08-01 | 08 | 3 | MAP-09 | manual | visual inspection | N/A | ⬜ pending |
| 7-09-01 | 09 | 3 | MAP-10 | unit + manual | `node src/lib/map.test.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/map.mjs` — export pure functions: `gaussianOpacity`, `kNearest`, `composedOpacity`
- [ ] `src/lib/map.test.mjs` — extend with test stubs for `gaussianOpacity`, `kNearest`, `composedOpacity`, `tagOpacity`

*Existing `src/lib/map.mjs` and `src/lib/map.test.mjs` exist from Phase 6; Wave 0 extends them.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Side panel slides in with correct content | MAP-03 | DOM interaction in browser | Click any dot; verify panel appears with title, tags, summary, link |
| Clicking second dot draws 5 neighbor lines | MAP-04 | Canvas rendering; visual | Click dot A, click dot B; verify 5 lines appear from dot B |
| Tag filter glows/dims correctly | MAP-05 | Canvas visual; no headless canvas test | Select a tag; verify matching dots bright, others at ~20% opacity |
| ANY/ALL toggle changes behavior | MAP-07 | Requires multi-tag state in browser | Select 2 tags; toggle ANY/ALL; verify glow set changes |
| Search dims non-matching dots | MAP-06 | Fuse.js CDN import; browser-only | Type search term; verify real-time dimming |
| Timeline slider applies Gaussian fade | MAP-08 | Visual opacity curve; no DOM assert | Drag slider; verify gradual fade by date distance |
| Play button auto-advances timeline | MAP-09 | DOM + timer; visual | Click play; verify slider advances and stops at end |
| All three filters compose simultaneously | MAP-10 | Combined visual state; browser | Set tag + search + timeline; verify only triple-matching dots at full opacity |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
