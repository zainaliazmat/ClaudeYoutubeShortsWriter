---
description: End-to-end YouTube Short pipeline for the Fathom Facts channel. Picks/uses a topic, researches & fact-checks it, writes a frame-timed Remotion script, sources typography assets + monetization-safe audio (spec only), generates a Remotion composition prompt, runs the review loop, and outputs one self-contained folder under output/.
argument-hint: [topic]
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash, Agent, Skill, TodoWrite
model: claude-opus-4-8
---

Topic (optional): $ARGUMENTS

You are running the `/short` agentic pipeline. **Read `CLAUDE.md` and `memory/lessons.md` FIRST**, then follow the CLAUDE.md pipeline section exactly, in order. Use a TodoWrite list mirroring steps 1–7 so progress is visible (step 8 render-qa is post-render and runs separately, only once a rendered file exists).

Key rules for this run:
- If no topic was given above, step 1 (niche-memory) selects a fresh, non-repeating one.
- Each step writes its file into the run folder `output/F-NNN-<slug>/` before the next step starts.
- Step 2 research uses the `/deep-research` skill; the script (step 3) may use ONLY claims that ended up in `01-verified-facts.md`.
- Run step 4 (asset-sourcing) through the **asset-scout** subagent (Agent tool) so the web lookups stay out of this context — pass it the run-folder path and the script path explicitly.
- Step 6 is the evaluator-optimizer loop (max 3 iterations) using the `remotion-script-reviewer` skill: review **`02-script.md` AND `05-remotion-prompt.md` together** — revise and re-score if the score < 80, any blocker, OR **rubric Category 9 (Visual Design Quality) is below ~70% of its weight** (flat/empty layout, dead space, invisible core mechanic, scale-dishonest data viz).
- Do not finish until the CLAUDE.md **completeness gate** passes. Then print the path to the deliverable folder and a one-line summary of each file in it.
- The package is spec-only (no render). When the Remotion project later produces `out.mp4`/`final.mp4`, run the **render-qa** skill (step 8) against `05-remotion-prompt.md` before publishing.
