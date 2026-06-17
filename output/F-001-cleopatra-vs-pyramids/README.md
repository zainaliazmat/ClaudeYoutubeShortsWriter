# F-001 — Cleopatra is closer to us than to the Pyramids  (deliverable package · v4 · VO-driven)

> Input package for the Fathom Remotion project. Not render-ready code — hand `05-remotion-prompt.md` to the Remotion skills. **This package includes a real Kokoro voiceover (`vo.wav`) and its timing — a render input.**

- **Hook:** "Cleopatra is closer to YOU than to the Pyramids." · **Runtime:** 31s (930f @30fps · 1080×1920, from `vo-timing.json`) · **Voice:** Kokoro `am_michael` · **Reviewer score:** 93/100
- **Status:** scripted + VO generated (v4 — not yet rendered) · **AI disclosure:** YES (synthetic voice)

> **v4 (VO-driven):** the channel default is now a Kokoro voiceover that drives the timing. The narration was synthesized locally (free, offline), and its integer-frame timing set `durationInFrames=930`, the per-beat frame map, the word-by-word caption frames, and the music-ducking envelope. v4 keeps v3's vertical-timeline design and adds the design-§5 denser visuals (date ticks + era labels, a shared-baseline comparison, a brighter rest-state pyramid). Audio model flipped: **VO is the lead; the music bed ducks under it.**

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale |
| 01-verified-facts.md | claims table: quote + URL + confidence (cite-or-abstain) |
| 02-script.md | VO-timed script — v4 (Narration block + VO-patched frame map, 930f, tiles exactly) |
| **vo.wav** | the Kokoro voiceover (lead audio) — a render input |
| **vo-timing.json** | integer-frame VO timing: words, beats, speech_regions, ducking envelope, total=930 |
| 03-assets.md | fonts (**Anton** hero + Space Mono counters), navy→indigo palette, large motifs, motion signature, §5 denser visuals |
| 04-audio.md | music + SFX: URL, license, attribution, **VO-lead/ducked** mix, per-beat timing (−14 LUFS master) |
| 05-remotion-prompt.md | frame-exact composition spec — v4 (captions from vo-timing.json, vo.wav lead + ducked music) |
| 06-scorecard.md | reviewer score 93/100 (9-cat rubric incl. Visual Design Quality) + validator output |
| 07-video-review.md | the v2 rendered-video review that drove the visual overhaul |

## Render handoff (exact)
**Inputs that feed the Remotion project:** `05-remotion-prompt.md` (the build spec) + `vo.wav` (lead audio, copy into `public/`) + `vo-timing.json` (durationInFrames + caption word frames + ducking envelope). **`durationInFrames = 930`** (= `vo-timing.json` `total`). The music/SFX are downloaded at render time per `04-audio.md`. After rendering + mastering, **render-qa runs on the resulting mp4** (see below). This repo has **no Remotion project** — render in the separate Fathom Remotion project you own.

## Render checklist
1. Scaffold/open the Remotion project (`npx create-video@latest`; `npx skills add remotion-dev/skills`).
2. **Copy `vo.wav` into `public/`.** Download the music/SFX in `04-audio.md` from their ORIGINAL Pixabay source into `public/` (expected names: `music-dark-tension.mp3`, `sfx-tick.mp3`, `sfx-whoosh.mp3`, `sfx-reveal-hit.mp3`); keep the Pixabay License Certificate PDFs.
3. Hand `05-remotion-prompt.md` to the Remotion skills to build composition `F-001-cleopatra-vs-pyramids` (durationInFrames 930). **VO is the LEAD (`vo.wav` ~0.95); the music bed DUCKS under it via the `vo-timing.json` envelope (0.22 under speech 0–855, swell on the silent tail).** Captions come from `vo-timing.json` word frames (merge same-display runs).
4. Render: `npx remotion render <entry> F-001-cleopatra-vs-pyramids out.mp4`.
5. **Master audio → two-pass `loudnorm` to −14 LUFS / ≤ −1 dBTP / LRA 11 (see `04-audio.md`), output `final.mp4`, then VERIFY** (re-measure for v4; the VO+bed mix differs from v3). Upload `final.mp4`, not `out.mp4`.
6. **Run the `render-qa` skill on `final.mp4`** against `05-remotion-prompt.md` + `vo-timing.json` — frame count (930), loop seam (frame 0 == frame 929), brightness/black-screen, per-beat dead-space/collision/mechanic, loudness, **and check (f) the voiceover** (VO present & audible, bed ducked under speech, captions aligned to VO word frames within ±3). **Do NOT upload on a FAIL** — route the failure back to the responsible spec file and re-render.
7. Upload: title/description from the script's metadata section. **Set "Altered or synthetic content" = YES** (synthetic voice).

## YouTube AI disclosure — YES
This Short carries a **synthetic (AI) voiceover** (Kokoro), so the old script/research-only exemption no longer applies. On upload, set **"Altered or synthetic content" = YES**. (The captions/visuals are not synthetic media; the synthetic voice alone triggers disclosure.) This README reminder cannot flip the toggle on the upload form — set it at upload.
