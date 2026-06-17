# ScriptWriter — Project Memory

Faceless **Fathom** YouTube Shorts channel. Videos are written as frame-timed scripts and rendered with **Remotion** (React → MP4). Active niche: **Facts / Kinetic Typography** (text + motion only — no footage). See `content/NICHES.md` and `YOUTUBE_SHORTS_RESEARCH_REPORT.md`.

## The `/short` factory (topic → published-ready `final.mp4`)

`/short [topic]` runs an end-to-end agentic flow that produces a **rendered, mastered, QA-passed video** plus its self-contained spec folder under `output/F-NNN-<slug>/`: a Kokoro **voiceover** (`vo.wav` + `vo-timing.json`) + script + asset/audio specs + a composition prompt + a QA scorecard, **then codegens per-video Remotion `.tsx`, renders it, masters the audio, and loops render→QA→fix to a quality bar**. The renderer lives in `render/` (monorepo — see "The renderer" below). The pipeline DOES generate `.tsx` (via the `remotion-codegen` skill on the shared `render/src/lib/`), DOES render + master locally, but does NOT download music/SFX binaries (a documented human step) or upload (a human action).

**Run these steps in order. Each reads the prior step's file(s) and writes the next.**

0. **Start:** read `memory/lessons.md` (cross-run learnings) and this file. If `/short` was given no topic, proceed to step 1 to pick one.
1. **niche-memory** skill → `00-topic.md`. Dedupe against `content/VIDEO_LOG.md` + `content/scripts/*` + backlog; pick a fresh topic; allocate the next `F-NNN` id and create the run folder `output/F-NNN-<slug>/`.
2. **Research + verify** → `01-verified-facts.md`. Run the `/deep-research` skill, then extract a claims table: `claim | source URL | verbatim quote | confidence`. **Cite-or-abstain.**
3. **youtube-shorts-writer** skill → `02-script.md`. **Narration block** (`<!-- NARRATION:START -->` … `- [beat] sentence`) + on-screen text + an **empty** frame-map block. ONLY facts from `01-verified-facts.md`. The VO sets final frames in 3.5.
3.5. **tts-voiceover** skill → `vo.wav` + `vo-timing.json` (integer-frame timing, `total` = durationInFrames, `speech_regions`, ducking envelope), and **patches the frame map** into `02-script.md`. Local Kokoro. **OVERRUN edge:** VO > target +~15% → loop back to step 3 to cut words.
4. **asset-sourcing** via the **asset-scout** subagent → `03-assets.md` (fonts, hex palette, motion signature) + `04-audio.md` (music + SFX: URL, license, attribution, **bed DUCKS under the VO**, per-beat timing). Spec-only.
5. **remotion-prompt-generator** skill → `05-remotion-prompt.md` (scene/frame list, caption frames from `vo-timing.json`, audio layering).
6. **Review loop (evaluator-optimizer, max 3):** **remotion-script-reviewer** on `02-script.md` AND `05-remotion-prompt.md` together (validator tiles the VO-patched frame map against `vo-timing.json` `total`; Category 9 grades visual design). Revise the responsible file if score < 80, any blocker, or **Cat 9 < ~70%**. Write `06-scorecard.md`.
7. **remotion-codegen** skill (step 5.5) → writes **per-video scene `.tsx`** under `render/src/F-NNN/` (+ `data.ts`, `scenes.json`, a Composition entry) on the shared `render/src/lib/`, plus `output/F-NNN/assets.json`. **Duration via `calculateMetadata` (never a `DURATION` const).** Gate: `cd render && npm run gate && npm run test:lib && node --experimental-strip-types scripts/check-tiling.mjs F-NNN` — all green, no hand edits. Quality floors (hero ≥300px, bg gradient+depth never flat, fill ≥55%, count-up ≤36f, scale-honest viz) enforced by construction.
8. **Render + self-improving QA loop (D3):** ensure the music/SFX binaries are in `output/F-NNN/assets/` (the pre-render asset gate halts with a download checklist if any are missing). Then `node --experimental-strip-types scripts/loop.mjs output/F-NNN-<slug>`: **precheck → render-run (render + two-pass loudnorm master → `final.mp4`) → qa-probe → attribute each defect to its owner (script | voice | video | video(master)) → auto-fix → re-render**, to the bar (**≥85, no blockers, Cat 9 ≥70%**) or **3 iterations / no-improvement abort**. Keeps `final-best.mp4`; writes `09-iteration-ledger.md`; appends a lesson per confirmed fix. A non-auto-fixable defect routes (HUMAN ACTION) to the owning skill — re-run it, re-loop.
9. **short-assembly** skill → `README.md`, `VIDEO_LOG.md` row, archive `02-script.md`, append lessons, record the render + QA iterations. Run the completeness gate.
10. **Human publish gate:** present `final.mp4` + `09-iteration-ledger.md` + facts/audio/AI-disclosure compliance for sign-off. Optionally run the full **render-qa** skill for richer per-beat visual judgment. Upload (with "Altered or synthetic content = YES") is a human action.

**Render bridge / engine:** codegen-first (D2). The parametric `compose.json` engine is **backlogged** behind a decision gate after 5–6 videos (see `MERGE_PLAN.md` Backlog) — do not build it; codegen new scene `.tsx` on `render/src/lib/`.

### Stage attribution (the loop routes defects by owner)
| Defect class | Owner | Re-run |
|---|---|---|
| Over-long/weak/unsourced narration, word-pacing | **script** | youtube-shorts-writer → tts-voiceover (≤1 re-cut/loop) |
| VO too fast/slow/robotic, caption frames off, overrun | **voice** | tts-voiceover (or back to script to cut) |
| Flat/near-black frame, dead space, invisible mechanic, slow count-up, loop seam, scale-dishonest viz, glyph collision | **video** | asset-sourcing / remotion-prompt-generator → remotion-codegen |
| Quiet/clipping master | **video (master)** | re-master (loudnorm) only |
| Missing licensed music/SFX binary | **human** | download per `04-audio.md` (the loop can't fetch binaries) |

## Standards (non-negotiable)

- **Facts:** every on-screen/spoken (narration) claim traces to a verbatim quote + URL in `01-verified-facts.md`. If it can't, cut it. Prefer "abstain" over guessing.
- **Audio:** monetization-safe music/SFX only — YouTube Audio Library / Pixabay / Uppbeat (free tier) or paid pre-cleared (Epidemic/Artlist). **No CC-BY-NC.** Record license + attribution requirement. Download from the original source at render time (re-uploads get Content-ID-claimed). **VO is the LEAD; the music bed DUCKS under it** (base ~0.72 → ~0.22 under speech via the `vo-timing.json` envelope, swelling on the payoff; a Short with no VO is the special case where the bed itself leads). **Always master the rendered file to -14 LUFS / ≤ -1 dBTP via two-pass `loudnorm`** (see `asset-sourcing/references/audio-mastering.md`). YouTube never boosts quiet masters — under-target = silent in-feed.
- **Frame math:** the VO sets the timing — `tts-voiceover` writes integer frames to `vo-timing.json` (`total` = durationInFrames) and patches the frame-map table into `02-script.md`. That table must pass the remotion-script-reviewer validator (it reads `total` from `vo-timing.json` and tiles `[0, total]`) — contiguous, 0-indexed half-open ranges, silent loop-back tail ending at `total`. Trust the validator over manual math.
- **Format:** 1080×1920 @ 30fps; frame 1 = the thumbnail (legible <0.5s — **no black fade-in lead; open on the hook, VO speaking from frame 0**); a cut every 2–4s; design for an invisible loop; burned-in word-by-word captions (from `vo-timing.json`) clear of the bottom ~15% and the very top.
- **AI disclosure:** the synthetic Kokoro voice means **"Altered or synthetic content" = YES** on every upload; the README states YES. (The old script/research-only exemption no longer applies once a synthetic voice is in the render. The README reminder can't flip the YouTube toggle — set it at upload.)

## Completeness gate (must pass before "done")

1. Every claim in the script (narration + on-screen) is sourced in `01-verified-facts.md`. 2. Audio is monetization-safe with license recorded, bed ducks under the VO, **and the rendered `final.mp4` measures -14 LUFS / ≤ -1 dBTP** (verified by the render loop, not just specified). 3. `vo.wav` + `vo-timing.json` present; captions derived from the VO word frames. 4. Frame math passes the validator; the scene-range tiling gate (`check-tiling.mjs`) passes. 5. **`final.mp4` rendered and the loop reports STATUS: PASS** (≥85, no blockers, Cat 9 ≥70%) — or a human accepted `final-best.mp4`; `09-iteration-ledger.md` records the rounds. 6. README AI-disclosure = YES (synthetic voice). If any fail, keep working.

## The renderer (`render/`)

`render/` is the Remotion v4 project (React 19, TS, 1080×1920 @ 30fps) that turns a `/short`
spec package into an MP4. It is a **monorepo subtree**, not a separate clone — one repo, one
pipeline. Its `node_modules/` and `.venv-tts/` (repo root) are gitignored and rebuilt by
`scripts/bootstrap.sh`. See `SETUP.md` for first-run.

- **Bootstrap:** `bash scripts/bootstrap.sh` (venv + `render/` npm i + seed public). `make doctor`
  asserts node/npm/ffmpeg/ffprobe/python/venv/espeak and prints each gap as `missing X → install Y`.
- **`render/public/` = copy + clean, gitignored.** Run-scoped only (`vo.wav`, music, SFX),
  repopulated fresh each render by `scripts/seed-public.sh` from the active `output/F-NNN/`
  (canonical copies: `output/F-NNN/vo.wav`, `output/F-NNN/assets/*`). No symlinks, no staleness.
- **Compositions** live under `render/src/F-NNN/` (per-video scene `.tsx`) on top of the shared
  primitive library `render/src/lib/` (motion, captions, audio bed, background, safe-area/quality
  floors). F-001's original bespoke code is under `render/src/cleopatra/`.

## Conventions

- IDs: Facts=`F`, Data=`D`, Explainer=`E`, Code=`C`, Comparison=`X`, then `-NNN`.
- Skills are single-purpose with markdown I/O contracts; subagents isolate web-heavy steps and return only their output file content (they can't see conversation history — pass file paths explicitly).
- Keep this file under ~200 lines.
