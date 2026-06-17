# F-001 — Cleopatra is closer to us than to the Pyramids  (deliverable package · v3)

> Input package for the Fathom Remotion project. Not render-ready code — hand `05-remotion-prompt.md` to the Remotion skills.

- **Hook:** "Cleopatra is closer to YOU than to the Pyramids." · **Runtime:** 28s (840f @30fps · 1080×1920) · **Reviewer score:** 93/100
- **Status:** scripted (v3 visual overhaul — not yet rendered)

> **v3 (post-render review):** the v2 render came out flat — near-black, tiny text, dead space, a non-proportional comparison, dragging count-ups. v3 keeps the verified facts + frame map but rebuilds the **design**: a vertical timeline filling the full 9:16 height, ~340px hero numbers, a navy→indigo depth gradient, scale-honest gold/ice segments, fast ease-out counters, and an "Egypt's queen" subject kicker. Audio (−14 LUFS bed-as-lead) was already fixed and is unchanged.

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale |
| 01-verified-facts.md | claims table: quote + URL + confidence (cite-or-abstain) |
| 02-script.md | frame-timed script — v3 (840f, tiles exactly; vertical-timeline design) |
| 03-assets.md | fonts (**Anton** hero + Space Mono counters), navy→indigo gradient palette, large filled motifs, motion signature |
| 04-audio.md | music + SFX: URL, license, attribution, mix, per-beat timing (−14 LUFS master) |
| 05-remotion-prompt.md | frame-exact composition spec — v3 (full-frame bands, scale-honest timeline, clamped counters) |
| 06-scorecard.md | reviewer score 93/100 (9-cat rubric incl. Visual Design Quality) + validator output |
| 07-video-review.md | the v2 rendered-video review that drove this overhaul |

## Render checklist
1. Scaffold/open the Remotion project (`npx create-video@latest`; `npx skills add remotion-dev/skills`).
2. Download the audio in `04-audio.md` from its ORIGINAL Pixabay source into `public/` (expected names: `music-dark-tension.mp3`, `sfx-tick.mp3`, `sfx-whoosh.mp3`, `sfx-reveal-hit.mp3`); keep the Pixabay License Certificate PDFs.
3. Hand `05-remotion-prompt.md` to the Remotion skills to build composition `F-001-cleopatra-vs-pyramids`. **No VO → mix the music bed as the LEAD (~0.72), never ducked.**
4. Render: `npx remotion render <entry> F-001-cleopatra-vs-pyramids out.mp4`.
5. **Master audio → two-pass `loudnorm` to −14 LUFS / ≤ −1 dBTP / LRA 11 (see `04-audio.md`), output `final.mp4`, then VERIFY.** Upload `final.mp4`, not `out.mp4`.
6. **Run the `render-qa` skill on `final.mp4`** against `05-remotion-prompt.md` — frame count (840), loop seam (frame 0 == frame 839), brightness/black-screen (mean luma > 40, no ≥1.5s black), per-beat dead-space/collision/mechanic, loudness. **Do NOT upload on a FAIL** — route the failure back to the responsible spec file and re-render.
7. Upload: title/description from the script's metadata section ("Cleopatra is closer to YOU than to the Pyramids").

## YouTube AI disclosure
AI was used only for script/research production — **exempt** from YouTube's altered/synthetic-content disclosure. Toggle "Altered or synthetic content" ONLY if synthetic media (AI faces/voices/realistic scenes) is later added. This video is text + motion graphics only (no synthetic media).
