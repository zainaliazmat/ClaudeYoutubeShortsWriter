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

**Mood / fit:** Low, minimal, tension-building ambient cinematic — dark thriller atmosphere with no lyrics. Matches the script's "low, suspenseful build that rises subtly into the Beat 6 payoff, then resolves on the loop." No vocals to fight word-by-word captions.

**Mix:**
- Bed level: -20 dB under dialogue baseline (approximately 10–12% of full scale). Remotion `<Audio volume={0.11}>`.
- Fade in: 0→full over frames 0–30 (first 1 second).
- Hold at full from frame 30 to frame 600 (Beat 5 end).
- Subtle swell: +3 dB gain ramp from frame 540→600 (1 beat before payoff) to underscore the reveal build.
- Hold swelled level through frame 720 (peak of Beat 6 payoff).
- Fade out: full→0 over frames 765–840 (loop-back, 2.5 seconds), landing silently on frame 840 so the loop restart sounds clean.

---

## SFX

All SFX from **Pixabay Sound Effects** — Pixabay Content License, free commercial use, no attribution required. Download from original Pixabay URL at render time; save the license certificate.

| Cue | Description | At frame | Source | Search URL | License |
|-----|-------------|----------|--------|-----------|---------|
| Year-stamp tick 1 | Single dry mechanical "tick" or "lock" click — stone-impact feel | **150** (Beat 1: "2560 BC" snaps in) | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/clock-tick/ | Pixabay Content License — commercial use, no attribution |
| Year-stamp tick 2 | Same SFX as tick 1 (reuse the same file) | **255** (Beat 2: "69 BC" locks in) | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/clock-tick/ | Pixabay Content License — commercial use, no attribution |
| Year-stamp tick 3 | Same SFX as tick 1 | **480** (Beat 4: "1969" locks in) | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/clock-tick/ | Pixabay Content License — commercial use, no attribution |
| Bracket whoosh | Short air-whoosh as bracket stretches across the timeline | **255** (bracket begins stretching Beat 2→3) and **480** (second bracket Beat 5) | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/whoosh/ | Pixabay Content License — commercial use, no attribution |
| Low reveal hit (payoff) | Single deep cinematic impact / low boom — the "oh wow" hit | **600** (Beat 6 payoff start: "~450 YEARS CLOSER" stamps) | Pixabay Sound Effects | https://pixabay.com/sound-effects/search/cinematic-hit/ | Pixabay Content License — commercial use, no attribution |

**SFX mix levels:**
- Year-stamp ticks: -10 dB (punchy but not jarring). Remotion `<Audio volume={0.30}>` per instance.
- Bracket whooshes: -14 dB (subtle pass). Remotion `<Audio volume={0.20}>`.
- Low reveal hit (frame 600): -6 dB (this is the emotional peak — let it land). Remotion `<Audio volume={0.50}>`.

**SFX render note:** All three tick cues use the same single file — load it once and sequence three `<Audio>` instances with `startFrom` matching the beat frame offsets. Remotion handles overlapping audio instances cleanly.

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
