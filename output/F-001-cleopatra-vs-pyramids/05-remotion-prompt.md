# F-001 — Remotion Composition Prompt — v4 (VO-driven)

## Use the Remotion official skills to build this composition.
- Composition id: `F-001-cleopatra-vs-pyramids` · 1080×1920 · 30fps · **durationInFrames: 930** (= `vo-timing.json` `total`; 31s)
- Frames 0-indexed, half-open, contiguous per the VO-patched frame-map table in `02-script.md`. Last visual (loop) ends at 930 and matches frame 0. The loop tail (855–930) is **silent** (VO ended; music swells then fades).

## Design tokens
- **Fonts:** `Anton` (`@remotion/google-fonts/Anton`, OFL) — hook lines, year stamps, hero numbers, payoff; `Space Mono` (`@remotion/google-fonts/SpaceMono`, OFL) — rolling count-up digits only, `letter-spacing: -0.04em` at hero scale.
- **Colors:** bg gradient `#0B1430` (top) → `#1C2A55` (bottom); hero radial glow `#2E4A8C` @35%; nebula `#3A2C6B` @12%; text `#F4F1E8`; accent gold `#F2B53C` (ancient/Pyramid side); reveal ice-blue `#6FD3FF` (modern/Moon side); timeline spine `#5B6BA8` ≥12px.
- **Persistent background layer (all frames):** vertical navy→indigo gradient + ~900px radial hero glow (breathing scale 1.0↔1.04 / ~120f) + faint upper-left nebula wash + drifting 2–4px star field (~70 dots, +2px/s). **Never flat single-hex black.**
- **Motion signature:** word slam-in `spring(tension 200, damping 22)` Y+48→0; hero overshoot `spring(200, 13)` scale 0.55→1.0; year-stamp shake `spring(420, 28)` micro-oscillate then lock; segment grow `spring(130, 24)` scaleY 0→1 on ≥12px bars; count-up `interpolate(...Easing.out(Easing.cubic))` 30f then hold, value `Math.max(0,…)`; payoff glow pulse sinusoidal; cross-dissolve loop linear.

## Spatial frame (whole video)
Vertical time-axis fills the safe height (y≈260–1660): **Pyramid pinned TOP (2560 BC), Moon pinned BOTTOM (1969)**, Cleopatra node at **~55% down** (time-accurate, below center). Scale: 4,529 yr over ~1,200px → 0.265 px/yr; Pyramid→Cleopatra gap = 660px, Cleopatra→Moon gap = 540px (true 1.22 ratio). **Date ticks + era labels** ("Old Kingdom", "Ptolemaic", "Space Age") fill the right band.

## Scenes (frame-exact)
> Layout: full safe area y≈260–1660 in bands — context line (upper third) · hero element (center) · vertical timeline + comparison (runs through, anchored lower). Hero numbers ≥ ~340px Anton. Decorative layers visible at viewing size (≥12px spine, ~360px motifs). VO speaks throughout; captions step word-by-word (below).

### Scene 0 — Hook (frames 0–109)
- Kicker "EGYPT'S QUEEN" (gold, ~90px, uppercase) upper third; hero "Cleopatra is closer to **YOU**" (off-white, ~150px) center; "than the **Pyramids**" (gold, ~150px) below. "YOU" overshoots in ~frame 24.
- Faint full timeline preview: lit gold pyramid silhouette top, pale moon disc bottom, "Cleopatra" label low-center (~55%). Gradient + glow behind text.
- **Frame-fill note:** three bands used (kicker upper / hero center / timeline preview lower); ~0% dead zone — glow + stars + spine fill the rest.

### Scene 1 — Beat 1 (frames 109–259)
- Context "THE GREAT PYRAMID" + small "Khufu · Old Kingdom" (upper); hero **"2560 BC"** (~340px gold) center, year-stamp shake on entry; tick SFX @109.
- Timeline establishes (draws top→bottom); **~360px lit gold pyramid** anchors TOP node + soft glow; era label "Old Kingdom" + first date tick appear right band.
- **Frame-fill note:** pyramid motif (top) + hero year (center) + spine/ticks (right) → full height used, no >40% dead zone.

### Scene 2 — Beat 2 (frames 259–397)
- Context "EGYPT'S LAST QUEEN · CLEOPATRA" (upper); hero **"69 BC"** (~340px gold) center, year-stamp shake; tick SFX @259.
- Cleopatra marker node lands at ~55% down; "Cleopatra" + era label "Ptolemaic" ride the node. Pyramid stays pinned top.
- **Frame-fill note:** node at 55% + pyramid top + hero center → lower band populated, no dead zone.

### Scene 3 — Beat 3 (frames 397–493) · first gap
- Context "PYRAMID → CLEOPATRA" (upper); hero **"~2,500" + "YEARS"** (~340px gold) center.
- **Thick gold segment (≥12px)** grows down spine Pyramid→Cleopatra = **660px** (scale-honest); Space-Mono counter rolls **0→2,500** over ~30f ease-OUT then holds (clamped ≥0); whoosh SFX @397.
- **Frame-fill note:** growing 660px bar spans top→55%, hero number center → strong fill.

### Scene 4 — Beat 4 (frames 493–592)
- Context "THE MOON LANDING" + small "Space Age" (upper); hero **"1969"** (~340px ice-blue) center, year-stamp shake; tick SFX @493.
- Focus drops to BOTTOM node — **~360px moon disc** + ~120px rocket & launch-flash; era label "Space Age" bottom-right. Gold gap stays visible above.
- **Frame-fill note:** moon motif bottom + hero center + retained gold gap → full height used.

### Scene 5 — Beat 5 (frames 592–702) · second gap
- Context "CLEOPATRA → MOON" (upper); hero **"~2,000" + "YEARS"** (~340px ice-blue) center.
- **Thick ice-blue segment (≥12px)** grows down Cleopatra→Moon = **540px**, collinear below the gold on the same spine so blue is **visibly shorter**; counter rolls **0→2,000** ease-OUT then holds (clamped ≥0); whoosh SFX @592.
- **Frame-fill note:** both segments now on spine (660 gold above 540 blue), hero center → no dead zone. **Scale-honest: 660:540 = 1.22 = 2,491:2,038, computed from the values.**

### Scene 6 — Beat 6 PAYOFF (frames 702–855)
- Hero "She's **~450 YEARS** closer" (~340px) → "to the **Moon landing**" → "than the **Pyramids**"; "~450" overshoots in; reveal hit SFX @702.
- **Shared-baseline comparison:** the two gaps render as two bars from a shared baseline at the Cleopatra node — gold up (660px), blue down (540px) — so the ~450-yr difference reads at a glance; shorter blue segment **glow-pulses** through the dwell; "2,500" vs "2,000" flash; Cleopatra node **nudges down** toward the Moon. Quiet glowing hold.
- **Frame-fill note:** comparison bars + payoff hero + pulsing glow fill the frame; core mechanic (two unequal bars) is the most prominent thing on screen.

### Scene 7 — Loop-back (frames 855–930)
- Cross-dissolve (75f, linear) back to the **exact Scene 0 / frame-0 composition** — same gradient, timeline preview, kicker + hook lines in identical position/scale/color. Music swells (864) then fades to 0 by 930. Frame 930 == frame 0 → seamless auto-loop. Silent tail.

## Captions (from `vo-timing.json` integer word frames)
Word-by-word; show each word's `display`; highlight the active word; off-white body with the accent color on the hero number/word per beat (gold ancient side, ice-blue modern side). **Consecutive words sharing a `display` are merged into ONE token** (a number/abbrev expands to several spoken words but renders once). Safe zone: y 154–1632, x 60–1020, out of the timeline-node lane. Frames:

- **Hook (0–109):** Cleopatra 0–19 · lived 19–27 · closer 27–40 · in 40–43 · time 43–53 · to 53–57 · you 57–64 · than 64–67 · to 67–70 · the 70–73 · Great 73–81 · Pyramids 81–109
- **Beat 1 (109–259):** The 112–115 · Great 115–124 · Pyramid 124–137 · was 137–142 · finished 142–152 · around 152–162 · **2560 162–191** · **BC 191–214** · for 217–221 · the 221–224 · pharaoh 224–237 · Khufu 237–259
- **Beat 2 (259–397):** Cleopatra 266–292 · Egypt's 296–307 · last 307–316 · queen 316–334 · was 336–342 · born 342–350 · in 350–355 · **69 355–375** · **BC 375–397**
- **Beat 3 (397–493):** That's 397–402 · about 402–411 · **~2,500 411–446** · years 446–457 · after 457–465 · the 465–467 · pyramid 467–493
- **Beat 4 (493–592):** The 498–501 · first 501–511 · Moon 511–520 · landing 520–534 · was 534–540 · in 540–544 · **1969 544–592**
- **Beat 5 (592–702):** Cleopatra 596–616 · was 616–621 · born 621–631 · only 631–642 · **~2,000 642–662** · years 662–673 · before 673–684 · that 684–702
- **Beat 6 (702–855):** So 705–711 · she's 711–717 · roughly 717–728 · **450 728–758** · years 758–768 · closer 768–782 · to 782–785 · the 785–789 · Moon 789–800 · landing 800–815 · than 815–819 · to 819–823 · the 823–827 · pyramids 827–855

(Caption `display` strings follow the script's on-screen styling — e.g. spoken "2,500" renders "~2,500", "2560"+"BC" render "2560 BC". The frames above are copied verbatim from `vo-timing.json`, merging same-display runs.)

## Audio (VO is the lead — music ducks under it)
- **VO:** `staticFile('vo.wav')` @ `volume={0.95}`, starts frame 0 (the lead; speaks from the first frame).
- **Music bed:** `public/<dark-tension-track>.mp3` with a frame-callback `volume` reading the `vo-timing.json` `envelope`: **0.22 across 0→855** (single merged speech region — continuous narration keeps the bed ducked under the VO), ramp **0.22→0.72 over 855→864** (release), **0.72 through 864→930** (swell carrying the silent tail), plus a short fade toward 0 by 930 for a clean loop seam.
- **SFX** (`public/`, from `04-audio.md`): tick @109, @259, @493 (vol 0.60); whoosh @397, @592 (vol 0.50); low reveal hit @702 (vol 0.95).
- **Master (final step):** two-pass `loudnorm` on the rendered `out.mp4` → **-14 LUFS / ≤ -1 dBTP / LRA 11**, then verify. (Re-measure for v4; the bed+VO mix differs from v3.)

## Loop-back
Frame 930 composition == frame 0 (hook). Cross-dissolve 855→930; audio silent on the seam. Auto-loop invisible.

## Assumptions made (where the script was vague)
- Year-stamp SFX placed at each beat's start frame (where the year word begins per `vo-timing.json`), not mid-beat.
- The shared-baseline comparison (Beat 6) is rendered in addition to the collinear-on-spine view, both proportional — chosen to make the ~450-yr gap unmistakable (design §5).
- Caption `display` styling ("~2,500", "2560 BC") follows the script's on-screen text; the VO `display` tokens are the word source and same-display runs are merged.
