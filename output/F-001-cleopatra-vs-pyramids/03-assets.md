# F-001 — Visual Assets (spec)

> Kinetic typography, 1080×1920 @ 30fps, 840 frames (28s).
> Theme: deep night-sky timeline with two bracket/counter reveals and big hero numbers.
> All assets are spec-only — no downloads. All sources are logo-free and contain no identifiable faces.

---

## Fonts

- **Display / heading (hook text, beat labels, hero words):**
  Family: `Space Grotesk`, weights 700 (Bold) and 800 (ExtraBold)
  Remotion package: `@remotion/google-fonts/SpaceGrotesk`
  Source: https://fonts.google.com/specimen/Space+Grotesk
  License: SIL Open Font License 1.1 — free, self-hostable, no attribution required on screen
  Use: all on-screen caption text, beat titles, "YOU" / "Pyramids" / "Moon landing" labels.
  Rationale: heavy grotesque with slightly quirky mono-influenced terminals — pairs the night-sky mood and reads cleanly at large sizes; distinguishable at small caption sizes.

- **Numeric / mono (counter ticks, year stamps, hero numbers):**
  Family: `Space Mono`, weight 400 (Regular) and 700 (Bold)
  Remotion package: `@remotion/google-fonts/SpaceMono`
  Source: https://fonts.google.com/specimen/Space+Mono
  License: SIL Open Font License 1.1 — free, self-hostable
  Use: the count-up counters (0→2500, 0→2000), year stamps "2560 BC" / "69 BC" / "1969", and the "~450 YEARS" payoff number. Monospace ensures digits don't shift width during count-up animation — no layout jitter.

---

## Palette (hex)

| Role | Hex | Notes |
|------|-----|-------|
| Background | `#07090F` | Near-black deep navy — "night sky" base |
| Primary text / captions | `#F0EDE6` | Warm off-white — avoids harsh blue-cast on OLED screens |
| Accent / highlight (hero numbers + bracket) | `#C8A84B` | Antique gold — reads "ancient/time" without being garish |
| Reveal / payoff glow | `#7EC8E3` | Ice blue — used only on Beat 6 payoff pulse and the Moon-side bracket; cold vs warm contrast reinforces the time-distance idea |
| Timeline rule + bracket stroke | `#3A3D4A` | Mid-grey — subtle enough to not compete with text |

**Caption contrast check:**
`#F0EDE6` on `#07090F` → approx 18.3:1 — passes WCAG AAA (minimum 7:1).
`#C8A84B` on `#07090F` → approx 8.1:1 — passes WCAG AA Large.
`#7EC8E3` on `#07090F` → approx 10.4:1 — passes WCAG AA Large.

---

## Motion signature

All animations are Remotion spring-based (no CSS keyframes) unless noted. These become the repeatable Fathom signature across episodes.

| Behavior | Usage in this video | Type | Duration | Spring / easing | Scale / opacity |
|----------|-------------------|------|----------|----------------|-----------------|
| **Word slam-in** | Caption words, beat titles | `spring()` translateY + opacity | 8f | tension 180, damping 20 | Y: +40px → 0, opacity 0→1 |
| **Hero number overshoot** | "YOU" (Hook), "~2,500" (Beat 3), "~2,000" (Beat 5), "~450" (Beat 6) | `spring()` scale + opacity | 10f | tension 200, damping 14 (slight overshoot to 1.08 → 1.0) | scale 0.6→1.0, opacity 0→1 |
| **Year stamp + stone shake** | "2560 BC" (Beat 1), "69 BC" (Beat 2), "1969" (Beat 4) | `spring()` translateX micro-shake (3 cycles, ±4px), then lock | 12f total | tension 400, damping 30 | translateX oscillate then settle |
| **Counter tick (count-up)** | Beats 3 and 5, 0→2500 and 0→2000 | `interpolate(frame, [start, end], [0, target])` with easeInOutCubic | Full beat duration (120f / 120f) | easeInOut — starts slow, accelerates, lands hard | n/a (numeric value only) |
| **Bracket stretch** | Pyramid→Cleopatra (Beat 2→3), Cleopatra→Moon (Beat 5) | `spring()` scaleX on a 1px-tall line anchored left | 30f | tension 120, damping 22 | scaleX 0→1 |
| **Payoff glow pulse** | Beat 6, shorter bracket + "~450" number | CSS `box-shadow` / text-shadow animated via `interpolate` | 20f loop (3 cycles in 165f) | sinusoidal — shadow blur 0→12px→0 | opacity 0.6→1.0→0.6 |
| **Dissolve to loop** | Loop-back (frames 765–840) | `interpolate` opacity of all Beat 6 elements 1→0; Hook elements 0→1 | 75f | linear | opacity 1→0 / 0→1 cross-dissolve |

**Background star field:** static SVG dot grid (white dots, 1–2px, ~80 dots scattered across 1080×1920), `transform: translate` drifts +2px Y per second via `interpolate` — barely perceptible, reinforces "cosmic" depth without distraction. Implemented in Remotion as a single `<svg>` layer.

---

## Icons / background

All icons from **Lucide React** (`lucide-react` npm package).
License: ISC (functionally MIT) — https://github.com/lucide-icons/lucide — free for commercial use, no attribution required on screen.

Screened: Lucide icons are generic geometric/symbolic SVGs. No brand logos, no trademarked symbols, no identifiable faces. Safe to use.

| Icon | Lucide name | Used in beat | Rendering notes |
|------|-------------|-------------|-----------------|
| Pyramid glyph | `Triangle` (tagged "pyramid" in Lucide) | Hook, Beat 1, Beat 6 | Size 48px, stroke `#C8A84B`, positioned hard-left on timeline rule |
| Moon glyph | `Moon` | Hook, Beat 4, Beat 6 | Size 48px, stroke `#7EC8E3`, positioned hard-right on timeline rule |
| Rocket glyph | `Rocket` | Beat 4 | Size 32px, stroke `#7EC8E3`, stacked above `Moon` icon, small launch-flash via opacity 0→1 over 6f |

Usage in Remotion: `import { Triangle, Moon, Rocket } from 'lucide-react'` — render inline as SVG children of a positioned `<div>` inside the Remotion `<AbsoluteFill>`.

**Timeline rule:** a pure CSS `<div>` — 2px height, full width, color `#3A3D4A`, positioned at vertical center (y=960). No imagery. The pyramid/moon glyphs sit ON this rule. The bracket spans between them as a `<div>` with border-bottom `#C8A84B` (left bracket) and `#7EC8E3` (right bracket).

**No photographic or video background.** No stock imagery. No faces. No logos.
