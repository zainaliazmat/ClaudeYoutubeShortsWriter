---
description: End-to-end Fathom Short factory — topic → research → script → voice → assets → prompt → review → codegen → render+master → self-improving QA loop → human publish gate. Produces a passing, mastered final.mp4 (not just a spec).
argument-hint: [topic]
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash, Agent, Skill, TodoWrite
model: claude-opus-4-8
---

Topic (optional): $ARGUMENTS

You are running the merged `/short` factory. **Read `CLAUDE.md` and `memory/lessons.md` FIRST**,
then follow the CLAUDE.md pipeline section exactly, in order. Use a TodoWrite list mirroring the
steps below so progress is visible.

The pipeline now goes all the way to a **rendered, mastered, QA-passed `final.mp4`** — it is no
longer spec-only. Spec steps (1–6) build the package; the bridge + render loop (7–8) produce and
verify the video; assembly + the human gate (9–10) finish it.

Steps:
1. **niche-memory** → `00-topic.md` (fresh, non-repeating topic; allocate `F-NNN`, make the run folder). If a topic was given above, validate/dedupe it.
2. **`/deep-research`** → `01-verified-facts.md` (claims table: quote + URL + confidence; cite-or-abstain). The script may use ONLY claims that land here.
3. **youtube-shorts-writer** → `02-script.md` (Narration block + on-screen text + empty frame-map block).
3.5 **tts-voiceover** → `vo.wav` + `vo-timing.json` (integer-frame timing; patches the frame map into `02-script.md`). On overrun > target+~15%, loop back to step 3 to cut words.
4. **asset-scout** subagent (Agent tool) → `03-assets.md` + `04-audio.md` (spec only; pass the run-folder + script paths explicitly so web lookups stay out of this context).
5. **remotion-prompt-generator** → `05-remotion-prompt.md`.
6. **Review loop** (evaluator-optimizer, max 3) — **remotion-script-reviewer** on `02-script.md` AND `05-remotion-prompt.md` together. Revise + re-score if score < 80, any blocker, OR Category 9 (Visual Design) below ~70% of its weight. Write `06-scorecard.md`.
7. **remotion-codegen** (step 5.5) → writes `render/src/F-NNN/` (scene `.tsx` + `data.ts` + `scenes.json` + a Composition entry) on the shared `render/src/lib/`, plus `output/F-NNN/assets.json`. Gate: `cd render && npm run gate && npm run test:lib && node --experimental-strip-types scripts/check-tiling.mjs F-NNN`. Duration via `calculateMetadata` (never a const). (A brand-new skill may need a Claude Code reload before first use.)
8. **Render + self-improving QA loop** — first ensure music/SFX binaries are in `output/F-NNN/assets/` (the pre-render asset gate halts with a download checklist if any are missing — a human download step). Then run `node --experimental-strip-types scripts/loop.mjs output/F-NNN-<slug>`: precheck → render-run (render + two-pass loudnorm master) → qa-probe → attribute defects (script | voice | video | video(master)) → auto-fix → re-render, to the bar (≥85, no blockers, Cat9≥70) or 3 iterations / no-improvement. Keeps `final-best.mp4`; writes `09-iteration-ledger.md`. On a non-auto-fixable defect it routes to the owning skill (re-run it, re-loop).
9. **short-assembly** → `README.md`, `VIDEO_LOG.md` row, archive `02-script.md`, append lessons, record the render + QA iterations. Run the completeness gate.
10. **Human publish gate** — present `final.mp4` + `09-iteration-ledger.md` + facts/audio/AI-disclosure compliance for sign-off. Optionally run the full **render-qa** skill for richer per-beat visual judgment. Upload is a human action (set "Altered or synthetic content = YES").

Do not declare done until: the completeness gate passes, the loop reports STATUS: PASS (or a human
accepts `final-best.mp4`), and the human publish gate is presented. Missing licensed binaries and the
final publish are the only expected human stops.
