# F-004 — Visual Assets (spec)

**Style:** `effective_style: kinetic-typography`
**Palette direction:** warm honey-amber on a deep amber-brown gradient — NOT flat single-hex.

---

## Fonts

- **Display / hero:** Anton, weight 400 (the face is inherently condensed bold) — `@remotion/google-fonts/Anton`
  Why it fits: Anton's ultra-compressed all-caps letterforms read IMPACT at arm's length on a phone. The tight tracking maximises punch on short words like `HONEY` and `ONE FOOD` — which is exactly the hero beat this channel runs on. Consistent with F-001/F-002/F-003 (same face).

- **Body / stat chips:** Archivo Black, weight 900 — `@remotion/google-fonts/ArchivoBlack`
  Used for supporting fragments (`acidic + peroxide`, `~0% water`, `crystals ≠ spoiled`) where Anton would be too domineering. Slightly wider letterform still reads authoritative.

- **Mono / tabular (if count-up):** Space Mono, weight 400 — `@remotion/google-fonts/SpaceMono`
  Tabular figures keep digit-column widths fixed during count-up animations. Tighten letter-spacing to `−0.04em` on large numbers (≥120px) — wide default mono tracking reads dated at hero scale.

---

## Palette (hex)

| Role | Hex | Notes |
|------|-----|-------|
| Background top | `#2B1200` | Deep amber-brown, almost mahogany |
| Background bottom | `#5C2800` | Warm dark sienna — gives the vertical gradient depth |
| Depth accent (radial glow) | `#8B4A00` @ 30% opacity | Warm amber breathing glow, centred behind the jar motif |
| Hero text / primary | `#FDF3DC` | Off-white warm parchment — max contrast on dark amber bg |
| Accent / stat chips | `#F5B731` | Honey-gold — real chroma, high saturation, anchors the palette |
| Reveal / payoff | `#FFD966` | Lighter amber-gold for `STILL PRESERVED` and the Lottie check |
| Caution / caveat (beat4) | `#E07B39` | Warm orange-amber for `keep it sealed` / `crystals ≠ spoiled` nuance |

**Background depth spec (never flat single-hex):**
- Primary: CSS vertical linear gradient `#2B1200` (top) → `#5C2800` (bottom)
- Radial glow layer: `#8B4A00` ellipse ~800×1100px centred ~40% down, opacity 30% — warms the jar zone without flattening the gradient
- Optional grain wash: SVG `feTurbulence` noise at 3% opacity on a `#F5B731` layer — gives the amber a slightly organic, crystalline texture evoking actual honey

**Caption contrast check:** `#FDF3DC` on `#2B1200` ≈ 15.5:1. Passes WCAG AAA.
Pops on a phone at arm's length? Yes — warm parchment text on near-black mahogany is one of the highest-contrast warm combinations available; the honey-gold accent pops further because it has real chroma vs the neutral bg.

---

## Motion signature

Consistent with the Fathom channel signature established in F-001/F-002/F-003:

- **Word slam-in (hero):** spring entrance, `stiffness: 220, damping: 18`, scale 0.6→1.0, frames 0→8f. Primary entrance for `ONE FOOD`, `NEVER EXPIRES`, `HONEY`.
- **Stat chip pop:** `easeOutBack` spring, scale 0.5→1.05→1.0 over 10f, then hold. Used for `~0% water`, `acidic`, `+ peroxide`, `microbes die`.
- **Reveal wipe (beat3 payoff):** horizontal mask wipe from left on `STILL PRESERVED`, 12f easeOut — reveals the text as the word "preserved" is spoken (frame 611).
- **Jar fill animation (beat1):** a filled silhouette jar shape (SVG path) animates from 0% fill height to 100% using a `clipPath` or `borderRadius` mask, 24f easeOut, honey-gold `#F5B731` fill rising from the bottom.
- **Cross-dissolve loop return:** opacity 1.0 → 0 over frames 840→870, simultaneous with hook elements fading back in 855→885 for a smooth loop seam. Identical approach to F-001.
- **Count-up (if used for "1000s of years"):** 24f, ease-OUT (fast start, decelerates to land), `interpolate(frame, [0, 24], [0, 1000])`, then hold. Do NOT slow-start.

---

## Visual richness (earn the frame)

- **Depth bg:** vertical gradient `#2B1200 → #5C2800` + centred radial `#8B4A00` glow + optional grain noise layer. Never flat single-hex.
- **Large motif — honey jar silhouette:** a centred SVG vector jar shape, ~500–600px tall, positioned in the center/lower-center band. The jar uses a warm dark fill (`#3D1A00`) from frame 0 with a lit amber stroke (`#F5B731` @ 60%) so it reads as an intentional shape, not dead silhouette, from the first frame. On beat1 the interior fills with honey-gold via an animated clipPath.
- **Hero type ≥ 280px:** `ONE FOOD` on hook at Anton ~320px; `HONEY` on beat1 at Anton ~380px; `STILL PRESERVED` on beat3 at Anton ~290px.
- **Upper/center/lower band layout:**
  - Upper band (y ~5–25%): beat label / context text (`ANCIENT EGYPT`, `THOUSANDS OF YEARS OLD`)
  - Center band (y ~30–60%): hero word + jar motif
  - Lower band (y ~60–75%): stat chips / supporting fragments
  - Caption zone (y ~80–95%): burned-in word-by-word captions only — all hero type stays above

---

## Per-beat visual asset notes

| Beat | Frames | Key visual | Motion |
|------|--------|------------|--------|
| hook | 0–109 | `ONE FOOD` (upper center, ~320px Anton), `NEVER EXPIRES` (~260px, lower center), jar silhouette bg | Slam-in at f=0 (thumbnail = full opacity, no fade); jar silhouette already present |
| beat1 | 109–287 | `HONEY` (~380px Anton, honey-gold), jar fills with animated gold clipPath from bottom; `~0% water` chip | `HONEY` slams at f=111; jar fill starts f=115; chip pops at f=194 |
| beat2 | 287–452 | Two stat chips: `ACIDIC` (left) + `H₂O₂` (right); `MICROBES DIE` resolves below | Chips pop in with easeOutBack stagger 6f apart; `MICROBES DIE` wipes in at f=406 |
| beat3 | 452–638 | Context text `ANCIENT EGYPT` upper band; `1000s of YEARS OLD` center; `STILL PRESERVED` wipes in + Lottie check draws at f=611 | Reveal wipe + Lottie accent (see Lottie accents section); swell on payoff |
| beat4 | 638–840 | `KEEP IT SEALED` with lid-snap motion; `CRYSTALS ≠ SPOILED` in caution amber `#E07B39` | Lid snap (scale bounce 1.0→1.15→1.0, 8f); text settles; returns toward hook layout by f=820 |
| loop | 840–915 | Cross-dissolve back to hook's `ONE FOOD / NEVER EXPIRES` hero | Dissolve 840→870; hook composition fully present by f=885 |

---

## Icons / background

- **Jar silhouette:** hand-defined SVG path (pure vector, no external download required). Build inline in the Remotion scene using `<svg>` with a bezier path approximating a classic round-shouldered honey jar with a neck and lid. No trademark shapes. No logos. No faces. No photo references.
  - Screened: no logos, no identifiable faces, no trademark shapes.
  - License: entirely code-generated, no external source required.

- **Phosphor Icons (MIT)** — optional for the lid icon on beat4, if needed: https://phosphoricons.com — MIT license, free commercial use, no attribution required. Render at ≥200px, not as a tiny marker.

---

## Lottie accents

| beat | source | placement | sizePx | frame window | fps |
|------|--------|-----------|--------|--------------|-----|
| beat3 | generate:check | above-captions | 320 | [611, 638) | 30 |

**Generated file:** `output/F-004-honey-never-spoils/assets/accent-beat3.json`
- Color: `#F5B731` (honey-gold — matches the accent palette entry)
- Size: 320×320px canvas
- Duration: 22 frames @ 30fps (~0.73s) — draws circle (f 0–12) then tick (f 9–20), holds completed check through f 22
- Frame window mapping: the Remotion `<Lottie>` component starts this animation at scene-local frame 611 (when the word "preserved" begins, per vo-timing.json) and runs through beat3 end (f 638). The 22f animation completes by f 633, holding the finished check for the remaining 5 frames before beat4 cuts.
- Placement: centered in the upper-center band, clear of the caption zone (bottom 15%) and the very top (top 5%). Recommended position: x=540px, y=420px from top-left of the 1080×1920 canvas (well within the safe area, above the caption strip).

**Route-A reject screen (for reference — generating, not sourcing, so all pass):**
- Embedded raster images (PNG/JPEG assets in JSON): NONE — generated entirely from vector shapes
- Non-embedded fonts (text `t` layers): NONE — no text layers, only shape layers (`ty:4`)
- Expression-driven layers (`x` / expression fields): NONE — all properties are standard `{a, k}` value objects
- Nested precomps (`ty:0`) whose `fr` differs from top-level `fr`: NONE — no precomp assets
- License incompatibilities: NONE — code-generated, no external IP

**Recolor note:** the color is baked at generate-time (`#F5B731`). Runtime recolor would require a dotLottie theme layer or a JSON patch. For F-004 the baked color is correct — no runtime recolor needed.
