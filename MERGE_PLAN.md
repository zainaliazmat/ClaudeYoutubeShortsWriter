<!-- /autoplan restore point: /home/zain-ali/.gstack/projects/zainaliazmat-ClaudeYoutubeShortsWriter/fix-short-pipeline-visual-quality-autoplan-restore-20260617-210551.md -->
# Merge Plan — Fathom: one self-improving Shorts factory

**Goal:** Merge `ScriptWriter` (agentic spec generator) and `CaludeRemotionShorts`
(bespoke Remotion renderer) into ONE project that takes a topic and autonomously
produces a world-class vertical Short: **script → voice → video → review the rendered
pixels → attribute every defect to the script / voice / video stage → fix the
responsible stage → re-render → loop to a quality bar → human approves the final.**
Every fix writes a durable lesson so the same mistake is not repeated next run.

---

## Decisions already made (this session)

- **D1 — Repo topology: monorepo, Remotion moves into ScriptWriter.**
  `CaludeRemotionShorts/` becomes `ScriptWriter/render/`. One git repo, one `CLAUDE.md`,
  one pipeline. Matches what the existing skills already assume (`render-qa` expects the
  rendered file to sit next to the spec folder).
- **D2 — Render bridge: CODEGEN-FIRST (revised after review).** *Original pick was a
  parametric data-driven engine; the /autoplan CEO+Design+Eng review challenged the
  **timing** (n=1 video, format unproven, engine caps novelty). Decision: codegen `.tsx`
  per video now, parametric engine → **backlog** with a decision gate after 5–6 videos.*
  A `remotion-codegen` skill reads the spec files and writes the per-video **scene** `.tsx`
  on top of a **shared primitive library** (`render/src/lib/`) extracted from F-001
  (motion presets, caption renderer, audio mixer, background). The generated code is small
  (layout/scene logic only); the proven primitives are reused, not regenerated. The shared
  lib is deliberately the seed of the eventual engine — see Backlog.
- **D3 — Loop autonomy: auto-iterate to a quality bar, human approves the final.**
  Render → QA → attribute → auto-route to the responsible stage → regenerate → re-render,
  looping until the scorecard clears a bar (default **≥ 85, no blockers, Cat 9 ≥ 70%**)
  or hits a **max of 3 render iterations**. A human signs off before upload (facts /
  audio / AI-disclosure compliance).

---

## Current state (verified)

### ScriptWriter (the spec generator)
- `/short` pipeline (8 steps) produces `output/F-NNN-<slug>/`:
  `00-topic` → `01-verified-facts` → `02-script` (+ `vo-timing.json`, `vo.wav`) →
  `03-assets` → `04-audio` → `05-remotion-prompt` → `06-scorecard` → (post-render)
  `07-video-review` / `08-render-qa`.
- Skills: `niche-memory`, `youtube-shorts-writer`, `tts-voiceover` (local Kokoro),
  `asset-sourcing` (via `asset-scout` subagent), `remotion-prompt-generator`,
  `remotion-script-reviewer`, `render-qa`, `short-assembly`.
- `memory/lessons.md` — cross-run learnings, read at start, appended at end. **The
  self-improving memory already exists.**
- Explicitly does NOT write `.tsx` or render. `05-remotion-prompt.md` is a human/agent
  instruction, not code.

### CaludeRemotionShorts (the renderer)
- Standard Remotion v4 project (React 19, TS), 1080×1920 @ 30fps. `npm run dev` /
  `npx remotion render`.
- ONE composition (`F-001-cleopatra-vs-pyramids`), **scenes hardcoded in `.tsx`**
  (`src/cleopatra/*`). No parametric engine. `vo-timing.json` drives captions; audio
  mixed in `AudioBed.tsx` (VO lead, music ducks, SFX at frames). Assets in `public/`.
- The ONLY automated input is `vo-timing.json`; everything else (scene text, colours,
  timing constants, audio file download) is manual.
- F-001 was built by an agent **hand-reading** `05-remotion-prompt.md`. That hand step
  is exactly the gap this merge closes.

### What already works (do not rebuild)
- VO generation + integer-frame timing contract (`tts-voiceover` → `vo-timing.json`).
- Word-by-word caption rendering from `vo-timing.json` (`Captions.tsx`).
- Frame-exact audio ducking (`AudioBed.tsx`) + the `-14 LUFS / ≤ -1 dBTP` master target.
- `render-qa`: ffprobe/blackdetect/luma/loop-seam/loudness checks that route failures
  back to the responsible spec file.
- `07-video-review.md`: a worked example of pixel-level defect attribution
  ("baked into the spec" vs "render bug") — the template for stage attribution.

---

## Target architecture

```
topic
  │  niche-memory
  ▼
00-topic ─► 01-verified-facts ─► 02-script (+vo-timing.json, vo.wav)
  (research/verify)   (writer)        (tts-voiceover)
                                          │
                                          ▼
                03-assets + 04-audio ─► 05-remotion-prompt ─► 06-scorecard
                  (asset-scout)        (prompt-generator)    (script reviewer loop)
                                          │
                          ┌───────────────┘  NEW: render bridge
                          ▼
                  compose.json  (scene-graph: beats, tokens, presets, timing)
                          │  scene-graph generator (NEW skill)
                          ▼
   render/  <FathomShort data={compose.json}/>   (parametric engine, NEW)
                          │  npx remotion render + two-pass loudnorm master
                          ▼
                   final.mp4 ───► render-qa (pixel + loudness QA)
                          │
                          ▼
              STAGE ATTRIBUTION  (script | voice | video) + lessons
                          │
            pass bar? ──no──► route to owning stage, regenerate, re-render (≤3)
                          │
                         yes
                          ▼
                  human publish gate ──► upload (AI-disclosure = YES)
```

The new pieces are: **`compose.json` contract**, **the parametric `<FathomShort>` engine**,
**a scene-graph generator skill** (turns `05-remotion-prompt.md` → `compose.json`), an
**automated render+master runner**, and a **closed attribution/re-render loop** wrapping
the existing `render-qa`.

---

## The codegen bridge + shared primitive library (heart of D2, revised)

Two parts:

**1. Shared primitive library `render/src/lib/`** — extract F-001's proven, reusable pieces
once so every video reuses tested code (not regenerated):
- `motion.ts` — spring/`countUp`/`glowPulse`/`slamIn` primitives (already clean, ~150 lines).
- `Captions.tsx` — word-by-word caption renderer **+ the merge/override/accent rules baked in**
  (consecutive same-`display` merge, `~2,500` override, ancient/modern accent) so that logic
  lives in ONE place, parameterized by fully-resolved tokens.
- `AudioBed.tsx` — VO-lead + ducked-music + SFX mixer driven by the `vo-timing.json` envelope.
- `Background.tsx` — gradient + grain + vignette depth field (enforces "never flat single-hex").
- `safeArea.ts` — the safe-area insets + the quality-floor constants (min hero px, fill ratio).

**2. `remotion-codegen` skill (single writer)** — reads `05-remotion-prompt.md` + `03-assets.md`
+ `04-audio.md` + `vo-timing.json` and writes the **per-video scene `.tsx`** under
`render/src/F-NNN/` plus a `Composition` entry, importing everything from `render/src/lib/`.
The generated file is just the layout/scene logic for this video. Hard gates after codegen:
`tsc` + `eslint` must pass, `durationInFrames`/`fps` come from `calculateMetadata(inputProps)`
fed by `vo-timing.json` (never a hardcoded `DURATION` const — that was a real F-001 bug),
fonts block frame 0 (`waitForFonts`/`delayRender`), and the frame-tiling validator runs over
the scene ranges (0-indexed half-open, tile `[0, total]`).

**Quality-floor enforcement without an engine:** the floors the Design voice wanted baked into
an engine instead live as (a) explicit constraints in the `remotion-codegen` skill instructions
(min hero ≥ ~300px, bg computed luma ≥ ~35, scene fill ≥ ~55%, count-up ≤ 36f ease-out,
scale-honest data-viz computed FROM the verified values), and (b) the existing `render-qa`
pixel checks as the backstop. Codegen here IS the escape hatch — any novel mechanic is just
new scene code, no fork needed.

> The parametric `compose.json` engine (original D2) is parked in **Backlog** below with its
> full reviewed design (archetypes + quality-floor clamps + inlined timing). The shared lib
> above is deliberately the foundation it would be extracted from.

---

## Stage attribution model (heart of D3)

`render-qa` already classifies failures by which spec file owns them. We formalize a
three-way owner so the loop knows which generator to re-run:

| Defect class (examples) | Owner stage | Re-run |
|---|---|---|
| Wrong/over-long narration, weak hook, unsourced claim, pacing in words | **script** | `youtube-shorts-writer` (then `tts-voiceover`) |
| VO too fast/slow/robotic, caption frames off, overrun, mispronunciation | **voice** | `tts-voiceover` (or back to script to cut words) |
| Flat/near-black frame, dead space, invisible mechanic, slow count-up, loop seam, scale-dishonest viz, glyph collision | **video** | `asset-sourcing` / `remotion-prompt-generator` → `remotion-codegen` (scene `.tsx`) |
| Quiet master / loudness | **video (master)** | re-master (loudnorm) only |

Each QA finding emits `{ defect, evidence (measured number), owner, fix, principle }`.
The loop routes to the owner, regenerates only the downstream artifacts, re-renders, re-QAs.
Every confirmed fix appends a one-line dated lesson to `memory/lessons.md` so the
generating skill avoids it next time (the prevention half of "self-improving").

---

## Build phases (codegen-first, re-sequenced after review)

### Phase 0 — Monorepo move + bootstrap (D1 + DX-critical)
- Move `CaludeRemotionShorts` → `ScriptWriter/render/` as a **plain copy + single commit**
  (unrelated histories; history value is low — auto-decided over `git subtree`). Fix paths,
  `tsconfig`, `remotion.config.ts`, Tailwind v4 webpack roots relative to `render/`.
- **`public/` strategy = COPY + CLEAN** (not symlink): the render runner wipes run-scoped
  files from `render/public/` and copies the active `output/F-NNN/` `vo.wav` + audio fresh
  each render (deterministic, no cross-run staleness). Keep only truly-static files.
- **Add `SETUP.md` + `scripts/bootstrap.sh` + `make doctor`** (create `.venv-tts` per the
  tts-voiceover skill, `npm i` in `render/`, assert `ffmpeg`/`node`/espeak, print each gap as
  `missing X → install with Y`). One root `CLAUDE.md` section documents `render/`.
- **Exit:** **fresh clone → `bootstrap` → `cd render && npx remotion render`** produces the
  F-001 MP4 from the moved tree.

### Phase 1 — Automated render + master runner (the real repeated pain)
- `render-run` script (new step between assembly and QA): validate `id` (`^F-\d{3}-[a-z0-9-]+$`),
  copy+clean assets, **pre-render asset-existence gate** (missing music/SFX → halt with the
  download checklist from `04-audio.md`: file → URL → license), `npx remotion render`
  (`execFile`/array args, **hard timeout**), two-pass `loudnorm` → `final.mp4` verified to
  −14 LUFS / ≤ −1 dBTP. Absolute paths (agent bash cwd resets between calls).
- **Exit:** one command takes `output/F-NNN/` to a mastered `final.mp4` at −14 LUFS.

### Phase 2 — Shared primitive library + `remotion-codegen` skill (the bridge)
- Extract `render/src/lib/` from F-001 (motion presets, `Captions` + merge/override/accent
  rules, `AudioBed`, `Background`, `safeArea`/quality-floor constants). Unit-test the
  reusable bits with existing F-001 data (caption-merge + tiling tests — write FIRST, TDD).
- New **single-writer** `remotion-codegen` skill (step 5.5): spec files + `vo-timing.json` →
  per-video scene `.tsx` under `render/src/F-NNN/` importing from `lib/`; `tsc`+`eslint` gate;
  `calculateMetadata` for duration; tiling validator over scene ranges. Note in CLAUDE.md +
  lessons: a NEW skill needs a Claude Code reload before its first run.
- Quality floors enforced via skill constraints (min hero, bg luma, fill, count-up clamp,
  scale-honest viz) + `render-qa` backstop.
- **Exit:** `/short` for F-001 codegens scene `.tsx` from specs with no hand edits; it renders
  and clears the bar (≥ the F-001 v4 scorecard).

### Phase 3 — Closed self-improving loop (D3)
- Wrap `render-qa` in an orchestrator: QA → attributed defect list (owner per the table) →
  if pass-bar met (≥85, no blockers, Cat 9 ≥ 70%), stop; else route to the owning stage's
  skill, regenerate downstream, re-render, re-QA. **Cap at 3 iterations OR no-improvement**
  (require strict score gain or abort); **keep the best-scoring render** (`final-best.mp4`,
  never overwrite a passing earlier attempt); **script re-cut ≤ 1× per loop** (it mutates VO
  timing → every range). First-class **`precheck` module** runs before every render
  (luma/dead-space/count-up/tiling/asset/caption-bounds) so wasted renders are rare.
- **Per-run iteration ledger** in the run folder: per round `{score, Cat9, blockers, owner,
  fix, lesson}` + terminal `STATUS: PASS | BAR-NOT-MET(best=NN) HUMAN ACTION: …`. Stream a
  one-line status per iteration; TodoWrite entry per iteration.
- Each confirmed fix appends a dated lesson to `memory/lessons.md` AND, where durable, folds
  into the owning skill's instructions (prevention structural, not just remembered).
- Final **human approval gate** before "done" (completeness gate + render sign-off).
- **Exit:** a fresh topic runs end-to-end to a passing `final.mp4` with zero hand edits, and
  an injected defect (e.g. near-black bg) is caught, attributed to *video*, auto-fixed, and a
  lesson written.

### Phase 4 — Update the orchestrator + docs
- Rewrite `.claude/commands/short.md` + `CLAUDE.md` to the merged 0→publish flow (incl. the
  named asset gate). Update `short-assembly` to record the render + QA iterations + AI-disclosure.

---

## Risks / open questions (for the review to sharpen)

- **Engine expressiveness vs F-001 fidelity.** A parametric engine may not reproduce every
  bespoke flourish. Mitigation: seed presets from F-001; accept the hybrid escape hatch
  (custom scene component validated against the contract) as a *later* phase if a beat
  can't be expressed — but Phase 1 targets parity first.
- **Render time in the loop.** Each iteration is a full ~2–5 min render. 3 iterations ×
  full render is real wall-clock. Mitigation: cheap pre-render checks on `compose.json`
  (luma estimate, dead-space estimate, count-up durations) before spending a render.
- **Attribution ambiguity.** Some defects span stages (slow count-up that's *also* on a
  black bg). Mitigation: rank by owner, fix highest-severity owner first, re-QA.
- **Asset binaries.** Music/SFX are downloaded manually today. The loop can't fix a missing
  binary. Keep download a documented pre-render human step (monetization-safe sourcing).
- **Kokoro/venv portability** (`.venv-tts`) must survive the move; it's gitignored.
- **Schema drift.** `compose.json` schema must be versioned so older runs still render.

## Out of scope (defer)

- Auto-downloading music/SFX binaries (licensing/Content-ID risk — stays human).
- Auto-upload to YouTube (the AI-disclosure toggle is a human action).
- Multi-video batch rendering / channel scheduling.

---

## Backlog — Parametric `compose.json` engine (DECISION GATE after 5–6 videos)

Original D2. Parked, not killed. **Revisit when 5–6 videos have shipped through the
codegen path** (or a clear winning format emerges sooner). Decision criteria at the gate:
- Do the per-video scene `.tsx` files show **repeated layout structure** (the same 2–3
  archetypes recurring)? If yes → extract them into an engine. If every video is still
  structurally novel → stay on codegen (an engine would only cap novelty).
- Is the codegen step a **measured throughput bottleneck**? If codegen is fast/reliable,
  the engine buys little.

If GO, build the engine **on top of the Phase-2 shared lib** with the reviewed design intact:
- **Layout ARCHETYPES, not generic bands** (verticalTimeline, splitCompare, stackedBars,
  bigStatHero, radialBurst…), each owning the full 1080×1920 canvas; chosen by fact-shape;
  rotation tracked in `memory/` to avoid template fatigue.
- **Quality floors as non-overridable engine clamps + a pre-render linter** (computed bg luma
  ≥ ~35, hero ≥ ~300px, scene fill ≥ ~55%, count-up ≤ 36f).
- **Data-viz archetypes take raw values; engine computes geometry** (scale-honesty can't be
  hallucinated; linter asserts length ratio == data ratio).
- **Inlined caption tokens + `meta.total`** in `compose.json` (no build-time `import`);
  `calculateMetadata` for duration; **global `persistentLayers`** for furniture + loop seam
  (state at `total` == state at 0); **`schemaVersion` reject-unsupported** (no migrations).
- A typed `customElement` stays the escape hatch into bespoke scene code.
(The full reviewed rationale is in the Design/Eng sections of the review report below.)

---

# GSTACK REVIEW REPORT — /autoplan

> Mode: SELECTIVE EXPANSION. Voices: **[subagent-only]** — codex binary missing, so each
> phase ran one independent Claude review subagent (no codex voice). No "both-models-agree"
> User Challenge can fire; single critical findings are flagged regardless.
> Scope: UI=yes (composition/layout), DX=yes (agent/skill/CLI tool). All 4 phases ran.

## Phase 1 — CEO (strategy & scope)

Independent voice raised a **CRITICAL strategic challenge to the *timing* of D2**:
- **n=1 generalization.** Channel has shipped 1 video, 0 published. Presets are extracted
  from that single video (`verticalTimeline` is literally time-gap-fact-specific). An
  abstraction distilled from one instance is that instance with indirection.
- **Wrong bottleneck.** Goal = "more good videos, faster," but there's no evidence the
  hand-build is the throughput constraint (topic quality / retention / research time are
  unmeasured). The plan spends its whole budget automating the one stage that demonstrably
  worked (F-001 rendered, scored 93).
- **Phase-1 parity trap.** Phase 1 exit = "visually equivalent to hand-coded F-001" → best
  case after the big build is what you already have, via a more complex path.
- **Self-improving loop mostly exists** (`memory/lessons.md`, `render-qa` owner-routing,
  `07-video-review`); the *new* part (autonomous re-render) saves a 1-person channel minutes
  at the cost of an orchestrator + admitted attribution ambiguity.
- **Recommendation:** keep Phase 0 (monorepo) + Phase 3 (render+master runner — real
  repeated pain per lessons), defer the engine, **codegen `.tsx` per video for the next
  ~4–5 videos** to find the winning format, then extract the engine from 5 datapoints.

CEO CONSENSUS TABLE (Codex N/A — single voice):
| Dimension | Claude voice | Codex | Consensus |
|---|---|---|---|
| 1 Premises valid? | NO — engine-now premise unproven | N/A | flagged → premise gate |
| 2 Right problem? | PARTIAL — render bridge may not be the bottleneck | N/A | flagged |
| 3 Scope calibrated? | NO — too big; Phase 0+3 only | N/A | flagged → user challenge |
| 4 Alternatives explored? | NO — pure codegen never evaluated as primary | N/A | flagged |
| 5 6-month trajectory? | RISK — factory before PMF; engine caps novelty | N/A | flagged |

## Phase 2 — Design (parametric engine)

Verdict: parametric is the right call **for the quality floor**, but the `compose.json`
*sketch* will re-ship F-001's flat void and converge on template fatigue.
- **Distinctiveness lives in LAYOUT ARCHETYPES, not animation presets.** ~6 presets × 3 bands
  → every Short is "hero center + kicker upper + motif." Define full-frame archetypes
  (verticalTimeline, splitCompare, stackedBars, radialBurst, bigStatHero…) chosen by fact
  shape; presets are the animation vocabulary *within* an archetype. Force archetype rotation.
- **Bake quality floors into the engine as non-overridable clamps + a pre-render linter:**
  computed bg luma ≥ ~35 (gradient required), hero ≥ ~300px, scene fill ≥ ~55% (the single
  check that catches F-001's void), count-up ≤ 36f ease-out, per-beat luma estimate.
- **Data-viz takes raw values, not pixels** — engine computes geometry (px/yr, segment
  lengths) so scale-honesty can't be hallucinated; linter asserts length ratio == data ratio.
- **Day-one typed `customElement` escape hatch** (not Phase 6) so a novel mechanic stays a
  *data* defect, not a code fork — still subject to the quality floors.
- **Global `persistentLayers`** for furniture + the loop seam (state at `total` == state at 0).
- "Extract presets" is mis-sized: `motion.ts` extracts clean (~150 lines); `TimelineLayer`/
  Beat6 are bespoke data-viz templates = the real Phase 1 cost. Split into 1a/1b.

## Phase 3 — Eng (architecture)  — CONDITIONAL GO

ENG CONSENSUS TABLE (Codex N/A — single voice):
| Dimension | Claude voice | Codex | Consensus |
|---|---|---|---|
| 1 Architecture sound? | YES (monorepo + data-driven + loop) | N/A | confirmed |
| 2 Test coverage? | NO — no test plan in the plan | N/A | flagged (artifact written) |
| 3 Perf/render cost? | RISK — precheck gate is a parenthetical, must be a phase | N/A | flagged |
| 4 Edge cases? | NO — tiling/asset-missing/schema-drift unhandled | N/A | flagged |
| 5 Determinism? | RISK — font FOUT, symlink staleness | N/A | flagged |

CRITICAL/HIGH findings folded into the revised plan:
- **E1/E2 inline timing.** `vo-timing.json` is `import`ed at build time and `DURATION=930`
  is a const. compose.json must **embed** resolved caption tokens + `meta.total`; duration via
  `calculateMetadata(inputProps)`, never a module const. `"captionsFrom"` indirection is a bug.
- **E6 tiling on compose ranges.** scenes[].range is a NEW timeline rep; re-run the tiling
  validator over it (0-indexed half-open, tile [0,total]) as a hard pre-render gate.
- **E10 first-class `precheck` module** (luma/dead-space/count-up/tiling/asset/schema/caption
  bounds) run before *every* render — this is what makes max-3 affordable.
- **E5 Zod as standalone pre-render gate** (actionable error) + Remotion `schema=` defense-in-depth.
- **E7 caption merge/override/accent rules become engine code** parameterized by fully-resolved
  tokens — not duplicated business logic (it already churned once: commit e5d3c7a).
- **E8 pre-render asset existence gate** → `{owner: human, missing <file> from <URL>}`; + hard render timeout.
- **E9 loop monotonicity:** strict score improvement or abort; keep best render; script re-cut ≤1×/loop.
- **E11 font determinism** (waitForFonts/delayRender; pin concurrency). **E18 copy+clean, not symlink.**
- **E17 security:** validate `id` `^F-\d{3}-[a-z0-9-]+$` + asset basename allowlist; `execFile` not shell.
- **E16 schemaVersion: reject-unsupported** (no forward-compat promise).
- Test plan artifact written: `~/.gstack/projects/<slug>/...-test-plan-*.md`.

## Phase 3.5 — DX  — ship the architecture, close 4 human-facing gaps

DX CONSENSUS TABLE (Codex N/A — single voice):
| Dimension | Claude voice | Codex | Consensus |
|---|---|---|---|
| 1 Getting started < 5 min? | NO — fresh clone blocked (venv/node/ffmpeg/espeak/binaries) | N/A | flagged (critical) |
| 2 Failure messaging actionable? | NO — missing-asset & post-3-iter are dead ends | N/A | flagged |
| 3 Skill contracts clean? | RISK — compose.json writer left undecided | N/A | flagged |
| 4 Observability? | PARTIAL — no per-run "why did it iterate" record | N/A | flagged |
| 5 Steady-state TTHW | GOOD — single-digit min + 1 asset fetch; beats by-hand | N/A | confirmed |

- **CRITICAL: Phase 0 adds `SETUP.md` + `scripts/bootstrap.sh` + `make doctor`** (venv, `npm i`
  in render/, assert ffmpeg/node/espeak, print missing→fix). Exit = "fresh clone → bootstrap → render F-001."
- **Asset-binary check = a NAMED pre-render gate** (halt with download checklist from `04-audio.md` URL+license), documented in CLAUDE.md, not buried in Risks.
- **Post-3-iteration terminal report:** per-run iteration ledger `{score,Cat9,blockers,owner,fix,lesson}` + `STATUS: PASS | BAR-NOT-MET(best=NN) HUMAN ACTION: …`; keep `final-best.mp4`, never overwrite a passing earlier attempt.
- **Single writer for compose.json:** a dedicated `compose-generator` skill (step 5.5); note in CLAUDE.md + lessons that a NEW skill needs a Claude Code reload before first run.

## Cross-phase themes (flagged by 2+ phases independently — high-confidence)

1. **The compose.json sketch is under-specified** — Design (no quality floors / generic bands) + Eng (inlined timing, tiling, precheck). → schema must be rebuilt before any engine code.
2. **"Extract presets" is mis-sized** — Design F8 + Eng E13: two beats are bespoke data-viz templates, not presets. → honest Phase 1a/1b split.
3. **Missing asset = silent dead-end** — Eng E8 + DX: → pre-render asset gate.
4. **Loop give-up / oscillation undefined** — Eng E9 + DX: → monotonicity + terminal report.
5. **Scope vs. PMF** — CEO (premature factory) + DX (first-run blocked): → the engine-timing question (gate).

## Decision Audit Trail

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | Eng | Inline resolved caption tokens + meta.total into compose.json; duration via calculateMetadata | Mechanical | P1 | build-time import is a correctness bug |
| 2 | Eng | Re-run frame-tiling validator over compose.json ranges as hard pre-render gate | Mechanical | P1 | new timeline rep must obey the same contract |
| 3 | Eng | First-class precheck module (luma/dead-space/count-up/tiling/asset/schema/caption) | Mechanical | P1/P2 | makes max-3 loop affordable; in blast radius |
| 4 | Eng | Zod validation as standalone pre-render gate + Remotion schema | Mechanical | P1 | actionable error surface |
| 5 | Eng | Caption merge/override/accent rules become engine code (single source) | Mechanical | P4 | DRY; already churned once |
| 6 | Eng | copy+clean public/ each render, not symlink | Mechanical | P5 | deterministic; no cross-run staleness |
| 7 | Eng | git: plain copy + single commit (not subtree) | Taste→auto | P3/P5 | unrelated histories, low history value |
| 8 | Eng | schemaVersion: reject-unsupported (no migration) | Mechanical | P5 | don't promise forward-compat you won't build |
| 9 | Eng | security: validate id + asset basename; execFile not shell; render timeout | Mechanical | P1 | cheap, closes injection + hang |
| 10 | Design | Quality floors baked into engine + linter (luma/hero/fill/count-up) | Mechanical | P1 | the whole point; prevents F-001 void structurally |
| 11 | Design | Data-viz archetypes take raw values; engine computes geometry | Mechanical | P1 | scale-honesty can't be hallucinated |
| 12 | Design | Layout = full-frame ARCHETYPES, not generic bands+presets | Taste→auto | P1/P5 | strongly supported; prevents template fatigue |
| 13 | Design | Global persistentLayers for furniture + loop seam | Mechanical | P1 | loop-seam is a non-negotiable |
| 14 | Design/Eng | Honest Phase 1a (motion presets) / 1b (data-viz templates) split | Mechanical | P5 | accurate scoping |
| 15 | DX | Phase 0 adds SETUP.md + bootstrap + doctor; exit = fresh-clone render | Mechanical | P1 | first-run is otherwise unrunnable |
| 16 | DX | Asset-binary check = named pre-render gate w/ download checklist | Mechanical | P1 | converts dead-end to 30s action |
| 17 | DX | Per-run iteration ledger + terminal report; keep final-best.mp4 | Mechanical | P1 | loop must be legible + non-destructive |
| 18 | DX | Single-writer compose-generator skill (step 5.5) | Mechanical | P4 | clean contract; resolves Phase 2 open Q |
| 19 | Design | Day-one typed customElement escape hatch | **TASTE → resolved MOOT** | — | user chose codegen-first; codegen IS the escape hatch |
| 20 | CEO | Engine-now vs codegen-first sequencing | **USER CHALLENGE → user chose B (codegen-first)** | — | engine → Backlog w/ decision gate after 5–6 videos; user kept D-UC A in backlog |
| 21 | Eng/CEO | Codegen writes per-video scene .tsx on a shared `render/src/lib/` extracted from F-001 | Mechanical | P4/P5 | minimal throwaway; shared lib = seed of the eventual engine; reuses tested primitives |
| 22 | CEO | Bring render+master runner forward to Phase 1 (was Phase 3) | Mechanical | P2/P6 | the real repeated pain (loudnorm) pays off regardless of engine decision |
