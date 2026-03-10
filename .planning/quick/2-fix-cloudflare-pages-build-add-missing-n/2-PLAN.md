---
phase: quick-2
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: [wrangler.toml]
autonomous: true
requirements: []
must_haves:
  truths:
    - "Cloudflare Pages build succeeds without missing name field error"
    - "wrangler.toml contains a name field matching the deployed project"
  artifacts:
    - path: "wrangler.toml"
      provides: "Cloudflare Pages configuration with required name field"
      contains: "name ="
  key_links: []
---

<objective>
Add the missing `name` field to wrangler.toml so Cloudflare Pages builds succeed.

Purpose: Cloudflare Pages / Wrangler requires a `name` field in wrangler.toml. Without it the build pipeline errors with a missing configuration field.
Output: Updated wrangler.toml with `name = "loom-7kv"` matching the deployed project at loom-7kv.pages.dev.
</objective>

<execution_context>
@/home/daniel/.claude/get-shit-done/workflows/execute-plan.md
@/home/daniel/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add name field to wrangler.toml</name>
  <files>wrangler.toml</files>
  <action>
    Add `name = "loom-7kv"` as the first line of wrangler.toml (before compatibility_date).
    The project name is derived from the known Cloudflare Pages URL: https://loom-7kv.pages.dev (recorded in STATE.md decisions).

    Final wrangler.toml should be:
    ```toml
    name = "loom-7kv"
    compatibility_date = "2025-07-18"
    pages_build_output_dir = "dist"
    ```

    Do not add any other fields.
  </action>
  <verify>
    <automated>grep -q '^name = "loom-7kv"' /home/daniel/codes/loom/wrangler.toml && echo "PASS: name field present" || echo "FAIL: name field missing"</automated>
  </verify>
  <done>wrangler.toml contains `name = "loom-7kv"` and Cloudflare Pages build can proceed without a missing-name error.</done>
</task>

</tasks>

<verification>
Run: `grep -n 'name' wrangler.toml` — should show `name = "loom-7kv"` on line 1.
</verification>

<success_criteria>
wrangler.toml has exactly three fields: name, compatibility_date, pages_build_output_dir. No other changes made.
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-cloudflare-pages-build-add-missing-n/2-SUMMARY.md`
</output>
