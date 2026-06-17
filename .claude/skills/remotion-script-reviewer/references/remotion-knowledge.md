# Remotion Knowledge — what the reviewer maps creative prose onto

Load this during the scene-by-scene pass (workflow step 4). The job is to translate a
script's plain-language motion descriptions into the concrete Remotion API + parameters
an implementer would actually write — and to flag where the script is too vague to
implement, technically infeasible, or arithmetically wrong.

> **Version note.** Remotion's API shifts between major versions. The configs below are
> current for Remotion v4.x with the modern `@remotion/media` `<Audio>` and
> `@remotion/captions`. When you suggest a fix, prefer these names but tell the user to
> match their installed version. Key version gotchas are flagged inline as ⚠VERSION.

## Table of contents
1. The frame model (the source of all hard checks)
2. `interpolate()` and `interpolateColors()`
3. `Easing` — the copy-paste curve library
4. `spring()` — overshoot, bounce, and how to kill it
5. `Sequence` / `Series` / `TransitionSeries` (and the transition-overlap budget trap)
6. Captions (`@remotion/captions`)
7. Audio (`@remotion/media`)
8. Text & fonts (`@remotion/layout-utils`, `@remotion/google-fonts`)
9. Rendering gotchas to flag in scripts
10. Translation table — creative phrase → concrete config

---

## 1. The frame model

- `useCurrentFrame()` returns the current frame; `useVideoConfig()` returns `fps`,
  `width`, `height`, `durationInFrames`. **Time = frame / fps.** At 30fps, frame 30 = 1s;
  a 28s video = 840 frames.
- **Frames are 0-indexed.** First frame is 0; the last *rendered* frame is
  `durationInFrames − 1`. A section written "frames A–B" represents `(B − A)` frames of
  duration and the next section starts at **B**, not B+1 — that's how ranges tile cleanly.
  (The validator enforces this; you just explain it when a script gets it wrong.)
- The single most objective check: hook + every beat + loop-back must sum to exactly
  `durationInFrames`, contiguous, no gaps/overlaps. **Never do this math by hand — the
  validator script does it.**

## 2. `interpolate()` and `interpolateColors()`

`interpolate(frame, inputRange, outputRange, options)` — maps a frame to a value.
- Input and output arrays **must be equal length**.
- ⚠ Default extrapolation is `extend`: values keep growing past the range — a classic bug
  (e.g. opacity shooting past 1). Almost always set
  `extrapolateLeft: 'clamp', extrapolateRight: 'clamp'` to hold the endpoints.
- Takes an `easing` option (see §3).
- `interpolateColors(frame, inputRange, [colorA, colorB])` for color transitions — this is
  the right answer for "fades from X to Y", "bleeds dark to blue", etc.

Example a reviewer would suggest:
```js
const opacity = interpolate(frame, [0, 15], [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
```

## 3. `Easing` — the copy-paste curve library

`Easing.bezier(x1,y1,x2,y2)` matches CSS `cubic-bezier`. Also `Easing.in/out/inOut`,
`Easing.linear` (default), `.quad`, `.cubic`, `.sin`, `.circle`, `.exp`, `.elastic`.
Default approach for most motion: `interpolate` + `Easing.bezier`. Concrete curves:

| Feel | Curve | Duration |
|---|---|---|
| Crisp UI entrance (strong ease-out, no overshoot) | `Easing.bezier(0.16, 1, 0.3, 1)` | ~45f |
| Editorial / slow fade (balanced ease-in-out) | `Easing.bezier(0.45, 0, 0.55, 1)` | ~90f |
| Playful overshoot (use sparingly for emphasis) | `Easing.bezier(0.34, 1.56, 0.64, 1)` | ~30f |
| Slide-in | `Easing.bezier(0.22, 1, 0.36, 1)` | — |

Rule of thumb: `Easing.out` for entrances (arrive with momentum), `Easing.in` for exits
(leave with gravity).

## 4. `spring()` — overshoot, bounce, and how to kill it

`spring({frame, fps, config, from, to, durationInFrames, delay, reverse})`.
- **Default config: `mass: 1, damping: 10, stiffness: 100`** → a little overshoot/bounce.
  This is what you suggest for "scale-overshoot", "pop", "bounce in", "slams in".
- **To remove bounce, raise damping. Canonical no-bounce value: `damping: 100`.**
- `overshootClamping: true` prevents shooting past `to`.
- `durationInFrames` stretches the curve to an exact length. Order of operations:
  **stretch → reverse → delay.**
- ⚠ The `{damping: 200}` value seen around is from `@remotion/transitions` `springTiming`,
  **not** base `spring()`. Don't cite it as the spring default.

Example for "scale-overshoot over ~12–15 frames":
```js
const scale = spring({ frame, fps, config: { damping: 10, stiffness: 100 },
                       durationInFrames: 13 });
```

## 5. `Sequence` / `Series` / `TransitionSeries`

- `<Sequence from={f} durationInFrames={d}>` time-shifts children. **Inside a Sequence,
  `useCurrentFrame()` is relative — it returns 0 at the sequence's start.** A reviewer
  should remember this when a script's beat says "animate over its first 10 frames."
- Default layout is `absolute-fill` (children overlay). Pass `layout="none"` to opt out.
- `<Series>` plays `<Series.Sequence durationInFrames={d}>` blocks back-to-back. Only the
  **last** may be `Infinity`. `offset` adds gaps (positive) or overlaps (negative).
- `premountFor` mounts a sequence invisibly ahead of time (carries `opacity:0`,
  `pointer-events:none`) to preload assets.
- **⚠ TransitionSeries budget trap:** `<TransitionSeries>` with a `.Transition` **shortens**
  total duration, because both scenes render during the crossfade. A(40) + B(60) with a
  30-frame transition = **70 frames total, not 100.** `.Overlay` does **not** shorten it.
  If a script uses crossfades/transitions between beats, the naive sum of beat durations
  **overstates** the real total — call this out and recompute.

## 6. Captions (`@remotion/captions`)

- `Caption` type: `{ text, startMs, endMs, timestampMs, confidence }`. `text` is
  **whitespace-sensitive** — include a leading space per word; render with
  `white-space: pre` so spaces survive.
- `createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds })` → `{ pages }`
  of `TikTokPage`s, each with a `tokens[]` array carrying `fromMs`/`toMs` for word-by-word
  highlighting. ⚠VERSION: requires Remotion v4.0.216+.
  - Low `combineTokensWithinMilliseconds` (~200–500ms) → word-by-word.
  - High (~1200–2000ms) → multiple words per page.
- **This pipeline's captions come from `vo-timing.json`** — the tts-voiceover step already emits
  exact integer word frames (display string per word), so captions are built directly from those,
  NOT transcribed. (Whisper — `@remotion/install-whisper-cpp` / `@remotion/openai-whisper` /
  `@remotion/whisper-web` — is the generic path when you DON'T already have word timing; we do, so
  skip it. Whisper is timing-by-ASR and would re-introduce the drift the JSON avoids.)
- Reviewer check: if a script says "word-by-word captions", confirm they're generated from
  `vo-timing.json` word frames (VO default) — or hand-timed to beats for a no-VO Short. Flag a spec
  that says "use Whisper" when a `vo-timing.json` exists: that's redundant and less accurate.

## 7. Audio (`@remotion/media` `<Audio>`)

- ⚠VERSION: modern `@remotion/media` `<Audio>` uses **`trimBefore` / `trimAfter`** (in
  frames). Older `<Audio>` / `<Html5Audio>` used `startFrom` / `endAt`. Match the user's version.
- `volume` is a number **or** a per-frame callback `f => ...` where `f` starts at **0 when
  the audio begins**, not the composition frame.
- `muted`; `playbackRate` (reverse not supported; pitch shifting only applies at render,
  not in preview/Player).
- **Delay audio by wrapping in `<Sequence from={n}>`.** For an SFX synced to a visual beat,
  put the SFX `<Audio>` in a Sequence whose `from` equals that beat's start frame.
- `useAudioData()` / `visualizeAudio()` (`@remotion/media-utils`) drive visualizations;
  `@remotion/sfx` has ready-made effects.
- Reviewer check: every "SFX on beat" / "whoosh on the cut" note needs a **frame number**
  that matches the corresponding visual event's frame. Flag any SFX with no frame.

## 8. Text & fonts

- Load fonts with `@remotion/google-fonts` — `loadFont()` exposes `waitUntilDone()`.
- `measureText()` / `fitText()` / `fitTextOnNLines()` (`@remotion/layout-utils`) only work
  **after** the font is loaded, and you must match **all** font properties (family, size,
  weight, letterSpacing) between measurement and render or the box will be wrong.
- Use `outline`, **not** `border`, for text outlines — `border` shrinks the box via
  `box-sizing: border-box`.
- **Typewriter rule (official): always use string slicing, never per-character opacity.**
  Invisible characters still occupy space and break cursor position. Reference timing:
  ~2 frames/char (~15 chars/sec at 30fps), a 16-frame cursor-blink cycle, ~1s pause after
  the first sentence. If a script describes a typewriter/typing reveal, this is the spec.

## 9. Rendering gotchas to flag in scripts

1. **CSS transitions/animations and Tailwind animation classes are forbidden** — they don't
   render deterministically. All motion must derive from `useCurrentFrame()`. If a script
   says "CSS fade" or "animate-pulse", flag it: the motion must be frame-driven.
2. **No `useState`-driven time.** Remotion re-renders every frame; `useState` time → infinite
   loops. Motion comes from frame math.
3. **`delayRender()` / `continueRender()`** (prefer the `useDelayRender()` hook) wrap async
   asset loading. The render fails if `continueRender()` isn't called within the timeout —
   the error fires at **28000ms**. Flag any script that loads remote assets without noting this.
4. **fps mismatches** between composition and assets cause desync. Design in seconds × fps.
5. **Frame budgets must be realistic for animation complexity.** "8 nodes light up one per
   arm in sequence" at a 5-frame stagger needs ≥40 frames just for the stagger to resolve —
   if the beat is only 30 frames, the animation can't finish. Do this sanity check per beat.

## 10. Translation table — creative phrase → concrete config

When a script uses vague motion language, this is the *single default* to suggest (give one
concrete value, not a menu — it's easier to act on). Always include the frame count.

| Script says… | Suggest (concrete) |
|---|---|
| "slams in" / "punches in" | `spring({frame, fps, config:{damping:10, stiffness:100}})` over ~12–15f, scale from 1.3→1.0 or y from -60→0 |
| "scale-overshoot" / "pops" / "bounces in" | `spring` default config over ~12–15f, scale 0→1 |
| "heartbeat pulse" | loop a scale `1.0→1.08→1.0`, ~18–24f per cycle (~75–100bpm); drive with `interpolate(frame % cycle, …)` |
| "quick scale-overshoot" | `spring({…config:{damping:10}})`, `durationInFrames: 12` |
| "bleeds from dark to deep blue" | `interpolateColors(frame, [startF, endF], ['#0a0a14', '#0b2a6b'])` |
| "counter ticks up" / "number counts 0→N" | `Math.round(interpolate(frame, [startF, endF], [0, N], {extrapolateRight:'clamp'}))` — render the rounded value; declare it a **persistent** element if it spans beats |
| "fades in" | `interpolate(frame, [startF, startF+15], [0,1], {extrapolateRight:'clamp'})` |
| "slides up from below" | translateY `interpolate` 60→0 with `Easing.bezier(0.22,1,0.36,1)` over ~20f |
| "crisp clean entrance" | `Easing.bezier(0.16, 1, 0.3, 1)` over ~45f, no overshoot |
| "typewriter / types out" | string slicing, ~2f/char, 16f cursor blink (never per-char opacity) |
| "X nodes light up in sequence" | per-node `spring` with a `delay` of `i * stagger`; stagger × count ≤ beat duration |
| "crossfade to next beat" | `<TransitionSeries.Transition>` — **and recompute the total** (transition shortens it) |
| "whoosh on the cut" / "SFX on beat" | SFX `<Audio>` in `<Sequence from={beatStartFrame}>` |
