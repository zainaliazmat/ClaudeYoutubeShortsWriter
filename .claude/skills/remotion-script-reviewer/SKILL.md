---
name: remotion-script-reviewer
description: Reviews and scores short-form vertical video scripts/briefs (kinetic typography, facts videos, YouTube Shorts/TikTok/Reels) for how accurately and completely they specify a Remotion video. Use whenever the user wants to review, critique, validate, score, sanity-check, QA, or "is this ready" a video script, creative brief, or storyboard before generating it with Remotion — including checking frame-budget math, animation feasibility, caption/audio sync, loop integrity, and platform safe zones. Triggers on "review my script", "check this brief", "is this Remotion-ready", "score my video script", "will this render", "did I get the frame math right", or right after a short script is written.
version: 1.0.0
allowed-tools: Read, Bash(python3 *)
user-invocable: true
---

# Remotion Script Reviewer

Review and score a short-form vertical video script for how faithfully and completely it
specifies a **Remotion** video (React → MP4) — then return a weighted scorecard, a
scene-by-scene breakdown, and severity-tagged fixes with concrete suggested values.

This is the QA counterpart to `youtube-shorts-writer`: that skill *writes* the script in a
frame-timed template; this skill *audits* it before anyone spends render time. You judge the
**specification**, not a rendered video — you can't promise the final pixels look right, only
that the script is complete, internally consistent, frame-accurate, and feasible in Remotion.

## Why frame math is the backbone

At 30fps a "28s = 840 frames" claim and every sub-range must tile exactly — no gaps, no
overlaps — and frames are 0-indexed (a section "frames A–B" spans `B−A` frames and the next
section starts at **B**, not B+1). Get this wrong and the render breaks or beats desync. LLMs
are unreliable at summing many ranges in their head, so a bundled deterministic script does
the counting. **You never compute frame budgets by hand.**

## Workflow (follow in order — don't skip the validator)

### 1. Parse the brief into structured sections
Read the script (`02-script.md`). **Also read the composition spec (`05-remotion-prompt.md`) and
asset spec (`03-assets.md`) when they exist** — the per-beat font sizes, hex, y-positions, z-order
and timeline geometry that Category 9 grades live there, not in the script. Identify:
Overview/metadata, Hook, Beats[], Loop-Back, Captions, Audio, and any channel/platform notes. If
the script is prose rather than a structured template, infer these sections and note that the
structure was loose (it's harder to implement). If `05` is not yet generated, score categories 1–8
on the script and mark Category 9 as pending the composition spec.

### 2. Run the frame-budget validator — never do this math by hand
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validate_frame_budget.py <path-to-script> 2>&1
```
(If the script is pasted inline rather than a file, write it to a temp file first, then run
the validator on it.) **VO-driven runs:** when a `vo-timing.json` sits beside the script (the
channel default), the validator reads `total` (= durationInFrames) from it and tiles the
frame-map **table** the tts-voiceover step patched between the `<!-- FRAME-MAP -->` markers.
With no VO it falls back to the declared total + `frames A–B` heading ranges (the no-VO path).
Either way it reports gaps/overlaps/total-mismatch with specific, quotable errors. **Quote its
output** in the report — that's the evidence for the Timing category. (Run it on the script IN
the run folder so it can find `vo-timing.json`; a temp-file copy loses that sibling.) Any
BLOCKING ERROR is a `blocker` and caps the score (see the rubric).

**Note on exit codes:** the validator exits non-zero (1) when it finds blocking errors. That
is the *intended* signal that the budget failed — it is **not** a tool failure. The full
report is on stdout; read it and proceed to score. Don't re-run or treat exit 1 as broken.

### 3. Score the 9 categories
Load `references/scoring-rubric.md`. Score each weighted category, apply the blocker gate
(≥1 blocker → final score capped at 60), and keep the breakdown auditable. Use
`references/spec-checklist.md` for the per-scene fields a complete spec must contain.
**Category 9 (Visual Design Quality & Frame Utilization) is graded against `05`/`03`** — flag
dead space (>40% of safe-area height empty in a beat), timid hero scale, invisible
hairline/near-black decorative layers, an unreadable core mechanic, and scale-dishonest data viz.
Per the rubric, **do not award a 90+ verdict if Category 9 is below ~70% of its weight**.

### 4. Map creative prose to Remotion APIs, scene by scene
Load `references/remotion-knowledge.md`. For each scene, translate vague motion language into
the concrete API + parameters an implementer would write (`useCurrentFrame`, `interpolate`,
`spring`, `Sequence`/`Series`/`TransitionSeries`, `@remotion/captions`, `@remotion/media`),
and flag anything ambiguous, frame-budget-inaccurate, or infeasible. Watch especially for:
- vague motion ("slams in", "pulses") with no frames/easing → propose a single concrete config
- animations that can't finish in their beat's frame budget (e.g. a 5-frame stagger × 8 nodes
  needs ≥40 frames) → blocker if it can't fit
- the **TransitionSeries trap**: crossfades *shorten* total duration, so a naive sum of beat
  lengths overstates the real total
- forbidden non-deterministic motion (CSS transitions, Tailwind `animate-*`, `useState` time)
- SFX with no frame number; captions with no generation method; per-character-opacity typewriters
- loop-back end state not explicitly matched to frame 0
- text/CTAs in a platform UI band (load `references/platform-safe-zones.md`)

### 5. Emit the report
Use `assets/report-template.md` exactly: verdict + scorecard → validator output → scene table
→ prioritized fixes by severity → consolidated drop-in parameter values. Give **one concrete
default per fix** (not a menu) — humans and agents both act on a single value more reliably.

### 6. Boundary — review only
Do **not** generate or rewrite Remotion code, and do not rewrite the script, unless the user
explicitly asks. After the report, you may *offer* to apply the fixes; wait for a yes.

## Thresholds that change the recommendation
- **fps ≠ 30:** every frame-count expectation scales. At 60fps, double them. The validator
  reads the declared fps; make sure the script states it.
- **Ads vs. organic:** ad placements tighten the bottom safe zone (~370–440px) — re-flag CTAs.
- **>8 text beats in <30s:** flag over-animation / retention risk (consensus is ~5–8 beats).
- **Version drift:** Remotion APIs differ by version (`@remotion/media` `<Audio>` uses
  `trimBefore`/`trimAfter`; `createTikTokStyleCaptions` needs v4.0.216+). Match suggestions to
  the user's installed version when known; otherwise prefer the modern names and say so.

## What's bundled
- `scripts/validate_frame_budget.py` — deterministic frame-math/tiling/loop validator (step 2)
- `references/scoring-rubric.md` — 9 categories (incl. Visual Design Quality), weights, severity defs, the blocker gate
- `references/spec-checklist.md` — per-scene required fields + common ambiguities
- `references/remotion-knowledge.md` — API configs, gotchas, the prose→config translation table
- `references/platform-safe-zones.md` — 1080×1920 margins per platform
- `assets/report-template.md` — the scored report-card output format
