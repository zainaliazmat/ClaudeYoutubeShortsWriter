# F-002 — T. rex closer to you than to Stegosaurus  (rendered package)
> Rendered + mastered + QA-passed by the /short factory. Scene code: render/src/F-002/. Video: final.mp4.

- **Hook:** "T. rex lived closer to you than to Stegosaurus." · **Runtime:** 24s (720f @30fps · 1080×1920, from vo-timing.json) · **Voice:** Kokoro am_michael (speed 1.08) · **Render QA:** loop score 94 / Cat9 98%
- **Status:** RENDERED — final.mp4 mastered to -14.01 LUFS / -0.88 dBTP, loop STATUS PASS (1 iteration, 1 minor loop-seam warning) · **AI disclosure:** YES (synthetic voice) · awaiting human publish gate
- **Publish packaging (2026-06-18, hooks-lab):** Title → `T-Rex lived closer to YOU than to Stegosaurus` · Thumbnail → `thumbnail.png` (the `hook-f002-you` first-frame card; sourced text only) · alt framings rendered in `render/out/hooks-lab/` (`-number`, `-compare`). See `docs/superpowers/specs/2026-06-18-hooks-lab.md`.
- **REPAINT v2 (2026-06-18):** `final-v2.mp4` — full-body visual repaint (amber/teal museum brand spine, dino+human silhouettes, beat-3 side-by-side comparison, scale-honest horizontal payoff timeline). Same frozen VO/timing/audio/captions. -14.53 LUFS / -1.28 dBTP. Code: `render/src/F-002-v2/` on `render/src/v2kit/`. **`final.mp4` (original) is kept for A/B — compare and finalize one.**
- **v3 directions (2026-06-18, research-grounded):** three more styles on `render/src/v3kit/`:
  - `final-v3-1.mp4` — CAPTION-FORWARD (near-black, phrase-accumulating big captions, key word highlighted). Intentionally dark.
  - `final-v3-2.mp4` — EDITORIAL INFOGRAPHIC (slate ground, Anton+Inter hierarchy, stat cards, flat bars).
  - `final-v3-3.mp4` — MOTION GRAPHICS (cinematic dark, scale+blur transitions, glow pulses). Intentionally dark.
  - All 720f, ~-14.5 LUFS / TP ≤ -1, loop seam RMSE <0.02. Compare against `final.mp4`/`final-v2.mp4` and finalize one.

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
