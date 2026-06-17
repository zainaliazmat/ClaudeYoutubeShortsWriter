---
name: short-assembly
description: Finalizes and packages a /short run after the render loop produced a passing final.mp4, then records side-effects. Use as STEP 9 of the /short pipeline (after codegen + the render/QA loop). Writes the run folder's README.md manifest (with the render+QA iteration summary + YouTube AI-disclosure note), adds the row to content/VIDEO_LOG.md, archives the script into content/scripts/, appends dated learnings to memory/lessons.md, and runs the completeness gate before handing off to the human publish gate.
version: 1.0.0
allowed-tools: Read, Write, Edit, Glob, Bash(ls:*), Bash(cp:*)
user-invocable: false
---

# short-assembly

Step 9 of the `/short` pipeline. By now the run folder `output/F-NNN-<slug>/` holds
`00-topic.md`..`06-scorecard.md`, `vo.wav`/`vo-timing.json`, `assets.json`, a rendered+mastered
`final.mp4` (and `final-best.mp4`), and `09-iteration-ledger.md` from the render loop; the scene
`.tsx` live in `render/src/F-NNN/`. Your job: write the manifest, record side-effects, and gate.

## 1. Write `README.md` (the folder manifest)
```markdown
# F-NNN — <Title>  (rendered package)
> Rendered + mastered + QA-passed by the /short factory. Scene code: render/src/F-NNN/. Video: final.mp4.

- **Hook:** "<…>" · **Runtime:** <s>s (<frames>f @30fps · 1080×1920, from vo-timing.json) · **Voice:** <kokoro voice> · **Reviewer score:** <NN>/100 · **Render QA:** <loop score>/Cat9 <NN>%
- **Status:** RENDERED — final.mp4 mastered to <I> LUFS / <TP> dBTP, loop STATUS PASS (<n> iteration(s)) · **AI disclosure:** YES (synthetic voice) · awaiting human publish gate

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale |
| 01-verified-facts.md | claims table: quote + URL + confidence |
| 02-script.md | VO-timed, reviewer-passed script (frame map patched from the VO) |
| 03-assets.md / 04-audio.md | fonts/palette/motion; music + SFX (URL, license, mix, timing) |
| vo.wav / vo-timing.json | Kokoro voiceover + integer-frame timing (words, beats, envelope, total) |
| assets/ + assets.json | downloaded music/SFX binaries + the manifest the render asset-gate reads |
| 05-remotion-prompt.md / 06-scorecard.md | composition spec + reviewer score |
| 09-iteration-ledger.md | render→QA→attribute→fix rounds + terminal STATUS |
| final.mp4 / final-best.mp4 | the mastered render (upload this) / best-scoring attempt |

(Scene code is in `render/src/F-NNN/` — `.tsx` + `data.ts` + `scenes.json` + a Composition entry.)

## What already happened (the factory did this)
The render loop (`scripts/loop.mjs`) already: codegenned the scene `.tsx`, seeded `render/public/`,
rendered, two-pass `loudnorm`-mastered to -14 LUFS / ≤ -1 dBTP, ran qa-probe, and looped any fix to
the bar. `final.mp4` is the upload artifact. Nothing to render by hand.

## Human publish gate (step 10 — outside this skill)
1. Watch `final.mp4`; skim `09-iteration-ledger.md` (why did it iterate?).
2. Confirm facts (01) + audio license (04) + AI disclosure.
3. Upload `final.mp4`; title/description from the script's metadata section.

## YouTube AI disclosure — YES
This Short carries a **synthetic (AI) voiceover** (Kokoro). On upload, set **"Altered or synthetic
content" = YES**. The README states YES but cannot flip the toggle — that is a human action at upload.
```

## 2. Record side-effects
- **VIDEO_LOG.md:** add a row to the Facts table with status **rendered** (`| F-NNN | Topic | "Hook" | <s>s | rendered | [output/F-NNN-<slug>/02-script.md](...) | <loop score> | <I> LUFS | — | <note> |`) AND append the topic to the "Topics used (quick dedupe checklist)" list.
- **Archive:** copy `02-script.md` to `content/scripts/F-NNN-<slug>.md` (the channel's canonical script home).
- **memory/lessons.md:** append a dated, specific, actionable entry — what worked / what to change next run. The render loop already auto-appended a lesson per confirmed fix; add any higher-level learning the loop wouldn't have captured. Keep entries one line, concrete.

## 3. Completeness gate (must pass before the human gate)
Verify and report each as ✅/❌:
1. Every claim in `02-script.md` (narration + on-screen) is sourced in `01-verified-facts.md`.
2. `04-audio.md` is monetization-safe (no CC-BY-NC), bed ducks under the VO, **and `final.mp4` MEASURES -14 LUFS / ≤ -1 dBTP** (from `09-iteration-ledger.md` / re-verify with `ffmpeg -i final.mp4 -af loudnorm=...:print_format=json -f null -`) — not just specified.
3. `vo.wav` + `vo-timing.json` present; captions derived from the VO word frames.
4. Frame math passed the reviewer validator (06) AND the scene-range tiling gate (`check-tiling.mjs`).
5. **`final.mp4` exists and the loop STATUS is PASS** (≥85, no blockers, Cat 9 ≥70%) — or a human accepted `final-best.mp4`. `09-iteration-ledger.md` records the rounds.
6. **README AI-disclosure = YES** (synthetic voice) — a reminder; the human flips the YouTube toggle at upload.

If any is ❌, do NOT declare done — return to the responsible step (or re-run the loop). When all ✅, hand off to the human publish gate (step 10) with the folder path + a one-line summary per file.

## Boundaries
- Packaging + bookkeeping only. Don't rewrite the script or re-source assets here (that's earlier steps). Don't render.
