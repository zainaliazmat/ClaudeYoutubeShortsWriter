// quality-floors.mjs — the engine's SINGLE source for luma floors (finding N7).
//
// Before this, three luma numbers lived apart and one was wrong:
//   - precheck.mjs   NEAR_BLACK_LUMA = 15  (gradient-STOP avg, pre-render, coarse)
//   - qa-assess.mjs  LUMA_MEAN_MIN   = 30  (COMPOSITED-frame mean, post-render)
//   - safeArea.ts    bgLumaMin       = 35  (COMPOSITED-frame floor, the "pixel backstop")
//
// Two SURFACES are involved, not one:
//   * BG_STOP_LUMA_MIN — the average luma of the bg gradient's hex STOPS only. precheck
//     uses it as a cheap pre-render estimate. It is deliberately LOW: F-001's stops
//     average ~31.6, and the additive glow + nebula + stars lift the COMPOSITED frame
//     well above it, so a stop-level floor must sit below the composited floor or it
//     would false-fail legit dark-but-lifted backgrounds.
//   * COMPOSITED_LUMA_MIN — the mean luma of the actual rendered, composited frame.
//     This is the real near-black backstop the QA probe enforces on pixels.
//
// RECONCILIATION DECISION (the 30-vs-35 mismatch): the probe's composited floor is
// raised 30 -> 35 to MATCH safeArea's documented design floor (bgLumaMin). The two
// were the same surface measured to different numbers; 35 is the authoritative design
// value. Both shipped videos composite at ~44 mean luma, so neither regresses.
// safeArea.ts keeps its own bgLumaMin (the render bundle stays self-contained); a
// render-lib test asserts the two stay equal (see quality-floors-agree.test.ts).

export const BG_STOP_LUMA_MIN = 15; // gradient-stop avg floor (precheck, pre-render)
export const COMPOSITED_LUMA_MIN = 35; // composited-frame mean floor (qa-probe, post-render)
