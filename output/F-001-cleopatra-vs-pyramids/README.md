# F-001 — Cleopatra is closer to us than to the Pyramids  (deliverable package)
> Input package for the Fathom Remotion project. Not render-ready code — hand `05-remotion-prompt.md` to the Remotion skills.

- **Hook:** "Cleopatra is closer to YOU than to the Pyramids." · **Runtime:** 28s (840f @30fps · 1080×1920) · **Reviewer score:** 92/100
- **Status:** scripted (not yet rendered)

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale |
| 01-verified-facts.md | claims table: quote + URL + confidence (cite-or-abstain) |
| 02-script.md | frame-timed, reviewer-passed script (840f, tiles exactly) |
| 03-assets.md | fonts (Space Grotesk + Space Mono), palette, motion signature, Lucide icons/bg |
| 04-audio.md | music + SFX: URL, license, attribution, mix, per-beat timing |
| 05-remotion-prompt.md | frame-exact composition spec for the Remotion skills |
| 06-scorecard.md | reviewer score 92/100 + frame-budget validator output |

## Render checklist
1. Scaffold/open the Remotion project (`npx create-video@latest`; `npx skills add remotion-dev/skills`).
2. Download the audio in `04-audio.md` from its ORIGINAL Pixabay source into `public/` (expected names: `music-dark-tension.mp3`, `sfx-tick.mp3`, `sfx-whoosh.mp3`, `sfx-reveal-hit.mp3`); keep the Pixabay License Certificate PDFs.
3. Hand `05-remotion-prompt.md` to the Remotion skills to build composition `F-001-cleopatra-vs-pyramids`.
4. Render: `npx remotion render <entry> F-001-cleopatra-vs-pyramids out.mp4`.
5. Upload: title/description from the script's metadata section ("Cleopatra is closer to YOU than to the Pyramids").

## YouTube AI disclosure
AI was used only for script/research production — **exempt** from YouTube's altered/synthetic-content disclosure. Toggle "Altered or synthetic content" ONLY if synthetic media (AI faces/voices/realistic scenes) is later added. This video is text + motion graphics only (no synthetic media).
