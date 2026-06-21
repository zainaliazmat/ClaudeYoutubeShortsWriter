# F-004 — Audio (spec, monetization-safe)

> Spec-only. Download each item from its original source URL at render time and keep the Pixabay License Certificate PDF (available on each track/SFX page) as your license receipt.

---

## Music bed

### Track pick rationale
F-001/F-002 used "Dark Tension Cinematic Background" (SoundGalleryByDmitryTaras, Pixabay) — a dark thriller-atmosphere bed that fits mystery/scale-reveal videos. F-004's honey-science topic is **warm, curious, light** — a dark-tension bed would fight the tone. A warm/inspiring ambient-documentary track is the right family here.

**Same source library (Pixabay Content License, same channel, same license terms) — different mood sub-family.**

| Field | Value |
|-------|-------|
| **Title** | Inspiring Cinematic Ambient Documentary Music |
| **Artist** | (verify at download — Pixabay credits artist on the track page) |
| **Source library** | Pixabay Music |
| **Direct URL** | https://pixabay.com/music/modern-classical-inspiring-cinematic-ambient-documentary-music-289860/ |
| **License** | Pixabay Content License — royalty-free, free for commercial use including monetized YouTube |
| **Attribution required** | No — Pixabay Content License requires no on-screen or description attribution |
| **Monetization-safe** | Yes — Pixabay Content License explicitly permits commercial monetized video use |
| **Content ID risk note** | Download the per-track Pixabay License Certificate PDF at render time; dispute any automated Content ID claim using that certificate (documented Pixabay/YouTube resolution path, same as F-001/F-002) |
| **Filename to use** | `music-inspiring-cinematic-ambient.mp3` (drop into `output/F-004-honey-never-spoils/assets/`) |

**Mood fit:** Warm, building, curiosity-driven ambient with soft cinematic texture. No lyrics. Rises subtly — supports the "hook mystery → chemistry reveal → payoff" arc without fighting the VO or the word-by-word captions.

**Fallback if ID 289860 is unavailable at download time:** "Soft Background Piano" — https://pixabay.com/music/modern-classical-soft-background-piano-285589/ — same Pixabay Content License, same attribution policy. Also warm and light, slightly quieter energy. Filename: `music-soft-background-piano.mp3`.

---

## Mix (VO is the LEAD — bed ducks under it)

The `vo-timing.json` envelope for F-004 shows a **single merged speech region** (frames 0–840 = continuous narration), with the bed then swelling back for the silent loop tail:

```
vo-timing.json envelope:
  frame   0  → vol 0.22   (speech starts immediately — bed stays ducked)
  frame 840  → vol 0.22   (speech ends)
  frame 849  → vol 0.72   (bed releases/swells over ~9 frames)
  frame 915  → vol 0.72   (holds through loop tail)
```

**Remotion volume implementation:**

| Element | Volume | Notes |
|---------|--------|-------|
| VO `vo.wav` | 0.95 | Lead; `staticFile('vo.wav')`, starts at frame 0 |
| Music bed | `envelope(frame)` | Drive `<Audio volume={…}>` with a linear interpolation of the vo-timing.json envelope keyframes above |
| Bed base (tail/loop) | 0.72 | Swells to 0.72 at frame 849, holds through 915 |
| Bed under speech | 0.22 | Ducked throughout frames 0–840 |
| Beat3 payoff swell | 0.72 at f=849 | Swell lands after the VO ends; for a subtle emotional lift during beat3's `STILL PRESERVED` reveal (f 611–638), optionally bump the envelope to 0.30 at f=611→638 then duck back to 0.22 — see beat3 swell note below |

**Beat3 payoff swell (optional micro-envelope):**
The "still preserved" reveal lands at frame 611. To give the Lottie check accent a slight musical lift without fighting the VO, add two envelope points:
- f=603 → 0.22 (start of the "still" word)
- f=611 → 0.30 (word "preserved" begins / check starts drawing)
- f=638 → 0.30 (beat3 ends)
- f=640 → 0.22 (return to ducked for beat4)
This is a +8 point swell above the ducked bed — audible as a warmth lift without overwhelming the VO.

**Loop seam:** from frame 905, fade the bed to 0 by frame 915 (loop end) so that re-entry at frame 0 (ducked to 0.22) is clean. The envelope already lifts to 0.72 for the tail; layer a short fade-out on top for the seam.

---

## SFX

All SFX from **Pixabay Sound Effects** — Pixabay Content License, free commercial use, no attribution required. Download from pixabay.com directly (not re-uploads).

| Cue | Description | At frame | Vol | Source | URL | Filename |
|-----|-------------|----------|-----|--------|-----|----------|
| Soft chime / draw-complete | A short, warm single-note chime or bell tone — the acoustic "confirmation" as the Lottie check finishes drawing. NOT a harsh notification beep; something like a soft mallet strike or xylophone tap. Duration under 1.5s. | **620** (Lottie check tick completes ~f 611+9=620) | 0.75 | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/soft%20chime/ | `sfx-soft-chime.mp3` |
| Reveal hit / payoff bloom | A gentle cinematic swell or low warm impact as `STILL PRESERVED` wipes in (beat3 hero text). NOT the same dark cinematic boom used in F-001 — for honey, prefer a warm "bloom" or soft mallet pad hit. | **611** (word "preserved" spoken, wipe begins) | 0.65 | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/success/ | `sfx-reveal-bloom.mp3` |
| Lid-snap accent (beat4) | A short satisfying "pop" or soft click as the jar lid seals on `KEEP IT SEALED`. Under 0.5s. | **681** (word "sealed" spoken) | 0.50 | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/pop/ | `sfx-lid-pop.mp3` |

**SFX notes for the render:**
- The soft chime at f=620 layers on top of the Lottie accent completing — it should feel like the visual and audio confirmation arrive together.
- The reveal bloom at f=611 is the emotional peak SFX — louder than the chime at f=620 but still below VO level; the VO word "preserved" is the true lead.
- All three SFX sit above the ducked bed (0.22) in the mix; the bed at 0.22 gives them enough headroom to read clearly.
- At render time, select one specific file per Pixabay search URL above from the top results. Prefer: clean single-strike with short natural decay, no reverb tail longer than 1s, no pitched content that clashes with the music bed key.

---

## Master target (final render) — REQUIRED

Per-element volumes above are **balance**. The rendered file's loudness is set by the master:

- **-14 LUFS integrated · ≤ -1 dBTP · LRA 11**

Apply via the default master chain in `scripts/master.mjs` (linear gain + true-peak limiter, LRA-preserving). This is the correct chain for voice-led Shorts — it preserves the VO's dynamic range (LRA) rather than crushing it. The old two-pass `loudnorm` is behind `--master loudnorm` / `FATHOM_MASTER=loudnorm` and should NOT be used for continuous-narration Shorts (see `asset-sourcing/references/audio-mastering.md`).

Verify after render: the render loop checks LUFS/dBTP automatically. Upload `final.mp4` only once the loop reports **STATUS: PASS**.

---

## Render note

1. Download `music-inspiring-cinematic-ambient.mp3` from https://pixabay.com/music/modern-classical-inspiring-cinematic-ambient-documentary-music-289860/
2. Download `sfx-soft-chime.mp3` from https://pixabay.com/sound-effects/search/soft%20chime/ (select one file)
3. Download `sfx-reveal-bloom.mp3` from https://pixabay.com/sound-effects/search/success/ (select one file)
4. Download `sfx-lid-pop.mp3` from https://pixabay.com/sound-effects/search/pop/ (select one short clean pop)
5. Drop all four files into `output/F-004-honey-never-spoils/assets/`
6. Save the Pixabay License Certificate PDFs alongside them in `output/F-004-honey-never-spoils/audio-licenses/`

---

## Monetization safety checklist

- [x] Music: Pixabay Content License — commercial use permitted, no attribution required
- [x] SFX: Pixabay Content License — commercial use permitted, no attribution required
- [x] No CC-BY-NC tracks selected
- [x] No tracks of unknown license
- [x] No re-upload sources — all sourced from pixabay.com directly
- [x] License certificate: download the Pixabay PDF certificate for each file at render time
- [x] If a Content ID claim arises: dispute using the Pixabay License Certificate PDF
