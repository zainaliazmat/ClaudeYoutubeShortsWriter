# F-002 — Remotion Composition Prompt (VO-driven)

- Composition id: `F-002-trex-closer-than-stegosaurus` · 1080×1920 · 30fps · **durationInFrames: 720** (= `vo-timing.json` `total`; 24s) via `calculateMetadata`.
- Frames 0-indexed, half-open, contiguous per the VO-patched frame map in `02-script.md`. Loop tail 645–720 silent; frame 720 == frame 0.

## Design tokens
- **Fonts:** Anton (hook/year stamps/hero/payoff), Space Mono (count-up digits).
- **Colors:** bg gradient `#0B1430` (top) → `#1C2A55` (bottom); hero glow `#2E4A8C` @35%; nebula `#3A2C6B` @12%; text `#F4F1E8`; gold `#F2B53C` (ancient/Stego→T.rex); ice `#6FD3FF` (modern/T.rex→today); spine `#5B6BA8`.
- **Background (all frames):** gradient + breathing radial glow + nebula + drifting stars (lib `Background`). Never flat single-hex.
- **Motion:** lib `motion` (slam-in, hero overshoot, year-stamp shake, segment grow, count-up ease-out clamp≥0, payoff glow, cross-dissolve).

## Spatial frame
Vertical deep-time spine (y 300→1500, 8 px/My over 150 My): Stegosaurus node TOP (150 Mya, y300),
T. rex node ~56% down (66 Mya, y972), TODAY/HUMANS node BOTTOM (y1500). Gap1 (Stego→T.rex)=672px (84 My);
Gap2 (T.rex→today)=528px (66 My) → 672:528 = 1.27 = 84:66 (scale-honest, computed from the values).

## Scenes (frame-exact)
- **hook (0–95):** kicker "DEEP TIME" (gold); hero "closer to **YOU**" (off-white, "YOU" punches in); "than to Stegosaurus" (gold). Faint full spine preview.
- **beat1 (95–206):** kicker "STEGOSAURUS · LATE JURASSIC"; hero "150 MYA" (~340px gold) center, year-stamp shake; tick @95. Stego node lights TOP.
- **beat2 (206–306):** kicker "TYRANNOSAURUS REX"; hero "66 MYA" (~340px gold) center, year-stamp shake; tick @206. T. rex node lands ~56% down.
- **beat3 (306–395):** kicker "STEGOSAURUS → T. REX"; hero count-up **0→84** + "MILLION YEARS" (gold) ease-out ≤36f; gold segment grows 672px Stego→T.rex; whoosh @306.
- **beat4 (395–447):** kicker "AND TO TODAY"; hero "HUMANS" (ice); TODAY node lights BOTTOM.
- **beat5 (447–518):** kicker "T. REX → TODAY"; hero count-up **0→66** + "MILLION YEARS" (ice); ice segment grows 528px T.rex→today (collinear, visibly shorter than gold); whoosh @447.
- **beat6 PAYOFF (518–645):** "T. REX is **~18M years** CLOSER to **YOU**"; two bars from the T. rex node — gold up 672px, ice down 528px — shorter ice glow-pulses; reveal hit @518. Quiet glowing hold.
- **loop (645–720):** cross-dissolve back to the frame-0 hook composition. Music swells (654) then fades to 0 by 720. Silent tail.

## Captions (from vo-timing.json word frames; merge same-display runs)
Word-by-word, off-white body; numerics carry the side accent (gold beat1–3, ice beat4–6). Hero numbers:
150 (beat1, merged 143–168), 66 (beat2, 248–268), 84 (beat3, 333–351), 66 (beat5, 464–484).

## Audio (VO lead; bed ducks)
- VO `staticFile('vo.wav')` @0.95 from frame 0.
- Music bed envelope: 0.22 across 0→645 (single speech region), 0.22→0.72 over 645→654, 0.72 hold, fade to 0 by 720.
- SFX: tick @95, @206; whoosh @306, @447; reveal hit @518.
- Master: two-pass loudnorm → -14 LUFS / ≤ -1 dBTP (render loop does this).
