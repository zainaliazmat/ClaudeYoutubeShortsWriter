# F-001 — Audio (spec, monetization-safe)

> Spec-only. Do not download files here. Download each item from its original source URL at render time and keep the license receipt (Pixabay provides a downloadable PDF license certificate per track — store it alongside the render assets).

---

## Music bed

| Field | Value |
|-------|-------|
| **Title** | Dark Tension Cinematic Background |
| **Artist** | SoundGalleryByDmitryTaras |
| **Source library** | Pixabay Music |
| **Direct URL** | https://pixabay.com/music/suspense-dark-tension-ambience-thriller-atmosphere-cinematic-background-174648/ |
| **License** | Pixabay Content License (royalty-free, free for commercial use including monetized YouTube) |
| **Attribution required** | No — Pixabay license requires no on-screen or description attribution |
| **Monetization-safe** | Yes — Pixabay license explicitly permits commercial use and monetized video; download the per-track Pixabay License Certificate PDF at render time to dispute any automated Content ID claim if one arises (Pixabay provides this resolution path) |
| **Content ID risk note** | Some Pixabay contributors register tracks with Content ID. If a claim is filed, dispute it using the Pixabay License Certificate — YouTube resolves these within ~30 days. The Pixabay license is the legal receipt. This is not a reason to reject the track; it is a known-manageable procedural risk. |

**Mood / fit:** Low, minimal, tension-building ambient cinematic — dark thriller atmosphere with no lyrics. Matches the script's "low, suspenseful build that rises subtly into the Beat 6 payoff, then resolves on the loop." No vocals to fight the VO or the word-by-word captions.

**Mix (VO is the LEAD — the music bed DUCKS under it):**
- **Voiceover `vo.wav`: `<Audio volume={0.95}>`** — the lead; `staticFile('vo.wav')`, starts at frame 0 (VO speaks immediately, no silent lead).
- **Music bed: ducked under the VO via the `vo-timing.json` `envelope`.** Drive the bed `<Audio>` `volume` with a frame-callback that reads the envelope keyframes (linear ramp between them):
  - `0 → 855`: **0.22** (the single merged `speech_regions` span — continuous narration, so the bed stays ducked under the whole VO).
  - `855 → 864`: ramp **0.22 → 0.72** (release ~9 frames as the VO ends).
  - `864 → 930`: **0.72** — the music **swells back up** to carry the silent loop tail / payoff hold.
- Tail: from ~frame 905 fade the bed toward 0 by frame 930 so the loop restart is clean (it re-enters ducked at frame 0). The envelope already lifts the bed for the tail; layer a short fade-out on top for the seam.
- Do NOT mix the bed flat-loud over the voice and do NOT crush it to ~0.11 — the deterministic envelope is the whole point (VO intelligible throughout, music breathes on the payoff).

---

## SFX

All SFX from **Pixabay Sound Effects** — Pixabay Content License, free commercial use, no attribution required. Download from original Pixabay URL at render time; save the license certificate.

> Frame cues recomputed from the VO-derived beat frames in `vo-timing.json` (hook 0, beat1 109, beat2 259, beat3 397, beat4 493, beat5 592, beat6 702, loop 855). The year-stamp ticks land where each year word is spoken; whooshes on the gap beats; the reveal hit on the payoff beat.

| Cue | Description | At frame | Source | Search URL | License |
|-----|-------------|----------|--------|-----------|---------|
| Year-stamp tick 1 | Single dry mechanical "tick" or "lock" click — stone-impact feel | **109** (Beat 1: "2560 BC") | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/clock-tick/ | Pixabay Content License — commercial use, no attribution |
| Year-stamp tick 2 | Same SFX as tick 1 (reuse the same file) | **259** (Beat 2: "69 BC") | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/clock-tick/ | Pixabay Content License — commercial use, no attribution |
| Year-stamp tick 3 | Same SFX as tick 1 | **493** (Beat 4: "1969") | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/clock-tick/ | Pixabay Content License — commercial use, no attribution |
| Bracket whoosh | Short air-whoosh as a gap segment grows | **397** (Beat 3 gold gap) and **592** (Beat 5 blue gap) | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/whoosh/ | Pixabay Content License — commercial use, no attribution |
| Low reveal hit (payoff) | Single deep cinematic impact / low boom — the "oh wow" hit | **702** (Beat 6 payoff start: "~450 YEARS CLOSER") | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/cinematic-hit/ | Pixabay Content License — commercial use, no attribution |

**SFX mix levels (sit above the ducked bed; the reveal hit is loudest, just under the VO):**
- Year-stamp ticks: punchy accent. Remotion `<Audio volume={0.60}>` per instance.
- Bracket whooshes: quick pass, just above the bed. Remotion `<Audio volume={0.50}>`.
- Low reveal hit (frame 702): the emotional peak — loudest non-VO element, peak near -1 dBFS in the render. Remotion `<Audio volume={0.95}>`.

**SFX render note:** All three tick cues use the same single file — load it once and sequence three `<Audio>` instances with `trimBefore`/offsets matching the beat frames. Remotion handles overlapping audio instances cleanly.

---

## Master target (final render) — REQUIRED

Per-element volumes above are *balance*. The rendered file's *loudness* is set here:

- **-14 LUFS integrated · ≤ -1 dBTP · LRA 11.** Apply the two-pass `loudnorm` from `.claude/skills/asset-sourcing/references/audio-mastering.md` to `out.mp4` → `final.mp4`, then verify. Upload `final.mp4`.

### Mastering result (v3 reference — v4 must be RE-MEASURED post-render)

The numbers below are from the **v3** (no-VO) render and are kept as the worked example of the fix. **v4 has a different mix (VO lead + ducked bed), so measure it fresh** after rendering `out.mp4`: run pass 1 to read the v4 `measured_*` values, then pass 2 with those. Target unchanged: -14 LUFS / ≤ -1 dBTP / LRA 11.

| | Integrated | True peak | LRA | In-feed |
|---|---|---|---|---|
| **v3, as first rendered** (bed `0.11`, no master) | **-30.6 LUFS** | -8.3 dBTP | 13.7 | near-silent vs other Shorts |
| **v3, after two-pass loudnorm to -14** | **-14.8 LUFS** | -0.65 dBTP | 11.9 | correct; riser build→hit preserved |

Exact command shape (v3 values shown — substitute v4's pass-1 measurements):
```bash
# pass 1: measure  →  pass 2:
ffmpeg -i out.mp4 -c:v copy \
  -af loudnorm=I=-14:TP=-1:LRA=11:measured_I=-30.62:measured_TP=-8.31:measured_LRA=13.70:measured_thresh=-41.34:offset=-0.95:linear=false \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart final.mp4
```
(A 0.25s black fade-in at the head was also trimmed — a video fix; see CLAUDE.md "frame 1 = no black lead".)

---

## Specific SFX track recommendations (from Pixabay search — select at render time)

These are confirmed category search pages on Pixabay. The creator selects one specific file per category at render time from the top results. Do NOT use re-uploads from YouTube or third-party sites — only from pixabay.com directly.

- **Tick / lock SFX:** Browse https://pixabay.com/sound-effects/search/clock-tick/ — prefer a short (under 1s), single clean "tick" with no reverb tail. Avoid multi-tick loops (only want one strike per beat).
- **Whoosh SFX:** Browse https://pixabay.com/sound-effects/search/whoosh/ — prefer a 0.5–1.0s quick air pass (not a long cinematic sweep). The bracket animation is fast (30f = 1 second).
- **Low reveal hit:** Browse https://pixabay.com/sound-effects/search/cinematic-hit/ — prefer a single low-frequency boom/impact with short natural decay (under 2s total). Do not choose anything with a musical pitch that clashes with the music bed.

---

## Monetization safety checklist

- [x] Music: Pixabay Content License — commercial use permitted, no attribution required
- [x] SFX: Pixabay Content License — commercial use permitted, no attribution required
- [x] No CC-BY-NC tracks selected
- [x] No tracks of unknown license
- [x] No re-upload sources — all sourced from pixabay.com directly
- [x] No YouTube Audio Library re-upload channels used
- [x] License certificate: download the Pixabay PDF certificate for each file at render time and store in the run folder (pixabay.com provides this on each track/SFX page)
- [x] If a Content ID claim arises: dispute using the Pixabay License Certificate PDF — this is the documented Pixabay/YouTube resolution path

---

## Render note

Download each audio file from its original pixabay.com URL at render time. Do not pre-download or commit binary files to the repo. Store the Pixabay License Certificate PDFs in `output/F-001-cleopatra-vs-pyramids/audio-licenses/` alongside the render session.
