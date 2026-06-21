# F-004 — Render-Readiness Scorecard

**Verdict: READY (score 89/100, no blockers, Cat 9 = 78% of weight).** Reviewed `02-script.md` +
`05-remotion-prompt.md` + `03-assets.md` together.

## Frame-budget validator (evidence)
```
Parsed 6 timed section(s):
  [   0 → 109]  109f  3.63s  hook
  [ 109 → 287]  178f  5.93s  beat1
  [ 287 → 452]  165f  5.50s  beat2
  [ 452 → 638]  186f  6.20s  beat3
  [ 638 → 840]  202f  6.73s  beat4
  [ 840 → 915]   75f  2.50s  loop
Declared total: 915 frames (30.50s @ 30fps)
✓ VO-driven: durationInFrames=915 read from vo-timing.json; tiling the patched frame-map table.
✓ Coverage complete: sections tile [0, 915] exactly.
RESULT: PASS
```

## Scorecard (weighted to 100)
| # | Category | Weight | Score | Notes |
|---|----------|-------:|------:|-------|
| 1 | Hook / frame-1 legibility | 12 | 11 | `ONE FOOD / NEVER EXPIRES` at full opacity f0; strong curiosity-gap thumbnail; subject named f≈111 ("HONEY"). |
| 2 | Timing / frame math | 14 | 14 | Validator PASS; tiles [0,915] exactly. |
| 3 | Narration / facts integrity | 14 | 14 | Every spoken/on-screen claim traces to `01-verified-facts.md` (C1–C6). King Tut "3,000-yr still edible" embellishment correctly ABSTAINED — uses "thousands of years old, still preserved" (C6). |
| 4 | Caption spec | 8 | 7 | Word-by-word from `vo-timing.json`; lane y≈1560–1660 clear of UI + hero. (−1: confirm `H₂O₂`/peroxide caption merges the spoken words cleanly.) |
| 5 | Audio / VO-lead + ducking | 10 | 9 | VO lead 0.95; bed ducks via envelope, swells on payoff; 3 SFX frame-placed; master −14 LUFS/≤−1 dBTP encoded. |
| 6 | Loop integrity | 8 | 7 | Cross-dissolve to hook hero f840–885; frame-0 hero full opacity both ends. (−1: persistent jar/hero must reset to exact frame-0 state at the seam — see F-002 loop-seam lesson.) |
| 7 | Animation feasibility (Remotion) | 10 | 9 | Concrete springs/easings/frames; jar clipPath fill, reveal wipe, lid snap all fit their beats. Lottie accent 22f completes within [611,638). |
| 8 | Platform safe zones | 6 | 6 | Hero/jar/accent above the caption lane; nothing in bottom ~15% or very top. |
| 9 | **Visual design quality & frame utilization** | 18 | 14 (78%) | Depth bg gradient+glow (not flat); hero ≥280px Anton; full safe-area bands; persistent jar motif; the success-check accent IS the payoff visual. Deductions below. |
| | **Total** | **100** | **89** | |

## Category 9 detail (78% — clears the ≥70% bar)
Strengths: depth background (gradient `#2B1200→#5C2800` + radial glow, never flat); hero scale honest (Anton 320–380px); explicit upper/center/lower bands; the honey-jar motif earns the frame from f0; the Lottie success-check is a real, legible core-mechanic payoff on beat3.
Deductions (Minor, not blocking):
- **beat1 (5.9s) and beat4 (6.7s) are long for their motion budget** — the jar fill (24f) then ~150f hold on beat1, and the settle on beat4, risk a static stretch. Add a secondary sustain (e.g. slow glow pulse on the jar, or the `~0% water` chip drifting) so no >40% dead-motion stretch.
- **beat2 chips** (`ACIDIC`, `+ H₂O₂`, `MICROBES DIE`) must be sized as real chips (≥~90px), not small markers, to keep Cat-9 legibility.

## Lottie accent assessment (the new layer)
Concretely specified and additive: `accent-beat3.json` (fr:30, honey-gold `#F5B731`), placement above-captions (x≈540/y≈420), sizePx 320, frame window [611,638) synced to the spoken word "preserved", completes ~f633, holds to beat end. Clear of the caption lane and the very top. `effective_style` stays `kinetic-typography` (one line, accent does NOT change it). ✓

## Fixes (all Minor — none block render)
1. **video:** beat1/beat4 add a secondary sustain motion to avoid a static stretch (Cat 9).
2. **video:** at the loop seam, reset the persistent jar + hero to their exact frame-0 state (not just dissolve the text) — pre-empts an F-002-style loop-seam YUV warning.
3. **video:** ensure beat2 stat chips render ≥~90px (legibility).

No revision required before codegen — score ≥80, Cat 9 ≥70%, no blockers. Carry the 3 Minor fixes into codegen as polish.
