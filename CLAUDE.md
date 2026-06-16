# ScriptWriter — Project Memory

Faceless **Fathom** YouTube Shorts channel. Videos are written as frame-timed scripts and rendered with **Remotion** (React → MP4). Active niche: **Facts / Kinetic Typography** (text + motion only — no footage). See `content/NICHES.md` and `YOUTUBE_SHORTS_RESEARCH_REPORT.md`.

## The `/short` pipeline

`/short [topic]` runs an end-to-end agentic flow that outputs **one self-contained folder** under `output/F-NNN-<slug>/`: an improved Remotion-ready script + a typography asset spec + an audio (music/SFX) spec + a Remotion composition prompt + a QA scorecard + a README manifest. It is an **input package** for a Remotion project — it does NOT generate `.tsx` code, download binary files, or use TTS.

**Run these steps in order. Each reads the prior step's file and writes the next.**

0. **Start:** read `memory/lessons.md` (cross-run learnings) and this file. If `/short` was given no topic, proceed to step 1 to pick one.
1. **niche-memory** skill → `00-topic.md`. Dedupe against `content/VIDEO_LOG.md` + `content/scripts/*` + backlog; pick a fresh topic; allocate the next `F-NNN` id and create the run folder `output/F-NNN-<slug>/`.
2. **Research + verify** → `01-verified-facts.md`. Run the `/deep-research` skill on the topic, then extract a claims table: `claim | source URL | verbatim quote | confidence`. **Cite-or-abstain** — drop any claim with no verbatim quote from a real fetched source.
3. **youtube-shorts-writer** skill (reads `01-verified-facts.md`) → `02-script.md`. The writer may use ONLY claims present in `01-verified-facts.md`. No new facts.
4. **asset-sourcing** skill, run via the **asset-scout** subagent → `03-assets.md` (fonts, hex palette, motion signature, icons/bg) + `04-audio.md` (music + SFX picks with URL, license, attribution, mix levels, per-beat timing). Spec-only.
5. **remotion-prompt-generator** skill (reads `02-script.md` + `03-assets.md` + `04-audio.md`) → `05-remotion-prompt.md`.
6. **Review loop (evaluator-optimizer):** run **remotion-script-reviewer** on `02-script.md`. If score < 80 or any blocker, revise via the writer and re-score. **Max 3 iterations.** Write final → `06-scorecard.md`.
7. **short-assembly** skill → write `README.md`, add the `VIDEO_LOG.md` row, archive the script into `content/scripts/`, append dated lessons to `memory/lessons.md`. Run the completeness gate (below) before declaring done.

## Standards (non-negotiable)

- **Facts:** every on-screen/spoken claim traces to a verbatim quote + URL in `01-verified-facts.md`. If it can't, cut it. Prefer "abstain" over guessing.
- **Audio:** monetization-safe only — YouTube Audio Library / Pixabay / Uppbeat (free tier) or paid pre-cleared (Epidemic/Artlist). **No CC-BY-NC.** Record license + attribution requirement. Download from the original source at render time (re-uploads get Content-ID-claimed). **Loudness: no voiceover → the music bed is the LEAD, never ducked; master the rendered file to -14 LUFS / ≤ -1 dBTP via two-pass `loudnorm` (see `asset-sourcing/references/audio-mastering.md`). YouTube never boosts quiet masters — under-target = silent in-feed.**
- **Frame math:** `02-script.md` must pass the remotion-script-reviewer validator — contiguous tiling, 0-indexed half-open ranges (`next.start == prev.end`), loop-back ending at total `durationInFrames`. Trust the validator over manual math.
- **Format:** 1080×1920 @ 30fps; frame 1 = the thumbnail (legible <0.5s — **no black fade-in lead; open on the hook**); a cut every 2–4s; design for an invisible loop; burned-in word-by-word captions clear of the bottom ~15% and the very top.
- **AI disclosure:** the README notes YouTube's altered/synthetic-content rule. AI used only for script/research is exempt; flag only if synthetic media (AI faces/voices/scenes) is later added.

## Completeness gate (must pass before "done")

1. Every claim in the script is sourced in `01-verified-facts.md`. 2. Audio is monetization-safe with license recorded **and specifies the -14 LUFS / ≤ -1 dBTP master target**. 3. Captions are timed to beats. 4. Frame math passes the validator. 5. AI-disclosure note present in README. If any fail, keep working.

## Conventions

- IDs: Facts=`F`, Data=`D`, Explainer=`E`, Code=`C`, Comparison=`X`, then `-NNN`.
- Skills are single-purpose with markdown I/O contracts; subagents isolate web-heavy steps and return only their output file content (they can't see conversation history — pass file paths explicitly).
- Keep this file under ~200 lines.
