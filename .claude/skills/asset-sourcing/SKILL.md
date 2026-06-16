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

- **Font stack:** 1 display/heading face + 1 numeric/mono face if numbers feature. Prefer variable Google Fonts (free, self-hostable) — e.g. a heavy grotesque for hooks. Give exact family names, weights, and the `@remotion/google-fonts` package name. Keep it consistent with prior episodes if a signature exists (check `content/scripts/`).
- **Color palette:** exact hex values — background, primary text, accent/highlight, and a "reveal" color. Ensure WCAG-strong contrast for burned-in captions. Note the ocean/"Fathom" brand leaning (deep blues) — check `Branding/`.
- **Motion signature:** the recurring entrance/emphasis behavior (e.g. word slam-in via spring, highlight wipe, count-up). Give concrete Remotion intent: animation type, frame duration, easing/spring feel, scale range. These become the reviewer's feasibility checks.
- **Icons / background (only if a beat needs one):** prefer pure-CSS/SVG shapes or a free no-attribution icon set (e.g. Lucide/Phosphor — MIT). Record source + license. **Screen for trademarks, logos, identifiable faces** — flag and replace if found. Default to NO imagery; typography should carry it.

## B. `04-audio.md` — music + SFX (monetization-safe)

Follow `references/audio-sources.md` for the source policy. For the ONE background track and any SFX:

1. Search the allowed libraries (YouTube Audio Library, Pixabay, Uppbeat free) for a track matching the script's energy/tempo and runtime.
2. Record per pick: **title, artist, source library, direct URL, license, attribution required? (yes/no + exact credit string), monetization-safe? (must be yes)**.
3. **Reject** anything CC-BY-NC, unknown-license, or from a re-upload channel. Prefer YouTube Audio Library (YouTube-certified, no Content-ID claims).
4. Specify the **mix:** music bed at ~0.10–0.15 under captions; name SFX punch-ins by frame (e.g. "whoosh on each beat cut", "ding on the reveal at frame X").
5. Note: files are downloaded from the original source at render time — this spec just pins the choice + license receipt.

## Templates

### `03-assets.md`
```markdown
# F-NNN — Visual Assets (spec)
## Fonts
- Display: <Family> <weights> — `@remotion/google-fonts/<Pkg>` — free, self-hostable
- Numeric/mono (if used): <Family> — <pkg>
## Palette (hex)
- Background <#> · Text <#> · Accent <#> · Reveal <#> — caption contrast ratio: <X:1>
## Motion signature
- <behavior>: <type>, <frames>f, <easing/spring>, scale <a→b>
## Icons / background
- <none> | <name> — <source URL> — <license> — screened: no logos/faces
```

### `04-audio.md`
```markdown
# F-NNN — Audio (spec, monetization-safe)
## Music bed
- Title / Artist · Source: <library> · URL: <…> · License: <…> · Attribution: <no | "credit string"> · Monetization-safe: yes
- Mix: bed at 0.1<x> under captions; fade in <f>f / out <f>f
## SFX
| Cue | At frame | Source | URL | License |
|-----|----------|--------|-----|---------|
| whoosh | … | … | … | … |
## Render note
- Download each item from its original source at render time; keep the license receipt.
```

## Boundaries
- Spec only — never download binaries or call paid APIs. If a needed asset can't be found monetization-safe, say so and leave a clear TODO rather than guessing a license.
