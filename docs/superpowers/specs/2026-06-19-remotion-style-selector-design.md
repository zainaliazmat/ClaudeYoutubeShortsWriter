<!-- /autoplan restore point: /home/zain-ali/.gstack/projects/zainaliazmat-ClaudeYoutubeShortsWriter/main-autoplan-restore-20260619-021950.md -->
# Design — `remotion-style-selector` skill (Phase 1 of the "living motion graphics" program)

**Date:** 2026-06-19
**Status:** Reviewed via /autoplan (2026-06-19) — **re-scoped to reference-only.** See the
`## GSTACK REVIEW REPORT` and `## Decision Audit Trail` at the end of this file.
**Author:** brainstorming session (zain-ali); revised by /autoplan review

> **/autoplan re-scope (user-decided):** Both review models (Claude + Codex) independently
> flagged that building a *selector* before the styles it selects exist is premature — Phase 1's
> own success criterion was "changes no behavior." The user chose to **trim Phase 1 to a
> reference-only skill**: ship the determinism/usage/decision-map *documentation* now, and
> **defer** the pipeline step `3.6`, the `03-style.md` decision record, the availability-gate
> machinery, and the CLAUDE.md niche-identity rewrite until a second style (D3) actually exists
> to route to. Three.js is **demoted from the committed program to an exploration bucket.**

## Context

The channel's renderer (`render/`) is today a tightly-scoped **kinetic-typography** factory:
text + motion only, no footage. Dependencies are `remotion`, `@remotion/google-fonts`,
`@remotion/media`, `lucide-react`, Tailwind — none of the richer animation libraries.

`REMOTION_USAGE_GUIDE.md` (added this session) is a generic "Remotion + Claude Code" playbook:
a decision map for pairing five libraries (GSAP / D3 / Three.js / Lottie / Framer Motion) with
Remotion, plus prompting discipline and a transparent-render recipe.

The user wants to evolve the channel from "text + motion only" toward **"kinetic typography +
living motion graphics"**, where each video can be a **full composition style of its own**
(primarily data-viz, primarily 3D, primarily motion-graphics) with text as caption overlay.

## The program (decomposition)

This is not one spec — it is a program of sequential sub-projects, each its own spec → plan →
build cycle. Agreed ordering:

1. **Reference skill — `remotion-style-selector`** ← *this spec (Phase 1)*. **Re-scoped to
   reference-only** (see Status). Cheap living documentation: the determinism rules + decision map
   that every later phase reads. The *selector machinery* (pipeline step, decision record,
   availability gate) is deferred to Phase 2 when there is a real second style to route to.
2. **D3 data-viz composition style** — highest content fit (we already fake data-viz),
   deterministic (pure SVG), immediate quality win. **This is the first build that produces new
   rendered frames.** Style-selection logic is inlined into `remotion-prompt-generator` here;
   the standalone selector skill is extracted only when a 3rd style creates real routing pressure
   (rule of three).
3. **Lottie composition style** — most reliable per the guide; genuine motion graphics, low risk.
4. **GSAP choreography** — richer easing/overlap; an enhancement layered on `lib/motion.ts`.
5. **Three.js 3D composition style** — **EXPLORATION BUCKET, not committed** (/autoplan D2).
   Biggest "alive" payoff but **highest determinism risk** (headless WebGL is GPU/driver-variant
   and fights the frame-reproducible QA loop). Re-admit to the committed program only after (a) a
   determinism spike renders byte-reproducibly across two machines AND (b) a recurring spatial/3D
   fact-shape proves it is needed.

Key correction baked into the program: **Framer Motion is NOT used for rendered video.** It is
physics/gesture-based and reactive to user input — non-deterministic when rendered headless. The
deterministic-choreography role goes to **GSAP** (and the existing `lib/motion.ts`). Framer Motion
appears in the skill only as an explicit "do not use for rendered video" warning.

## Goal of Phase 1

Capture the guide as an **operational, niche-specific, agent-facing** reference skill that
serves as the **usage + determinism reference** for each composition style, and **documents** the
fact-shape → style decision map for when the styles exist.

**Re-scoped (/autoplan D1):** Phase 1 ships *documentation only* — no pipeline wiring, no
`03-style.md` write, no availability-gate execution. The decision map and availability table are
present as **reference tables a human/agent reads**, not as a machine step that emits a per-video
record. Active *selection* (writing a decision record the pipeline branches on) lands in Phase 2
alongside D3, inlined into `remotion-prompt-generator` first. This adds no dependency and changes
no render output.

## The skill

**Name:** `remotion-style-selector`
**Location:** `.claude/skills/remotion-style-selector/SKILL.md`
**Type:** project skill, **user-invocable** (also consulted inside the pipeline).
**`allowed-tools`:** Read, Write (writes the decision record; reads spec files).

### Responsibilities (Phase 1 — reference-only)
- Serve as the **per-style usage + determinism reference** (the load-bearing value of this phase).
- **Document** the fact-shape → style decision map (priority-ordered, with worked examples) so the
  logic is reviewed and ready to inline into `remotion-prompt-generator` in Phase 2.
- **Document** the availability gate as a single canonical table (`available | planned`) — read by
  humans now, executed by the pipeline in Phase 2.

### Deferred to Phase 2 (with D3)
- *Executing* selection: writing a `03-style.md` decision record the pipeline branches on.
- The pipeline step `3.6` insertion.
- Teaching `asset-sourcing` / `remotion-prompt-generator` / `remotion-codegen` the new branches.

### Explicit non-responsibilities
- Does **not** duplicate the official Remotion skill at
  `render/.agents/skills/remotion-best-practices/` — points there for primitives/render mechanics.
- Does **not** write `.tsx` (that stays `remotion-codegen`).
- Does **not** download assets or render.

### SKILL.md contents
1. **The governing rule** — Remotion renders a fixed, frame-deterministic timeline; every frame
   reproducible from a frame number. The lens for every decision below.
2. **The decision map (niche version)** — *fact shape → style*, written as a **priority-ordered
   list (evaluate top to bottom, first match wins)** — NOT an unordered set — so the same fact
   classifies the same way every run (DX finding 2a: "X grew 40% over 10 years" is simultaneously a
   number, a timeline, and "data is the content"; ordering disambiguates). Each row carries a
   one-line *disqualifying* test, and the section ends with **2–3 worked golden examples**
   (fact → walk-through → chosen style):
   - "the data is the content" (≥3 data points / continuous distribution / growth curve) → **D3**
   - spatial / physical fact that **cannot be understood without a 3D relationship** → **Three.js**
   - needs a motion accent / icon / micro-illustration → **Lottie**
   - complex overlapping choreography → **GSAP**
   - single number / comparison of ≤2 magnitudes / ranking / discrete timeline → **kinetic-typography**
   - **Framer Motion → "do NOT use for rendered video"** (physics/gesture, non-deterministic headless).
   Define "**simplest style that fully serves**" operationally so it isn't a judgment call.
3. **Per-style playbook** — one block per relevant style: *when to pick · how to prompt Claude ·
   determinism caveats · quality floors · availability flag.*
4. **Determinism rules (non-negotiable)** — the load-bearing section. General rules: drive
   everything from `useCurrentFrame()`; **use Remotion's seeded `random("seed")`** (repo precedent:
   `render/src/lib/Background.tsx`) — not just "avoid `Math.random()`"; no `Date.now()`; duration via
   `calculateMetadata`; **wrap every async asset load (Lottie JSON, GLTF, fetched data) in
   `delayRender()` / `continueRender()`** so frames never render before data is ready. Plus
   **per-library** sub-rules (Eng finding D1 — these are the actual in-the-wild bugs):
   - **GSAP** — build a **paused** timeline; advance with `timeline.seek(frame / fps)` (or
     `.progress()` / `.totalTime()`) each frame. NEVER `gsap.ticker` / real-time playback.
   - **Three.js** — use `<ThreeCanvas>` from `@remotion/three` (raw `<Canvas>` frames aren't
     captured); advance animation from `frame`, never `clock.getElapsedTime()` / `requestAnimationFrame`.
     Flag residual WebGL cross-GPU nondeterminism (this is why Three is exploration-bucket).
   - **Lottie** — use `@remotion/lottie`; drive the player by `frame` via `seek`/`progress`, never autoplay.
   - **D3** — d3 scales/shapes are pure (good); **forbid `d3.transition()` / `d3-timer`** (wall-clock).
     Compute paths/scales as pure functions of `frame`.
5. **Transparency-render recipe** — verified CLI for compositing title cards/overlays:
   `npx remotion render <id> out.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le`
6. **Prompting discipline** — start simple; iterate in the same session; read the official
   Remotion skill first; match tool to motion before prompting.
7. **Sources & precedence** (Eng C1 / DX 4a-4b — three overlapping Remotion docs now exist; an
   agent needs a conflict rule). State precedence explicitly:
   - **This skill** governs *style selection + niche determinism rules* — wins on conflict for those.
   - **`render/.agents/skills/remotion-best-practices/`** (official) governs *Remotion API/primitives
     + render mechanics* — defer to it for code, wins on conflict for API.
   - **`REMOTION_USAGE_GUIDE.md`** is *background/long-form only, NOT authoritative for this repo* —
     cite only its decision-map / determinism / transparency sections; its `create-video` /
     "say yes to Tailwind" setup steps are **wrong for this monorepo** (`render/` already exists,
     codegen-first). To avoid three-way drift, **link rather than copy** the long-form prose; keep
     only the niche table + per-lib determinism inline here, and add a one-line "sync note" in both
     files naming the other.

### The availability gate (Phase 1: documented as a single canonical table)
ONE canonical fenced table is the single source of truth for flags (Eng C2 / DX 5a — don't scatter
the same fact across a playbook flag, the gate lists, and the decision-map parentheticals):

| style | flag |
|---|---|
| `kinetic-typography` | available |
| `d3` | planned |
| `lottie` | planned |
| `gsap` | planned |
| `three` | exploration (not committed) |

In Phase 1 this is reference. The *execution* contract (record ideal; if `planned`, set effective to
`kinetic-typography` with a note; specify the `ideal == effective` branch too) lands in Phase 2.
Add a short **"Adding a style (maintenance)"** note: when a phase ships a style, flip the flag here
(one edit) **and** teach the three downstream skills the branch *before* flipping — otherwise the
Phase-2 gate must keep effective pinned to `kinetic-typography`.

### Skill frontmatter (draft now — DX 1b)
Draft the trigger-surface `description` to the sibling pattern so the user-invoke path triggers
reliably, e.g.: *"Reference skill: picks/justifies the composition style for a Fathom Short from its
fact shape, and is the per-style determinism + usage reference. Phase 1 = reference-only (no pipeline
write). Triggers on 'which style should this video use', 'pick a composition style', 'remotion
determinism rules'."* Pin `user-invocable: true`.

## Pipeline integration — DEFERRED to Phase 2 (/autoplan D1)

The light step **3.6**, the `03-style.md` write, and downstream branching are **not built in
Phase 1**. Rationale: no downstream skill consumes a style record in Phase 1 (they only understand
`kinetic-typography`), so the artifact would be dead overhead (Eng finding A1). The wiring lands
with D3, when there is a real branch to take:

```
Phase 2: 3.5 tts-voiceover → 3.6 (style selection, inlined into prompt-generator first) → 4. asset-sourcing → ...
```

When built (Phase 2):
- **I/O contract** — Reads `00-topic.md`, `01-verified-facts.md`, `02-script.md`; writes a decision
  record (use a name that does NOT collide with `03-assets.md` and is not picked up by an `03-*`
  glob — e.g. `03b-style.md` / `035-style.md`; Eng A2 / DX 5b). Ship it with a **fenced output
  template** + a machine-greppable `effective_style:` line on its own (DX 1a) so downstream does a
  deterministic single-line read, plus a `check-style.mjs` field/enum validator wired into the
  completeness gate (Eng T1 — every other artifact here has a gate; this one needs one too).
- **Tie-breakers:** (1) simplest style that fully serves (operationally defined); (2) prefer
  `available`; (3) escalate to 3D only when the fact is genuinely spatial. Ties record both
  candidates in `runner-up`; the availability gate is the final arbiter.

## CLAUDE.md change (re-scoped — /autoplan, CEO finding F10)

**Do NOT flip the niche-identity line yet.** Advertising "+ living motion graphics (data-viz / 3D)"
while all those styles are `planned`/exploration would mislead every future `/short` run into
thinking richer styles are real. The niche line flips when the *first new style ships and shows
lift* (Phase 2+). For Phase 1, the only CLAUDE.md change is a **terse pointer** (file is capped at
~200 lines): one line noting the `remotion-style-selector` reference skill exists and that a phased
styles program (D3 → Lottie → GSAP; Three = exploration) is planned — linking to this spec for the
ordering rationale rather than inlining it. Confirm whether the Stage-attribution table needs a
future "wrong style chosen" row (defer the actual row to Phase 2). Flagged explicitly; not silent.

## Out of scope (Phase 1 — reference-only)
- Any new npm dependency (`d3`, `@remotion/lottie`, `gsap`, `three`).
- Any new `lib/` primitive or `.tsx`.
- The pipeline step `3.6`, the `03-style.md` write, and the availability-gate *execution* (Phase 2).
- Teaching `asset-sourcing` / `prompt-generator` / `codegen` the new style branches (Phase 2).
- The niche-identity line rewrite in CLAUDE.md (Phase 2+, after a style ships and shows lift).
- Three.js as a committed phase (exploration bucket).

## Success criteria (re-scoped)
1. `remotion-style-selector/SKILL.md` exists, is `user-invocable: true`, has a drafted sibling-style
   `description`, and follows the project's single-purpose markdown-skill convention.
2. The **determinism section is complete and correct per library** (seeded `random`; `delayRender`
   for async loads; GSAP paused-timeline-seek; Three `@remotion/three` + frame-driven; Lottie
   `@remotion/lottie` + frame-driven; D3 no transitions) — this is the load-bearing deliverable.
3. The decision map is **priority-ordered with ≥2 worked golden examples**, plus the determinism
   rules, transparency recipe, Framer-Motion warning, the single canonical availability table, and a
   **Sources & precedence** section — all matching the verified guide.
4. CLAUDE.md gains only the terse reference-skill pointer + phased-program note (NOT the niche-line
   rewrite, NOT step 3.6).
5. Nothing in the existing render path changes behavior (no deps, no `.tsx`, no pipeline wiring, no
   renumbering, no per-video `03-style.md`).

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Trim Phase 1 to reference-only; defer selector machinery to Phase 2 | **User Challenge** | user-decided (D1→A) | Both models: building a selector before its targets exist is premature; Phase 1's own success was "no behavior change". User chose the synthesis: keep the cheap doc, drop the dead machinery | "Proceed as written"; "Build D3 first" |
| 2 | CEO | Demote Three.js from committed program to exploration bucket | **User Challenge** | user-decided (D2→A) | Highest determinism risk (headless WebGL GPU-variance) vs the frame-reproducible QA loop; free + reversible to demote | "Keep committed (last)" |
| 3 | CEO | Do NOT rewrite CLAUDE.md niche-identity line in Phase 1 | Mechanical | P5 explicit/honest | Advertising `planned` styles as channel identity misleads every `/short` run; flip when a style ships | Niche-line rewrite now |
| 4 | Eng | Strengthen determinism rules per-library (GSAP seek, Three `@remotion/three`, Lottie `@remotion/lottie`, D3 no-transitions, seeded `random`, `delayRender`) | Taste→adopted | P1 completeness | This is now the skill's load-bearing value; the generic rules missed the actual in-the-wild bugs | Generic rules only |
| 5 | Eng/DX | Single canonical availability table + Sources & precedence; link-don't-copy the guide | Taste→adopted | P4 DRY | Three overlapping docs (skill / guide / official) will drift; the guide's setup steps are wrong for this monorepo | Restate prose in each |
| 6 | DX | Decision map = priority-ordered list + worked examples; draft `description` frontmatter | Taste→adopted | P5 explicit | Overlapping fact categories → nondeterministic ideal-style pick; undrafted description → weak user-invoke trigger | Unordered map; defer description |
| 7 | Eng | (Phase 2) name the record to avoid `03-*` collision; ship fenced template + `check-style.mjs` gate | Deferred | P1 completeness | Resolves A1/A2/T1 when the artifact becomes load-bearing | Build now (dead artifact) |

## GSTACK REVIEW REPORT

**Pipeline:** /autoplan (CEO → [Design skipped: no UI scope] → Eng → DX). Dual voices: Claude
subagent (independent) + Codex `gpt-5.5` (read-only; reviewed from brief — sandbox blocked file read,
conclusions independently matched).

**Gates hit:** Premise gate + two User Challenges (D1 sequencing, D2 Three.js) — both surfaced, both
user-decided. No auto-decision overrode user direction.

**CEO consensus:** 0/6 dimensions confirmed the plan as written; both voices independently challenged
premise, sequencing, alternatives-not-explored, Three.js, and 6-month trajectory. → Re-scoped.

**Eng findings folded in:** D1 (per-lib determinism — adopted), C1/C2 (doc-drift / single-source —
adopted), A1/A2/T1 (dead artifact / naming / no verification — auto-resolved by the trim; carried as
Phase-2 requirements). E3 (fallback record) confirmed sound.

**DX findings folded in:** 1b (description), 2a (priority-ordered map + examples), 4a/4b (source
precedence; guide's stale monorepo setup) — adopted. 1a/3a/5a (output schema / `ideal==effective` /
flip-checklist) — partly auto-resolved by trim, carried to Phase 2; maintenance note added now.

**Confirmed sound (both phases):** Framer-Motion "not for rendered video" call is correct and matches
the guide; the transparency-render CLI (`yuva444p10le`) is verified accurate.

**Net:** Plan re-scoped from "build a no-op router + rewrite channel identity" to "ship a tight,
correct determinism + decision reference now; build D3 (and real selection) next." Ready to implement.
