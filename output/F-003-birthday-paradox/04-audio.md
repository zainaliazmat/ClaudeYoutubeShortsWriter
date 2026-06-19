# F-003 — Audio (spec, monetization-safe)

Reuses F-001/F-002's Pixabay picks (Pixabay Content License — commercial use, no attribution required;
same channel, same license receipts). Spec-only; binaries already copied to
`output/F-003-birthday-paradox/assets/`. VO is the LEAD; the bed ducks under it.

## Music bed
- **Dark Tension Cinematic Background** (SoundGalleryByDmitryTaras, Pixabay) — `music-dark-tension.mp3`.
  URL: https://pixabay.com/music/suspense-dark-tension-ambience-thriller-atmosphere-cinematic-background-174648/ · Pixabay Content License.
- **Mix:** `vo.wav` is the LEAD (~0.95 from frame 0). Bed DUCKS under the VO via the `vo-timing.json`
  `envelope`: 0.22 across the single speech region (0→759), releases to 0.72 over 759→768, holds 0.72
  through the silent loop tail (768→834), and the render's master fades the very tail for a clean seam.

## SFX (Pixabay Content License; frames from `vo-timing.json` beats)
| Cue | File | At frame | Vol | Why |
|-----|------|----------|-----|-----|
| Payoff hit — 50%×23 crossing lights (hook) | sfx-reveal-hit.mp3 | 60 | 0.95 | the thumbnail payoff |
| Node tick — 10 → 12% | sfx-tick.mp3 | 282 (beat2) | 0.60 | curve reaches the first node |
| Climb whoosh — the steep sweep | sfx-whoosh.mp3 | 384 (beat3) | 0.50 | 30→71%, 50→97% |
| Node tick — 70 → 99.9% | sfx-tick.mp3 | 537 (beat4) | 0.60 | curve hits the ceiling |
| Reveal hit — "the magic number is 23" | sfx-reveal-hit.mp3 | 691 (beat5) | 0.90 | loop-back payoff |

## Master target (REQUIRED)
- **−14 LUFS / ≤ −1 dBTP** via the default LRA-preserving linear-gain + true-peak limiter master on
  the render → `final.mp4`, verified. (The render loop does this automatically.)

## Boundaries
Spec only — binaries are the already-licensed reuse (no new download). Monetization-safe: Pixabay
Content License, no CC-BY-NC.
