---
name: remotion-style-selector
description: Reference skill — picks and justifies the composition style for a Fathom Short from its fact shape, and is the per-style determinism + usage reference for rendering motion graphics with Remotion. Phase 1 is REFERENCE-ONLY (documents the decision map + determinism rules; does NOT write a pipeline record or change any render output). Use when deciding how a video should look, or when you need the determinism rules for D3 / Lottie / GSAP / Three.js in Remotion. Triggers on "which style should this video use", "pick a composition style", "remotion determinism rules", "is this animation deterministic", "how do I render transparent".
version: 1.0.0
allowed-tools: Read, Write
user-invocable: true
---

# remotion-style-selector

The niche-specific style + determinism reference for the Fathom renderer.

> **Phase 1 = REFERENCE-ONLY.** This skill is *living documentation*: the decision map and the
> per-style determinism rules that the codegen path reads. It does **not** write a decision record
> (`03-style.md`), does **not** insert a pipeline step, and does **not** change any render output.
> Today every video renders as `kinetic-typography`. *Active* selection (writing a record the
> pipeline branches on) lands in **Phase 2** with D3, inlined into `remotion-prompt-generator`
> first. See `docs/superpowers/specs/2026-06-19-remotion-style-selector-design.md`.

---

## 1. The governing rule

Remotion renders a **fixed, frame-deterministic timeline**: every frame is fully reproducible from
its frame number alone. The render farm samples frame `N` in isolation — there is no "playback",
no real elapsed time, no user input. Every decision below is a consequence of that one rule. If an
effect cannot be expressed as a pure function of `useCurrentFrame()`, it does not belong in a
rendered Short.

---

## 2. The decision map (niche version) — fact shape → style

**Evaluate top to bottom; first match wins.** This is a priority-ordered list, not a menu — the
ordering is what makes the same fact classify the same way every run. Each row carries a
*disqualifying* test so overlapping facts (a growth stat is simultaneously a number, a timeline,
and "data") resolve deterministically.

| Order | Fact shape | Disqualifying test (skip this row unless…) | Style |
|---|---|---|---|
| 1 | **The data IS the content** — ≥3 data points, a continuous distribution, or a growth/trend curve | skip if a single number or ≤2-magnitude comparison carries the payoff | **D3** |
| 2 | **Spatial / physical fact** | skip unless the fact *cannot be understood without a 3D spatial relationship* (a growth curve is D3, not 3D; a map is D3/SVG, not 3D) | **Three.js** |
| 3 | **Needs a motion accent** — one icon / micro-illustration / logo-like flourish | skip if the whole frame is the graphic (that's D3/Three) | **Lottie** |
| 4 | **Complex overlapping choreography** — many elements with staggered, interdependent easing | skip if `lib/motion.ts` springs already cover it | **GSAP** |
| 5 | **Single number / comparison of ≤2 magnitudes / ranking / discrete timeline** (the default) | — | **kinetic-typography** |
| — | **Interactive / gesture / physics** | — | **Framer Motion → DO NOT USE for rendered video** (see §4) |

**"Simplest style that fully serves" (operational):** if the payoff is a single number or a
comparison of ≤2 magnitudes → `kinetic-typography` fully serves. ≥3 data points or a continuous
distribution → it does not; escalate to `D3`. Escalate to 3D **only** when the fact is genuinely
spatial.

### Worked golden examples
1. *"X grew 40% over 10 years."* — matches rows 1 (data), 5 (number), conceptually a timeline.
   First match wins → **row 1, D3** (a 10-year curve is ≥3 points; the curve is the content).
2. *"The Moon is 384,400 km from Earth."* — a single number with a spatial flavor. Row 2's
   disqualifier: is it un-understandable without 3D? No — it's one distance. → **row 5,
   kinetic-typography.** (Do not reach for Three.js just because space is involved.)
3. *"T-rex was closer in time to us than to Stegosaurus."* — a comparison of two time-gaps, ≤2
   magnitudes. → **row 5, kinetic-typography** (a clean two-bar / timeline-gap animation).

---

## 3. Per-style playbook

One block per style: *when to pick · how to prompt · determinism caveat · availability.* See the
canonical availability table in §5.

- **kinetic-typography** *(available)* — the house style. Text + motion via `lib/motion.ts` springs,
  `lib/captions`, `lib/Background`. Pick by default. Determinism is already enforced by the lib.
- **D3** *(available — `render/src/lib/dataviz`)* — pure-SVG data-viz (growth curve / bars /
  distribution). Prompt: "compute scales/paths as pure functions of `frame`; animate by interpolating
  the domain/reveal cutoff, not with transitions." Determinism: d3 *scales and shape generators are
  pure* (safe); **`d3.transition()`/`d3-timer`/`d3-selection` are forbidden AND not installed** (scoped
  to `d3-scale` + `d3-shape`); the static grep guard + render-hash check enforce it on every render.
- **Lottie** *(planned)* — motion accents. Prompt: "use `@remotion/lottie`; drive the player by
  `frame`." Determinism: never autoplay; `seek`/`progress` from `frame`; wrap JSON load in
  `delayRender`/`continueRender` (§4).
- **GSAP** *(planned)* — overlapping choreography layered on `lib/motion.ts`. Determinism: build a
  **paused** timeline, advance with `timeline.seek(frame / fps)` each frame (§4).
- **Three.js** *(exploration — not committed)* — spatial/3D. Determinism is fragile (headless WebGL
  is GPU/driver-variant). Requires `<ThreeCanvas>` from `@remotion/three` and a passing determinism
  spike before any committed use (§4, §5).

---

## 4. Determinism rules (non-negotiable)

The load-bearing section. A frame must be a pure function of its frame number.

**General**
- Drive everything from `useCurrentFrame()` / `useVideoConfig()`.
- For randomness, use Remotion's **seeded** `random("some-seed")` — never `Math.random()`.
  Precedent: `render/src/lib/Background.tsx` (`random(\`stars-x-${i}\`)`).
- No `Date.now()`, no `new Date()`, no `performance.now()`, no `requestAnimationFrame` for animation.
- Wrap **every async asset load** (Lottie JSON, GLTF models, fetched data) in
  `delayRender()` / `continueRender()` so a frame never renders before its data is ready.
- Duration comes from `calculateMetadata` — never a hardcoded `DURATION` const.

**Per-library (the actual in-the-wild bugs)**
- **GSAP** — build a **paused** timeline; advance with `timeline.seek(frame / fps)` (or
  `.progress()` / `.totalTime()`) every frame. NEVER `gsap.ticker` or real-time playback.
- **Three.js** — render through `<ThreeCanvas>` from `@remotion/three` (a raw `<Canvas>` is not
  captured). Advance animation from `frame`, never `clock.getElapsedTime()` /
  `requestAnimationFrame`. Residual WebGL cross-GPU nondeterminism remains — this is why Three.js
  is exploration-only until a spike renders byte-reproducibly across two machines.
- **Lottie** — `@remotion/lottie`; drive by `frame` via `seek`/`progress`, never autoplay.
- **D3** — scales/shape generators are pure (good); **forbid `d3.transition()` / `d3-timer`**.
  Compute paths and scales as pure functions of `frame`.

---

## 5. Availability gate (single canonical table)

This table is the **single source of truth** for style availability. Do not restate these flags in
the playbook or the decision map — reference this.

| style | flag |
|---|---|
| `kinetic-typography` | available |
| `d3` | available |
| `lottie` | planned |
| `gsap` | planned |
| `three` | exploration (not committed) |

**How the gate behaves (executed in Phase 2, documented now):** recommend the *ideal* style from
§2. If it is `available`, the effective style equals the ideal. If it is `planned`/`exploration`,
record the ideal **and** set the effective style to `kinetic-typography` with a note
(`"ideal <X> is planned, not yet built; rendering as kinetic-typography"`). The selector can never
instruct the pipeline to use a harness that does not exist.

### Adding a style (maintenance)
When a phase ships a style: (1) flip its flag here — **one edit, this table only**; (2) **first**
teach the three downstream skills (`asset-sourcing`, `remotion-prompt-generator`,
`remotion-codegen`) the new branch — *before* flipping the flag, or the gate must keep the
effective style pinned to `kinetic-typography`; (3) tie the flip to the downstream guard so the
gate can never emit an `effective` style the pipeline can't consume.

---

## 6. Transparency-render recipe

For title cards / overlays that composite onto footage (verified against the Remotion docs):

```
npx remotion render <comp-id> out.mov \
  --codec=prores --prores-profile=4444 \
  --image-format=png --pixel-format=yuva444p10le
```

Without `--pixel-format=yuva444p10le` (and with any background set) the alpha channel flattens and
transparency is lost. — https://www.remotion.dev/docs/transparent-videos

---

## 7. Prompting discipline

- Start simple; iterate in the same session rather than over-specifying up front.
- Read the official Remotion skill **first** for any code mechanics (see §8).
- Match the tool to the motion (§2) *before* prompting — don't prompt for a chart in plain divs.
- Keep every effect a pure function of `frame`; if you can't, it's the wrong effect.

---

## 8. Sources & precedence

Three Remotion references exist. On conflict, this precedence holds:

1. **This skill** governs *style selection + niche determinism rules.* Wins for those.
2. **`render/.agents/skills/remotion-best-practices/`** (official) governs *Remotion API /
   primitives / render mechanics.* Defer to it for code; it wins for API questions.
3. **`REMOTION_USAGE_GUIDE.md`** (repo root) is *background / long-form only — NOT authoritative for
   this repo.* Cite only its decision-map / determinism / transparency sections. ⚠️ Its
   `npx create-video` / "say yes to Tailwind" **setup steps are wrong for this monorepo** —
   `render/` already exists and is codegen-first; never run them.

> **Sync note:** the long-form decision map + transparency recipe also live in
> `REMOTION_USAGE_GUIDE.md`. Keep that file the long-form companion; if either changes, update the
> other. This skill holds only the niche table + per-lib determinism inline.
