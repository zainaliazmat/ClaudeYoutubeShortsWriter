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

## Extending this (DX-6 — the touch-points, so the next person doesn't reverse-engineer 5 edits)

**Add a 4th archetype** (e.g. scatter):
1. add the value to the chart-spec `archetype` enum (in `remotion-prompt-generator` SKILL + the
   reviewer's check + `validateChartSpec` in `scripts/schema.mjs`);
2. add `render/src/lib/dataviz/<Archetype>.tsx` (pure of frame) + its purity/scale-honesty unit test
   in `render/src/lib/dataviz/__tests__/`;
3. add it to the fixture composition so `check-determinism.mjs` covers it;
4. add a decision-map row in `remotion-prompt-generator`.

**Add the next STYLE** (e.g. Lottie — rule of three says extract a selector skill at this point):
1. a parallel `effective_style` value + flip its flag in `remotion-style-selector` §5 **last**;
2. its scoped deps + a static-grep allow/deny entry in `check-dataviz-static.mjs` (or a sibling guard);
3. a `render/src/lib/<style>/` primitive + its determinism layers (unit + render-hash + grep);
4. teach `remotion-codegen` to consume it (with a controlled-halt gate) BEFORE flipping the flag.

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

---

<!-- /autoplan review report — appended 2026-06-19 -->
# GSTACK REVIEW REPORT — /autoplan

> Dual-voice status: **[subagent-only]** for all phases. Codex degraded to unavailable —
> this environment's bubblewrap sandbox cannot create user namespaces (`bwrap: loopback:
> Failed RTM_NEWADDR`), and the `--dangerously-bypass-approvals-and-sandbox` fallback was
> (correctly) denied by the harness. Each phase ran the Claude independent subagent + the
> grounded primary review. Single-critical findings are flagged regardless of missing voice.

## Phase 1 — CEO Review (Strategy & Scope)

### 0A. Premise challenge
The spec's locked premises (line 39–53, "do not re-litigate"):
- **P1: "D3 is the highest content fit."** Status: **ASSERTED, not validated.** Evidence offered
  is "F-002 hand-builds bars" — fit to the *one* archetype already shipped, i.e. survivorship, not
  demand. Counter-evidence (this review): of 25 backlog topics in `content/topic-backlog-facts.md`,
  ~1–3 are multi-point datasets (#23 birthday paradox, maybe #15 stars-vs-sand as a 2-bar
  magnitude). The spec's OWN row-1 classifier (≥3 sourced numeric points) routes the rest to
  kinetic-typography. The capability has near-zero demand in the current pipeline.
- **P2: "an immediate quality win."** Status: **ASSERTED.** No retention/view data exists — both
  F-001 and F-002 are `rendered`, never `published` (VIDEO_LOG: Published/Views/Retention all `—`).
  Byte-reproducible SHA-256-identical PNGs is an engineering aesthetic with no viewer-facing payoff.
- **P3 (timing/sequencing): D3 is the right thing to build NOW.** Status: **CONTESTED — this is the
  premise gate.** The build commitment precedes the lift evidence it is explicitly conditioned on
  (CLAUDE.md: niche line flips "after D3 ships AND shows lift"); lift is unmeasurable while 0 videos
  are published.

### 0B. What already exists (leverage map)
- Scale-honest bars: **already shipped** — `segmentGrow` + `countUp` in `render/src/lib/motion.ts`;
  F-002 rendered them at score 94 / Cat9 98, loop PASS. The hand version already clears the bar.
- Scale-honesty floor: **already enforced** by `remotion-codegen` (length ratio == data ratio).
- Pure-function-of-frame convention + seeded `random` + loop-safe primitives: **already the lib
  pattern** (`Background.tsx`, `motion.ts`). D3 geometry follows the identical shape — so the
  genuinely-new code is only the d3-shape curve/area math (Appendix A).

### 0C. Dream-state delta
CURRENT: 2 rendered, 0 published, 1 archetype. THIS PLAN: + a 3-archetype D3 engine, determinism
proof, 5-skill wiring. 12-MONTH IDEAL: a channel with a measured audience and a style library pulled
by *demonstrated* content demand. Delta risk: the plan advances render capability on an axis with no
demonstrated link to the 12-month ideal (audience), while the binding constraint (distribution
signal) is untouched.

### 0C-bis. Implementation alternatives (the spec omits this section)
| # | Approach | CC effort | Risk | Notes |
|---|----------|-----------|------|-------|
| A | **Publish-and-measure first** (ship 8–12 in existing style, instrument retention), D3 stays backlogged | ~days of content, ~0 eng | low | The 10x reframe. Converts a 0-signal channel into a measuring one; lets data authorize D3. |
| B | **Extend `lib/motion.ts`** with a few pure helpers (line-path, band-width, axis) — no new dep, no determinism harness | ~0.5 day | low | d3-shape curve math is the only hard-to-hand-roll piece (~30 lines Catmull-Rom). No `d3-transition` to forbid → most of the spec's proof apparatus is self-inflicted by choosing the dependency path. |
| C | **Spec as written** (d3-scale+d3-shape primitive, 3 archetypes, 3 determinism layers, 5-skill wiring) | ~2–4 days | medium | Elegant, future-proof, but ~5–10x over-built for a 2-video channel; Distribution archetype has zero demonstrated demand. |
| C′ | **Descoped spec**: BarChart only, drop render-hash layer + Distribution + 6-row matrix | ~1–1.5 day | low-med | Keeps determinism-by-construction (dep scoping + unit tests + static grep), cuts ~70% surface. |

### CEO consensus table
```
CEO DUAL VOICES — CONSENSUS TABLE:
  Dimension                              Claude-subagent   Codex      Consensus
  1. Premises valid?                     NO (asserted)     N/A        flagged (single critical)
  2. Right problem to solve NOW?         NO (publish first) N/A       flagged (single critical)
  3. Scope calibration correct?          NO (over-built)   N/A        flagged (single high)
  4. Alternatives explored?              NO (A/B omitted)  N/A        flagged
  5. Competitive/market risk covered?    NO (no data)      N/A        flagged
  6. 6-month trajectory sound?           AT RISK           N/A        flagged
Missing voice = Codex unavailable (sandbox). Single-voice criticals flagged regardless.
```

### CEO findings (auto-decided where mechanical; strategic ones → premise gate)
- **F1 (critical): premature engine-building before distribution proven.** → premise gate.
- **F2 (critical): central premises asserted, not validated.** → premise gate.
- **F3 (high): "extend motion.ts" + "publish first" alternatives dismissed without analysis.** Fix:
  added the 0C-bis table above. → surfaced at gate.
- **F4 (high): scope over-built ~5–10x.** Distribution archetype + render-hash-every-render + 6-row
  robustness matrix have zero current demand. → descope option (C′) at gate.
- **F7 (medium): render-hash determinism layer solves a non-problem at this scale** (no render
  cache, no frame-diffing consumer). Unit purity + static grep already catch the real regression
  (someone importing `d3-transition`). Auto-decision: recommend dropping Layer 2 from the per-render
  path (make it on-demand/CI), keep Layers 1+3 — but bundled into the descope decision at the gate.

### NOT in scope (confirmed from spec + this review)
Lottie/GSAP/Three.js; chart-aware scripts; moving selection earlier; standalone selector skill;
CLAUDE.md niche-line rewrite; the `compose.json` engine. **This review adds:** Distribution archetype
and the render-hash layer SHOULD move here (defer) unless the gate keeps full scope.

## Phase 2 — Design Review
**Skipped — no interactive UI surface.** The deliverable is rendered video frames, not screens with
loading/empty/error/responsive states or keyboard nav, so the plan-design-review dimensions are N/A.
The genuinely-visual concerns that DO apply are folded elsewhere: chart legibility at 1080×1920 + hero
sizing → existing `QUALITY_FLOORS` (hero ≥300px, fill ≥55%, bg gradient+depth); encoding honesty →
the `scaleHonest` invariant (Eng); color-ramp contrast → `colors.ts` derives from the palette accent
hue (verify the ramp clears a legible contrast delta between adjacent categories — added as a
quality note below).

## Phase 3 — Eng Review (Architecture & Correctness)
Independent Claude eng subagent ran against the live repo (package.json scripts, tsconfig strict +
noUnusedLocals, the single existing `scripts/check-tiling.mjs`, motion.ts Math.* usage, empirical
glob expansion). Codex N/A (sandbox). Findings auto-decided P5 (explicit) + P3 (pragmatic) + P1
(completeness) — all are correctness fixes to the FULL spec, none reduce scope.

```
ENG CONSENSUS TABLE:
  Dimension                       Claude-subagent   Codex   Consensus
  1. Architecture sound?          YES (additive)    N/A     confirmed (single-voice)
  2. Test coverage actually runs? NO (glob miss)    N/A     flagged critical
  3. Gate phase/ordering correct? NO (render-hash)  N/A     flagged critical
  4. Determinism claim holds?     PARTIAL (PNG flake)N/A    flagged high
  5. Type-safety under strict tsc?NO (string|null)  N/A     flagged medium
  6. Guard patterns precise?      NO (under-spec)   N/A     flagged medium
```

### ENG-1 (CRITICAL) — `test:lib` glob silently skips the new dataviz tests
`test:lib` = `node --experimental-strip-types --test src/lib/__tests__/*.test.ts`. That shell glob is
ONE directory level; it does NOT match `src/lib/dataviz/__tests__/dataviz.test.ts`. Determinism
Layer 1 would never execute behind a green gate — the worst failure mode. **FIX (apply):** change
`test:lib` to `node --experimental-strip-types --test 'src/lib/**/*.test.ts'` (quoted → Node's
runner expands `**`, Node 22 present) AND update the remotion-codegen gate doc in lockstep. (Alt:
colocate at `src/lib/__tests__/dataviz.test.ts` importing from `../dataviz/*` — zero script change.)

### ENG-2 (CRITICAL) — render-hash check is in the wrong phase
The codegen gate (`npm run gate && test:lib && check-tiling`) is fast, pre-render, static — no
Remotion bundle exists at gate time. `check-determinism.mjs` requires a bundle + 6 single-frame
renders. **FIX (apply):** move Layer 2 OUT of the codegen gate into the render-run/loop precheck
(CLAUDE.md step 8), running ONCE per `effective_style: d3` video, reusing the bundle the render
already builds. Rewrite spec lines that say "wired into the codegen gate" → "render-run precheck."
The static grep guard (ENG-6) STAYS in the codegen gate — the two scripts have opposite correct homes.

### ENG-3 (HIGH) — full-frame byte-identical PNG hashing will be flaky
Layer 2 hashes full composited frames = D3 chart + burned-in caption TEXT + gradient bg. Headless-
Chromium text rasterization (subpixel AA, font hinting, glyph-cache warm-up, GPU/SwiftShader) is not
guaranteed bit-stable across two process invocations; the geometry is pure but the text layer isn't.
A flaky gate that blocks renders is worse than no gate. **FIX (apply, [TASTE on the how — surfaced at
gate]):** keep a genuine render-level proof but make it stable — render the chart in ISOLATION
(chart-only composition, no captions/bg) with pinned Chromium flags (`--disable-gpu`,
`--force-color-profile=srgb`, `--font-render-hinting=none`, fixed concurrency) before hashing; OR
redefine Layer 2 to hash the serialized chart geometry (path strings + bar rects), which is the
actual pure-function-of-frame artifact (and overlaps Layer 1, making the render-hash near-redundant —
note for the implementer). Do NOT hash the full frame.

### ENG-4 (HIGH) — `scaleTime` contradicts the `new Date` grep guard
d3 `scaleTime` domains are `Date` objects; you cannot use it without constructing Dates. The
determinism rule + grep guard forbid the substring `new Date` — which would fail on the FIXED-literal
`new Date(2560,0,1)` that scaleTime requires. Direct internal contradiction. **FIX (apply):** make the
guard precise — forbid only zero-arg wall-clock `new Date()` via `/new Date\s*\(\s*\)/` and
`/\bDate\.now\s*\(/`, explicitly ALLOW `new Date(<literal>)`. (Or drop `scaleTime` from v1 — no
backlog topic needs a true time axis; use `scaleLinear` over numeric years. Recommend: keep the
precise regex so scaleTime stays usable.)

### ENG-5 (MEDIUM) — d3-shape `line()/area()/arc()` return `string | null` under strict tsc
`noUnusedLocals` + `strictNullChecks` reject `string|null → string`. **FIX (apply):** `paths.ts`
coerces explicitly — `return line(data) ?? ""` — and treats empty data as a precondition violation
(throw → feeds the controlled-halt philosophy). State it so the unit test asserts non-null.

### ENG-6 (MEDIUM) — static grep guard patterns under-specified (Math.random vs Math.sin/max/PI)
motion.ts legitimately uses `Math.sin/Math.max/Math.PI`; Background uses seeded `random()`. A naive
`Math\.` or unanchored `random` misfires. **FIX (apply):** pin exact anchored regexes —
`/\bMath\.random\s*\(/`, `/\bDate\.now\s*\(/`, `/\bperformance\.now\s*\(/`,
`/\brequestAnimationFrame\s*\(/`, `/new Date\s*\(\s*\)/`, and imports
`/from ['"]d3-(transition|timer|selection)['"]/`. Scope the guard to `lib/dataviz/` + scene `.tsx`
only (NOT motion.ts). Wire it into the codegen gate (it is the ONLY layer catching a future
`npm i d3` reintroducing the wall-clock modules — tsc would pass).

## Phase 3.5 — DX Review (skill contracts & operator/agent experience)
Independent Claude DX subagent; "developers" = the AI skills consuming handoff files + future
maintainers. Codex N/A. Cross-cutting theme: **the spec's new d3 handoffs are specified LESS
rigorously than the project's own existing machine-read artifacts** — fixing them to the established
patterns (`schema.mjs` versioned JSON, asset-gate halt fidelity, fail-open defaults) resolves the
three highest-severity DX findings together.

```
DX CONSENSUS TABLE:
  Dimension                          Claude-subagent   Codex   Consensus
  1. Machine-read contract pinned?   NO (free text)    N/A     flagged critical
  2. Halt message actionable?        NO (under-spec)   N/A     flagged high
  3. effective_style contract pinned?NO + no default   N/A     flagged high
  4. Flag-flip race prevented?       NO (doc-order)    N/A     flagged medium
  5. Robustness rows actionable?     PARTIAL (2,6 vague)N/A    flagged medium
  6. Extensible without reverse-eng? NO (5 hidden edits)N/A    flagged medium
```

### DX-1 (CRITICAL) — chart-spec block has no pinned schema; two skills must machine-read it
codegen parses it, reviewer validates "≥3 sourced points + coherence" — but the spec gives no field
names/types/fence. Every other machine-read artifact here is versioned JSON (`scenes.json`,
`vo-timing.json`, `assets.json` via `scripts/schema.mjs`). **FIX (apply):** pin a fenced
` ```json chart-spec ` block: `{ "schemaVersion":1, "archetype":"curve|bars|distribution",
"points":[{"label","value","sourceRef"}], "domain":[n,n], "range":[n,n],
"axisLabels":{"x","y"}, "transform":"linear|log", "growsAcrossBeats":[int] }`. Register `"chart-spec"`
in `scripts/schema.mjs`. `sourceRef` REQUIRED per point → reviewer's "sourced" check becomes a
field-presence check, not prose interpretation. Add one worked example.

### DX-2 (HIGH) — codegen halt message under-specified vs the asset-gate it claims to mirror
The exemplar (`scripts/render-run.mjs:122-148`) states count + folder + per-item file→URL→license +
literal re-run instruction, with a structured `{owner}` payload `loop.mjs:111` routes on. The spec's
gate is only "halt with a specific routing message." **FIX (apply):** specify PROBLEM ("2 sourced
points, need ≥3") + CAUSE + FIX ("re-run remotion-prompt-generator → reclassify to
kinetic-typography" or "re-run youtube-shorts-writer → source the dropped point") + structured
`{ owner:"video", fix, detail }` matching loop.mjs. Emit exactly the `owner` the new stage-attribution
row uses.

### DX-3 (HIGH) — `effective_style:` grep contract unpinned + missing-line case unhandled
Three consumers depend on a line called "machine-greppable" with no pinned key/values/location/regex,
and the spec never says what codegen does when an OLD prompt has no such line. **FIX (apply):** key
literally `effective_style:` (lowercase, line-anchored), values `{d3, kinetic-typography}`, matched by
`^effective_style:\s*(d3|kinetic-typography)\s*$`. **Missing line → default `kinetic-typography`**
(fail-safe to the untouched path; satisfies Success Criterion 7). Multiple matches → reviewer error.

### DX-4 (MEDIUM) — teaching-order is a doc convention, not an enforced gate
Nothing prevents a maintainer flipping `d3 = available` before codegen's d3 branch ships → a race
where prompt-generator emits `effective_style: d3` and codegen (not yet d3-aware) silently renders a
diverging kinetic-typography video. **FIX (apply):** gate prompt-generator's d3 branch on the SAME
canonical capability source codegen reads (flip one place, enable both atomically). Backstop: codegen
asserts on `effective_style: d3` that `lib/dataviz/` exists, else emits the DX-2 controlled halt
rather than degrading silently.

### DX-5 (MEDIUM) — robustness rows 2 & 6 non-actionable
Row 2 "route to writer" has no mechanism; row 6 offers two routes with no selection rule. **FIX
(apply):** Row 2 → prompt-generator drops unsourced points during classification; <3 remain → emit
`effective_style: kinetic-typography` (never reaches d3); reviewer "≥3 sourced" is the backstop. Row 6
→ deterministic route from failure reason: `<3 sourced` → owner=script, re-run youtube-shorts-writer;
`present but incomparable/scale-dishonest` → owner=video, re-run remotion-prompt-generator. Encode the
mapping in the halt payload (ties to DX-2).

### DX-6 (MEDIUM) — adding a 4th archetype / next style means reverse-engineering ~5 edit sites
No enumerated extension checklist; the deferred standalone-selector skill (rule of three) makes a
written checklist MORE important. **FIX (apply):** add an "Extending this" section — new archetype →
{chart-spec `archetype` enum + `lib/dataviz/<X>.tsx` + purity/scale-honesty test + decision-map row +
reviewer coherence rule}; new style → {`effective_style` value + capability-flag flip + deps +
static-grep allow-list entry + primitive dir + determinism layers}. Cheap to write now while couplings
are fresh.

## Cross-phase theme
**Under-specified machine contracts** appeared independently in Eng (ENG-6 grep patterns) and DX
(DX-1 chart-spec schema, DX-2 halt message, DX-3 effective_style line). High-confidence signal: the
single most valuable correction is to pin every new d3 handoff to the repo's existing versioned-JSON /
fail-open / structured-owner conventions. Do that and ~half the findings close together.

## Flagged (see-something-say-something, pre-existing — NOT fixed here)
`remotion-prompt-generator/SKILL.md` lines 26 & 57 still instruct a **two-pass `loudnorm`** master to
-14 LUFS — but the project moved to **LRA-preserving linear+limiter** as the default master (commit
da8f99c, CLAUDE.md Standards). This skill is stale vs the current default. Repo mode is collaborative
→ flagging, not fixing. Worth a follow-up edit to that skill independent of D3.

## STATUS
DONE_WITH_CONCERNS. Full spec approved by user at the premise gate (strategic timing/over-build
concerns acknowledged, flagged, not blocking). 12 implementation findings (2 critical eng, 1 critical
dx, 3 high, 6 medium) auto-decided as correctness fixes to fold into the implementation plan. One
TASTE decision surfaced: ENG-3 render-hash approach (isolated-chart-render vs geometry-hash).

## Decision Audit Trail
| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|----------------|-----------|-----------|
| 1 | CEO | Proceed with FULL spec (3 archetypes, 3 layers, full matrix) | USER CHALLENGE → user chose B | user context | User wants the complete style-engine as the deliverable; strategic concerns flagged not blocking |
| 2 | CEO | Strategic timing/over-build concerns → flagged, not blocking | Mechanical | P6 bias-to-action | Premise gate resolved; do not re-litigate |
| 3 | Eng | ENG-1 fix test:lib glob to `'src/lib/**/*.test.ts'` | Mechanical | P1 completeness | Tests must actually run or Layer 1 is theater |
| 4 | Eng | ENG-2 move render-hash to render-run precheck | Mechanical | P5 explicit | Gate is pre-render static; render-hash needs a bundle |
| 5 | Eng | ENG-3 → **user chose A: render chart in ISOLATION + pinned Chromium flags** (--disable-gpu --force-color-profile=srgb --font-render-hinting=none + fixed concurrency), hashing a chart-only composition — NOT the full frame | TASTE resolved by user | P3 pragmatic | Keeps a genuine render-level byte-repro proof without text-AA flake |
| 6 | Eng | ENG-4 precise `new Date()` regex, keep scaleTime usable | Mechanical | P5 explicit | Resolves direct contradiction |
| 7 | Eng | ENG-5 `?? ""` + throw on empty data | Mechanical | P5 explicit | strict tsc rejects string|null |
| 8 | Eng | ENG-6 anchored grep regexes, scope to dataviz+scenes, keep in codegen gate | Mechanical | P5 explicit | Avoid Math.sin false-positives; guard is the only npm-i-d3 catch |
| 9 | DX | DX-1 pin chart-spec as fenced JSON + schema.mjs entry | Mechanical | P4 DRY / P5 | Match repo's existing versioned-JSON convention |
| 10 | DX | DX-2 specify halt message problem/cause/fix + owner payload | Mechanical | P5 explicit | Mirror asset-gate fidelity so loop.mjs can route |
| 11 | DX | DX-3 pin effective_style regex + missing-line → kinetic-typography default | Mechanical | P5 explicit | Fail-safe to untouched path (Success Criterion 7) |
| 12 | DX | DX-4 gate prompt-gen d3 branch on shared capability flag + codegen assertion | Mechanical | P5 explicit | Close the flag-flip race by construction |
| 13 | DX | DX-5 make robustness rows 2 & 6 deterministic routes | Mechanical | P5 explicit | Single-owner attribution needs one route |
| 14 | DX | DX-6 add "Extending this" checklist section | Mechanical | P1 completeness | Rule-of-three deferral makes the checklist more needed |
| 15 | — | Flag stale loudnorm master in prompt-generator skill | Mechanical | see-something | Collaborative repo → flag not fix |
