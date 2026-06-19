# F-003 — The Birthday Paradox (23 people → 50%)  (rendered package)
> Rendered + mastered + QA-passed by the /short factory. **First `effective_style: d3` video** —
> the dominant visual is a D3 growth curve (`render/src/lib/dataviz` `GrowthCurve`). Scene code:
> render/src/F-003/. Video: final.mp4.

- **Hook:** "23 people. 50% chance two share a birthday." · **Runtime:** 27.8s (834f @30fps · 1080×1920,
  from vo-timing.json) · **Voice:** Kokoro `am_michael` · **Reviewer score:** 92/100 · **Render QA:** 94 / Cat9 80%
- **Status:** RENDERED — final.mp4 mastered to **-14.58 LUFS / -1.15 dBTP**, loop STATUS **PASS (1 iteration)** ·
  **AI disclosure:** YES (synthetic voice) · awaiting human publish gate
- **Style:** `effective_style: d3` — scale-honest by construction (the curve is P(n)=1−365!/(365ⁿ(365−n)!)
  sampled densely so x-index == group size; the gold 50% gridline crosses at the true x=23).

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale (data-shaped, for D3) |
| 01-verified-facts.md | 9 claims: exact computed value + verbatim Wikipedia quote + URL + confidence |
| 02-script.md | VO-timed, reviewer-passed script (frame map patched from the VO) |
| 03-assets.md / 04-audio.md | fonts/palette/motion; music + SFX (URL, license, mix, timing) |
| 05-remotion-prompt.md / 06-scorecard.md | composition spec (effective_style: d3 + chart-spec) + reviewer 92/100 |
| vo.wav / vo-timing.json | Kokoro voiceover + integer-frame timing (69 words, 7 beats, envelope, total=834) |
| assets/ + assets.json | reused licensed music/SFX binaries + the manifest the render asset-gate reads |
| 09-iteration-ledger.md | render→QA→attribute→fix rounds + terminal STATUS PASS (94/Cat9 80) |
| final.mp4 / final-best.mp4 | the mastered render (upload this) / best-scoring attempt (same; passed iter 1) |

(Scene code is in `render/src/F-003/` — `Short.tsx` + `Chart.tsx` (the D3 curve furniture) + `scenes.tsx`
+ `data.ts` + `scenes.json` + a Composition entry in `render/src/Root.tsx`.)

## What already happened (the factory did this)
The render loop (`scripts/loop.mjs`) already: rendered the codegenned scene `.tsx`, seeded the run-scoped
public dir, mastered (linear gain + true-peak limiter, LRA-preserving) to -14.58 LUFS / -1.15 dBTP, ran
qa-probe (score 94, Cat9 80, 0 blockers), and PASSED on iteration 1. `final.mp4` is the upload artifact.

## Human publish gate (step 10 — outside this skill)
1. Watch `final.mp4`; skim `09-iteration-ledger.md` (passed first try).
2. Confirm facts (01) + audio license (04, Pixabay Content License) + AI disclosure.
3. Upload `final.mp4`; title/description from `02-script.md` metadata.

## YouTube AI disclosure — YES
This Short carries a **synthetic (AI) voiceover** (Kokoro `am_michael`). On upload, set **"Altered or
synthetic content" = YES**. The README states YES but cannot flip the toggle — that is a human action at upload.
