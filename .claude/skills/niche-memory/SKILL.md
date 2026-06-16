---
name: niche-memory
description: Picks a fresh, non-repeating Facts topic for the Fathom Shorts channel and opens the run folder. Use as STEP 1 of the /short pipeline. Reads content/VIDEO_LOG.md, content/scripts/*, and content/topic-backlog-facts.md to dedupe against everything already scripted, selects (or validates a user-given) topic, allocates the next F-NNN id, and writes output/F-NNN-<slug>/00-topic.md.
version: 1.0.0
allowed-tools: Read, Write, Glob, Grep, Bash(ls:*), Bash(mkdir:*)
user-invocable: false
---

# niche-memory

Step 1 of the `/short` pipeline. Decide WHAT this video is about and open its run folder. Output: `output/F-NNN-<slug>/00-topic.md`.

## Procedure

1. **Read the dedupe sources** (all under `content/`):
   - `VIDEO_LOG.md` — the "Topics used (quick dedupe checklist)" list and the Facts table.
   - `topic-backlog-facts.md` — the researched candidate topics.
   - `scripts/*.md` — titles/premises of everything already written.
2. **Choose the topic:**
   - If the pipeline passed a topic, validate it isn't a near-duplicate of anything in the dedupe sources. If it clashes, say so and pick the closest fresh angle instead (note the change).
   - If no topic was given, propose 3 candidates from the backlog that do NOT repeat a used topic, ranked by curiosity gap + frame-1 legibility + visual-as-typography fit. Pick #1 unless it's weak.
3. **Allocate the id:** scan `VIDEO_LOG.md` for the highest `F-NNN`; the new id is the next integer, zero-padded to 3 (e.g. `F-002`). Slug = kebab-case of the core hook (e.g. `octopus-3-hearts`).
4. **Create the run folder:** `mkdir -p output/F-NNN-<slug>/`.
5. **Write `00-topic.md`** using the template below.

Do NOT write to `VIDEO_LOG.md` here — the `short-assembly` step (step 7) logs the row once the script exists. This step only reserves the id and records the choice.

## `00-topic.md` template

```markdown
# F-NNN — <topic title>

- **Slug:** <kebab-slug>
- **Niche:** Facts / Kinetic Typography
- **Core hook (working):** "<the surprising one-liner, ≤6 words feel>"
- **Why it's fresh:** <one line — confirms it's not in VIDEO_LOG dedupe list>
- **Why it stops the swipe:** <curiosity gap / bold claim>
- **Source for the topic:** <backlog entry / user-supplied / proposed>

## Candidates considered (if auto-picked)
1. <chosen> — picked because …
2. <alt> — …
3. <alt> — …

## Handoff to research (step 2)
- **Research question:** "<the precise factual question /deep-research should answer>"
- **Must verify:** <the 2–4 specific claims the script will hinge on>
```

## Boundaries
- Selection + folder setup only. No research, no script, no logging. Frame math and facts are later steps' jobs.
