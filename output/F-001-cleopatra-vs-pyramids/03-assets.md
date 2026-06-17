# F-001 — Visual Assets (spec) — v4 (VO-driven)

> Kinetic typography, 1080×1920 @ 30fps, **930 frames (31s)** — durationInFrames from `vo-timing.json` (Kokoro VO).
> **v4 carries the v3 visual overhaul** (navy→indigo gradient bg + radial glow + nebula, hero type ~340px Anton, ~360px filled pyramid/moon motifs, thick growing comparison segments) **and adds the design-§5 denser visuals** so the ~31s VO never reads as static: **date ticks + era labels along the spine**, a **shared-baseline comparison** on the payoff, and a **brighter rest-state pyramid** (lit from frame 0, not muddy). Facts unchanged.
> All assets are spec-only — no downloads. All sources are logo-free and contain no identifiable faces.

---

## Fonts

- **Display / hero (high-impact — hook line, year stamps, hero numbers, payoff):**
  Family: `Anton`, weight 400 (Anton ships a single ultra-heavy weight)
  Remotion package: `@remotion/google-fonts/Anton`
  Source: https://fonts.google.com/specimen/Anton — file: `ofl/anton/Anton-Regular.ttf` in google/fonts
  License: SIL Open Font License 1.1 (OFL) — free, self-hostable, no on-screen attribution required. Verified: lives under `ofl/` in the Google Fonts repo.
  Use: the hook lines ("Cleopatra is closer to YOU / than the Pyramids"), all hero years ("2560 BC", "69 BC", "1969"), the gap words ("~2,500 YEARS", "~2,000 YEARS"), and the "~450 YEARS CLOSER" payoff.
  Rationale: Anton is a single ultra-condensed black display face — it fills horizontal space and goes huge (~340px) without overflowing the 1080px width, giving the poster-weight "monument" presence the timeline payoff needs. One unmistakable signature face = defensible Fathom look.

- **Numeric / mono (count-up counters only — the rolling 0→2,500 / 0→2,000 digits):**
  Family: `Space Mono`, weights 400 (Regular) and 700 (Bold)
  Remotion package: `@remotion/google-fonts/SpaceMono`
  Source: https://fonts.google.com/specimen/Space+Mono — file: `ofl/spacemono/` in google/fonts
  License: SIL Open Font License 1.1 (OFL) — free, self-hostable.
  Use: the live count-up readouts during Beats 3 and 5 so the digits keep a fixed advance and don't jitter width as they roll.
  **Tighten tracking on the large numbers:** apply `letter-spacing: -0.04em` to the big count-ups. Space Mono's default mono advance is wide and reads dated at hero scale — negative tracking pulls the digits into a tight, modern block. The *final* settled hero number (e.g. "~2,500 YEARS") sets in **Anton**, not mono; mono is only the rolling counter.

---

## Palette (hex)

Background is a **vertical gradient with depth layers** — never a flat single-hex. Accent (gold) and reveal (ice-blue) both carry real chroma so the decorative layer reads as intentional design.

| Role | Hex | Notes |
|------|-----|-------|
| Background — top | `#0B1430` | Deep navy (Pyramid / ancient end, anchored at frame top) |
| Background — bottom | `#1C2A55` | Indigo (Moon / modern end, anchored at frame bottom). Linear gradient top→bottom over full 1920px height. |
| Hero radial glow | `#2E4A8C` @ ~35% opacity | Soft 900px-radius radial behind the center hero element; lifts the number off the bg and kills dead space |
| Nebula wash | `#3A2C6B` @ ~12% opacity | One faint large off-center blurred blob (upper-left) for cosmic texture — barely there, never competes with text |
| Primary text / captions | `#F4F1E8` | Warm off-white — clean on the indigo without harsh blue-cast |
| Accent — gold (ancient / Pyramid side) | `#F2B53C` | Saturated antique gold — real chroma, glows against navy; hero years/segments on the Pyramid→Cleopatra side |
| Reveal — ice blue (modern / Moon side) | `#6FD3FF` | Bright ice-blue — strong cold chroma; "1969", Cleopatra→Moon segment, Beat 6 payoff pulse |
| Timeline stroke | `#5B6BA8` | Lit indigo-blue, **≥12px** thick visible rule (NOT a 1–2px hairline) — reads as a real spine, not a scratch |

**Caption / hero contrast check (against the mid-gradient ~`#13204A`):**
- `#F4F1E8` text on gradient → ≈ 13.5:1 — passes WCAG AAA (min 7:1).
- `#F2B53C` gold on gradient → ≈ 8.6:1 — passes WCAG AA Large / AAA Large.
- `#6FD3FF` ice-blue on gradient → ≈ 9.9:1 — passes WCAG AA Large / AAA Large.

**Pops on a phone at arm's length?** Yes — warm off-white and saturated gold/ice-blue sit on a deep-but-not-black gradient at 8–13:1, so hero numbers and the two segments separate instantly even at 5cm tall on a phone in daylight; the glow + nebula keep the frame from ever reading as empty black.

---

## Motion signature

All animations Remotion `spring()` / `interpolate()` (no CSS keyframes) unless noted. These are the repeatable Fathom signature.

| Behavior | Usage in this video | Type | Duration | Spring / easing | Scale / opacity |
|----------|-------------------|------|----------|----------------|-----------------|
| **Word slam-in** | Caption words, context kickers | `spring()` translateY + opacity | 8f | tension 200, damping 22 | Y: +48px → 0, opacity 0→1 |
| **Hero overshoot** | "YOU" (Hook), "~2,500" (B3), "~2,000" (B5), "~450" (B6) hero set in Anton | `spring()` scale + opacity | 12f | tension 200, damping 13 (overshoots to ~1.10 → settles 1.0) | scale 0.55→1.0, opacity 0→1 |
| **Year-stamp shake** | "2560 BC" (B1), "69 BC" (B2), "1969" (B4) — stone/impact feel | `spring()` translate micro-shake (3 cycles, ±5px), then lock | 12f total | tension 420, damping 28 | translateX/Y oscillate → settle |
| **Segment grow** | Pyramid→Cleopatra gold bar (B3, 660px), Cleopatra→Moon ice-blue bar (B5, 540px) | `spring()` scaleY on a **≥12px-wide** filled bar anchored at its top node | 28–34f | tension 130, damping 24 | scaleY 0→1 (grows *down* the timeline) |
| **Count-up** | Beats 3 & 5 rolling digits (Space Mono) | `interpolate(frame,[start,start+30],[0,target],{easing: Easing.out(Easing.cubic)})` then **hold** | **30f ease-OUT**, then static hold to beat end | fast start, decelerate, land — NOT full-beat | value `Math.max(0, …)` — **clamped ≥ 0** |
| **Payoff glow pulse** | B6 shorter ice-blue segment + "~450" number | `interpolate` text-/box-shadow blur, sinusoidal | continuous over the 165f dwell (~3 cycles) | sine, never static | shadow blur 4→18→4px, glow opacity 0.55→1.0→0.55 |
| **Node nudge** | B6 Cleopatra marker eases visibly downward toward Moon | `spring()` translateY | 18f | tension 110, damping 20 | Y +0 → +28px |
| **Cross-dissolve loop** | Loop-back 765–840 → exact Hook composition | `interpolate` opacity: Beat-6 layer 1→0, Hook layer 0→1 | 75f | linear | seamless; frame 840 == frame 0 |

**Background motion:** parallax star field — ~70 dots sized **2–4px** in `#F4F1E8` at 25–60% opacity scattered across 1080×1920, drifting +2px/sec upward via `interpolate`. Single `<svg>` layer behind the glow. The hero radial glow softly breathes (scale 1.0↔1.04 over ~120f) so the bg is never frozen.

---

## Visual richness (earn the frame)

- **Depth bg:** vertical navy→indigo gradient (`#0B1430`→`#1C2A55`) + ~900px radial hero glow (`#2E4A8C` @35%) + faint upper-left nebula wash (`#3A2C6B` @12%) + drifting 2–4px star field. No flat black anywhere; no beat leaves a >40% empty zone (script "Look & feel").
- **Large motif elements (filled silhouettes, NOT line-icons):**
  - **Pyramid silhouette ~360px** — solid gold-fill (`#F2B53C`, ~85% opacity) triangle anchoring the **TOP** node of the vertical timeline, soft gold glow beneath. Present in Hook, Beat 1, and as the top reference through Beats 3/6.
  - **Moon disc ~360px** — solid pale-`#6FD3FF`/off-white radial-fill circle with subtle crater shading anchoring the **BOTTOM** node, soft ice glow. Present in Hook, Beat 4, Beat 6. A small rocket + launch-flash sits beside it in Beat 4 (scaled ~120px, not tiny).
- **Hero-scale type:** primary years/words at **~340px** Anton (script spec), stepping down to ~90–120px context kickers and ~64px captions — a clear three-tier hierarchy that dominates the frame.
- **Comparison beats use thick growing bars:** the gold (660px) and ice-blue (540px) segments are **≥12px-wide filled bars that grow proportionally** (true 1.22 ratio), sitting side by side in Beat 6 so the blue is *visibly shorter* — no hairline strokes for the data-viz.

## Denser visuals (design §5 — fill the frame across the VO)
- **Date ticks along the spine:** faint `#5B6BA8` @ ~45% tick marks (each ~18px wide) at regular intervals down the timeline spine, with small labels at the anchors only (2560 BC top, 1969 bottom, 69 BC at the Cleopatra node). Fills the right band the v3 layout left sparse; computed from the same px/yr scale (0.265 px/yr) so ticks are scale-honest, not decorative noise.
- **Era labels:** `#F4F1E8` @ ~70%, ~52px, set beside the spine — **"Old Kingdom"** near the pyramid (Beat 1), **"Ptolemaic"** near the Cleopatra node (Beat 2), **"Space Age"** near the Moon (Beat 4). They ride in with the node they annotate and persist faintly, giving the empty right band semantic content.
- **Shared-baseline comparison (Beat 6 payoff):** in addition to the collinear-on-spine view, the payoff briefly renders the two gaps as **two bars from a shared baseline at the Cleopatra node** — gold up (660px), blue down (540px) — so the ~450-yr difference reads at a glance as two unequal bars, not just a single longer line. Both proportional to the values.
- **Brighter rest-state pyramid:** the pyramid silhouette is a **lit warm-gold fill from frame 0** (`#F2B53C` ~85%, soft glow), not a muddy dark-brown that only lights on the payoff (the v3 render note). The moon disc is likewise pale-lit at rest.

---

## Icons / background

The **pyramid and moon are large filled CSS/SVG silhouettes** (drawn in Remotion, ≥360px) — NOT icon-set glyphs. Only the small Beat-4 rocket comes from an icon set.

- **Pyramid silhouette** — pure SVG `<polygon>` (filled triangle), `#F2B53C`. No source needed; hand-drawn shape. Screened: generic geometric form, no trademark.
- **Moon disc** — pure SVG `<circle>` with a radial-gradient fill + a couple of low-opacity crater circles. No source needed. Screened: generic, no trademark, no identifiable face/"man in the moon" likeness.
- **Rocket (Beat 4 only, ~120px)** — `Rocket` from **Lucide** (`lucide-react`, ISC ≈ MIT — https://github.com/lucide-icons/lucide), stroke/fill `#6FD3FF`, launch-flash via opacity 0→1 over 6f. Free for commercial use, no attribution required. Screened: generic symbol, no logo/face.
- **Timeline spine** — pure CSS `<div>`, **≥12px wide**, `#5B6BA8` with a soft glow, running the full safe height (y≈260–1660) so it fills the tall frame. The pyramid sits at its top end, the moon at its bottom end; the Cleopatra node sits at 55% down.

**Screening result:** no brand logos, no trademarked symbols, no identifiable real faces, no photographic/stock imagery anywhere. All shapes are generic geometry or OFL/ISC-licensed. Safe to use and monetize.
