# F-003 — Remotion Composition Prompt

## Use the Remotion official skills to build this composition.
- Composition id: `F-003-birthday-paradox` · 1080×1920 · 30fps · durationInFrames: 834

effective_style: d3

```json chart-spec
{ "schemaVersion": 1,
  "archetype": "curve",
  "points": [ {"label":"5","value":2.7,"sourceRef":"01-verified-facts.md#curve"},
              {"label":"10","value":11.7,"sourceRef":"01-verified-facts.md#claim-2"},
              {"label":"20","value":41.1,"sourceRef":"01-verified-facts.md#claim-3"},
              {"label":"23","value":50.7,"sourceRef":"01-verified-facts.md#claim-1"},
              {"label":"30","value":70.6,"sourceRef":"01-verified-facts.md#claim-4"},
              {"label":"40","value":89.1,"sourceRef":"01-verified-facts.md#claim-5"},
              {"label":"50","value":97.0,"sourceRef":"01-verified-facts.md#claim-6"},
              {"label":"60","value":99.4,"sourceRef":"01-verified-facts.md#claim-7"},
              {"label":"70","value":99.9,"sourceRef":"01-verified-facts.md#claim-8"} ],
  "domain": [0, 70], "range": [0, 100],
  "axisLabels": {"x":"people in the room","y":"% chance of a shared birthday"},
  "transform": "linear",
  "growsAcrossBeats": [0,1,2,3,4] }
```

> **Scale-honesty (critical):** the 9 points above are the SOURCED verification anchors. Group sizes
> are unevenly spaced, so the curve must NOT be plotted at evenly-spaced indices. Render the curve
> **densely**: `series = [P(0), P(1), …, P(70)]` where `P(n) = (1 − 365!/(365ⁿ·(365−n)!)) · 100`
> (the formula is verified in `01-verified-facts.md`; this dense sampling passes exactly through all 9
> anchors). Feed that 71-value series into `lib/dataviz` `GrowthCurve` so **x-index == group size** —
> the 50% gridline then crosses the curve at **exactly x=23**, the payoff. The 9 anchors are drawn as
> lit nodes at their true x. Curve color = accent `#46C6FF`; the 50% gridline + the x=23 marker are
> gold `#FFC83D`.

## Design tokens
- **Fonts:** Anton (`@remotion/google-fonts/Anton`) hero numbers; Space Mono (`SpaceMono`) for percentage
  count-ups (stable digit width); Inter (`Inter`) 600/700 captions + axis labels.
- **Colors:** bg gradient `#0A1230`→`#1B2C5A` + radial glow `#2A3F7A` + nebula `#13204A` + star field
  (lib `<Background loopSafe>`). Primary text `#F2F6FF`. Accent/curve `#46C6FF`. Payoff/markers gold
  `#FFC83D`. Curve fill = accent @ 0.18.
- **Motion signature:** `heroOvershoot` (hero numbers); `countUp` ≤36f ease-out then hold, clamp ≥0
  (percentages); curve reveal via interpolated cutoff `t(frame)` (NOT a transition); `payoffGlow` on the
  50%×23 crossing; `loopSafe` Background.
- **Persistent background layer (all frames):** the gradient+glow+nebula+stars — never flat single-hex.

## Scenes (frame-exact — tiles [0,834])
> Layout bands: context label upper third (y≈260–520); the **curve fills the center** (chart box
> y≈540–1180, x inset ≈90–990); hero number + caption lower-center (y≈1240–1480); captions clear of the
> bottom ~15%. The curve is the large motif (stroke ≥8px). Hero numbers ≥300px Anton.

### Scene 0 — Hook (frames 0–138)
- **Chart:** the full axes (x 0→70, y 0→100%) drawn; the curve revealed up to ~x=23 with the gold 50%
  gridline + the gold x=23 vertical marker lit at the crossing (`payoffGlow`).
- **Hero text:** `23` (Anton ≥320px, `#F2F6FF`) with a gold `50%` beside/under it (`heroOvershoot`,
  frames 0–14). Context line upper: `chance two people share a birthday`.
- **On-screen:** `23 PEOPLE` / `50% CHANCE`.
- **Frame-fill note:** axes+curve fill the center band, hero number lower-center, context upper — full
  safe area used, no >40% dead zone. This is the thumbnail (legible <0.5s).

### Scene 1 — Beat 1 (frames 138–282)
- The full x-axis (0→70) emphasized; a small `23` tick sits close to the LEFT (23/70 ≈ a third across) to
  show how *little* of the axis it is. Curve dims to a faint guide.
- **On-screen:** `feels like hundreds` → `it's not` (swap ~frame 210).
- **Frame-fill note:** axis spans full width center; caption lower; context upper.

### Scene 2 — Beat 2 (frames 282–384)
- Curve reveals to **x=10**; node lights at **12%** (`heroOvershoot`); `countUp` 0→12 on a Space-Mono
  hero `12%`.
- **On-screen:** `10 → 12%`. **SFX:** tick @ 282.
- **Frame-fill note:** node + hero % center, curve climbing.

### Scene 3 — Beat 3 (frames 384–537)
- Curve sweeps through **x=30 (71%)** then **x=50 (97%)** — steep climb; nodes pop; hero % count-ups
  (71 at ~393, 97 at ~497). **SFX:** climb whoosh @ 384.
- **On-screen:** `30 → 71%` · `50 → 97%`.
- **Frame-fill note:** the steepest segment fills the center; two nodes lit.

### Scene 4 — Beat 4 (frames 537–691)
- Curve reaches **x=70 at 99.9%**, flattening into the ceiling; the whole S-curve now drawn; hero
  `99.9%` (`countUp` clamp ≥0, ease-out). **SFX:** tick @ 537. Soft `payoffGlow` on the ceiling.
- **On-screen:** `70 → 99.9%`.
- **Frame-fill note:** full curve visible; hero % lower-center.

### Scene 5 — Beat 5 (frames 691–759)
- Collapse back toward the **23 / 50% crossing** (matches the hook composition); hero `23` returns gold.
  **SFX:** reveal hit @ 691.
- **On-screen:** `23.`
- **Frame-fill note:** returns to the hook layout for the seam.

### Scene 6 — Loop tail (frames 759–834, silent)
- Hold the hook composition (curve up to 23, 50% crossing lit, `23`+`50%`); music releases to 0.72 then
  fades. Frame 834 state == frame 0 state (loop-safe Background + curve frozen at the hook).

(For the magnitude/probability axis: all positions computed FROM the verified values via `lib/dataviz`;
count-up displays clamp ≥ 0; no arbitrary pixel pins.)

## Captions
Word-by-word from `vo-timing.json` integer word frames (display string per word; merge consecutive
same-display tokens). Safe zone: bottom ~15% / top clear. Per beat:
- **hook 0–138:** Put[0-3] 23[3-18] people[18-29] in[29-31] a[31-34] room[34-43] and[44-47] there's[47-53] a[53-56] 50[56-66] percent[66-77] chance[77-89] two[89-95] of[95-97] them[97-104] share[104-110] a[110-113] birthday[113-138]
- **beat1 138–282:** It[141-146] feels[146-156] like[156-163] you'd[163-169] need[169-176] hundreds[176-201] But[203-207] 23[207-224] is[224-229] less[229-237] than[237-241] a[241-243] fifteenth[243-257] of[257-259] the[259-263] year[263-282]
- **beat2 282–384:** With[285-291] just[291-298] 10[298-306] people[306-315] the[317-321] odds[321-333] are[333-338] already[338-350] 12[350-360] percent[360-384]
- **beat3 384–537:** By[387-393] 30[393-407] it[409-413] jumps[413-424] to[424-428] 71[428-445] percent[445-470] By[473-480] 50[480-495] it's[497-503] 97[503-537]
- **beat4 537–691:** And[540-544] with[544-549] 70[549-561] people[561-573] it's[574-580] 99.9[580-618] percent[618-638] Practically[641-660] guaranteed[660-691]
- **beat5 691–759:** The[695-700] magic[700-712] number[712-723] is[723-728] 23[728-759]
- **loop 759–834:** silent (no captions).

## Audio (VO is the lead — music ducks under it)
- **VO:** `staticFile('vo.wav')` @ vol ~0.95 — the lead (frame 0 opens on speech).
- **Music:** `public/music-dark-tension.mp3` with a frame-callback `volume` reading the `vo-timing.json`
  `envelope`: 0.22 across the speech region (0→759), release to 0.72 over 759→768, hold 0.72 to 834,
  tail fades to 0. Fade in ~12f.
- **SFX:** `public/sfx-reveal-hit.mp3` @ frame 60 (vol 0.95) and @ 691 (vol 0.90); `public/sfx-tick.mp3`
  @ 282 and @ 537 (vol 0.60); `public/sfx-whoosh.mp3` @ 384 (vol 0.50).
- **Master (final step):** the render loop masters to **−14 LUFS / ≤ −1 dBTP** (default LRA-preserving
  linear-gain + true-peak limiter) and verifies.

## Loop-back
- Frame 834 == frame 0: the loop tail holds the hook composition (curve frozen at x=23, 50% crossing lit,
  `23`+`50%`), Background is `loopSafe`, so the auto-loop is invisible.

## Assumptions made (where the script was vague)
- Curve rendered densely as P(n), n=0..70, from the verified formula (passes through the 9 sourced
  anchors) so the x-axis spacing is honest and the 50% crossing lands at the true x=23.
- The 50% gridline + x=23 marker are gold; node dots sit on the curve at the 9 anchor x-positions.
- Hero number sizes/positions pinned here (≥300px Anton; lower-center) since the script left exact px open.
