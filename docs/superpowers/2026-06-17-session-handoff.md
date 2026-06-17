# Session Handoff — 2026-06-17

> **Read this first to resume.** Single source of truth for where the work stands. Everything below is committed on branch **`fix/short-pipeline-visual-quality`** (HEAD **`1897fb8`**), NOT merged to `main`.

---

## TL;DR — current state

Three things happened this session, in order:
1. **Fixed the `/short` pipeline** so it stops producing visually flat videos (rubric + render-QA gate). ✅ done & committed.
2. **Regenerated F-001 ("Cleopatra vs Pyramids") as v3** through the upgraded pipeline; rendered; **render-QA PASS**. ✅ done. (User then asked for TTS + denser visuals → v4 is a future regen.)
3. **Started a channel-wide TTS-voiceover feature** (the user wants spoken narration). Spec + plan written and reviewed; **Plan 1 of 3 (the engine) is fully implemented, tested, and code-reviewed.** Plans 2 & 3 NOT started.

**Tests:** `cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v` → **34 OK, 1 skipped** (the skip is the Kokoro e2e, which self-skips because Kokoro isn't installed here).

**What to do next:** pick one — (a) write & execute **Plan 2** (wire the engine into `/short`), (b) `pip install kokoro misaki soundfile numpy` + `espeak-ng` and run the gated e2e to validate the real engine path, or (c) decide branch integration (this branch now spans the visual fixes + the TTS engine).

---

## Repo orientation (for a cold reader)

- **Project:** `ScriptWriter` — a faceless **Fathom** YouTube Shorts channel. Niche: **Facts / Kinetic Typography** (text + motion, no footage). Videos are frame-timed scripts rendered with **Remotion** (React→MP4) in a SEPARATE repo at `/home/zain-ali/Documents/CaludeRemotionShorts/`.
- **`/short` pipeline** (defined in `CLAUDE.md`): an agentic flow that outputs one deliverable folder `output/F-NNN-<slug>/` (topic → verified facts → script → asset/audio specs → Remotion prompt → review → assembly). It is **spec-only** today (no rendering) — EXCEPT the new TTS engine, which generates `vo.wav` in-pipeline.
- Skills live in `.claude/skills/`; the command is `.claude/commands/short.md`; cross-run learnings in `memory/lessons.md`.

---

## Phase 1 — `/short` visual-quality fixes (DONE, commit `933016b`)

The previously-rendered F-001 was flat (near-black, tiny text, dead space). Root cause: the pipeline graded spec completeness + frame math but **never visual design**, and **never looked at a rendered pixel**. Applied 9 fixes (report was `PIPELINE_FIXES_REPORT.md` from the user):
- **Rubric Category 9 "Visual Design Quality & Frame Utilization"** added (`.claude/skills/remotion-script-reviewer/references/scoring-rubric.md`), weights rebalanced to 100; 90+ band now requires Cat 9 ≥ ~70%.
- **asset-sourcing** stopped mandating minimalism ("Default to NO imagery" → "earn the frame": depth backgrounds, large motifs, hero-scale type).
- **remotion-prompt-generator** gained full-safe-area band layout + scale-honest data-viz + clamp-counters rules.
- Review loop now scores **`02-script.md` AND `05-remotion-prompt.md`** together (CLAUDE.md step 6 + `short.md`).
- **NEW skill `render-qa`** (step 8, post-render): the pixel gate — frame count, loop seam, brightness/black-screen, per-beat dead-space, loudness. `.claude/skills/render-qa/SKILL.md`.
- youtube-shorts-writer gained subject-naming (≤4 words) + opener-choice rules.
- Dead `scriptwriter-skill` (Chinese narrative screenplay) quarantined via description.
- 8 dated lessons appended to `memory/lessons.md`.

## Phase 2 — F-001 v3 regeneration (DONE, commits `70de150`, `d8fdcfb`)

Regenerated F-001 through the upgraded pipeline. **Biggest design win:** flipped the timeline from horizontal (wasted the tall 9:16 frame) to **vertical** (pyramid top → moon bottom), which fills the height AND makes "she's closer to the Moon" a spatial fact (Cleopatra node at the time-accurate 55% down, scale-honest 660px:540px = 2,491yr:2,038yr). Reviewer **93/100**. Rendered `final.mp4`; **render-QA PASS 5/5** (mean luma 46 vs v2's ~11, zero black segments, 840 frames, −14.7 LUFS, scale-honest mechanic reads). Deliverable: `output/F-001-cleopatra-vs-pyramids/` (files `00`–`08` + README). `07-video-review.md` is the v2 critique that drove all this.

**User feedback on v3:** visuals much better; but wants (a) **TTS voiceover** and (b) **denser visuals same length**. (a) became the TTS feature below; (b) is folded into the future F-001 v4 (Plan 3).

---

## Phase 3 — TTS Voiceover feature (Plan 1 DONE; Plans 2 & 3 PENDING)

### Decisions (locked, via brainstorming + a design review + an engine comparison)
- **Engine: Kokoro-82M via the Python `kokoro` package** (Apache-2.0). Chosen over Piper after a full comparison (`docs/superpowers/specs/2026-06-17-tts-engine-comparison-piper-vs-kokoro.md`): Kokoro wins quality + clean monetization licensing + Node-or-Python runtime + **native token timing**; Piper has no native word timestamps and a per-voice license minefield. Default voice candidates: `am_michael` / `bm_george` / `af_bella` (pick from samples at build time).
- **VO drives the frame map** — generate the voice first, derive the frame map from its actual word timing (not hand-set frames).
- **Generated IN the pipeline** (new step 3.5), writing `vo.wav` + `vo-timing.json`.
- **Music bed now DUCKS under the VO** (VO is the lead) — reverses the old "bed is the lead" rule; still master to −14 LUFS.
- **AI-disclosure flips to YES** (synthetic voice is no longer script-only-AI-exempt).
- **Determinism** (Kokoro's one weak spot) mitigated by: generate `vo.wav`/`vo-timing.json` once, commit them, never re-synthesize a shipped run.

### Spec & plan docs
- **Spec:** `docs/superpowers/specs/2026-06-17-tts-voiceover-pipeline-design.md` — read §3.3–3.6 (alignment + the `vo-timing.json` integer-frame schema + failure detector) and §4 (ducking envelope). It survived a rigorous design review (forced-alignment, silence-trim, round-once, region-merge ramps all pinned).
- **Plan 1:** `docs/superpowers/plans/2026-06-17-tts-voiceover-engine.md` — the 9-task TDD plan that's now BUILT.

### Plan 1 — the engine (DONE: commits `a7b70b6`..`1897fb8`)
Built `.claude/skills/tts-voiceover/` — ~740 lines, 8 modules. **Pure stdlib logic is engine-free and fully unit-tested; the Kokoro/aeneas/ffmpeg calls are isolated in one shell + orchestrator, exercised only by a gated e2e that self-skips without the engine.**

| Module | Role | Tested |
|---|---|---|
| `scripts/normalize.py` | numbers/abbrevs → spoken tokens + beat map | unit |
| `scripts/timing.py` | per-word times → integer-frame `vo-timing.json` (round-once, beats tile [0,total] incl. loop tail, region-merge) | unit |
| `scripts/failure_detector.py` | §3.6 checks (monotonicity/coverage/duration/token-count) | unit |
| `scripts/envelope.py` | ducking envelope (region-merge + attack/release) | unit |
| `scripts/framemap.py` | render + marker-patch the frame map into `02-script.md` | unit |
| `scripts/kokoro_io.py` | Kokoro synth (native token timing) + silence-trim + aeneas fallback + `preflight` + `KNOWN_VOICES` | preflight unit; synth smoke-only |
| `scripts/run.py` | orchestrator `run()` + `align_with_fallback()` + CLI | unit + **engine-free integration test** (fake aligner) |
| `SKILL.md` | the step-3.5 pipeline contract | n/a |

**Two real bugs the multi-agent review caught (both fixed + re-reviewed):**
1. **Critical:** `run()` measured `vo.wav` length *before* the aligner wrote it → `FileNotFoundError` on every real run; invisible to 31 green unit tests because `run()` itself wasn't integration-tested. Fixed (wav-length is a callable measured after synth) + locked with a fake-aligner integration test.
2. **Important:** `align_with_fallback` didn't catch a *raising* primary → Kokoro-unavailable would crash past the aeneas fallback (spec §3.6 violation). Fixed + tested.

**`vo-timing.json` contract (the cross-component interface — integer frames only):**
`{fps, voice, speed, total, words:[{i,display,spoken,start,end,beat,region}], beats:[{id,start,end}] (last is no-word "loop" tail; tiles [0,total]), speech_regions:[{start,end}], envelope:[{frame,vol}]}`.

**CLI:** `cd .claude/skills/tts-voiceover && python3 scripts/run.py <run_dir> <voice_name>` (e.g. `am_michael`). Needs a `02-script.md` with `<!-- NARRATION:START -->`/`END` (lines `- [beat_id] spoken line`) and an empty `<!-- FRAME-MAP:START -->`/`END` block.

---

## How to resume

### Option A — Plan 2: wire the engine into `/short` (the natural next step)
Not yet planned/written. Scope (from the spec §3.1–3.2): insert **step 3.5 `tts-voiceover`** into the flow; update —
- `youtube-shorts-writer`: emit a **Narration block** (spoken lines per beat) alongside on-screen text; target ~28–32s; frame map becomes a TARGET (finalized by 3.5).
- `remotion-prompt-generator`: audio = `vo.wav` (lead) + **ducked** music + SFX; **captions generated from `vo-timing.json` word frames** — ⚠️ **carry-forward: key captions off `words[]`, NOT `beats[]`** (a beat's `start` can precede its first word due to contiguity snapping).
- `remotion-script-reviewer` rubric: Audio category → "VO is the lead, music ducks under it" (the old "bed is the lead, never ducked" becomes the no-VO special case).
- `short-assembly`: render checklist includes `vo.wav`; **AI-disclosure = YES** (note: gate is a reminder, can't enforce the YouTube toggle).
- `render-qa`: add check **f. Voiceover** (present/audible, music ducked, captions aligned ±3 frames).
- `CLAUDE.md`: remove "does NOT … use TTS"; rewrite the Audio standard; reorder steps for VO-driven timing; flip disclosure.
Recommend: brainstorm-lite → `writing-plans` → subagent-driven execution, same as Plan 1.

### Option B — validate the real engine first
`pip install kokoro misaki soundfile numpy` and install `espeak-ng`, then:
`cd .claude/skills/tts-voiceover && KOKORO_VOICE=am_michael python3 -m unittest tests.test_e2e_gated -v` (it will RUN instead of skip). **Known-unknown to verify here:** Kokoro's token-timing attribute names (`start_ts`/`end_ts`) and per-word granularity vary by `kokoro` version — adjust `kokoro_io.synth_and_durations` to the installed build if needed; aeneas fallback + the §3.6 detector cover a mismatch. **Also watch:** `synth_and_durations` raises `KokoroUnavailable` on a tokenless chunk — if real Kokoro emits one for valid input, change it to skip-empty.

### Option C — Plan 3: F-001 v4 (after Plans 1+2)
Regenerate F-001 with TTS narration + denser visuals (timeline date ticks/era labels, stronger side-by-side comparison, brighter rest-state pyramid — see `08-render-qa.md` polish list), render in `CaludeRemotionShorts`, run render-qa incl. the new VO check.

---

## Open items / deferred Minor findings (in `.git/sdd/progress.md`)
- timing.py: loop-tail start uses `last_word_end` not `beats[-1].end` (equal now; future-fragility comment worth adding); region field inits `None` then overwritten.
- envelope.py: regions exactly 9–10 frames apart can briefly un-duck (benign; upstream merge gap = 9f).
- framemap.py: `re.sub` replacement processes `\1`/`\g` escapes (benign for frame-map tables; a `lambda` replacement would harden it).
- **Carry-forward to Plan 2:** captions key off `words[]`, not `beats[]` (see Option A).

## Key paths
- Engine: `.claude/skills/tts-voiceover/` · Tests: same `/tests/`
- TTS spec: `docs/superpowers/specs/2026-06-17-tts-voiceover-pipeline-design.md`
- Engine comparison: `docs/superpowers/specs/2026-06-17-tts-engine-comparison-piper-vs-kokoro.md`
- Plan 1: `docs/superpowers/plans/2026-06-17-tts-voiceover-engine.md`
- F-001 deliverable: `output/F-001-cleopatra-vs-pyramids/` (00–08 + README)
- Pipeline def: `CLAUDE.md` · Learnings: `memory/lessons.md` · SDD ledger: `.git/sdd/progress.md`
- Rendered video (external repo): `/home/zain-ali/Documents/CaludeRemotionShorts/final.mp4`

## Branch state
- Branch `fix/short-pipeline-visual-quality` @ `1897fb8`, ahead of `main` by 23 commits (visual-quality fixes + F-001 v3 + TTS spec/comparison/plan + the engine). NOT merged. Decide integration when the feature (Plans 2–3) is further along, or merge the engine separately — it's self-contained and changes no `/short` behavior until Plan 2 wires it.
