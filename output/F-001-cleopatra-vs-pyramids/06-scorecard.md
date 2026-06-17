# 06 — Scorecard (F-001 · Cleopatra vs Pyramids) — v4 (VO-driven)

Reviewed `02-script.md` **and** `05-remotion-prompt.md` together (Category 9 grades the composition spec). Frame math from the bundled validator (VO mode). **Iteration 1 of max 3.**

## Verdict: **93 / 100 — Remotion-ready** (Strong; no blockers). Category 9 = 12.5/14 = **89%** (≥70% gate satisfied).

## Validator output (quoted — Timing evidence)
```
Parsed 8 timed section(s):
  [    0 → 109 ] 109f 3.63s hook    [ 109 → 259 ] 150f 5.00s beat1
  [  259 → 397 ] 138f 4.60s beat2   [ 397 → 493 ]  96f 3.20s beat3
  [  493 → 592 ]  99f 3.30s beat4   [ 592 → 702 ] 110f 3.67s beat5
  [  702 → 855 ] 153f 5.10s beat6   [ 855 → 930 ]  75f 2.50s loop
Declared total: 930 frames (31.00s @ 30fps)
✓ VO-driven: durationInFrames=930 read from vo-timing.json; tiling the patched frame-map table.
✓ Coverage complete: sections tile [0, 930] exactly.
RESULT: PASS — frame budget tiles exactly with no gaps or overlaps.
```

## Scorecard (weighted)
| # | Category | Weight | Score | Notes |
|---|----------|-------:|------:|-------|
| 1 | Timing & Frame Accuracy | 18 | **18** | Validator PASS in VO mode; total=930 from `vo-timing.json`; 8 sections tile [0,930] exactly; silent loop tail ends at total. VO-derived, not hand-pinned. |
| 2 | Visual Spec Completeness | 13 | **12** | Every scene in `05` pins text, hex, font/size, layout bands, z-order, simultaneity, frame-fill note. −1: a couple of context-line exact sizes left as ranges. |
| 3 | Animation Feasibility | 13 | **12** | Concrete springs/interpolate configs (03 motion table) feasible in each beat's budget; count-up 30f ease-OUT + hold; no non-deterministic motion. −1: payoff has several concurrent layers — implementable but dense. |
| 4 | Text & Caption Clarity | 11 | **10.5** | Captions generated from `vo-timing.json` word frames (display strings), same-display runs merged into one token; legible fragments, accent-per-side. |
| 5 | Audio Sync | 9 | **8.5** | VO is the lead (`vo.wav` 0.95); music bed ducks via the `vo-timing.json` envelope (0.22 under the merged speech region, swell on tail); SFX framed to VO beats (109/259/493/397/592/702); −14 LUFS master target stated. −0.5: v4 loudness must be re-measured post-render. |
| 6 | Loop Integrity | 8 | **7.5** | Frame 930 == frame 0 (cross-dissolve 855→930), silent tail, music fades to 0. −0.5: dissolve endpoints described, not pixel-pinned. |
| 7 | Platform Compliance | 7 | **7** | 1080×1920@30; captions inside y154–1632 / x60–1020, out of the node lane; no CTA in UI band. |
| 8 | Creative / Retention | 7 | **6** | Hook legible <0.5s + identified subject; 7 beats / 31s is sane. −1: beat1 5.0s and beat6 5.10s run long — beat6 is the justified payoff dwell; beat1 could tighten if retention sags (the VO sentence sets it). |
| 9 | **Visual Design Quality** | 14 | **12.5** | Full safe area in explicit bands, hero ~340px Anton, ≥360px lit motifs, ≥12px spine, **scale-honest 660:540 = 1.22 = 2,491:2,038** computed from values, real-chroma gold/ice-blue on a depth gradient, **denser §5 visuals** (date ticks + era labels + shared-baseline comparison + brighter rest-state pyramid). −1.5: relies on the implementer realizing the bands at the stated sizes; verify at render-qa. **89% ≥ 70% gate.** |
| | **Total** | **100** | **93** | No blockers. |

## Blockers: none.

## Fixes applied this iteration
- None required to clear the gate. The script + prompt are internally consistent and the VO-derived frame map validates.

## Watch-items for render-qa (step 8)
- Re-measure v4 loudness after render (mix changed vs v3) → -14 LUFS / ≤ -1 dBTP.
- Confirm captions land on the `vo-timing.json` word frames within ±3 (esp. the merged "2560"/"BC"/"~2,500"/"1969"/"450" tokens).
- Confirm the bed is audibly ducked under the VO and the voice stays intelligible throughout.
- Watch beat1 (5.0s) / beat6 (5.1s) dwell for any visible static stretch; beat6 is the payoff (justified).
