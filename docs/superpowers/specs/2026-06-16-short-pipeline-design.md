# `/short` Agentic Pipeline — Design Spec

**Date:** 2026-06-16
**Status:** Approved (design), building
**Project:** ScriptWriter — faceless "Fathom" YouTube Shorts channel (Facts / Kinetic Typography), Remotion-rendered.

## Goal

A single command, `/short [topic]`, that runs an end-to-end agentic pipeline and returns **one self-contained folder** containing: an improved, Remotion-ready, frame-timed script + a typography-native asset spec + an audio (music/SFX) spec + a Remotion composition prompt + a QA scorecard + a manifest README. The folder is an **input package** handed to a (future) Remotion project — the pipeline does not generate Remotion `.tsx` code.

## Locked decisions (from brainstorming)

1. **Asset output = spec/manifest only.** No API keys, no binary downloads. Works today with WebSearch/WebFetch. Music/SFX/visual picks are recorded with URL + license + attribution + timing; the renderer fetches files later.
2. **No voiceover.** Pure kinetic typography: burned-in word-by-word captions hand-timed to beats; background music + SFX only. No TTS, no Whisper.
3. **Full pipeline, all phases.** Orchestrator command + CLAUDE.md, new skills, a subagent, a hook, evaluator-optimizer review loop, and a cross-run lessons loop.
4. **Deliverable = input package for Remotion** (script + manifests + prompt), not render-ready `.tsx`.
5. **"Assets" = typography-native** (font stack, hex palette, motion signature, icons/bg) + music/SFX — **not** Pexels/Pixabay B-roll footage. Footage does not apply to a text+motion niche.

## Architecture (Approach B — reuse aggressively, build the gaps)

**Reuse:** `/deep-research` skill (research + adversarial claim verification = the anti-hallucination engine), `youtube-shorts-writer` (script), `remotion-script-reviewer` (the evaluator/scorer), `scriptwriter-skill`.

**Build new:** `niche-memory`, `asset-sourcing`, `remotion-prompt-generator`, `short-assembly` skills; `asset-scout` subagent; `/short` command; project `CLAUDE.md`; SessionStart hook; `memory/lessons.md`.

### Trigger
`.claude/commands/short.md` → `/short [topic]`. No arg → niche-memory picks the next non-repeating Facts topic from `content/topic-backlog-facts.md`. First action every run: read `memory/lessons.md` + the CLAUDE.md pipeline order.

### Pipeline (read → write contract)
1. **niche-memory** — reads `content/scripts/*`, `content/VIDEO_LOG.md`, `content/topic-backlog-facts.md` → dedupe → pick/propose topic → `output/<id>-<slug>/00-topic.md`. Allocates the next `F-NNN` id.
2. **research+verify** — run `/deep-research` on the topic → cited report → extract to `01-verified-facts.md` (claims table: claim → source URL → verbatim quote → confidence). Cite-or-abstain; unverifiable claims retracted.
3. **script** — `youtube-shorts-writer` reads `01-verified-facts.md` → `02-script.md` (frame-timed, existing template).
4. **asset-sourcing** (via `asset-scout` subagent) — `03-assets.md` (font stack, hex palette, motion signature, icons/bg) + `04-audio.md` (music pick w/ URL + license + attribution flag + mix ~0.10–0.15, SFX list, per-beat timing). Spec-only; screened for monetization safety + logos/faces.
5. **remotion-prompt-generator** — fuse script + assets + audio → `05-remotion-prompt.md` (1080×1920, scene/frame list, word-by-word caption timing, audio layering, font/color tokens).
6. **review loop (evaluator-optimizer)** — `remotion-script-reviewer` scores `02-script.md`; if score < 80 or any blocker, revise via writer and re-score. **Max 3 iterations.** Final → `06-scorecard.md`.
7. **short-assembly** — write `README.md` (manifest + render checklist + AI-disclosure note), add `VIDEO_LOG.md` row, archive script into `content/scripts/`, append dated lessons to `memory/lessons.md`.

### Subagent
`.claude/agents/asset-scout.md` — isolates the web-heavy asset/audio lookups; returns only `03-assets.md` + `04-audio.md` content. Research isolation is handled by `/deep-research`'s own harness.

### Hook
`.claude/settings.json` → **SessionStart**: inject `memory/lessons.md` so every run starts informed (safe, low-token). The completeness gate (claims sourced? audio monetization-safe? captions timed? frame math passes? AI-disclosure noted?) is **enforced in-pipeline** as a mandatory final checklist in `short-assembly` + the command, rather than as an always-firing global Stop hook (which would interrupt unrelated conversations).

### Deliverable folder
```
output/F-NNN-<slug>/
├── README.md              # manifest, render checklist, AI-disclosure note
├── 00-topic.md            # chosen topic + non-repeat rationale
├── 01-verified-facts.md   # claims table: quote + URL + confidence
├── 02-script.md           # improved, frame-timed, reviewer-passed script
├── 03-assets.md           # fonts, palette, motion signature, icons/bg (spec)
├── 04-audio.md            # music + SFX: URL, license, attribution, mix, timing
├── 05-remotion-prompt.md  # composition spec for Remotion skills
└── 06-scorecard.md        # reviewer score + fixes applied
```
Side-effects: `VIDEO_LOG.md` row, script archived to `content/scripts/`, `memory/lessons.md` appended.

## Anti-hallucination
Anthropic's three documented techniques (allow "I don't know"; cite quotes per claim, retract if no quote; ground in verbatim quotes) + `/deep-research`'s adversarial verification (≈ Chain-of-Verification). `01-verified-facts.md` is the single source of truth for the script — the writer may not introduce claims absent from it.

## Standards (non-negotiable, in CLAUDE.md)
- Every factual claim traces to a verbatim quote + URL in `01-verified-facts.md`, else it is cut.
- Audio must be monetization-safe (YouTube Audio Library / Pixabay / Uppbeat free; or paid pre-cleared). No CC-BY-NC. Record license + attribution. Download from original source at render time.
- Frame math must pass the `remotion-script-reviewer` validator (tiling, 0-indexed half-open ranges, loop-back to total).
- 1080×1920, frame 1 = thumbnail, cut every 2–4s, design for the loop, captions clear of bottom ~15%.
- README notes the YouTube "altered/synthetic content" disclosure (AI-assisted script production is exempt; flag only if synthetic media is added).

## Out of scope (YAGNI for now)
Remotion `.tsx` generation, real asset downloads, TTS/Whisper, Lambda render, MCP search servers, PostToolUse citation-validator hook, multi-niche routing. All deferrable.
