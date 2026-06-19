# F-003 — Visual Assets (spec)

The Fathom signature (deep-ocean palette, heavy display face + mono digits, depth background), tuned
for the **D3 growth-curve** payoff. For an `effective_style: d3` video the chart colors come from the
**accent hue** (the `lib/dataviz` `categoricalRamp`) — so the accent below IS the curve color.

## Fonts
- **Display / hero:** Anton (via `@remotion/google-fonts/Anton`) — the big `23`, `50%`, `99.9%`.
- **Numerics / count-ups:** Space Mono (via `@remotion/google-fonts/SpaceMono`) — stable digit width so
  the percentage count-ups don't jitter. Tighten tracking on big numbers.
- **Captions / labels:** Inter (via `@remotion/google-fonts/Inter`), 600/700.

## Palette (hex)
- **Background:** `#0A1230` → `#1B2C5A` vertical gradient + depth (radial glow `#2A3F7A`, faint nebula
  `#13204A`, star field). NOT flat single-hex (use the lib `<Background>`).
- **Primary text:** `#F2F6FF` (near-white).
- **Accent (curve + ramp source):** `#46C6FF` (vivid ocean cyan — real chroma; drives the D3 curve and
  the categorical ramp). Caption contrast on bg ≈ 11:1 — pops on a phone at arm's length.
- **Reveal / payoff:** `#FFC83D` (gold) — the **50% gridline crossing** and the **23 marker** light gold
  at the payoff (the one warm accent against the cool field = the eye lands on it).
- **Curve fill:** accent at ~0.18 opacity under the stroke.

## Motion signature
- `heroOvershoot` — the hero `23` / `50%` / `99.9%` numbers (scale 0.55→1.0, overshoot).
- `countUp` (≤36f, ease-out then hold, clamp ≥0) — each percentage counts up as its node lights.
- **Curve reveal** — the D3 `GrowthCurve` grows left→right across beats (interpolate the reveal cutoff
  `t(frame)`, NOT a transition); nodes pop with a small `heroOvershoot` as the curve reaches them.
- `payoffGlow` — a soft glow pulse on the gold 50%×23 crossing at the hook + on the 99.9% ceiling.
- Loop-safe: pass `loopSafe` to `<Background>`; the curve collapses back to the 23/50% crossing at the
  tail so frame 834 matches frame 0.

## Visual richness (earn the frame)
- **Depth background** (gradient + glow + nebula + stars) — fills the field, never flat.
- **The curve IS the large motif** — a bold cyan S-curve filling the center band (stroke ≥8px, fill
  beneath), axis ticks at 0/23/50/70, a dashed gold 50% gridline. Not hairlines.
- **Hero type** — `23` and `50%` at ≥300px Anton on the hook.

## Icons / background
- No line-icons. The chart + axes + gold markers are the entire visual system. Layout: context label
  upper band, the curve fills center (y≈300–1200), the hero number + caption lower-center, captions
  clear of the bottom ~15%.

## Boundaries
Spec only — no downloads. The accent `#46C6FF` is the single source the D3 categorical ramp derives
from; codegen passes it to `lib/dataviz`.
