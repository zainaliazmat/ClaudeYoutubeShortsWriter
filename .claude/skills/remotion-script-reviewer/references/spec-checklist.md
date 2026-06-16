# Spec Checklist — per-scene required fields & common ambiguities

Load this in step 4 alongside `remotion-knowledge.md`. For each scene/beat, check the
script supplies everything an implementer needs. A missing field isn't pedantry — it's a
decision the implementer (human or agent) will otherwise guess, and guesses don't match
the creator's intent.

## Per-scene required fields

For **every** beat (and the hook and loop-back), the script should give:

1. **Exact on-screen text** — the literal words, not "a stat" or "the title". Word-for-word.
2. **Font intent** — family/size/weight, or at least a clear hierarchy ("big bold headline,
   small caption"). Brand font if the channel has one.
3. **Color values** — hex, or unambiguous intent ("channel red #E50914 on near-black").
   Background AND foreground.
4. **Entrance animation** — type + frame count + easing/spring feel (see translation table).
5. **Exit / hold** — does it animate out, hold, or get replaced by a cut?
6. **Start frame + duration in frames** — explicit (the validator needs these).
7. **Position / layout** — where on the 1080×1920 canvas; centered, upper third, etc.
8. **Layering / z-order** — when multiple elements share the screen, what's on top.
9. **What's on screen simultaneously** — persistent elements (a running counter, a logo
   bug, a progress bar) vs. what's swapping per beat.
10. **Transition in/out** — hard cut, crossfade (remember the budget shortening), wipe.

Not every field is needed for every beat — a plain text card doesn't need z-order. Use
judgment: flag the *load-bearing* gaps (the ones that change what gets built), not every
blank.

## Common ambiguities to surface (and propose a single concrete fix for)

These phrasings recur and always under-specify. When you see one, name it and supply one
default value (don't enumerate options — a single default is easier to act on):

- **"slams in" / "punches in"** → over how many frames? what spring/easing?
- **"heartbeat pulse"** → what cycle length (BPM) and scale range (e.g. 1.0→1.08→1.0)?
- **"quick scale-overshoot"** → which spring config, over how many frames?
- **"bleeds from dark to deep blue"** → exact start/end hex, over what frame range,
  via `interpolateColors`?
- **"8 nodes light up one per arm in sequence"** → stagger interval in frames, per-node
  animation length — and does it fit the beat budget?
- **"text appears"** → fade? slide? typewriter? over how many frames?
- **"it loops back"** → does the final-frame state actually match frame 0? describe both.
  A complete loop spec names the endpoints side by side, e.g.:
  > *Frame 0:* bg `#0a0a14`, hook text centered at opacity 1, scale 1.0.
  > *Frame 720 (final):* identical — bg `#0a0a14`, same hook text, same position/opacity/scale,
  > nothing mid-animation. → the cut is invisible.
  If the script only says "fades back to the start", that's a major: the implementer can't
  confirm the states match.
- **"epic music"** → tempo/energy, and is it ducked under the captions?
- **"SFX on the cut"** → at which exact frame?
- **"big text"** → px size? does it fit the safe zone at that size (use `fitText`)?

## How to phrase a gap in the fix list

For each gap, write: **what's missing → why it matters → the single concrete fix.**

> **[major] Beat 2 — "logo slams in" has no timing.** An implementer can't build "slams"
> without a duration and curve. → Fix: `spring({frame, fps, config:{damping:10,
> stiffness:100}})`, scale 1.3→1.0 over ~13 frames (frames 135–148).

This format lets a human skim and an agent act, and gives the writer a value to drop in.
