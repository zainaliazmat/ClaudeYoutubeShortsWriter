# Scoring Rubric — 9 weighted categories + severity + the formula

Load this in workflow step 3. Score the script across the 9 categories, then apply the
blocker gate. The goal is a number that's *reproducible* across human and agent reviewers —
so score against the explicit criteria below, not vibes.

**What this rubric reviews:** `02-script.md` AND `05-remotion-prompt.md` together. Categories 1–8
mostly live in the script; **Category 9 (Visual Design Quality) is graded against the composition
spec (`05`)** — per-beat font sizes, hex, y-positions, z-order and timeline geometry live there,
not in the script. A video can be spec-complete and frame-perfect and still look flat; Category 9
is the guard against that. If `05` isn't available yet, score 1–8 on the script and note that 9 is
pending the composition spec.

## Severity definitions

Borrowed from code-review conventions. Tag every issue you raise with one:

- **blocker** — prevents a faithful or renderable implementation. Examples: frame budget
  doesn't sum (gap/overlap/total mismatch), an animation that can't finish in its beat,
  missing total runtime, fps undeclared, an effect that's technically impossible in Remotion,
  or **non-deterministic motion** (CSS transitions/animations, Tailwind `animate-*`,
  `useState`-driven time). The last one is a blocker even though the effect is "possible" —
  it renders differently than the preview, so the output is unreliable. Don't waffle between
  major and blocker on these: they're blockers.
- **major** — degrades fidelity or clarity but is still implementable. Examples: missing
  easing/spring spec, undefined colors, ambiguous motion ("it moves"), no caption method,
  SFX with no frame number, text in the platform danger zone.
- **minor** — style/consistency issues. Inconsistent naming, a beat slightly off the ~3s
  pacing, redundant direction.
- **nit** — optional polish. Phrasing, ordering, nice-to-have specificity.

## The 9 categories and what earns points

Score each category as a fraction of its weight (0 → full). Judge the *specification* —
how completely and correctly the script tells a Remotion implementer what to build.

| # | Category | Weight | Full marks means… |
|---|---|---:|---|
| 1 | **Timing & Frame Accuracy** | 18 | **Hard gate — validator-driven.** Total declared in s AND frames; F == round(N·fps); every section has a frame range; ranges tile [0, total] with no gaps/overlaps; loop-back ends at total. **Scoring with blocking errors:** start at 30% of weight (~5/18) and deduct ~2 more per additional blocking error, floor 0 — so 1 error ≈ 5, 2 errors ≈ 3, 3+ ≈ 0–2. This keeps the number reproducible instead of arbitrary. |
| 2 | **Visual Specification Completeness** | 13 | Every beat specifies: exact on-screen text, color intent (hex or clear), layout/position, what's on screen simultaneously, z-order/layering where things overlap. Missing colors or layout = major deductions. |
| 3 | **Animation Feasibility & Specificity** | 13 | Each motion maps to a concrete Remotion API (spring/interpolate/Sequence) with a frame count, and is feasible in its beat's budget. Vague verbs ("slams in" with no frames) lose points; impossible animations are blockers. |
| 4 | **Text & Caption Clarity** | 11 | Caption style + generation method named (word-by-word + Whisper, or hand-timed to beats); text is legible (short fragments, high contrast); typewriter effects use slicing not per-char opacity. |
| 5 | **Audio Sync** | 9 | Track vibe specified; **the mix note treats the music bed as the LEAD (no VO to duck under) and names the -14 LUFS / ≤ -1 dBTP master target**; every SFX has a frame number matching a visual event. A bed mixed "under captions"/ducked, or a missing master target, loses points — it ships near-silent in-feed (YouTube won't boost it). If the script has no audio at all, score on intent — don't penalize a deliberate silent piece, but note it. |
| 6 | **Loop Integrity** | 8 | Final-frame state explicitly matches frame-0 state (bg color, persistent text/position, transforms); nothing mid-animation at the wrap. Vague "it loops" without the match described = major. |
| 7 | **Platform Compliance** | 7 | Canvas 1080×1920; critical text/CTAs inside the safe zone; captions clear the bottom UI band. See `platform-safe-zones.md`. |
| 8 | **Creative Effectiveness / Retention** | 7 | Hook is legible in <0.5s and promises a payoff; beat density is sane (~5–8 beats / 20–30s); **each beat is ~2–4s — flag any beat >5s as a retention sag** unless the dwell is justified; each beat advances info or escalates curiosity. |
| 9 | **Visual Design Quality & Frame Utilization** | 14 | Judges whether the spec describes a video that looks *designed*, not just *correct* — graded against `05-remotion-prompt.md` (and `03-assets.md`). Full marks means ALL of: • **Frame utilization** — content uses the full safe area (y≈260–1660); no beat leaves a large contiguous dead zone (>40% of safe-area height empty) without a stated reason. **Flag dead space as a MAJOR.** • **Hero scale & hierarchy** — the beat's hero element (number/word) dominates: ≥ ~280px for a primary number, with a clear size step to supporting text. Timid, uniform sizing loses points. • **Decorative-layer visibility** — backgrounds, timelines, glyphs, brackets are actually visible at viewing size, not 1–2px "barely perceptible" dots/hairlines lost on near-black. An element described as invisible/subtle to the point of pointlessness is a deduction. • **Core-mechanic legibility** — for comparison/data-viz shorts the central visual idea (e.g. two bar lengths) must be the most prominent thing on screen during its beat, not buried under a number. If the "aha" visual doesn't read, that's a MAJOR. • **Scale-honest data viz** — bars/brackets/positions are proportional to the values, OR the distortion is explicitly labeled. A comparison drawn out of proportion that contradicts the stated payoff is a **MAJOR** (it misleads the viewer). • **Color energy** — accent/reveal colors have enough chroma and contrast to read as intentional design, not a muted wash; a flat single-hex near-black background with no depth (gradient/glow/texture) is a deduction. |

Total weight = 100.

**Category 9 is the anti-flat guard.** A script can hit 90+ on completeness and frame math and
still be a weak, empty-looking video. **Do not award a 90+ verdict if Category 9 scores below ~70%
of its weight (≈10/14).** Treat a beat with >40% dead space, an invisible core mechanic, or a
scale-dishonest comparison as a **major** in this category.

## The formula (and the blocker gate)

1. Score each category `cᵢ` as a value from 0 to its weight `wᵢ`. Sum → `raw = Σ cᵢ`
   (0–100).
2. **Blocker gate (non-linear — one critical flaw dominates, like security scoring):**
   - **≥1 blocker present → report `min(raw, 60)`.** A script that's beautiful everywhere
     but whose frames don't sum will produce a broken render, so it cannot score "good".
   - If `raw` is already below 60 (lots of issues), the cap is moot — report `raw` — but you
     **must still state that blockers are present** and that they, not the cap, set the band.
     Don't write "capped at 60" on a 39; write "blockers present; raw score is already below
     the cap."
3. If no blockers, `final = raw`.
4. Round to the nearest integer. Show the per-category breakdown so the number is auditable.

Banding (for the one-line verdict):
- **90–100** Remotion-ready — hand it to an implementer as-is. **Requires Category 9 ≥ ~70% of its
  weight (≈10/14)** — a spec-complete but flat/empty video cannot earn this band.
- **75–89** Strong — a few majors to tighten first.
- **60–74** Workable but needs revision before generating.
- **< 60** Not ready / blocked — fix blockers first (or capped by the gate).

A script can hit 90+ on completeness and frame math and still be a weak video. Category 9 is the
guard against that — do not award a 90+ verdict if Category 9 is below ~70% of its weight.

## Scoring discipline

- **Run the validator before scoring category 1.** Never assert the frames sum from
  eyeballing — quote the validator's output.
- Be specific, not punitive. Every deduction should correspond to a concrete issue in the
  fix list with a frame number or a named field. If you can't point to the issue, don't
  deduct for it.
- Reward a deliberate, well-justified deviation. A silent piece with no audio, or a 40s
  short the creator is A/B-testing, isn't automatically wrong — judge against the script's
  stated intent, and note assumptions you made.
