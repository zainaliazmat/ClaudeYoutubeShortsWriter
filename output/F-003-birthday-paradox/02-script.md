# F-003 — The Birthday Paradox (script)

- **Working title:** 23 people, 50% — the birthday paradox
- **Format:** data viz (D3 growth curve) + kinetic-typography captions
- **Niche:** Facts
- **Target runtime:** ~28–32s — `durationInFrames` set by the VO in step 3.5
- **One-line premise:** it takes only 23 people for a coin-flip chance that two share a birthday, and the probability curve rockets to near-certain by 70.

## Narration (spoken — the TTS reads ONLY this block)
<!-- NARRATION:START -->
- [hook] Put 23 people in a room, and there's a 50 percent chance two of them share a birthday.
- [beat1] It feels like you'd need hundreds. But 23 is less than a fifteenth of the year.
- [beat2] With just 10 people, the odds are already 12 percent.
- [beat3] By 30, it jumps to 71 percent. By 50, it's 97.
- [beat4] And with 70 people, it's 99.9 percent. Practically guaranteed.
- [beat5] The magic number is 23.
<!-- NARRATION:END -->

## On-screen text (per beat — NOT the captions; captions come from vo-timing.json)
- **hook:** `23 PEOPLE` / `50% CHANCE`
- **beat1:** `feels like hundreds` → `it's not`
- **beat2:** `10 → 12%`
- **beat3:** `30 → 71%` · `50 → 97%`
- **beat4:** `70 → 99.9%`
- **beat5:** `23.`

## Visual direction (D3 growth curve — `effective_style: d3`)
- **Core mechanic:** a single **probability curve** (x = group size, y = % chance of a shared
  birthday) that **grows left→right** as the narration climbs. A horizontal **50% gridline** and a
  vertical **23 marker** sit on the chart; the emotional payoff is the curve **crossing 50% exactly at
  x=23**.
- **hook:** open on the curve already drawn up to ~23 with the 50% crossing lit; big `23` + `50%`
  hero text. Frame 1 = the thumbnail (legible in <0.5s).
- **beat1:** the full x-axis (0→70) visible, curve reset to the early toe; emphasize how *little* of
  the axis 23 is (a 23-tick close to the left).
- **beat2:** curve reveals to x=10, a node lights at 12%.
- **beat3:** curve sweeps through x=30 (71%) and x=50 (97%) — steep climb, nodes pop.
- **beat4:** curve reaches x=70 at 99.9%, flattening into the ceiling; the whole S-curve is now drawn.
- **beat5 / loop:** collapse back to the 23 / 50% crossing (matches the hook composition) → silent
  tail → frame 0.
- Scale-honest by construction: feed the verified `(group, probability)` points straight into the D3
  `GrowthCurve` (no hand-placed pixels).

## Loop-back (final ~1s, silent tail → frame 0)
- **Final frame composition:** returns to the hook's `23` + `50%` crossing, same colors/position.
- **The loop trick:** the closing line "the magic number is 23" lands the viewer back on the opening
  `23 PEOPLE / 50%` — rewatch to trace the curve again.

## Captions
- Burned-in, large, high-contrast, **word-by-word synced to the VO** (generated in step 5 from
  `vo-timing.json` integer word frames). Clear of the bottom ~15% and the very top. The curve lives in
  the upper/center bands so captions never collide with it.

## Audio (VO is the lead)
- **Voice:** Kokoro `am_michael` (set in step 3.5) — same channel voice as F-001/F-002.
- **Track vibe:** light, curious, building royalty-free bed; a small "tick" SFX as each node lights and
  a soft swell on the 99.9% ceiling.
- **Mix:** VO LEAD; bed ducks ~0.72 → ~0.22 under speech, swells on the payoff. Master −14 LUFS / ≤ −1 dBTP.

## Metadata (for upload)
- **Title:** 23 people. 50% chance. The birthday paradox.
- **Description:** Why it only takes 23 people for a 50% shot at a shared birthday — and why it's near-certain by 70. #Shorts #math #birthdayparadox #didyouknow
- **Hashtags:** #Shorts #math #probability #birthdayparadox

## Frame map (VO-patched — do not hand-edit; tts-voiceover writes this from vo-timing.json)
<!-- FRAME-MAP:START -->
| Segment | start | end | frames |
|---------|-------|-----|--------|
| hook | 0 | 138 | 138 |
| beat1 | 138 | 282 | 144 |
| beat2 | 282 | 384 | 102 |
| beat3 | 384 | 537 | 153 |
| beat4 | 537 | 691 | 154 |
| beat5 | 691 | 759 | 68 |
| loop | 759 | 834 | 75 |
| **Total** | **0** | **834** | **834** |
<!-- FRAME-MAP:END -->

## Channel notes
- **Length test:** this lands ~28–32s; if retention sags, try a 22s cut that drops beat1.
- **Cadence:** 1×/day target; this is the first D3-style episode (data-viz niche opener).
- **Metric to chase:** engaged views + retention, not loop-inflated counts.

## Sourcing check (cite-or-abstain)
Every number traces to `01-verified-facts.md` (all High confidence): 23→50% (claim 1), 10→12%
(claim 2), 30→71% (claim 4), 50→97% (claim 6), 70→99.9% (claim 8), "less than a fifteenth of the
year" (claim 9). The "feels like you'd need hundreds" line is rhetorical framing (not the abstained
"people expect 183" statistic). 6 beats, each covered by ≥1 distinct High claim — no padding.
