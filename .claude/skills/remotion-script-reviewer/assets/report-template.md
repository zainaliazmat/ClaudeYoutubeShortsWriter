# Report Template — the scored review output

Emit the review in this exact structure (workflow step 5). It's built to serve two readers
at once: a human skims the scorecard and prose; an agent acts on the severity tags, frame
numbers, and suggested values. Keep suggested fixes to a **single concrete value** each, not
a menu — both humans and agents act on one default more reliably than a list.

Delete the parenthetical guidance when you fill it in.

---

# 🎬 Remotion Script Review — "[working title]"

**Verdict: [SCORE]/100 — [band: Remotion-ready / Strong / Workable / Not ready]**
[One sentence: the headline takeaway. If the blocker gate capped the score, say so here.]

## Scorecard

| Category | Score | Weight | Notes |
|---|---:|---:|---|
| Timing & Frame Accuracy | X | 20 | (quote the validator result) |
| Visual Specification Completeness | X | 18 | |
| Animation Feasibility & Specificity | X | 15 | |
| Text & Caption Clarity | X | 12 | |
| Audio Sync | X | 10 | |
| Loop Integrity | X | 10 | |
| Platform Compliance | X | 8 | |
| Creative Effectiveness / Retention | X | 7 | |
| **Total** | **X** | **100** | (note if capped by the blocker gate) |

## Frame budget (from validator)

```
(paste the relevant lines of validate_frame_budget.py output — the section table and
PASS/FAIL line. This is the receipts for category 1; never hand-compute it.)
```

## Scene-by-scene accuracy

| Scene | Frames declared | Frames computed | Status | Issues |
|---|---|---|---|---|
| Hook | 0–45 | 45f / 1.5s | ✓ / ✗ | (terse: what's missing/wrong) |
| Beat 1 | … | … | … | … |
| … | | | | |
| Loop-back | … | … | … | … |

## Prioritized fixes

Grouped by severity. Each: **what → why it matters → single concrete fix (with frames).**

### 🔴 Blockers (fix before generating)
- **[blocker] …** → … → Fix: …

### 🟠 Major
- **[major] Beat N — "…"** → … → Fix: `spring({...})` over ~Nf (frames A–B).

### 🟡 Minor
- **[minor] …** → …

### ⚪ Nits
- **[nit] …**

(If a severity group is empty, write "None.")

## Suggested parameter values (drop-in)

A consolidated list of the concrete values proposed above, so the writer can paste them
straight back into the script:

- **[Beat N] "logo slams in"** → `spring({frame, fps, config:{damping:10, stiffness:100}})`, scale 1.3→1.0, frames 135–148.
- **[Beat M] "bleeds to blue"** → `interpolateColors(frame, [startF, endF], ['#0a0a14', '#0b2a6b'])`.
- …

## Next step
[One line: e.g. "Address the 1 blocker and 3 majors, then this is render-ready." Or, if the
user asked, offer: "Want me to apply these fixes to the script?" — but only generate Remotion
code if explicitly asked.]
