# Design — Lottie accent layer (Phase 3a of the "living motion graphics" program)

**Date:** 2026-06-19
**Status:** Approved via brainstorming session (zain-ali). Ready for implementation plan.
**Author:** brainstorming session (zain-ali)
**Program parent:** `docs/superpowers/specs/2026-06-19-remotion-style-selector-design.md` (the phased
styles program: 1. reference skill ✅ · 2. D3 ✅ · **3. Lottie ← this spec** · 4. GSAP · 5. Three.js =
exploration bucket).

## Context

The channel renderer (`render/`) evolved from a text-only kinetic-typography factory into a
multi-style one: Phase 2 shipped the **D3 data-viz composition style** (`render/src/lib/dataviz/`,
`effective_style: d3`), first proven on F-003 (birthday paradox) and retrofitted into F-001/F-002 via
`StyleEditorial.tsx`. Style selection is a single regex-gated line in `05-remotion-prompt.md`
(`^effective_style:\s*(d3|kinetic-typography)\s*$`), threaded through `remotion-prompt-generator`,
`remotion-codegen`, `asset-sourcing`, and `remotion-script-reviewer`. No standalone selector skill
or `03-style.md` decision record exists yet — selection is inlined, exactly as the program planned
(extract the selector only when a *third routing target* creates real pressure).

Phase 3 is **Lottie**. The user has already done the research: a complete `lottie-master` skill
(generator `lottie_gen.py`, optimizer, fetcher, `.lottie` bundler, 9 committed templates, 6 reference
docs) plus a knowledge-base artifact, both under `Lottie & dotLottie research/`.

## The pivotal decision: Lottie is an accent layer, not a full style (yet)

The parent program lists Lottie as a "composition style," but its decision-map row reads "needs a
motion **accent / icon / micro-illustration**" — a layer, not a full-frame style. We resolve this as
**phased**:

- **Phase 3a (this spec):** Lottie = an **accent layer** — animated icons, micro-illustrations, and
  transition accents dropped *into* existing kinetic-typography and editorial/D3 scenes. There is
  **no new `effective_style`**; instead a reusable `render/src/lib/lottie/` primitive any scene can use.
- **Phase 3b (deferred):** a full `effective_style: lottie` branch that routes whole videos to a
  Lottie-led composition (text as caption overlay). Admitted only after accents prove out.

Because an accent adds **no new routing target**, the "rule of three" that would extract the standalone
selector skill (and the deferred `03-style.md` record + pipeline step `3.6` + availability gate) is
**not tripped**. `effective_style` stays `d3 | kinetic-typography`. Selector machinery remains deferred.

## The engine decision: `@remotion/lottie`, never the dotLottie runtime in-render

The research went deep on **dotLottie-web / ThorVG (WASM, canvas, autoplay + requestAnimationFrame)**.
That engine is correct for a *website* but **wrong for our renderer**: it is real-time-clock /
autoplay driven and touches `window`, violating the program's non-negotiable determinism rule (every
frame a pure function of `useCurrentFrame()`, byte-reproducible across machines for the render-hash QA
gate).

**Decision:** render with **`@remotion/lottie`** (Remotion's official package, wrapping Airbnb's
`lottie-web`). It consumes parsed `animationData` (a `.json`), loads it via
`delayRender()`/`continueRender()`, and Remotion frame-syncs playback automatically — verified against
Remotion docs (`lottie-staticfile`, `lottie-comp`, `after-effects`). It consumes `.json`, not `.lottie`
zips, which is exactly what `lottie_gen.py` emits (Lottie schema v5.x with baked `fr`/`ip`/`op`).
dotLottie/ThorVG stays an **authoring/inspection-time convenience only** (bundling, `--info`
reports) — never in the render path.

## The sourcing decision: generate-first, all three routes via `lottie-master`

All three sourcing routes are in scope, ordered by the `lottie-master` skill's "generate before you
hunt" golden rule:

- **C — generate from scratch:** `lottie_gen.py` builder API / presets, emitted **in the brand
  palette** via `--color`. Code-authored ⇒ license-free, fully deterministic. Default route.
- **B — committed templates:** the 9 ready `<3KB` templates (`spinner`, `pulse`, `dots-loader`,
  `success-check`, `error-cross`, `progress-bar`, `heartbeat`, `bounce`, `fade-in`), recolored.
- **A — source from LottieFiles (fallback):** `fetch_lottie.py` to pull/inspect, with a **per-file
  license screen** mirroring the audio monetization gate. The **Lottie Simple License** is
  commercial-OK / attribution-not-required, but licenses vary per file — verify each, never re-host
  marketplace assets as free. **Reject list (determinism / feature gaps):** embedded raster images;
  non-embedded fonts (convert text to outlines); **expression-driven layers** — Remotion's own
  docs warn certain After Effects expressions don't seek deterministically under `goToAndStop()` and
  flicker, with no upstream fix; **and nested precomps baked at a differing `fr`** — `getLottieMetadata()`
  reads only the top-level framerate, so a file can pass the top `fr == 30` assertion while a precomp
  seeks mis-scaled one level down. Generate-first output is shape-based, expression-free, and
  single-`fr`, so this only bites route A; the render-hash fixture is the backstop.

## Components

1. **Install the `lottie-master` skill** → `.claude/skills/lottie-master/`. The research folder has two
   copies (`lottie-master/` and `lottie-master (2)/`); **choose the canonical one by content, not by
   name** — diff the two and keep the one with the later / more-complete templates and references (the
   `(2)` copy is often the newer download), then delete the other so the stale copy isn't silently
   installed. Scripts are stdlib-only Python (no venv); `make_dotlottie.mjs` needs npm but is
   authoring-only and not required for the render path.
2. **`@remotion/lottie` dependency** in `render/package.json`, **pinned to the exact version already
   used by the other `@remotion/*` packages, with the caret stripped** — not a hand-typed literal.
   Today that is `4.0.478` (verified: `remotion`, `@remotion/cli`, `@remotion/google-fonts`,
   `@remotion/media` are all on `4.0.478`, and `@remotion/lottie@4.0.478` is published on npm). The
   rule, not the number, is load-bearing: version **skew between `@remotion/*` packages is a known
   flicker cause**, so this must always equal the rest of the Remotion suite exactly.
3. **`render/src/lib/lottie/LottieAccent.tsx`** — the primitive, wrapping `@remotion/lottie` with house
   conventions:
   - **Load:** `.json` via `staticFile()` + `delayRender()`/`continueRender()` (returns `null` until
     loaded), with **`cancelRender()` in the `.catch`** and a `retries` value — multiple accents each
     hold a `delayRender` handle and the default ~30s timeout can blow under render concurrency / slow
     disk reads.
   - **Stable identity (correctness, not just perf):** Remotion re-initializes the animation whenever
     the `animationData` object identity changes. The parsed object **MUST be memoized** (module-level
     cache keyed by `staticFile` path, or `useMemo`) so identity is stable for the whole composition —
     otherwise re-parse on a frame-driven re-render causes mid-render re-init → flicker / dropped first
     loop.
   - **fps match (highest-value quality guard):** read the animation's natural framerate via
     `getLottieMetadata().fps` and **assert it equals `useVideoConfig().fps`** (the channel canonical
     **30fps**). On mismatch during a **real render**, the assertion **hard-fails the render** (throws,
     aborting) — it does **not** fall through to `null` or silently drop the accent, and it must **not**
     be wrapped in a `try/catch` that swallows it. A mismatched accent is a quality defect, not a
     degrade-gracefully case; fail fast so codegen authors fix the source fps. Resampling is out of
     scope for 3a — generate at 30fps instead.
   - **Frame-window-aware looping:** the accent either **completes once within its frame window**, or
     loops on an **integer-frame period that exactly divides the window** — computed from
     `getLottieMetadata().durationInFrames` (which Remotion floors to an integer, so even a "clean"
     loop can be a fraction off at the seam after rounding). The accent **must not cross the video's
     invisible loop seam** — place it wholly within one pass.
   - **Renderer (main perf lever):** expose the `renderer` prop, **default `"svg"`** (most faithful);
     documented escape hatch to `"canvas"` for a busy micro-illustration that tanks render time at
     1080p.
   - **Aspect:** pin a `preserveAspectRatio` default so an accent whose natural aspect ≠ its placement
     box doesn't letterbox/crop unexpectedly near the safe-area edge.
   - **Color:** **generate-in-palette is a hard rule for 3a** — runtime recolor is out of scope (it
     mutates `animationData` and collides with the identity-stability rule above). Recolor happens at
     generate time via `lottie_gen.py --color`.
   - **Safe area + floor:** placement clear of the burned-in captions, the bottom ~15%, and the very
     top; a quality-floor minimum render size so an accent is never a dead speck.
   - Exported from `render/src/lib/lottie/index.ts`.
4. **Determinism proof:**
   - extend the existing **static determinism guard** to cover `lib/lottie` (no `Math.random`, no
     `Date.now()`, no `new Date()`; drive only off frame) **and add an fps-match assertion** (accent
     `fr` vs comp fps);
   - add a `LottieAccent` fixture to the **Phase-2 render-hash determinism check** that proves both
     reproducibility *and* correctness: (a) accent `fr` == comp fps, (b) the accent's rendered bounding
     box falls inside the safe area on a sampled frame, (c) no blank frame inside the accent's **sustain
     window** — i.e. excluding the entrance/exit ramp, so a legitimate fade-in/out isn't flagged;
     defined as a minimum non-transparent pixel fraction over the sustain frames (the "not a dead speck"
     floor checked in pixels, not just configured min-size). (The static `.json` already guarantees
     same-input→same-bytes; these assertions guard quality, not just reproducibility.)
5. **Light pipeline wiring:**
   - `asset-sourcing`: when a beat benefits from a motion accent/icon, record it in `03-assets.md`
     (beat, preset/source, color token, placement, frame window, **and the accent fps**), generate-first
     **at the channel canonical 30fps**, license-screen any sourced file.
   - `remotion-prompt-generator`: carry the accent (which beats, which file, frames) into
     `05-remotion-prompt.md`.
   - `remotion-codegen`: emit `LottieAccent` usage in the scene `.tsx`, write the `.json` into
     `output/F-NNN/assets/`, and ensure `seed-public.sh` copies it into `render/public/` like `vo.wav`
     and the audio assets already are.

## Data flow

```
asset-sourcing  →  generate in-palette .json via lottie-master, record accent in 03-assets.md
      ↓
remotion-prompt-generator  →  accent + frame window into 05-remotion-prompt.md
      ↓
remotion-codegen  →  <LottieAccent/> in scene .tsx; .json into output/F-NNN/assets/
      ↓
seed-public.sh  →  copies .json into render/public/ (run-scoped, gitignored)
      ↓
render  →  @remotion/lottie frame-syncs the accent
      ↓
qa-probe / render-qa  →  accent clears safe-area + captions, is loop-safe, not flat/dead
```

## Testing / acceptance

- `cd render && npm run gate && npm run test:lib` green; no hand edits.
- The static determinism guard covers `lib/lottie` (no `Date.now()` etc. **+ fps-match**); the
  render-hash fixture proves a `LottieAccent` renders byte-identically twice **and** asserts the three
  quality checks: (a) accent fps == comp fps, (b) bounding box inside the safe area on a sampled frame,
  (c) min non-transparent pixel fraction across the accent's **sustain window** (entrance/exit ramp
  excluded, so a fade-in/out doesn't trip the gate).
- **Proof-of-life:** land the primitive by adding one real accent (e.g. a `success-check` or arrow)
  to an existing short or the next `/short` run, rendered through the full render→QA loop to
  **STATUS: PASS** (≥85, no blockers, Cat 9 ≥70%) with the accent clear of the safe-area. (Which video
  is chosen during planning.)

## Out of scope (YAGNI / deferred)

- The full `effective_style: lottie` routing branch (Phase 3b).
- The deferred selector machinery: standalone `remotion-style-selector` as a pipeline step,
  `03-style.md` decision record, step `3.6`, availability-gate execution. Still gated on a real third
  routing target.
- dotLottie `.lottie` bundles, runtime theming/slots, and state machines in the render path.
- Runtime data-bound recoloring beyond generate-in-palette (revisit if a video needs it).
- GSAP choreography (Phase 4); Three.js 3D (exploration bucket, gated on a cross-machine determinism
  spike + a recurring spatial fact-shape).

## Risks & mitigations

- **fps mismatch (highest-likelihood quality bug):** an accent baked at a different `fr` than the
  comp's 30fps seeks to a mis-scaled timeline → wrong speed + non-integer loop period. Mitigation:
  generate at 30fps; `getLottieMetadata().fps` assertion in the primitive **and** the static guard.
- **`animationData` re-init / flicker:** unstable object identity across frame-driven re-renders.
  Mitigation: memoize the parsed object (path-keyed cache); recolor strictly at generate time.
- **lottie-web feature gaps / text / expressions:** native fonts, embedded rasters, and certain AE
  expressions fail silently or flicker under `goToAndStop()`. Mitigation: generate-first (shape-based,
  no fonts/rasters/expressions); for sourced files, reject all three; render-hash fixture + visual QA
  are the backstop.
- **Loop seam fight:** an accent's integer-rounded loop period may not divide the video's loop, or its
  window may straddle the seam. Mitigation: accent completes once or loops on an integer-frame divisor
  of its window, placed wholly within one pass; existing loop-seam QA probe.
- **`delayRender` timeout under concurrency:** many accent handles + slow disk can exceed the ~30s
  default. Mitigation: `cancelRender()` in `.catch` + a `retries` value.
- **Skill duplication drift:** two copies of `lottie-master` in the research folder. Mitigation:
  diff and install exactly one canonical (more-complete) copy under `.claude/skills/`; delete the other.
