# F-001 Cleopatra vs Pyramids — Implementation Design

> Faithful Remotion implementation of the frame-exact spec at
> `/home/zain-ali/Documents/ScriptWriter/output/F-001-cleopatra-vs-pyramids/05-remotion-prompt.md`.
> That prompt is the source of truth for every color, font size, frame range, and on-screen
> word. This doc covers the **code structure** ("how"), not the content ("what").

## Composition facts (pinned by spec)

- id: `F-001-cleopatra-vs-pyramids`
- 1080×1920, 30fps, **840 frames** (28s)
- Scenes are half-open contiguous ranges; final scene cross-dissolves so frame 840 pixel-matches frame 0 (seamless YouTube auto-loop).

## Decisions (confirmed with user 2026-06-16)

1. **Audio** — user will download the 4 Pixabay mp3s themselves. I attempt the fetch; if Pixabay gates it, I wire the `<Audio>` layer to the exact filenames and leave `public/` empty (renders silently until files are present).
2. **Root.tsx** — register the Cleopatra composition only; drop the dangling/broken `./vaquita/*` imports.
3. **Icons** — install `lucide-react`; use `Triangle` (pyramid), `Moon`, `Rocket` per spec.

## Module layout

```
src/cleopatra/
  theme.ts            # color tokens, font loaders, dims (FPS/W/H/DURATION),
                      #   x-positions (PYRAMID_X, CLEO_X, MOON_X), y-bands, scene frame ranges
  motion.ts           # reusable helpers returning style fragments / numbers:
                      #   wordSlamIn, heroOvershoot, yearStampShake, countUp,
                      #   bracketStretch, payoffGlow, crossDissolve
  Background.tsx      # <StarField> (random('stars') seeded — never Math.random) + <TimelineRule>
  Glyphs.tsx          # PyramidGlyph / MoonGlyph / RocketGlyph wrappers around lucide icons
  AudioBed.tsx        # music bed + 3 ticks + 2 whooshes + reveal hit, frame-exact volumes/fades
  CleopatraShort.tsx  # top-level: AbsoluteFill bg + StarField + TimelineRule + <Sequence> per scene + AudioBed
  scenes/
    Hook.tsx          # Scene 0   frames 0–45
    Beat1.tsx         # Scene 1   frames 45–150
    Beat2.tsx         # Scene 2   frames 150–255
    Beat3.tsx         # Scene 3   frames 255–375  (gap reveal, count-up 0→2500)
    Beat4.tsx         # Scene 4   frames 375–480
    Beat5.tsx         # Scene 5   frames 480–600  (second gap, count-up 0→2000)
    Beat6.tsx         # Scene 6   frames 600–765  (payoff)
    LoopBack.tsx      # Scene 7   frames 765–840  (cross-dissolve back to Hook)
```

## Principles

- **One `<Sequence from=… durationInFrames=…>` per scene** so each scene's `useCurrentFrame()` is local/0-based — the spec's per-scene timings (e.g. "yearStampShake @ frame 95" within Beat 1) map directly to local frames. Scene-internal "@ frame N" values in the spec that are global are converted to local offsets in each component (documented inline).
- All motion via `interpolate()` (`extrapolateLeft/Right:'clamp'` + `Easing.bezier`) or `spring()`. **No `Math.random()`** anywhere — star field positions seeded with Remotion `random('stars')`.
- Shared layout constants live once in `theme.ts`. Timeline rule, glyphs, markers, and both brackets read the same `PYRAMID_X / CLEO_X / MOON_X` so left→right ordering (pyramid ‹ Cleopatra ‹ Moon) and the "Cleopatra visually closer to the Moon" relationship are guaranteed.
- Persistent layers (star field + timeline rule) live in `CleopatraShort`, outside the per-scene sequences, but the timeline rule fades in 45–60 and is hidden on Hook + re-hidden on loop-back per spec.
- `LoopBack` renders the Hook layout fading in (0→1, frames 790–840 global) while Beat 6 fades out (765–820) so frame 840 == frame 0.

## Audio (frame-exact, from 04-audio.md / 05 spec)

- `music-dark-tension.mp3`: base 0.11; fade-in 0–30; hold to 540; swell 0.11→0.155 over 540–600; hold to 720; fade to 0 over 765–840. Driven by a frame-callback `volume` fn.
- `sfx-tick.mp3` @ frames 150, 255, 480 — volume 0.30 (3 `<Audio>` instances).
- `sfx-whoosh.mp3` @ 255, 480 — volume 0.20.
- `sfx-reveal-hit.mp3` @ 600 — volume 0.50.
- All referenced via `staticFile()` from `public/`; `<Audio>` from `@remotion/media`.

## Verification

- `npm run lint` (eslint + tsc) must pass.
- `npx remotion still F-001-cleopatra-vs-pyramids --frame=N --scale=0.5` at a few key frames (0, 360 hero number, 600 payoff, 839 loop-match) to sanity-check layout/colors.
