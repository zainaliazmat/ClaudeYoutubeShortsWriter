---
name: remotion-prompt-generator
description: Fuses a frame-timed Short script with its visual-asset spec and audio spec into a single precise Remotion composition prompt. Use as STEP 5 of the /short pipeline. Reads 02-script.md, 03-assets.md, and 04-audio.md, then writes 05-remotion-prompt.md — a copy-pasteable instruction set for Remotion's official skills to build the 1080x1920 composition (scene/frame list, word-by-word caption timing, audio layering, font/color tokens). Does NOT write .tsx code.
version: 1.0.0
allowed-tools: Read, Write
user-invocable: false
---

# remotion-prompt-generator

Step 5 of the `/short` pipeline. Turn the three prior files into ONE unambiguous prompt that Remotion's official skills (`npx skills add remotion-dev/skills`) can execute without guessing. Output: `output/F-NNN-<slug>/05-remotion-prompt.md`. **Spec/prompt only — never emit `.tsx`.**

Inputs: `02-script.md` (frames, beats, on-screen text, loop-back), `03-assets.md` (fonts, palette, motion signature), `04-audio.md` (music + SFX + mix + timing).

## What a Remotion implementer needs per scene (resolve every ambiguity)
exact text · font family/weight/size · color hex · entrance + exit animation type · start frame + duration (frames) · easing/spring feel · position/layout · z-order · what's on screen simultaneously · transition in/out. If the script left any of these vague, pin a concrete value here (and note it as an assumption).

## Hard constraints to encode
- Composition: **1080×1920, fps 30**, `durationInFrames` = the script total. Frames 0-indexed; ranges half-open and contiguous (`next.start == prev.end`); last visual loops back to frame 0.
- Animation via `interpolate()` with `extrapolateLeft/Right: 'clamp'` and `Easing.bezier(...)`, or `spring()` — give configs from the motion signature. **No `Math.random()`** — use Remotion `random(seed)`.
- Captions: burned-in, word-by-word, hand-timed to beats (no Whisper — there's no voiceover). Keep clear of bottom ~15% and the very top.
- Audio: layered `<Audio>` from `@remotion/media`; **no voiceover, so the music bed is the LEAD — volume ~0.65–0.80** (NOT 0.1x) via a frame-callback for fades; accent SFX 0.5–0.7, reveal hit 0.9–1.0, at the frames named in `04-audio.md`. Reference files via `staticFile()` from `public/`. **Final render must be mastered to -14 LUFS / ≤ -1 dBTP** via the two-pass `loudnorm` post-step (see `04-audio.md` master target) — encode it as the last render instruction.

## `05-remotion-prompt.md` template
```markdown
# F-NNN — Remotion Composition Prompt

## Use the Remotion official skills to build this composition.
- Composition id: `F-NNN-<slug>` · 1080×1920 · 30fps · durationInFrames: <total>

## Design tokens
- Fonts: <from 03-assets> · Colors: <hex set> · Motion signature: <configs>

## Scenes (frame-exact)
### Scene 0 — Hook (frames 0–45)
- Text: "<exact>" · Font/size/color: … · Animation: <type, frames, easing/spring> · Layout: … · z: …
### Scene 1 — Beat 1 (frames 45–135)
- …
(continue for every beat + the loop-back; must tile to durationInFrames)

## Captions
- Word-by-word, hand-timed. Per scene: words + their frame windows. Safe zone: bottom 15% / top clear.

## Audio (no voiceover — bed is the lead)
- Music: `public/<file>` @ vol 0.65–0.80, fade in <f>/out <f>; swell ~+3 dB into the reveal.
- SFX: `public/<file>` at frame <n> @ vol 0.5–0.7; reveal hit @ 0.9–1.0.
- **Master (final step): run two-pass `loudnorm` on the rendered `out.mp4` → -14 LUFS / ≤ -1 dBTP / LRA 11, then verify.**

## Loop-back
- Final frame matches frame 0 (<how>) so the auto-loop is invisible.

## Assumptions made (where the script was vague)
- <list, if any>
```

## Boundaries
- Produce the prompt only. Do not generate React/Remotion code, install packages, or render. If the script's frame budget doesn't tile, flag it for the review step rather than silently fixing it here.
