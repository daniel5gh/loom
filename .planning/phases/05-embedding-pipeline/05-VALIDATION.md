---
phase: 5
slug: embedding-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `assert` (no external test runner) |
| **Config file** | none — tests are standalone `.mjs` scripts run with `node` |
| **Quick run command** | `node scripts/embed.test.mjs` |
| **Full suite command** | `node src/lib/graph.test.mjs && node scripts/embed.test.mjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/embed.test.mjs`
- **After every plan wave:** Run `node src/lib/graph.test.mjs && node scripts/embed.test.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run build` succeeds + `src/data/embeddings.json` committed
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | EMBED-01, EMBED-02, EMBED-03, EMBED-04 | stubs | `node scripts/embed.test.mjs` | ❌ Wave 0 | ⬜ pending |
| 5-02-01 | 02 | 1 | EMBED-01 | integration (Ollama mocked) | `node scripts/embed.test.mjs` | ❌ Wave 0 | ⬜ pending |
| 5-02-02 | 02 | 1 | EMBED-02 | unit (mock Ollama spy) | `node scripts/embed.test.mjs` | ❌ Wave 0 | ⬜ pending |
| 5-02-03 | 02 | 1 | EMBED-03 | unit (ECONNREFUSED mock) | `node scripts/embed.test.mjs` | ❌ Wave 0 | ⬜ pending |
| 5-03-01 | 03 | 2 | EMBED-04 | smoke (file inspection) | `node scripts/embed.test.mjs` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/embed.test.mjs` — stubs for EMBED-01, EMBED-02, EMBED-03, EMBED-04
- [ ] `src/data/embeddings.json` — initial placeholder committed so build doesn't fail (EMBED-04)
- [ ] `.cache/` entry in `.gitignore`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run build` uses committed embeddings.json and Cloudflare Pages build shows no missing-file errors | EMBED-04 | Requires actual Cloudflare Pages build environment | Run `npm run build` locally and confirm `src/data/embeddings.json` is read without error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
