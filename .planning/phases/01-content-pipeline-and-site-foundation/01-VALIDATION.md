---
phase: 1
slug: content-pipeline-and-site-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Astro build IS the test (no test framework; see research rationale) |
| **Config file** | none — Wave 0 creates `package.json` |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && node scripts/validate-output.mjs` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && node scripts/validate-output.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green + Cloudflare Pages URL live
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | REQ-002 | build-verify | `npm run build` | ❌ W0 — fix files + package.json | ⬜ pending |
| 1-01-02 | 01 | 0 | REQ-042 | manual | `git status` after build | ❌ W0 — create .gitignore | ⬜ pending |
| 1-01-03 | 01 | 1 | REQ-001, REQ-003, REQ-004 | build-verify | `npm run build` | ❌ W0 — package.json | ⬜ pending |
| 1-01-04 | 01 | 1 | REQ-010 | output-count | `ls dist/ai-tools-and-services dist/cloud-ai-platforms dist/companies \| wc -l` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | REQ-011, REQ-015 | manual | Visual inspect `dist/index.html` | manual | ⬜ pending |
| 1-01-06 | 01 | 1 | REQ-005, REQ-012, REQ-013 | output-count | `node scripts/validate-output.mjs --check-tags` | ❌ W0 | ⬜ pending |
| 1-01-07 | 01 | 2 | REQ-030, REQ-031, REQ-032, REQ-034 | manual | Visual inspect rendered pages + browser devtools | manual | ⬜ pending |
| 1-01-08 | 01 | 3 | REQ-040 | build-verify | `ls dist/` after `npm run build` | ❌ W0 — package.json | ⬜ pending |
| 1-01-09 | 01 | 3 | REQ-041 | deploy-test | Push commit, verify build in CF dashboard | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — Astro project must be initialized before any `npm run build` can run
- [ ] `.gitignore` — Does not exist yet; must cover dist/, node_modules/, .DS_Store, .env, .astro/
- [ ] `.node-version` — Pin Node.js 22 for Cloudflare Pages build environment
- [ ] Fix `airllm.md` — Remove leading space from ` date:` on line 2 (MUST happen before Astro init per STATE.md)
- [ ] Fix `langflow.md` — Remove leading space from ` date:` on line 2 (MUST happen before Astro init)
- [ ] `scripts/validate-output.mjs` — Output validation script (page count + tag link checks)

*Note: No pre-existing test infrastructure. Wave 0 creates the entire foundation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark background on all pages | REQ-030 | Visual rendering — no DOM assertion | Open rendered site in browser, confirm dark background |
| Neon accent on tag pills, hovers | REQ-031 | Interactive visual state | Hover over tags, confirm neon color transitions |
| Monospace font loaded | REQ-032 | Font rendering | Browser devtools → computed → font-family on body element |
| WCAG AA contrast on body text | REQ-034 | Visual accessibility | Run browser contrast checker on `#D0D0D0` vs `#0D0D1A` |
| Index page category sections visible | REQ-015 | Layout visual | Open `dist/index.html`, confirm three category groups labeled |
| Index lists all 15 documents | REQ-011 | Content count visual | Count document cards on index page |
| Cloudflare Pages auto-deploy triggers | REQ-041 | Requires live CF account | Push a commit to main, confirm build starts in CF dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
