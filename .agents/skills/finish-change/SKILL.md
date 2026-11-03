---
name: finish-change
description: Run every handoff check from AGENTS.md (typecheck, lint, tests including the rule tests, i18n parity, build, impeccable on changed UI files), fix what fails, and report the result in a fixed format. Use before you hand off any change in src/, and whenever the user asks if the work is done.
---

# Finish change

## Steps

1. Run from the desktop folder:

   ```
   bash .agents/skills/finish-change/scripts/check.sh
   ```

   Use `--quick` while iterating to skip the build. The final run must be the full one.

2. Fix every `FAIL`. Read the printed log tail first.
   - Rule test failures (`architecture-rules`, `testid-rules`, `ui-rules`, `security-rules`) point to `file:line`. Fix the code. Never edit a rule test to make it pass. If a rule seems wrong, ask.
   - A `missing` script is reported, not failed. Mention it in the handoff.
   - Re-run until everything passes.

3. If the summary lists changed UI files:
   - Run the app (`bun run dev`).
   - Check each changed screen at the minimum window width and at a wide window, in `id` and `en`.
   - No horizontal scroll, no clipped text, skeletons match the final layout.

4. Review the diff against the "Ask first" list in `AGENTS.md`. If the change touched any of those items without approval, stop and ask.

5. Report in this format:

   ```
   Checks: typecheck ✅ lint ✅ test ✅ i18n-check ✅ build ✅ impeccable ✅
   UI checked: <screens> at <min>px and <wide>px, id + en   (or: no UI change)
   Notes: <custom elements used, missing scripts, follow-ups>   (or: none)
   ```

   Do not claim a check passed that you did not run.
