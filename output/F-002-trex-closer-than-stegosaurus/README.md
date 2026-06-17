# F-002 — T. rex closer to you than to Stegosaurus  (rendered package)
> Rendered + mastered + QA-passed by the /short factory. Scene code: render/src/F-002/. Video: final.mp4.

- **Hook:** "T. rex lived closer to you than to Stegosaurus." · **Runtime:** 24s (720f @30fps · 1080×1920, from vo-timing.json) · **Voice:** Kokoro am_michael (speed 1.08) · **Render QA:** loop score 94 / Cat9 98%
- **Status:** RENDERED — final.mp4 mastered to -14.01 LUFS / -0.88 dBTP, loop STATUS PASS (1 iteration, 1 minor loop-seam warning) · **AI disclosure:** YES (synthetic voice) · awaiting human publish gate

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale (same archetype as F-001, new fact) |
| 01-verified-facts.md | claims table: Stegosaurus ~150 Mya, T. rex ~66 Mya (Wikipedia quotes) |
| 02-script.md | VO-timed script + frame map (patched from the VO) |
| 03-assets.md / 04-audio.md | Fathom signature reuse; F-001's licensed Pixabay audio (same channel/license) |
| vo.wav / vo-timing.json | Kokoro voiceover + integer-frame timing (720f, 8 beats) |
| assets/ + assets.json | music + SFX binaries + the render asset-gate manifest |
| 05-remotion-prompt.md | composition spec |
| 09-iteration-ledger.md | render→QA loop round + STATUS PASS |
| final.mp4 / final-best.mp4 | the mastered render (upload this) |

Scene code: `render/src/F-002/` (`Short.tsx` + `data.ts` + `scenes.json` + `Timeline.tsx` + `scenes.tsx`,
on the shared `render/src/lib/`). Composition id `F-002-trex-closer-than-stegosaurus`.

## Human publish gate
1. Watch final.mp4; skim 09-iteration-ledger.md. Note: one minor loop-seam warning (the persistent
   timeline's tail state differs slightly from frame 0) — cosmetic, non-blocking. A codegen refinement
   could freeze/reset the timeline on the loop tail for a perfect seam.
2. Confirm facts (01) + audio license (04, Pixabay) + AI disclosure.
3. Upload final.mp4; set "Altered or synthetic content = YES" (synthetic voice).
