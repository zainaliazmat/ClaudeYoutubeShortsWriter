---
name: remotion-prompt-generator
description: Fuses a frame-timed Short script with its visual-asset spec and audio spec into a single precise Remotion composition prompt. Use as STEP 5 of the /short pipeline. Reads 02-script.md, 03-assets.md, and 04-audio.md, then writes 05-remotion-prompt.md — a copy-pasteable instruction set for Remotion's official skills to build the 1080x1920 composition (scene/frame list, word-by-word caption timing, audio layering, font/color tokens). Does NOT write .tsx code.
version: 1.0.0
allowed-tools: Read, Write
user-invocable: false
---

# remotion-prompt-generator

Step 5 of the `/short` pipeline. Turn the three prior files into ONE unambiguous prompt that Remotion's official skills (`npx skills add remotion-dev/skills`) can execute without guessing. Output: `output/F-NNN-<slug>/05-remotion-prompt.md`. **Spec/prompt only — never emit `.tsx`.**

Inputs: `02-script.md` (beats, on-screen text, loop-back, the VO-patched frame-map table), `vo-timing.json` (integer word + beat frames, `total` = durationInFrames, `speech_regions`, ducking `envelope`), `vo.wav` (the voiceover, lead audio), `03-assets.md` (fonts, palette, motion signature), `04-audio.md` (music + SFX + mix + timing).

## What a Remotion implementer needs per scene (resolve every ambiguity)
exact text · font family/weight/size · color hex · entrance + exit animation type · start frame + duration (frames) · easing/spring feel · position/layout · z-order · what's on screen simultaneously · transition in/out. If the script left any of these vague, pin a concrete value here (and note it as an assumption).

## Hard constraints to encode
- Composition: **1080×1920, fps 30**, `durationInFrames` = `vo-timing.json` `total`. Frames 0-indexed; ranges half-open and contiguous (`next.start == prev.end`) per the VO-patched frame-map table in `02-script.md`; last visual loops back to frame 0. The loop tail is silent (VO ended).
- Animation via `interpolate()` with `extrapolateLeft/Right: 'clamp'` and `Easing.bezier(...)`, or `spring()` — give configs from the motion signature. **No `Math.random()`** — use Remotion `random(seed)`.
- **Composition & frame utilization (not just edge-avoidance):** lay out across the **full safe area (y≈260–1660)**, not a thin center band. Define **explicit vertical bands per scene** — e.g. context line (upper third), hero element (center), supporting visual / timeline (lower third) — so the frame is balanced and **no large dead zone is left** (>40% of safe-area height empty without a stated reason). The **hero element of each beat must be sized to dominate** (primary numbers ≥ ~280px). Emit a per-scene **"frame-fill note"** stating roughly how the safe-area height is used. A persistent **depth background** (gradient/glow/texture from `03-assets.md`) fills the rest — never leave flat black.
- **Background depth:** encode the `03-assets.md` background as an actual gradient/glow/texture layer behind everything; reject a flat single-hex near-black. Make decorative layers (timeline, brackets, glyphs) **visible at viewing size** — thick bars/large shapes, not 1–2px hairlines or 36–48px icons.
- **Overflow guard:** any line that could exceed the safe width at its size must use Remotion `fitText`/measured sizing. **Never let a caption collide with a glyph/marker** — reserve its lane (don't place a right-edge glyph in the same horizontal band as a long caption).
- **Scale-honest data viz:** when the script compares magnitudes (gap A vs gap B), the on-screen lengths/positions **MUST be proportional to the values — compute positions from the numbers** — OR the exaggeration must be explicitly labeled. Do NOT pin arbitrary x-positions that contradict the payoff (F-001 drew a real ~5:4 gap as ~3:1 and undercut "~450 years closer"). Clamp any animated count-up display to **≥ 0** (never show a negative interim value).
- Captions: burned-in, word-by-word, **generated from `vo-timing.json` integer word frames** — each word's `[start,end]` frames come straight from the JSON (no Whisper, no hand-typed windows, no re-rounding from seconds); the caption shows the word's `display` string. Keep clear of bottom ~15% and the very top.
- Audio (VO is the lead): layered `<Audio>` from `@remotion/media`. **`vo.wav` is the lead at volume ~0.9–1.0** (`staticFile('vo.wav')`). The **music bed DUCKS under it** via a frame-callback `volume` that reads the `vo-timing.json` `envelope` keyframes (base ~0.72 → ~0.22 across `speech_regions`, swelling on the payoff after the last region) — not a flat low gain, not a live sidechain. Accent SFX 0.5–0.7, reveal hit 0.9–1.0, at the frames named in `04-audio.md`. Reference files via `staticFile()` from `public/`. **Final render must be mastered to -14 LUFS / ≤ -1 dBTP** via the two-pass `loudnorm` post-step (see `04-audio.md` master target) — encode it as the last render instruction.

## `05-remotion-prompt.md` template
```markdown
# F-NNN — Remotion Composition Prompt

## Use the Remotion official skills to build this composition.
- Composition id: `F-NNN-<slug>` · 1080×1920 · 30fps · durationInFrames: <vo-timing.json total>

## Design tokens
- Fonts: <from 03-assets> · Colors: <hex set + bg depth: gradient/glow> · Motion signature: <configs>
- Persistent background layer (all frames): <gradient/glow/texture> — never flat single-hex black.

## Scenes (frame-exact)
> Layout: use the FULL safe area y≈260–1660 in explicit bands (context = upper third · hero = center · supporting visual/timeline = lower third). Hero element dominates (primary numbers ≥ ~280px). Decorative layers visible at viewing size (thick bars/large shapes, not hairlines/tiny icons).

### Scene 0 — Hook (frames 0–45)
- Text: "<exact>" · Font/size/color: … · Animation: <type, frames, easing/spring> · Layout (bands): … · z: …
- Frame-fill note: <how the safe-area height is used; no dead zone >40%>
### Scene 1 — Beat 1 (frames 45–135)
- … · Frame-fill note: …
(continue for every beat + the loop-back; must tile to durationInFrames)
(for any magnitude comparison: state the proportional positions computed FROM the values, or label the exaggeration; count-up displays clamp ≥ 0)

## Captions
- Word-by-word, from `vo-timing.json` integer word frames (display string per word). Per scene: words + their [start,end] frames copied from the JSON. Safe zone: bottom 15% / top clear.

## Audio (VO is the lead — music ducks under it)
- VO: `staticFile('vo.wav')` @ vol 0.9–1.0 — the lead.
- Music: `public/<file>` with a frame-callback `volume` reading the `vo-timing.json` `envelope` (base ~0.72, ~0.22 under `speech_regions`, swell on the payoff); fade in <f>/out <f> (tail fades to 0).
- SFX: `public/<file>` at frame <n> @ vol 0.5–0.7; reveal hit @ 0.9–1.0.
- **Master (final step): run two-pass `loudnorm` on the rendered `out.mp4` → -14 LUFS / ≤ -1 dBTP / LRA 11, then verify.**

## Loop-back
- Final frame matches frame 0 (<how>) so the auto-loop is invisible.

## Assumptions made (where the script was vague)
- <list, if any>
```

## Boundaries
- Produce the prompt only. Do not generate React/Remotion code, install packages, or render. If the script's frame budget doesn't tile, flag it for the review step rather than silently fixing it here.
