---
name: loom:deploy
description: Validate documents, re-embed changed docs, commit and push to trigger Cloudflare Pages build
disable-model-invocation: true
allowed-tools:
  - Read
  - Glob
  - Bash
---

# /loom:deploy

Orchestrates the full deploy pipeline: validate all documents, re-embed changed docs via Ollama, commit updated embeddings.json, and push to trigger a Cloudflare Pages build.

**STOP if validation fails. Do not proceed to embed or commit.**

---

## Step 1 — Validate Documents (hard stop on errors)

Run via Bash:
```
node scripts/validate-docs.mjs
```

- If exit code is **0**: print "Validation passed. Proceeding to embed step." and continue to Step 2.
- If exit code is **non-zero**: print the validation output (already printed by the script), then print "Deploy aborted: fix validation errors before deploying." and **STOP**. Do not proceed to any further steps.

---

## Step 2 — Embed Changed Documents

Run via Bash:
```
node scripts/embed.mjs
```

- If exit code is **non-zero** (Ollama unreachable or other error): print the error output, then print "Deploy aborted: embedding pipeline failed." and **STOP**.
- If exit code is **0**: continue to Step 3.

---

## Step 3 — Check for Other Staged Files (safety warning)

Run via Bash:
```
git status --porcelain
```

- If any output lines do **not** start with a space (i.e., there are already-staged files): warn the user:
  "Warning: you have other staged files. Only src/data/embeddings.json will be committed by this deploy. Your other staged changes remain staged but are NOT included in this commit."
- Continue regardless — this is a warning only, not a stop.

---

## Step 4 — Stage Embeddings Only

**Only git add src/data/embeddings.json -- do not stage other files.**

Run via Bash:
```
git add src/data/embeddings.json
```

---

## Step 5 — Check If Embeddings Changed

**Check git diff --cached --quiet before committing to avoid 'nothing to commit' error.**

Run via Bash:
```
git diff --cached --quiet
```

- Exit code **0** means no changes staged (embeddings.json was identical to HEAD). Print "Embeddings up to date — nothing to commit. Pushing current HEAD." and skip to Step 6 (push only).
- Exit code **1** means changes are staged. Proceed to Step 5a (commit).

---

## Step 5a — Commit Embeddings (only if changed)

Run via Bash:
```
git commit -m "chore: update embeddings"
```

- If exit code is **non-zero**: print the error output and **STOP**.
- If exit code is **0**: continue to Step 6.

---

## Step 6 — Push to Remote

Run via Bash:
```
git push
```

- If exit code is **non-zero**: print the git error output, then print "Deploy failed at push step. Check git remote and authentication."
- If exit code is **0**: print "Deploy complete. Cloudflare Pages build triggered."

---

## Guardrails Summary

- **STOP if validation fails. Do not proceed to embed or commit.**
- **Only git add src/data/embeddings.json -- do not stage other files.**
- **Check git diff --cached --quiet before committing to avoid 'nothing to commit' error.**
