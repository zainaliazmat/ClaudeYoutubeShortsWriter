# ScriptWriter — Project Memory

Faceless **Fathom** YouTube Shorts channel. Videos are written as frame-timed scripts and rendered with **Remotion** (React → MP4). Active niche: **Facts / Kinetic Typography** (text + motion only — no footage). See `content/NICHES.md` and `YOUTUBE_SHORTS_RESEARCH_REPORT.md`.

## The `/short` pipeline

`/short [topic]` runs an end-to-end agentic flow that outputs **one self-contained folder** under `output/F-NNN-<slug>/`: an improved Remotion-ready script + a locally-generated Kokoro **voiceover** (`vo.wav` + `vo-timing.json`) + a typography asset spec + an audio (music/SFX) spec + a Remotion composition prompt + a QA scorecard + a README manifest. It is an **input package** for a Remotion project — it does NOT generate `.tsx` code, download music/SFX binaries, or render the video. It DOES generate the voiceover audio locally via Kokoro (free, offline); that `vo.wav` is a render input and its timing drives the frame map, captions, and audio.

**Run these steps in order. Each reads the prior step's file and writes the next.**

0. **Start:** read `memory/lessons.md` (cross-run learnings) and this file. If `/short` was given no topic, proceed to step 1 to pick one.
1. **niche-memory** skill → `00-topic.md`. Dedupe against `content/VIDEO_LOG.md` + `content/scripts/*` + backlog; pick a fresh topic; allocate the next `F-NNN` id and create the run folder `output/F-NNN-<slug>/`.
2. **Research + verify** → `01-verified-facts.md`. Run the `/deep-research` skill on the topic, then extract a claims table: `claim | source URL | verbatim quote | confidence`. **Cite-or-abstain** — drop any claim with no verbatim quote from a real fetched source.
3. **youtube-shorts-writer** skill (reads `01-verified-facts.md`) → `02-script.md`. Writes a **Narration block** (`<!-- NARRATION:START -->` … spoken lines `- [beat] sentence`) + on-screen text + visual direction + an **empty** frame-map block. Spoken ≠ caption. ONLY facts from `01-verified-facts.md`. The writer proposes beat order + rough per-beat seconds; it does NOT hand-pin final frames (the VO sets those in 3.5).
3.5. **tts-voiceover** skill (reads the Narration block) → `vo.wav` + `vo-timing.json` (integer-frame word/beat timing, `total` = durationInFrames, `speech_regions`, ducking envelope), and **patches the VO-derived frame map** into `02-script.md`. Local Kokoro, no API keys. **OVERRUN edge:** if measured VO > target +~15% and raising `speed` past ~1.15 would sound robotic, loop back to step 3 to cut words.
4. **asset-sourcing** skill, run via the **asset-scout** subagent → `03-assets.md` (fonts, hex palette, motion signature, denser visuals per design §5) + `04-audio.md` (music + SFX picks with URL, license, attribution, **mix: bed DUCKS under the VO**, per-beat timing). Spec-only.
5. **remotion-prompt-generator** skill (reads `02-script.md` + `vo-timing.json` + `vo.wav` + `03-assets.md` + `04-audio.md`) → `05-remotion-prompt.md`. Captions from `vo-timing.json` word frames; audio = `vo.wav` (lead) + ducked music + SFX.
6. **Review loop (evaluator-optimizer):** run **remotion-script-reviewer** on `02-script.md` **AND `05-remotion-prompt.md` together** (the validator reads `vo-timing.json` `total` and tiles the VO-patched frame-map table; Category 9 — Visual Design Quality — grades the composition spec). If score < 80, any blocker, or **Category 9 below ~70% of its weight** (flat/empty layout, dead space, invisible mechanic, scale-dishonest data viz), revise the responsible file (writer for `02` narration, prompt-generator for `05`, asset-sourcing for `03`) and re-score. **Max 3 iterations.** Write final → `06-scorecard.md`.
7. **short-assembly** skill → write `README.md`, add the `VIDEO_LOG.md` row, archive the script into `content/scripts/`, append dated lessons to `memory/lessons.md`. Run the completeness gate (below) before declaring done.
8. **render-qa** skill (POST-RENDER — runs only after the Remotion project produces `out.mp4`/`final.mp4`, not part of the spec package): inspect actual pixels against `05-remotion-prompt.md` + `vo-timing.json` — duration vs `durationInFrames`, loop seam (frame 0 == final frame), caption/glyph collisions, per-beat dead-space ratio, core-mechanic legibility, integrated loudness (-14 LUFS / ≤ -1 dBTP), and **(f) the voiceover — VO present & audible, music ducked under speech, captions aligned to `vo-timing.json` word frames within ±3**. On FAIL, route back to the responsible spec file (not a manual one-off patch), regenerate, and re-render.

## Standards (non-negotiable)

- **Facts:** every on-screen/spoken (narration) claim traces to a verbatim quote + URL in `01-verified-facts.md`. If it can't, cut it. Prefer "abstain" over guessing.
- **Audio:** monetization-safe music/SFX only — YouTube Audio Library / Pixabay / Uppbeat (free tier) or paid pre-cleared (Epidemic/Artlist). **No CC-BY-NC.** Record license + attribution requirement. Download from the original source at render time (re-uploads get Content-ID-claimed). **VO is the LEAD; the music bed DUCKS under it** (base ~0.72 → ~0.22 under speech via the `vo-timing.json` envelope, swelling on the payoff; a Short with no VO is the special case where the bed itself leads). **Always master the rendered file to -14 LUFS / ≤ -1 dBTP via two-pass `loudnorm`** (see `asset-sourcing/references/audio-mastering.md`). YouTube never boosts quiet masters — under-target = silent in-feed.
- **Frame math:** the VO sets the timing — `tts-voiceover` writes integer frames to `vo-timing.json` (`total` = durationInFrames) and patches the frame-map table into `02-script.md`. That table must pass the remotion-script-reviewer validator (it reads `total` from `vo-timing.json` and tiles `[0, total]`) — contiguous, 0-indexed half-open ranges, silent loop-back tail ending at `total`. Trust the validator over manual math.
- **Format:** 1080×1920 @ 30fps; frame 1 = the thumbnail (legible <0.5s — **no black fade-in lead; open on the hook, VO speaking from frame 0**); a cut every 2–4s; design for an invisible loop; burned-in word-by-word captions (from `vo-timing.json`) clear of the bottom ~15% and the very top.
- **AI disclosure:** the synthetic Kokoro voice means **"Altered or synthetic content" = YES** on every upload; the README states YES. (The old script/research-only exemption no longer applies once a synthetic voice is in the render. The README reminder can't flip the YouTube toggle — set it at upload.)

## Completeness gate (must pass before "done")

1. Every claim in the script (narration + on-screen) is sourced in `01-verified-facts.md`. 2. Audio is monetization-safe with license recorded, bed ducks under the VO, **and specifies the -14 LUFS / ≤ -1 dBTP master target**. 3. `vo.wav` + `vo-timing.json` present; captions derived from the VO word frames. 4. Frame math passes the validator on the VO-patched map. 5. README AI-disclosure = YES (synthetic voice). If any fail, keep working.

## Conventions

- IDs: Facts=`F`, Data=`D`, Explainer=`E`, Code=`C`, Comparison=`X`, then `-NNN`.
- Skills are single-purpose with markdown I/O contracts; subagents isolate web-heavy steps and return only their output file content (they can't see conversation history — pass file paths explicitly).
- Keep this file under ~200 lines.
