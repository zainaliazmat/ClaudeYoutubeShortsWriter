# F-003 — Remotion Script Scorecard

**Verdict: 92 / 100 — Remotion-ready (90–100 band).** No blockers. Cat 9 = 12.5/14 (89% ≥ 70% gate).
d3 style decision validated. Reviewed `02-script.md` + `05-remotion-prompt.md` + `03-assets.md` together.

## Step 1.5 — d3 style decision (PASS)
- Exactly one `effective_style: d3` line (matches `^effective_style:\s*(d3|kinetic-typography)\s*$`).
- Fenced `json chart-spec`: `archetype: "curve"`, **9 points each with numeric `value` + `sourceRef`**
  (≥3 sourced ✓). `validateChartSpec` → `{ok:true, curve, 9 sourced points}`. Earned, won't halt at codegen.

## Step 2 — Frame-budget validator (PASS — quoted)
```
Parsed 7 timed section(s): hook[0→138] beat1[138→282] beat2[282→384] beat3[384→537]
  beat4[537→691] beat5[691→759] loop[759→834]
Declared total: 834 frames (27.80s @ 30fps)
✓ VO-driven: durationInFrames=834 read from vo-timing.json; tiling the patched frame-map table.
✓ Coverage complete: sections tile [0, 834] exactly.
RESULT: PASS — frame budget tiles exactly with no gaps or overlaps.
```

## Scorecard (9 categories, total weight 100)
| # | Category | Weight | Score | Notes |
|---|---|---|---|---|
| 1 | Timing & Frame Accuracy | 18 | 18 | Validator PASS; tiles [0,834]; loop ends at total; VO-driven. |
| 2 | On-screen Text & Captions | 12 | 11 | Captions from `vo-timing.json` word frames (frames quoted per beat); merge rule noted; safe-zone respected. On-screen fragments punchy. |
| 3 | Animation Feasibility & Specificity | 13 | 12 | Every motion → concrete API + frames (`heroOvershoot` 0–14, `countUp` ≤36f clamp≥0, curve reveal via interpolated cutoff, `payoffGlow`, `loopSafe`); all fit their 68–154f budgets. |
| 4 | Audio Design | 10 | 9.5 | VO lead; bed ducks via the `vo-timing.json` envelope (0.22→0.72); 5 SFX cues at named frames; master target stated. |
| 5 | Loop Integrity | 8 | 8 | Frame 834 == frame 0 explicit (hook composition frozen, `loopSafe` Background); silent tail. |
| 6 | Hook Strength | 10 | 9 | Frame-1 thumbnail = `23` + `50%` + the lit crossing; surprising threshold; legible <0.5s. |
| 7 | Platform Safe Zones | 8 | 8 | Captions clear of bottom ~15% + top; curve lane reserved in center so captions never collide. |
| 8 | Spec Completeness / Metadata | 7 | 6.5 | Per-scene fonts/hex/sizes/positions/z pinned; title/desc/hashtags present; assumptions listed. |
| 9 | **Visual Design & Frame Utilization** | 14 | **12.5** | Full safe area in explicit bands + per-scene frame-fill notes (no >40% dead zone); hero ≥300px Anton; curve stroke ≥8px (not hairline); **core mechanic (50%×23 crossing) is the prominent visual**; **scale-honest by construction** (dense P(n) sampling → x-index∝group → 50% crosses at true x=23); cyan accent + gold payoff against gradient depth. |
| | **TOTAL** | **100** | **92** | |

## Severity findings
- **Minor (no revision required):** the dense-curve instruction (render P(n), n=0..70 from the verified
  formula) puts a small computation in codegen — acceptable (the formula is a verified claim, and the
  sampling passes exactly through the 9 sourced anchors). Codegen should add the 50% gridline + x=23
  marker + node dots as bespoke scene layers on top of the `lib/dataviz` `GrowthCurve` (the codegen
  escape hatch); flagged so codegen expects it.
- **Minor:** loop-tail is 75f of held hook — fine; ensure the curve is frozen (not still revealing) at
  759 so the seam is clean (Background `loopSafe` + a frozen reveal cutoff).

## Decision
**PASS — proceed to codegen (step 7).** Score 92 ≥ 80, Cat 9 89% ≥ 70%, no blockers, d3 decision earned.
No revision pass needed.
