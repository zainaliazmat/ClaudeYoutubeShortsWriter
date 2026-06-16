---
name: short-assembly
description: Finalizes and packages a /short run into a deliverable folder, then records side-effects. Use as STEP 7 (final step) of the /short pipeline. Writes the run folder's README.md manifest (with render checklist + YouTube AI-disclosure note), adds the row to content/VIDEO_LOG.md, archives the script into content/scripts/, appends dated learnings to memory/lessons.md, and runs the completeness gate before declaring the run done.
version: 1.0.0
allowed-tools: Read, Write, Edit, Glob, Bash(ls:*), Bash(cp:*)
user-invocable: false
---

# short-assembly

Step 7 (final) of the `/short` pipeline. The run folder `output/F-NNN-<slug>/` already holds `00-topic.md`..`06-scorecard.md`. Your job: write the manifest, record side-effects, and gate.

## 1. Write `README.md` (the folder manifest)
```markdown
# F-NNN — <Title>  (deliverable package)
> Input package for the Fathom Remotion project. Not render-ready code — hand 05-remotion-prompt.md to the Remotion skills.

- **Hook:** "<…>" · **Runtime:** <s>s (<frames>f @30fps · 1080×1920) · **Reviewer score:** <NN>/100
- **Status:** scripted (not yet rendered)

## Files
| File | What it is |
|------|-----------|
| 00-topic.md | chosen topic + non-repeat rationale |
| 01-verified-facts.md | claims table: quote + URL + confidence |
| 02-script.md | frame-timed, reviewer-passed script |
| 03-assets.md | fonts, palette, motion signature, icons/bg |
| 04-audio.md | music + SFX: URL, license, attribution, mix, timing |
| 05-remotion-prompt.md | composition spec for Remotion skills |
| 06-scorecard.md | reviewer score + fixes applied |

## Render checklist
1. Scaffold/open the Remotion project (`npx create-video@latest`; `npx skills add remotion-dev/skills`).
2. Download the audio in 04-audio.md from its ORIGINAL source into `public/`; keep license receipts.
3. Hand 05-remotion-prompt.md to the Remotion skills to build the composition.
4. Render: `npx remotion render <entry> F-NNN-<slug> out.mp4`.
5. Upload: title/description from the script's metadata section.

## YouTube AI disclosure
AI was used only for script/research production — **exempt** from YouTube's altered/synthetic-content disclosure. Toggle "Altered or synthetic content" ONLY if synthetic media (AI faces/voices/realistic scenes) is later added.
```

## 2. Record side-effects
- **VIDEO_LOG.md:** add a row to the Facts table (`| F-NNN | Topic | "Hook" | <s>s | scripted | [output/F-NNN-<slug>/02-script.md](...) | — | — | — | <note> |`) AND append the topic to the "Topics used (quick dedupe checklist)" list.
- **Archive:** copy `02-script.md` to `content/scripts/F-NNN-<slug>.md` (the channel's canonical script home).
- **memory/lessons.md:** append a dated, specific, actionable entry — what worked / what to change next run (e.g. "F-002: reviewer flagged beat-3 spring too slow; default spring damping raised. 2026-06-16"). Keep entries one line, concrete.

## 3. Completeness gate (must pass before "done")
Verify and report each as ✅/❌:
1. Every claim in `02-script.md` is sourced in `01-verified-facts.md`.
2. `04-audio.md` is monetization-safe with license recorded (no CC-BY-NC).
3. Captions are timed to beats in `05-remotion-prompt.md`.
4. Frame math passed the remotion-script-reviewer validator (see `06-scorecard.md`).
5. AI-disclosure note present in `README.md`.

If any is ❌, do NOT declare done — return to the responsible step. When all ✅, print the deliverable folder path + a one-line summary per file.

## Boundaries
- Packaging + bookkeeping only. Don't rewrite the script or re-source assets here (that's earlier steps). Don't render.
