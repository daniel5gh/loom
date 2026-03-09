---
phase: 4
slug: cleanup-and-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in (no test framework) |
| **Config file** | none |
| **Quick run command** | `npm run build && node scripts/validate-output.mjs` |
| **Full suite command** | `npm run build && node scripts/validate-output.mjs` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && node scripts/validate-output.mjs`
- **After every plan wave:** Run `npm run build && node scripts/validate-output.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | REQ-006 | smoke | `npm run build && node scripts/validate-output.mjs` | ✅ (script exists; assertion added in Wave 0) | ⬜ pending |
| 4-01-02 | 01 | 1 | REQ-030 | manual visual | Browser inspection of a document page | N/A | ⬜ pending |
| 4-01-03 | 01 | 1 | REQ-043 | smoke | `npx wrangler pages dev` (manual check — starts server) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-output.mjs` — add `dist/graph/index.html` assertion (MC-01 fix, covers REQ-006 gap)

*(CSS padding and wrangler.toml fixes have no automated test coverage needed — verifiable by visual inspection and CLI invocation.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Document pages have no double padding | REQ-030 | CSS visual layout — no automated assertion available | Open a doc page in browser; inspect padding on `main` container using DevTools; expect ~2rem from `.doc-layout` only, not stacked 4rem |
| `npx wrangler pages dev` starts without `dist/` argument | REQ-043 | Starts a local server — can't automate in CI without integration harness | Run `npx wrangler pages dev` (no args); confirm server starts and serves pages from `dist/` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
