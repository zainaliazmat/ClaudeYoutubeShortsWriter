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
- Audio: layered `<Audio>` from `@remotion/media`; music bed volume ~0.10–0.15 via a frame-callback for fades; SFX at the frames named in `04-audio.md`. Reference files via `staticFile()` from `public/` (the renderer adds them; this prompt names the expected filenames).

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

## Audio
- Music: `public/<file>` @ vol 0.1x, fade in <f>/out <f>.
- SFX: `public/<file>` at frame <n>; …

## Loop-back
- Final frame matches frame 0 (<how>) so the auto-loop is invisible.

## Assumptions made (where the script was vague)
- <list, if any>
```

## Boundaries
- Produce the prompt only. Do not generate React/Remotion code, install packages, or render. If the script's frame budget doesn't tile, flag it for the review step rather than silently fixing it here.
