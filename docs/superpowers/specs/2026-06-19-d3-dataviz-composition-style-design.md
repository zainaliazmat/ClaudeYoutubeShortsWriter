# Design — D3 data-viz composition style (Phase 2 of the "living motion graphics" program)

**Date:** 2026-06-19
**Status:** Approved (brainstorming session, zain-ali) — ready for implementation plan.
**Author:** brainstorming session (zain-ali)
**Predecessor:** `docs/superpowers/specs/2026-06-19-remotion-style-selector-design.md` (Phase 1 — the
reference skill + determinism rules this phase implements against). Phase 2 is the first build in
the program that produces **new rendered frames**.

## Context

The Fathom renderer (`render/`) is today a kinetic-typography factory: text + motion only. The
"living motion graphics" program (see the Phase 1 spec) evolves it toward full composition styles,
ordered **D3 → Lottie → GSAP** (Three.js = exploration, not committed). **D3 is Phase 2** — the
highest content fit (the Facts niche already *fakes* data-viz: F-002 hand-builds bars with
`segmentGrow` + count-ups in `render/src/F-002/scenes.tsx`), the cleanest determinism story (pure
SVG), and an immediate quality win.

The renderer already carries the scaffolding D3 slots into:
- `render/src/lib/motion.ts` — every export is a **pure function of a frame number** (springs,
  `countUp`, `loopSafeDrift`). D3 geometry follows the identical shape.
- `remotion-codegen` already enforces a **"Data-viz scale-honesty" quality floor** ("length ratio
  must equal data ratio"). D3 makes that enforceable *by construction* instead of by hand.
- The lib convention: a tested primitive (`Background`, `Captions`) consumed by per-video scene
  `.tsx`. D3 adds a new primitive `render/src/lib/dataviz/` to that convention.

The Phase-1 style-selector skill (`.claude/skills/remotion-style-selector/`) documented the D3
determinism rule (`§4`: "d3 scales/shape generators are pure (good); **forbid `d3.transition()` /
`d3-timer`**; compute paths/scales as pure functions of `frame`") and the availability table
(`d3 = planned`). Phase 2 implements that rule and flips the flag to `available`.

## Goal

Add **D3 as a real, deterministic composition style** the codegen path can produce: a Short whose
dominant visual is a data-viz (growth curve / categorical bars / distribution) with kinetic-typography
captions overlaid, passing the existing render→QA loop and quality floors, and **byte-reproducible on
every render**.

## Decisions locked in brainstorming (do not re-litigate)

1. **Three archetypes**, sharing one scale infrastructure: growth/trend curve, categorical bars,
   distribution.
2. **Scoped deps + a lib primitive:** install `d3-scale` + `d3-shape` only (NOT the `d3` umbrella);
   build `render/src/lib/dataviz/`. Scoping physically excludes `d3-selection`/`d3-transition`/
   `d3-timer` — the wall-clock/DOM modules — so the determinism rule is enforced by "not installed,"
   not by discipline. (Verified via Context7 against the official d3 docs — see Appendix A.)
3. **Selection inlined into `remotion-prompt-generator`** (rule of three — no standalone selector
   skill yet), **recorded inside `05-remotion-prompt.md`** as an `effective_style:` line + chart-spec
   block — no separate `03b-style.md`, no new pipeline step, no new validator. The existing step-6
   reviewer validates it.
4. **Determinism proven on EVERY render** via three layers (unit purity + render-hash + static grep).
5. **Data-can't-be-charted-honestly is handled by defense in depth** (classification → review →
   codegen controlled halt); never a silent text swap.

## Architecture

### 1. The `render/src/lib/dataviz/` primitive (new)

A new shared primitive directory, peer to `Background.tsx` / `Captions.tsx`, holding frame-driven,
pure chart components plus their scale-honesty + color helpers. Structure (final names settled in the
plan):

- `scales.ts` — thin wrappers over `d3-scale` (`scaleLinear`, `scaleBand`, `scaleTime`) returning the
  pure scale objects. Pure number→number maps; no DOM.
- `paths.ts` — frame-driven path builders over `d3-shape` (`line`, `area`, `arc`, `curveMonotoneX` /
  `curveLinear`). Each returns an SVG path **string** (d3-shape's no-context behavior) for a given
  `frame` by feeding a frame-derived domain cutoff into the scales.
- `GrowthCurve.tsx` — `<GrowthCurve series domain range total … />`: an area/line curve revealed by
  `t(frame)` (the curve "grows" left→right as the frame advances). Loop-safe tail.
- `BarChart.tsx` — `<BarChart values labels domain … />`: `scaleBand` x, `scaleLinear` height; bars
  grow via a frame-driven height scale. Categorical colors from a deterministic ramp.
- `Distribution.tsx` — `<Distribution bins … />`: histogram / bell via `scaleLinear` + `area`.
- `scaleHonest.ts` — `scaleHonest(value, ref)` helper + the invariant used by tests: rendered length
  ratio MUST equal data ratio (within float epsilon), unless a labeled transform (e.g. log) is in use.
- `colors.ts` — a deterministic categorical color ramp derived from the palette accent hue (so
  asset-sourcing need not pre-plan N category colors).
- `__tests__/dataviz.test.ts` — the purity + scale-honesty unit tests (runs in `npm run test:lib`).

**Determinism rules the primitive obeys** (from the Phase-1 skill §4):
- Everything a pure function of `frame` / `useCurrentFrame()`. Animate by interpolating the **domain**
  (reveal cutoff, bar height target), never with `d3.transition()`.
- Seeded `random("seed")` only — never `Math.random()` (precedent: `Background.tsx`).
- No `Date.now()` / `new Date()` / `performance.now()` / `requestAnimationFrame`.
- Loop-safe: any persistent chart furniture returns to its frame-0 state at `total` (reuse
  `loopSafeDrift` / `loopSafePulse` from `lib/motion.ts`).
- Duration via `calculateMetadata` — never a `DURATION` const (codegen invariant, unchanged).

### 2. Dependencies

Add to `render/package.json`:
- `d3-scale`, `d3-shape` (runtime).
- `@types/d3-scale`, `@types/d3-shape` (dev).

Explicitly NOT added: `d3` (umbrella), `d3-selection`, `d3-transition`, `d3-timer`, `d3-force`,
`@remotion/three`, `gsap`, `@remotion/lottie`. The static grep guard (below) fails the build if any
forbidden module is imported, so a future `npm i d3` can't silently reintroduce the wall-clock APIs.

### 3. Pipeline wiring (teaching the "d3" branch)

Taught in this order (the Phase-1 §5 maintenance rule: teach downstream BEFORE flipping the flag):

- **`remotion-prompt-generator`** — inline the §2 decision map. Classify the dominant fact shape; if
  row 1 matches (≥3 *sourced* numeric points forming a trend / categories / distribution, comparable
  units), emit into `05-remotion-prompt.md`:
  - a machine-greppable `effective_style: d3` line (else `effective_style: kinetic-typography`),
  - a **chart-spec block**: archetype (curve | bars | distribution), the verified data points
    (value + source ref), domain/range, axis labels, and which beats the chart grows across.
- **`remotion-codegen`** — read the chart spec; import `lib/dataviz/`; wire chart data straight from
  the verified values (scale-honest by construction). Add D3 entries to its shared-library list and
  quality-floor section. Add a **controlled-halt-and-route precondition gate** (see Robustness): if a
  `d3` spec reaches codegen but can't be charted honestly (<3 valid points, etc.), halt with a
  specific routing message — exactly like the existing pre-render asset gate — never a silent swap.
- **`asset-sourcing`** — light touch: a one-line note that for a `d3` video the chart colors come
  from the existing palette (the dataviz primitive derives a categorical ramp from the accent hue;
  no new motif required).
- **`remotion-script-reviewer`** — validate that an `effective_style: d3` decision actually carries
  ≥3 sourced numeric points + a coherent chart spec; otherwise flag for revision (catches
  misclassification *before* render, inside the existing step-6 evaluator-optimizer loop).
- **`remotion-style-selector` §5** — flip `d3` from `planned` → `available` in the single canonical
  table, AFTER all of the above are in place.

No new pipeline step number; no `03b-style.md`; no new validator skill. The style decision lives in
`05-remotion-prompt.md` (prompt-generator owns it, codegen + reviewer + the loop read it).

### 4. Determinism proof (three layers, ALL run on every D3 render)

1. **Pure-function unit tests** (`render/src/lib/dataviz/__tests__/`, in `npm run test:lib`):
   - **Determinism:** same `frame` → byte-identical path string / bar rects across repeated calls.
   - **Scale-honesty:** `length(value) / length(other) === value / other` within float epsilon
     (the codegen scale-honesty floor, now machine-checked).
2. **Render-hash check** (`render/scripts/check-determinism.mjs F-NNN`): render frames `0`, midpoint,
   `total-1` **twice** via Remotion `--frames`, SHA-256 the PNGs, assert each pair is byte-identical.
   Wired into the **codegen gate for any `effective_style: d3` video — runs on every such render.**
   This is the literal byte-reproducibility proof the program demanded.
3. **Static grep guard** (a script in the gate): fail if `lib/dataviz/` or any scene `.tsx` imports
   `d3-transition` / `d3-timer` / `d3-selection`, or uses `Date.now` / `Math.random` / `new Date` /
   `performance.now` / `requestAnimationFrame`.

### 5. Robustness — "d3 is ideal but data can't be charted honestly"

Defense in depth so the codegen backstop almost never fires:

| # | Case | Caught at | Resolution |
|---|------|-----------|------------|
| 1 | Only 1–2 data points | classification (row-1 disqualifier) | → kinetic-typography from the start |
| 2 | A value is unsourced | facts/writer (cite-or-abstain) | drop point if ≥3 remain, else route to writer |
| 3 | Incomparable units on one axis | classification | → kinetic-typography (or a labeled transform) |
| 4 | Huge dynamic range (1, 10, 10000) | primitive | log scale **with a mandatory axis label**; if still unreadable → kinetic-typography |
| 5 | Non-monotonic "curve" | primitive | valid line — `curveLinear` instead of `curveMonotoneX` |
| 6 | Slips through to codegen with <3 valid points | codegen precondition gate | **controlled halt + route** (reclassify in prompt-generator / source in writer), never a silent text swap |

The rationale for halt-not-silent-fallback at #6: a silent swap would render a video that diverges
from what step 6 reviewed as a "d3 video" and would paper over a non-negotiable scale-honesty
violation, breaking the loop's defect attribution. A controlled halt matches the existing
pre-render asset-gate pattern and is rare because layers 1–2 catch nearly everything first.

### 6. CLAUDE.md

Per the Phase-1 decision, the niche-identity line flips to "+ living motion graphics" only **after**
D3 ships *and shows lift* — so that edit is a **follow-up, not part of this build**. This build may add
a "d3 scale-dishonest / wrong-archetype" routing row to the Stage-attribution table (owner: video →
re-run prompt-generator / codegen), and updates the `remotion-codegen` shared-library + quality-floor
sections to mention `lib/dataviz/`.

## Out of scope

- Lottie / GSAP / Three.js styles (later phases / exploration).
- Chart-aware *scripts* (the writer stays style-blind in v1; revisit only if charts need it).
- Moving style selection earlier than `remotion-prompt-generator` (step 3.6 machinery stays deferred).
- A standalone selector skill (extract only at a 3rd style — rule of three).
- The CLAUDE.md niche-identity line rewrite (follow-up, after lift).
- The parametric `compose.json` engine (still backlogged — codegen-first).

## Success criteria

1. `render/src/lib/dataviz/` exists with `GrowthCurve`, `BarChart`, `Distribution` + scale/path/color
   helpers, all pure functions of `frame`, importing only `d3-scale` / `d3-shape`.
2. `d3-scale` + `d3-shape` (+ `@types/*`) are the only new deps; no umbrella `d3`, no
   transition/timer/selection module installed.
3. The three determinism layers exist and pass: unit purity + scale-honesty tests (`test:lib`); a
   render-hash check (`check-determinism.mjs`) wired into the D3 codegen gate and run on **every** D3
   render; a static grep guard in the gate.
4. `remotion-prompt-generator` emits `effective_style:` + a chart-spec block; `remotion-codegen`
   consumes it and imports `lib/dataviz/`; `remotion-script-reviewer` validates the d3 decision;
   `asset-sourcing` notes the palette-derived chart colors.
5. The `d3` flag in the style-selector §5 table is flipped to `available` **only after** 4 is done.
6. An end-to-end `/short` (or a fixture run) produces a passing, byte-reproducible D3 video through
   the existing render→QA loop (≥85, no blockers, Cat 9 ≥70%), with `final.mp4` mastered to
   -14 LUFS / ≤ -1 dBTP — i.e. D3 changes the *visual*, not the loop's bar.
7. Existing kinetic-typography videos render unchanged (the d3 branch is additive; the default path
   is untouched).

## Appendix A — Context7 verification of the pure-import surface (2026-06-19)

Confirmed against the official d3 docs (`/websites/d3js`):
- **`d3-scale`** — `scaleLinear([domain],[range])`, `scaleBand([domain],[range])`, `scaleTime`; each a
  factory returning a callable `scale(value)→pixel` with `.nice()`, `.clamp()`, `.invert()`,
  `.bandwidth()`. Pure number→number; no DOM, no timer, no animation. Transitive deps: `d3-array`,
  `d3-format`, `d3-interpolate`, `d3-time`, `internmap` — none of which is timer/transition/selection.
- **`d3-shape`** — `d3.line().x(fn).y(fn)`, `d3.area()`, `d3.arc()`, curves incl. `curveMonotoneX`.
  `line(data)` returns a path-`d` **string** when no canvas context is attached — so we call it
  ourselves and feed the string to a React `<path d={…}>` with zero d3 DOM involvement. Transitive
  dep: `d3-path` only.

Conclusion: scoping to `d3-scale` + `d3-shape` keeps the genuinely-hard-to-hand-roll math (nice
domains, band widths, area/curve generators) while making the forbidden wall-clock/DOM APIs
un-installable — determinism by construction.
