---
name: asset-sourcing
description: Sources typography-native visual assets and monetization-safe audio for a kinetic-typography Short, as a SPEC ONLY (no downloads, no API keys). Use as STEP 4 of the /short pipeline, ideally via the asset-scout subagent. Reads the script, then writes 03-assets.md (font stack, hex palette, motion signature, optional icons/background) and 04-audio.md (one music pick + SFX with URL, license, attribution, mix levels, per-beat timing). Screens audio for monetization safety and visuals for logos/faces.
version: 1.0.0
allowed-tools: Read, Write, WebSearch, WebFetch
user-invocable: false
---

# asset-sourcing

Step 4 of the `/short` pipeline. The channel is **kinetic typography (text + motion)**, so "assets" means a **design system + audio**, NOT stock footage. Output two files into the run folder: `03-assets.md` and `04-audio.md`. **Spec only** — record picks with URLs + license; do not download files.

Inputs (paths passed by the orchestrator): the run folder `output/F-NNN-<slug>/` and `02-script.md`. Read the script's beats, on-screen text, and runtime/frame budget first.

## A. `03-assets.md` — the visual design system

The goal is a **recognizable, repeatable Fathom type/color/motion signature** (per NICHES.md, defensibility = a consistent signature). Specify, don't download:

- **Font stack:** 1 display/heading face for IMPACT at large sizes + 1 numeric/mono face if numbers feature. For hero words choose a **high-impact display/condensed face** (e.g. Anton, Archivo Black, Montserrat 800/900, Clash Display) — "generic body grotesque at default tracking" is a deduction; give a one-line rationale for why the face suits the channel mood. Keep a **tabular/monospace** figure face for count-ups so digits don't jitter width, but **tighten its letter-spacing on large numbers** (wide default mono tracking reads dated). Give exact family names, weights, and the `@remotion/google-fonts` package name; prefer free, self-hostable Google Fonts. Keep it consistent with prior episodes if a signature exists (check `content/scripts/`).
- **Color palette:** exact hex values — background, primary text, accent/highlight, and a "reveal" color. The **background must have depth — never a flat single-hex near-black**: specify a subtle vertical gradient, faint grain, or a low-opacity nebula/texture. The accent AND reveal colors must have **real chroma and contrast** so the decorative layer reads as intentional design, not a muted wash. State the caption contrast ratio AND a one-line **"does this pop on a phone at arm's length?"** rationale. Note the ocean/"Fathom" brand leaning (deep blues) — check `Branding/`.
- **Motion signature:** the recurring entrance/emphasis behavior (e.g. word slam-in via spring, highlight wipe, count-up). Give concrete Remotion intent: animation type, frame duration, easing/spring feel, scale range. These become the reviewer's feasibility checks. Keep count-ups **short (~0.8–1.2s / 24–36f) with an ease-OUT** (fast start, decelerate to land), then hold — long slow-start counters read as sluggish dead air.
- **Chart colors (d3 videos):** for an `effective_style: d3` video you need NOT pre-plan N category colors — the `lib/dataviz` primitive derives a deterministic categorical ramp from the palette **accent hue** (`categoricalRamp`). Just specify a strong accent with real chroma; the ramp keeps adjacent categories legibly distinct.
- **Visual richness (earn the frame):** typography leads, but a 9:16 frame is large — fill it. Specify **at least one** per video: (a) a **depth background** (subtle gradient / faint grain / low-opacity nebula or texture — never flat single-hex black), (b) one or two **LARGE motif elements** (e.g. a 400–700px moon disc, a pyramid silhouette) as background/anchor layers — **not 36–48px line-icons** that vanish at viewing size, (c) a **hero-scale type treatment** (primary numbers/words sized to dominate, ≥ ~280px). Tiny decorative icons as the *only* visual aren't "clean," they're empty — avoid. For comparison/data-viz beats, prefer a **thick bar/shape that grows** (proportional to the values) over hairline strokes.
- **Denser visuals for VO pacing (design §5):** the VO buys ~30s of attention — fill the empty bands so it never reads as static. For timeline/comparison shorts specify: (a) **date ticks + era labels** along the spine (e.g. "Old Kingdom", "Ptolemaic", "Space Age") to fill the right/empty bands; (b) a **stronger side-by-side comparison beat** — show the competing gaps as two bars from a shared baseline (not only collinear) so the difference reads at a glance; (c) **brighter rest-state fills** on motif shapes (the v3 pyramid was muddy until the payoff — give it a lit fill from frame 0). These are per-beat anchors the prompt-generator turns into layers.
- **Icons / background:** prefer pure-CSS/SVG shapes, **large filled silhouettes**, or a free no-attribution icon set (e.g. Lucide/Phosphor — MIT) rendered **large** (≥200px) as anchor/background elements, not tiny markers. Record source + license. **Screen for trademarks, logos, identifiable faces** — flag and replace if found.

## B. `04-audio.md` — music + SFX (monetization-safe)

Follow `references/audio-sources.md` for the source policy and `references/audio-mastering.md` for loudness/mix. For the ONE background track and any SFX:

1. Search the allowed libraries (YouTube Audio Library, Pixabay, Uppbeat free) for a track matching the script's energy/tempo and runtime.
2. Record per pick: **title, artist, source library, direct URL, license, attribution required? (yes/no + exact credit string), monetization-safe? (must be yes)**.
3. **Reject** anything CC-BY-NC, unknown-license, or from a re-upload channel. Prefer YouTube Audio Library (YouTube-certified, no Content-ID claims).
4. Specify the **mix** per `references/audio-mastering.md`. **The VO is the LEAD; the music bed DUCKS under it.** VO `vo.wav` at ~0.9–1.0; the bed base **~0.72** ducking to **~0.22 under speech** via the `vo-timing.json` `envelope` (swelling back on the payoff), accent SFX at 0.5–0.7 (above the ducked bed), the reveal hit loudest at ~0.9–1.0. Name SFX punch-ins by frame (e.g. "whoosh on each beat cut", "low hit on the reveal at frame X"). Then state the **final-master target: -14 LUFS integrated / ≤ -1 dBTP / LRA 11**, applied via the two-pass `loudnorm` step in `audio-mastering.md` at render time. Per-element volumes are balance; the master sets loudness — both required.
5. Note: files are downloaded from the original source at render time — this spec just pins the choice + license receipt.

## Templates

### `03-assets.md`
```markdown
# F-NNN — Visual Assets (spec)
## Fonts
- Display (high-impact, hero): <Family> <weights> — `@remotion/google-fonts/<Pkg>` — why it fits: <one line>
- Numeric/mono (if used): <Family> — <pkg> — tighten tracking on large numbers
## Palette (hex)
- Background <#> + depth: <gradient #→# | grain | nebula> (NOT flat single-hex)
- Text <#> · Accent <#> · Reveal <#> — caption contrast ratio: <X:1>
- Pops on a phone at arm's length? <yes — why>
## Motion signature
- <behavior>: <type>, <frames>f, <easing/spring>, scale <a→b>
- Count-up (if used): 24–36f, ease-OUT, then hold
## Visual richness (earn the frame — at least one)
- Depth bg: <gradient/grain/nebula> · Large motif(s): <e.g. 500px moon disc / pyramid silhouette> · Hero type ≥ ~280px
## Icons / background
- <none> | <name> — <source URL> — <license> — rendered LARGE (≥200px) — screened: no logos/faces
```

### `04-audio.md`
```markdown
# F-NNN — Audio (spec, monetization-safe)
## Music bed
- Title / Artist · Source: <library> · URL: <…> · License: <…> · Attribution: <no | "credit string"> · Monetization-safe: yes
- Mix (VO is the lead — bed ducks): VO `vo.wav` at 0.9–1.0; bed base ~0.72 → ~0.22 under speech via the `vo-timing.json` envelope; swell on the payoff; tail fades to 0
## SFX
| Cue | At frame | Vol | Source | URL | License |
|-----|----------|-----|--------|-----|---------|
| whoosh | … | 0.5–0.7 | … | … | … |
| reveal hit | … | 0.9–1.0 | … | … | … |
## Master target (final render)
- **-14 LUFS integrated · ≤ -1 dBTP · LRA 11** — apply the two-pass `loudnorm` from `references/audio-mastering.md` to `out.mp4`, then verify. Quieter masters are NOT boosted by YouTube.
## Render note
- Download each item from its original source at render time; keep the license receipt.
```

## C. Lottie accents (optional, per beat)

A beat may carry a **Lottie accent** — a small animated overlay (e.g. a success checkmark on the payoff, a pulse on the reveal hit) layered on top of the scene. Accents are purely ADDITIVE; they do not change `effective_style`. Specify accents in `03-assets.md` under a `## Lottie accents` section (omit the section if none are needed).

**Source rule — generate-first:** prefer generating the accent from a preset via the `lottie-master` skill:

```bash
python3 .claude/skills/lottie-master/scripts/lottie_gen.py <preset> \
  --color "<palette hex from 03-assets>" --fps 30 \
  -o output/F-NNN/assets/accent-<beat>.json
```

Available presets include `check` (success checkmark). Fallback: `lottiefiles:<url>` — download the `.json` manually, place it in `output/F-NNN/assets/`, and record the URL + license. Cross-reference the `lottie-master` skill for preset inventory and generation options.

**Per-accent record** (one row per accent in the table):

| field | value |
|---|---|
| `beat` | beat name / number matching the frame-map |
| `source` | `generate:<preset>` or `lottiefiles:<url>` |
| `placement` | `top` \| `center` \| `above-captions` |
| `sizePx` | rendered size in px (e.g. `200`) |
| `frame window` | `[startFrame, endFrame)` half-open, within the beat's range |
| `fps` | **30** (always — the gate enforces this) |

**Route-A reject screen** — reject any `.json` that contains:
- Embedded raster images (PNG/JPEG assets inside the JSON)
- Non-embedded fonts (text layers whose `t` family isn't a web-safe or Remotion-available font)
- Expression-driven layers (`x` / expression fields on any keyframe)
- Nested precomps (`ty: 0` assets) whose `fr` differs from the top-level `fr`
- Per-file license incompatibilities (the accent must be freely usable without attribution or with attribution clearly recorded)

If any check fails, regenerate with a different preset or source a clean alternative.

### `03-assets.md` accent template
```markdown
## Lottie accents
| beat | source | placement | sizePx | frame window | fps |
|------|--------|-----------|--------|--------------|-----|
| payoff | generate:check | above-captions | 200 | [120,180) | 30 |
```
(Omit this section entirely if no accents are needed for the video.)

## Boundaries
- Spec only — never download binaries or call paid APIs. If a needed asset can't be found monetization-safe, say so and leave a clear TODO rather than guessing a license.
