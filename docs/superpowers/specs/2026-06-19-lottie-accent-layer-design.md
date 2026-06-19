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
  marketplace assets as free, and reject anything with embedded raster images or non-embedded fonts
  (they break determinism / safe-area and the ThorVG/lottie-web feature gaps).

## Components

1. **Install the `lottie-master` skill** → `.claude/skills/lottie-master/`. Resolve the two duplicate
   copies in the research folder (`lottie-master/` and `lottie-master (2)/`) — keep one. Scripts are
   stdlib-only Python (no venv); `make_dotlottie.mjs` needs npm but is authoring-only and not required
   for the render path.
2. **`@remotion/lottie` dependency** in `render/package.json`, pinned to **4.0.478** to match every
   other `@remotion/*` package.
3. **`render/src/lib/lottie/LottieAccent.tsx`** — the primitive, wrapping `@remotion/lottie` with house
   conventions:
   - loads `.json` via `staticFile()` + `delayRender()`/`continueRender()` (returns `null` until loaded);
   - brand-palette color (prefer generate-in-palette; runtime recolor optional, not required for 3a);
   - safe-area-aware placement — clear of the burned-in captions, the bottom ~15%, and the very top;
   - loop-aware (accent loop must not fight the video's invisible loop seam);
   - a quality-floor minimum render size so an accent is never a dead speck.
   - Exported from `render/src/lib/lottie/index.ts`.
4. **Determinism proof:**
   - extend the existing **static determinism guard** to cover `lib/lottie` (no `Math.random`, no
     `Date.now()`, no `new Date()`; drive only off frame);
   - add a `LottieAccent` fixture to the **Phase-2 render-hash determinism check** so an accent renders
     byte-identically across two runs. (The `.json` itself is static committed data, so determinism is
     by construction — the fixture guards against regressions in the wrapper.)
5. **Light pipeline wiring:**
   - `asset-sourcing`: when a beat benefits from a motion accent/icon, record it in `03-assets.md`
     (beat, preset/source, color token, placement, frame window), generate-first, license-screen any
     sourced file.
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
- The static determinism guard covers `lib/lottie`; the render-hash fixture proves a `LottieAccent`
  renders byte-identically twice.
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

- **lottie-web feature gaps / text rendering:** native fonts and unsupported After Effects features
  fail silently. Mitigation: generate-first (our `lottie_gen.py` output is shape-based, no embedded
  fonts/rasters); for sourced files, reject embedded rasters and convert text to outlines; the
  render-hash fixture + visual QA catch regressions.
- **Loop seam fight:** an accent's own loop period may not divide the video's loop. Mitigation:
  `LottieAccent` loop control + the existing loop-seam QA probe; prefer accents that resolve to a
  rest state within their beat window.
- **Skill duplication drift:** two copies of `lottie-master` in the research folder. Mitigation:
  install exactly one canonical copy under `.claude/skills/` during implementation.
