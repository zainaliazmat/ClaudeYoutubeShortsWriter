# F-002 — Audio (spec, monetization-safe)

Reuses F-001's Pixabay picks (Pixabay Content License — commercial use, no attribution; same
channel, same license receipts). Spec-only; binaries live in `output/F-002-.../assets/`.

## Music bed
- **Dark Tension Cinematic Background** (SoundGalleryByDmitryTaras, Pixabay) — `music-dark-tension.mp3`.
  URL: https://pixabay.com/music/suspense-dark-tension-ambience-thriller-atmosphere-cinematic-background-174648/ · Pixabay Content License.
- **Mix:** VO `vo.wav` is the LEAD (~0.95 from frame 0). Bed DUCKS under the VO via the `vo-timing.json`
  envelope: 0.22 across the single speech region (0→645), releases to 0.72 over 645→654, holds 0.72
  through the silent tail, fades to 0 by 720 for a clean loop seam.

## SFX (Pixabay Content License; frames from vo-timing.json beats)
| Cue | File | At frame | Vol |
|-----|------|----------|-----|
| Year-stamp tick (150 MYA) | sfx-tick.mp3 | 95 (beat1) | 0.60 |
| Year-stamp tick (66 MYA) | sfx-tick.mp3 | 206 (beat2) | 0.60 |
| Gap whoosh (Stego→T.rex) | sfx-whoosh.mp3 | 306 (beat3) | 0.50 |
| Gap whoosh (T.rex→today) | sfx-whoosh.mp3 | 447 (beat5) | 0.50 |
| Reveal hit (payoff) | sfx-reveal-hit.mp3 | 518 (beat6) | 0.95 |

## Master target (REQUIRED)
- **-14 LUFS / ≤ -1 dBTP / LRA 11** via two-pass `loudnorm` on the render → `final.mp4`, verified.
  (The render loop does this automatically.)
