---
phase: 10
slug: claude-code-skills
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, no install needed) |
| **Config file** | none — tests are standalone .mjs files |
| **Quick run command** | `node scripts/validate-docs.test.mjs` |
| **Full suite command** | `node scripts/embed.test.mjs && node scripts/validate-docs.test.mjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-docs.test.mjs`
- **After every plan wave:** Run `node scripts/embed.test.mjs && node scripts/validate-docs.test.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green + human verification of all four skills
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | SKILL-03 | unit | `node scripts/validate-docs.test.mjs` | ❌ Wave 0 | ⬜ pending |
| 10-01-02 | 01 | 1 | SKILL-01 | manual | N/A — WebFetch + skill behavior | N/A | ⬜ pending |
| 10-02-01 | 02 | 1 | SKILL-02 | manual | N/A — requires live Ollama + git remote | N/A | ⬜ pending |
| 10-02-02 | 02 | 1 | SKILL-03 | unit | `node scripts/validate-docs.test.mjs` | ❌ Wave 0 | ⬜ pending |
| 10-03-01 | 03 | 1 | SKILL-04 | manual | N/A — skill behavior tested by inspection | N/A | ⬜ pending |
| 10-04-01 | 04 | 1 | SKILL-05 | unit | `node scripts/gaps.test.mjs` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-docs.mjs` — validation script used by /loom:deploy skill
- [ ] `scripts/validate-docs.test.mjs` — unit tests covering SKILL-03 validation logic

*Note: If validation is done inline in the deploy skill (not as a separate script), Wave 0 is not needed and SKILL-03 becomes manual-only verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/loom:add` creates file with correct frontmatter | SKILL-01 | Skill behavior depends on Claude + WebFetch in live session | Run `/loom:add <url>`, check created file has title/date/tags/summary/content |
| `/loom:deploy` runs embed.mjs, commits, pushes | SKILL-02 | Requires live Ollama + git remote | Run `/loom:deploy`, verify embeddings.json committed, Cloudflare Pages build triggered |
| `/loom:retag` updates tags across all docs | SKILL-04 | Skill behavior tested by inspection | Run `/loom:retag old-tag new-tag`, grep all docs to confirm replacement |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
