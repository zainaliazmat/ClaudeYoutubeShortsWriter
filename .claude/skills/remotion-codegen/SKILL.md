---
name: remotion-codegen
description: Turns a finished /short spec package into per-video Remotion scene .tsx that renders. Use as STEP 5.5 of the /short pipeline (after remotion-prompt-generator + the review loop, before render-run). Reads 05-remotion-prompt.md + 03-assets.md + 04-audio.md + vo-timing.json and writes render/src/F-NNN/ (scene .tsx + data.ts + a Composition entry) on top of the shared primitive library render/src/lib/, plus output/F-NNN/assets.json. Hard gates: tsc + eslint pass, duration via calculateMetadata (never a hardcoded const), scene-range frame-tiling validator, quality floors.
version: 1.0.0
allowed-tools: Read, Write, Edit, Bash
user-invocable: false
---

# remotion-codegen

**Step 5.5 of `/short`.** The single writer that bridges the spec package to runnable
Remotion code. It writes the **per-video scene `.tsx`** under `render/src/F-NNN/` —
layout/scene logic only — importing every proven primitive from the shared library
`render/src/lib/`. It does NOT regenerate the primitives and it does NOT render (that is
`scripts/render-run.mjs`).

> **A brand-new skill needs a Claude Code reload before its first run** — newly-added
> `.claude/skills/*` don't register mid-session. Same caveat as new subagents (see
> `memory/lessons.md`).

## Inputs (read all four, in the run folder `output/F-NNN-<slug>/`)
- `05-remotion-prompt.md` — the scene/frame list, design tokens, spatial frame, captions, audio.
- `03-assets.md` — fonts, hex palette, motion signature, motifs.
- `04-audio.md` — music + SFX picks, mix levels, per-beat frame cues, master target.
- `vo-timing.json` — the timing contract. `total` = durationInFrames; `fps`; `words[]`
  (word-by-word caption frames); `beats[]`; `envelope[]` (music ducking keyframes).

## The shared library (import from `render/src/lib/`, never reimplement)
- `motion.ts` — `wordSlamIn, heroOvershoot, yearStampShake, countUp, segmentGrow, nodeNudge, payoffGlow, crossDissolve`. All take a LOCAL (scene-relative) frame. `countUp` is clamped ≥ 0.
- `Background.tsx` — `<Background colors={{bgTop,bgBottom,glow,nebula,star}} totalFrames heroY? starCount? loopSafe? />`. Gradient + breathing glow + nebula + drifting stars. **Use it — it is the structural guarantee the bg is never a flat single hex.** Pass **`loopSafe`** (audit #4) so the drift + glow return to frame-0 state at `total` for an invisible loop.
- `Captions.tsx` — `<Captions words={voTiming.words} style={CaptionStyle} />`. Word-by-word; the merge/override/accent rules live in `captions-core.ts` (consecutive same-`display` + same-`beat` merge; `overrides` re-skin a display before merge; numerics/`BC` carry the side accent). Pass `accentBBeats` for the second-side beats.
- `AudioBed.tsx` — `<AudioBed spec={AudioSpec} />`. VO lead + envelope-ducked music + SFX cues. `spec = { vo, voVolume?, music, envelope:[{frame,volume}], sfx:[{file,from,durationInFrames,volume}] }`.
- `safeArea.ts` — `WIDTH, HEIGHT, FPS, SAFE_TOP, SAFE_BOTTOM, SAFE_INSET_X, BANDS, QUALITY_FLOORS, hexLuma, gradientLuma`.
- `tiling.ts` — `validateTiling(ranges, total)` (the codegen gate runs this).
- `captions-core.ts` — `buildTokens, isNumeric, tokenAt` (pure; used by Captions and tests).
- `dataviz/` — the **D3 composition-style primitive** (`d3-scale` + `d3-shape`, scoped). Pure,
  frame-driven charts + helpers: `GrowthCurve`, `BarChart`, `Distribution`, `scales` (linear/band/time),
  `paths` (revealPoints + line/area path strings), `scaleHonest` (`lengthFor`/`isScaleHonest` — the
  scale-honesty floor, machine-checked), `colors` (`categoricalRamp` from the accent hue). Import via
  `render/src/lib/dataviz` for an `effective_style: d3` video. Everything is a pure function of frame;
  animate by interpolating a reveal cutoff, **never** `d3.transition()` (forbidden + not installed).

## Output (write under `render/src/F-NNN/` — `NNN` from the run id)
1. `vo-timing.json` — **copy** the run's file here (the composition reads `total`/`fps`/`words`/`envelope` from it).
2. `data.ts` — resolved tokens ONLY (no JSX): `COLORS`, font families (loaded via `@remotion/google-fonts/*`), geometry, the per-scene frame ranges `SCENES` (from the frame-map / `beats[]`), `CAPTION_STYLE`, `AUDIO_SPEC`, and `TOTAL = voTiming.total`. **Never declare a `DURATION`/duration constant** — duration comes from `calculateMetadata`. `buildScenes` reads `{ from, duration }` **straight from `scenes.json`** — it must NOT compute any scene's duration from `TOTAL` (e.g. `TOTAL - from`); that `TOTAL - from` pattern was F-002's loop-seam overrun and precheck's `scene-duration-source` audit now fails on it.
   - `scenes.json` — the scene-order contract `data.ts` imports and `check-tiling.mjs`/precheck read: `{ "schemaVersion": 1, "order": [{ "name", "from", "duration" }, …] }`. **Each scene carries an explicit authored `duration`** (the single source — precheck validates these RAW durations tile `[0,total]`, so an overrun surfaces before render). **Must carry `"schemaVersion": 1`** (audit #8). The last scene's `duration` is authored too (`total − its from`), not computed in code.
3. `<Short>.tsx` — the root component: `<Background>` + persistent furniture + per-scene `<Sequence>`s + `<Captions>` + `<AudioBed>`. Every scene `<Sequence>` MUST be `from={SCENES.x.from} durationInFrames={SCENES.x.duration}` — never `TOTAL - SCENES.x.from` or a numeric literal (precheck's `scene-duration-source` audit fails on both). Export a `calculateMetadata` returning `{ durationInFrames: voTiming.total, fps: voTiming.fps, width: WIDTH, height: HEIGHT }`.
4. `scenes/*.tsx` and any per-video layers (timeline, glyphs) — the bespoke layout for THIS video, importing motion from `lib/motion` and tokens from `../data`.
5. Register the composition in `render/src/Root.tsx`:
   ```tsx
   <Composition id="F-NNN-slug" component={Short}
     calculateMetadata={calculateMetadata}
     defaultProps={{}} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
   ```
   (`durationInFrames` is a required placeholder Remotion overrides with `calculateMetadata`.)
6. `output/F-NNN/assets.json` — the asset manifest the render runner gates on:
   `{ "schemaVersion":1, "compositionId":"F-NNN-slug", "vo":"vo.wav", "assets":[{ "file","kind","url","license" }] }`
   one entry per music/SFX file referenced in `AUDIO_SPEC`, with the URL + license from `04-audio.md`.

## Quality floors — enforce by construction (the engine-free version of the clamps)
These are non-negotiable; render-qa is the pixel backstop, but codegen must not emit a violation:
- **Background:** always the lib `<Background>` (gradient ≥ 2 stops + glow + nebula + stars). Never a flat `backgroundColor` single hex. (`QUALITY_FLOORS.bgRule`.)
- **Hero scale:** hero number/payoff type ≥ `QUALITY_FLOORS.heroMinPx` (~300px) Anton.
- **Frame fill:** lay out the FULL safe area in upper/center/lower bands (`BANDS`); no beat leaves > ~45% dead space. Use persistent furniture (timeline/motif) to fill.
- **Count-up:** `countUp` reveals ≤ `QUALITY_FLOORS.countUpMaxFrames` (~36f) ease-out then hold; values clamped ≥ 0 (lib already clamps).
- **Data-viz scale-honesty:** compute geometry FROM the verified values (px-per-unit), never hand-pick pixel lengths; the length ratio must equal the data ratio. Label any deliberate exaggeration. **For an `effective_style: d3` video this is by construction** — feed the chart-spec `points[].value` straight into `lib/dataviz` (`lengthFor`/the scale wrappers); never reposition by hand.
- **Captions:** clear the bottom gutter (`QUALITY_FLOORS.captionBottomGutterPx`) and the top; the lib component handles this.
- **Loop seam (audit #4):** the last scene cross-dissolves back to the frame-0 composition AND the **persistent furniture must itself return to its frame-0 state at `total`** — an overlaid frozen Hook is not enough if the background/timeline underneath is still mid-animation. Pass **`loopSafe`** to `<Background>` (uses `loopSafeDrift`/`loopSafePulse` so the star drift + glow pulse land back at their frame-0 values), and drive any custom persistent layer (timeline progress, motif) with the same loop-safe primitives from `lib/motion`. Verify with the qa-probe seam check (state at `total` == state at 0).

## d3 branch — `effective_style: d3` (read the chart-spec, halt-and-route if invalid)
Read `effective_style` from `05-remotion-prompt.md` (match `^effective_style:\s*(d3|kinetic-typography)\s*$`;
a **missing** line ⇒ `kinetic-typography`, the untouched default path). When `d3`:
1. Parse the fenced ` ```json chart-spec ` block (`scripts/schema.mjs` registers it at v1).
2. **Controlled-halt precondition gate** (mirror the pre-render asset gate). Validate the spec
   (`validateChartSpec` in `schema.mjs`): an `archetype` of `curve|bars|distribution` and **≥3 sourced
   numeric points** (each `points[]` has a numeric `value` + a `sourceRef`). If it fails, HALT — do NOT
   silently swap to text — and print a routing message:
   - `<3 sourced points` → **PROBLEM**/CAUSE + **FIX: re-run youtube-shorts-writer to source the dropped point** · owner `script`.
   - bad/missing archetype or incomparable units → **FIX: re-run remotion-prompt-generator to reclassify (or to kinetic-typography)** · owner `video`.
3. Import the charts from `render/src/lib/dataviz`; wire `points[].value` straight in (scale-honest by
   construction). Defense-in-depth: assert `render/src/lib/dataviz` exists when you see `effective_style: d3`
   — if it's absent, emit the same controlled halt rather than degrading silently (closes the flag-flip race).

## Gate (run after writing — all must pass; this is the codegen exit)
```bash
cd render
npm run gate          # tsc (strict) && eslint src && the dataviz static determinism guard  — MUST exit 0
npm run test:lib      # the lib unit tests still pass (glob 'src/lib/**/*.test.ts' covers lib/dataviz/__tests__)
node --experimental-strip-types scripts/check-tiling.mjs F-NNN-slug   # scene ranges tile [0, total]
```
> The render-hash determinism proof (`scripts/check-determinism.mjs`) is NOT part of this fast
> pre-render gate — it needs a bundle + real renders, so it runs in the render-run/loop precheck for
> any `effective_style: d3` video.
- `tsc` + `eslint` must be clean (no hand edits after — fix the generator output, re-gate).
- `check-tiling.mjs` reads `render/src/F-NNN/scenes.json` (the RAW authored `{from,duration}`) + `vo-timing.json` `total` and runs `validateTiling` (0-indexed, half-open, contiguous, tiles `[0, total]`). Authoring a scene's duration too long now surfaces here as an overlap / wrong-tail — it is no longer hidden by contiguous re-derivation.
- Duration MUST come from `calculateMetadata` (grep the composition: no `durationInFrames={<number const>}` except the `=1` placeholder; no `DURATION` const in `data.ts`). No scene `<Sequence>` may set `durationInFrames` from `TOTAL` (`TOTAL - from`) — precheck's `scene-duration-source` audit fails it; use `SCENES.x.duration`.

On any gate failure, FIX THE GENERATED FILES (or the upstream spec if the spec is wrong) and
re-gate. Never leave a red gate. When green, hand off to `scripts/render-run.mjs output/F-NNN`.

## Boundaries
- Writes code + `assets.json`; does NOT render, master, download binaries, or upload.
- Reuses `render/src/lib/` primitives; if a beat needs a genuinely novel mechanic, write it as
  new scene code in `render/src/F-NNN/` (codegen IS the escape hatch) — still subject to the floors + gate.
