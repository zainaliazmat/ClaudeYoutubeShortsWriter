# Building a "God-Level" Remotion Script Reviewer as a Claude Code Skill

## TL;DR
- **A reviewer skill is fully feasible and should be built as a standard Agent Skill:** a `remotion-script-reviewer/` directory with `SKILL.md` (frontmatter + workflow), a `references/` folder (Remotion knowledge + scoring rubric + spec checklist + safe zones), a `scripts/` folder (a dependency-free Node/Python frame-budget validator), and an output template. The single biggest success factors are a precise, "pushy" `description` field and a **deterministic validator script** so frame-math checks never rely on the model doing arithmetic in its head.
- **The core review logic maps creative prose to concrete Remotion APIs** (`useCurrentFrame`, `interpolate`, `spring`, `Sequence`/`Series`/`TransitionSeries`, `@remotion/captions`, `@remotion/layout-utils`) and flags exactly where a script is ambiguous, frame-budget-inaccurate, or technically infeasible — returning a weighted 0–100 scorecard, a scene-by-scene breakdown, and severity-tagged fixes (blocker/major/minor/nit) with concrete suggested parameter values.
- **Score along 8 weighted categories** (Timing/Frame Accuracy, Visual Spec Completeness, Animation Feasibility, Text/Caption Clarity, Audio Sync, Loop Integrity, Platform Compliance, Creative/Retention) with frame-budget math as a hard gate — because at 30fps a "28s = 840 frames" claim and every sub-range must tile exactly with no gaps/overlaps, and frames are 0-indexed (last frame = durationInFrames − 1).

## Key Findings

### 1. The skill format is simple and well-specified
A skill is a directory with a `SKILL.md` file containing YAML frontmatter (only `name` and `description` are required) and a Markdown body. Per Anthropic's Agent Skills docs (platform.claude.com, "Skill authoring best practices"), at startup "the name and description from all Skills' YAML frontmatter are loaded into the system prompt" — roughly 100 tokens per skill; the full body loads only when triggered, and reference files and scripts load only on demand ("progressive disclosure"). Keep the SKILL.md body under ~500 lines / **under 5,000 tokens** (the level loaded when the skill is triggered); split overflow into `references/`. The `name` must match the parent folder name exactly (lowercase, hyphens). Scripts execute via Bash without their code entering context — only their output consumes tokens, which is ideal for a deterministic frame-budget validator. Restrict permissions with `allowed-tools` (e.g. `Bash(python3 *)`, `Read`). Reference bundled scripts via `${CLAUDE_SKILL_DIR}` so paths resolve at personal/project/plugin scope.

### 2. Remotion's frame model gives the reviewer hard, checkable math
- Everything is frame-based: `useCurrentFrame()` returns the current frame; `useVideoConfig()` returns `fps`, `width`, `height`, `durationInFrames`. Time = `frame / fps`. At 30fps, frame 30 = 1 second; a 28-second video = 840 frames.
- Frames are 0-indexed: first frame is 0, last frame is `durationInFrames − 1` (confirmed in Remotion's "fundamentals" docs). A reviewer must flag inclusive/exclusive range errors — e.g. "frames 0–45" for a 1.5s hook at 30fps spans 46 inclusive frame indices but represents a 45-frame *duration*; the next beat should start at frame 45, not 46, to tile cleanly.
- This is the most objective check available: hook + all beats + loop-back must sum exactly to total `durationInFrames`, with no gaps or overlaps. This is what the bundled validator script should enforce.

### 3. The creative-to-implementable gap is where most value is added
Plain-language descriptions routinely under-specify what a Remotion implementer (human or agent) actually needs. For each scene the implementer needs: exact text content; font family/size/weight intent; color values (hex) or clear intent; entrance/exit animation type; start frame + duration in frames; easing feel; positioning/layout; z-order/layering; what is on screen simultaneously; and the transition into/out of the scene. Typical ambiguities a great reviewer must surface and propose fixes for:
- "slams in" → over how many frames? what easing or spring config?
- "heartbeat pulse" → what BPM / cycle length, what scale range (e.g. 1.0→1.08→1.0)?
- "quick scale-overshoot" → which spring config, over how many frames?
- "bleeds from dark to deep blue" → exact start/end hex, over what frame range, with `interpolateColors`?
- "8 nodes light up one per arm in sequence" → stagger interval in frames, per-node animation length.

### 4. Concrete Remotion API knowledge the reviewer needs (with exact values)

**interpolate()** — `interpolate(frame, inputRange, outputRange, options)`. Input and output arrays must have equal length. Default extrapolation is `extend` (values keep growing past the range — a classic bug); set `extrapolateLeft: 'clamp'` and `extrapolateRight: 'clamp'` to hold values. Supports an `easing` option. Use `interpolateColors()` for color transitions.

**Easing** — `Easing.bezier(x1,y1,x2,y2)` matches CSS `cubic-bezier`; also `Easing.in/out/inOut`, `Easing.linear` (the default), `Easing.quad`, `Easing.cubic`, `Easing.sin`, `Easing.circle`, `Easing.exp`, `Easing.elastic`. The official Remotion skill recommends `interpolate` + `Easing.bezier` as the default approach and provides copy-paste curves:
- Crisp UI entrance (strong ease-out, no overshoot), ~45 frames: `Easing.bezier(0.16, 1, 0.3, 1)`
- Editorial / slow fade (balanced ease-in-out), ~90 frames: `Easing.bezier(0.45, 0, 0.55, 1)`
- Playful overshoot (use sparingly for emphasis), ~30 frames: `Easing.bezier(0.34, 1.56, 0.64, 1)`
- Slide-in: `Easing.bezier(0.22, 1, 0.36, 1)`
- Rule of thumb: `Easing.out` for entrances (arrive with momentum), `Easing.in` for exits (leave with gravity).

**spring()** — `spring({frame, fps, config, from, to, durationInFrames, delay, reverse})`. The Remotion docs confirm the default config is **`mass: 1, damping: 10, stiffness: 100`**, which produces a little overshoot/bounce — ideal for "scale-overshoot" and "pop" effects. To disable the default bounce, the docs' canonical value is **`damping: 100`** (raise damping for less bounce). `overshootClamping: true` prevents shooting past `to`. `durationInFrames` stretches the curve to an exact length; order of operations is stretch → reverse → delay. (Note: the `{damping: 200}` value seen in examples is specifically from `@remotion/transitions` `springTiming`, not the base `spring()` doc.) A reviewer should translate "heartbeat pulse" / "slams in" / "scale-overshoot" into a concrete spring config + frame count.

**Sequence / Series / TransitionSeries** — `<Sequence from={f} durationInFrames={d}>` time-shifts children; inside, `useCurrentFrame()` is *relative* (returns 0 at the sequence's start). Default layout is `absolute-fill` (children overlay); pass `layout="none"` to opt out. `<Series>` plays `<Series.Sequence durationInFrames={d}>` blocks back-to-back; only the last may be `Infinity`; `offset` adds gaps (positive) or overlaps (negative). `premountFor` mounts a sequence invisibly ahead of time (carries `opacity:0`, `pointer-events:none`) to preload assets. `<TransitionSeries>` adds `.Transition` (which **shortens** total duration because both scenes render during the crossfade) and `.Overlay` (which does **not** shorten it). The reviewer must account for transition overlap in the budget: A(40) + B(60) with a 30-frame transition = **70** total, not 100.

**Captions (`@remotion/captions`)** — `Caption` type: `{text, startMs, endMs, timestampMs, confidence}`; `text` is whitespace-sensitive (include a leading space per word). `createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds})` returns `{pages}` of `TikTokPage` objects, each with a `tokens[]` array carrying `fromMs`/`toMs` for word-by-word highlighting. Lower `combineTokensWithinMilliseconds` (~200–500ms) → word-by-word; higher (~1200–2000ms) → multiple words per page. Render with `white-space: pre` to preserve spaces. Captions are generated via Whisper (`@remotion/install-whisper-cpp`, `@remotion/openai-whisper`, or in-browser `@remotion/whisper-web`) then formatted.

**Audio (`@remotion/media` `<Audio>`)** — `trimBefore` / `trimAfter` in frames; `volume` (a number or a per-frame callback `f => ...` where `f` starts at 0 when the audio begins, not the composition frame); `muted`; `playbackRate` (reverse not supported; pitch shifting only applies at render, not in preview/Player). Delay audio by wrapping in `<Sequence from={n}>`. For SFX synced to visual beats, place each SFX `<Audio>` in a Sequence whose `from` equals the beat's start frame. `useAudioData()` / `visualizeAudio()` (from `@remotion/media-utils`) drive visualizations; `@remotion/sfx` provides ready-made effects. Reviewer check: every "SFX on beat" note needs a frame number that matches the corresponding visual event's frame.

**Text / fonts** — Load fonts with `@remotion/google-fonts` (`loadFont` exposes `waitUntilDone()`); call `measureText()`/`fitText()`/`fitTextOnNLines()` (from `@remotion/layout-utils`) only after the font is loaded, and match all font properties (family, size, weight, letterSpacing) between measurement and render. Use `outline` not `border` (border shrinks the box via `box-sizing: border-box`). Official typewriter rule: **"Always use string slicing for typewriter effects. Never use per-character opacity"** (invisible characters still occupy space and break cursor position). The official typewriter reference uses ~2 frames per character (~15 chars/sec at 30fps), a 16-frame cursor-blink cycle, and a 1-second pause after the first sentence.

**Rendering gotchas the reviewer should flag in scripts** — (1) CSS transitions/animations and Tailwind animation classes are **forbidden** (they don't render deterministically); all motion must derive from `useCurrentFrame()`. (2) No `useState`-driven time (Remotion re-renders every frame → infinite loops); use frame math. (3) `delayRender()`/`continueRender()` (prefer the `useDelayRender()` hook) wrap async asset loading — the render fails if `continueRender()` isn't called within the default timeout (error fires at **28000ms**). (4) fps mismatches between composition and assets cause desync; design in seconds × fps. (5) Frame budgets must be realistic for animation complexity — e.g. "8 nodes light up one per arm in sequence" at a 5-frame stagger needs ≥40 frames just for the stagger to resolve.

### 5. fps and frame-budget validation
If a script declares 30fps but specifies frame ranges implying 60fps (or vice versa), flag it. The validator should: parse the stated total (`Ns = F frames @ fps`), verify `F == round(N*fps)`, parse each section's frame range, confirm contiguous tiling (`next.start == prev.end`), confirm the union equals `[0, F]`, and confirm the loop-back segment ends exactly at `F`. Animations should be authored in seconds × fps so switching fps preserves timing.

### 6. Loop integrity for seamless loops
A seamless loop requires the final rendered frame to visually match frame 0 — same on-screen elements, positions, colors, opacity, and scale — so the cut is undetectable. The reviewer must check that the loop-back section's end state equals the hook's frame-0 state (background color, any persistent text, element transforms) and that no animation is mid-transition at the wrap point. `<Loop>` repeats content of a fixed `durationInFrames`; for a one-shot composition the author must hand-match start and end.

### 7. Platform safe zones (1080×1920 vertical)
Design canvas is 1080×1920 (9:16). Platform UI overlays obscure the edges; keep critical text/CTAs inside a conservative central safe zone. Per Ignite Social Media (values current as of July 2025): for **TikTok**, leave **108px top, 320px bottom, 60px left, 120px right**; for **Instagram/Facebook Reels** (boosted content) the safe zone is **1010×1280, set 220px from top and 420px from bottom**. **YouTube Shorts** is commonly cited at ~180px top, ~350px bottom, ~120px right (action column), ~40px left, giving a usable ≈920×1390 area with the visual center shifted ~40px left. Note that named sources diverge widely (e.g. TikTok in-feed ads are cited at 150px top / 440px bottom), reinforcing that these are conservative, community-reported figures. **The safe common area across all three platforms is ~900×1400 centered** (roughly x:90–990, y:260–1660). The reviewer should flag any on-screen text placed near edges and confirm caption placement clears the bottom UI band.

### 8. Scoring methodology
Adapt code-review severity conventions: **blocker** (prevents a faithful/renderable implementation — frame budget doesn't sum, infeasible animation, missing total runtime), **major** (affects fidelity/clarity — missing easing, undefined colors, ambiguous motion), **minor** (style/consistency), **nit** (optional polish). Use a weighted 0–100 scorecard for reproducibility across human and agent use, with non-linear weighting so a single blocker caps the score (analogous to security scoring where one critical flaw dominates the rating). Recommended category weights:

| Category | Weight | Notes |
|---|---|---|
| Timing & Frame Accuracy | 20 | Hard gate (validator-driven) |
| Visual Specification Completeness | 18 | Text, color, layout, z-order |
| Animation Feasibility & Specificity | 15 | Maps to spring/interpolate configs |
| Text & Caption Clarity | 12 | Caption method, timing, readability |
| Audio Sync | 10 | SFX/music frame alignment |
| Loop Integrity | 10 | Frame-0 == final-frame match |
| Platform Compliance | 8 | Safe zones, 1080×1920 |
| Creative Effectiveness / Retention | 7 | Hook strength, beat density |

Output should include: a scored report card; a scene-by-scene accuracy table (each beat: frames declared, frames computed, status, issues); a prioritized fix list grouped by severity; and concrete suggested parameter values that fill each gap (e.g. specify scale-overshoot as `spring({frame, fps, config:{damping:10, stiffness:100}})` over ~12–15 frames; specify "bleeds dark→deep blue" as `interpolateColors(frame,[startF,endF],['#0a0a14','#0b2a6b'])`).

### 9. Triggering description
The `description` is the primary trigger mechanism and should be deliberately "pushy." Recommended:
> `description: Reviews and scores short-form vertical video scripts/briefs (kinetic typography, facts videos, YouTube Shorts/TikTok) for how accurately and completely they specify a Remotion video. Use whenever the user wants to review, critique, validate, score, or sanity-check a video script, creative brief, or storyboard before generating it with Remotion — including checking frame-budget math, animation feasibility, caption/audio sync, loop integrity, and safe zones. Triggers on "review my script", "check this brief", "is this Remotion-ready", "score my video script".`

## Details

### Recommended skill directory structure
```
remotion-script-reviewer/
├── SKILL.md                     # frontmatter + the review workflow (numbered steps)
├── references/
│   ├── remotion-knowledge.md    # APIs, exact configs, gotchas (research areas 1 & 4)
│   ├── scoring-rubric.md        # 8 categories, weights, severity defs, scoring formula
│   ├── spec-checklist.md        # per-scene required fields + common ambiguities
│   └── platform-safe-zones.md   # 1080x1920 margins per platform
├── scripts/
│   └── validate_frame_budget.py # deterministic frame-math + tiling + loop checks
└── assets/
    └── report-template.md       # the scored report-card output format
```

### SKILL.md workflow (numbered — agents follow sequences more reliably than prose)
1. Parse the brief into structured sections (Overview, Hook, Beats[], Loop-Back, Captions, Audio, Metadata, Channel notes).
2. Run `python3 ${CLAUDE_SKILL_DIR}/scripts/validate_frame_budget.py <file>` to get deterministic frame-math results; **never compute frame sums by hand.**
3. Load `references/scoring-rubric.md` and `references/spec-checklist.md`; score each of the 8 categories.
4. For each scene, map creative phrases to Remotion APIs (per `references/remotion-knowledge.md`) and flag ambiguities/infeasibilities with severity tags.
5. Emit the report using `assets/report-template.md`: scorecard → scene table → prioritized fixes → concrete suggested parameter values.
6. Boundary: review only — do **not** generate Remotion code unless explicitly asked.

### The validator script (deterministic, verbose)
It should parse `"Ns = F frames @ fps"`, every `"(frames a–b)"` range, and the loop-back; then assert: `F == round(N*fps)`; ranges are contiguous and non-overlapping; union == `[0,F]`; loop ends at `F`; and emit specific, machine-readable errors (e.g. `GAP between Beat 2 (ends 240) and Beat 3 (starts 250): 10 frames`). Verbose, specific error strings let the agent quote and fix issues precisely. Keep it dependency-free Python (or Node) so it runs anywhere, gated with `allowed-tools: Bash(python3 *)`.

### Dual human + agent use
Make the output readable for humans (scorecard, prose fixes) but structured for agents (severity tags, explicit frame numbers, suggested code snippets). Provide an "escape hatch" default for every recommendation (a single concrete value) rather than enumerating options — both humans and agents follow a single default more reliably than a menu. Keep instructions imperative and bounded ("do X", "never do Y").

## Recommendations
1. **Build minimal, then iterate against real briefs.** Start with `SKILL.md` + the validator + `scoring-rubric.md`. Run it on 5–10 representative scripts; watch where the agent mis-scores or ignores a reference file, then tighten the prose/structure. This evaluation-first loop is Anthropic's recommended authoring method (build evals before extensive docs; measure baseline; refine).
2. **Make frame-budget math a hard gate.** If the validator finds a gap/overlap/mismatch, cap the overall score (e.g. ≤60/100) and tag it blocker — this is the most objective, highest-value check and prevents downstream render failures.
3. **Bundle the Remotion knowledge as a reference file, not inline in SKILL.md.** It's large and only needed during step 4; loading it on demand keeps discovery cheap and the body under the ~5,000-token guideline.
4. **Tune the description with a ~20-query eval** (a mix of should-trigger / should-not-trigger prompts) to maximize triggering accuracy, per Anthropic's skill-creator methodology.
5. **Pin a Remotion version note** in the knowledge file — APIs differ by version (e.g. `@remotion/media` `<Audio>` uses `trimBefore`/`trimAfter`; older `<Audio>`/`<Html5Audio>` used `startFrom`/`endAt`; `createTikTokStyleCaptions` requires v4.0.216+). Suggestions should match the user's installed version.
6. **Thresholds that change the recommendation:** if a script targets ads (not organic), tighten the bottom safe zone (TikTok ads ~370–440px) and re-flag CTAs; if fps is 60, double every frame-count expectation; if the brief has >8 text beats in <30s, flag over-animation / retention risk (creator consensus is ~5–8 "text beats" for a 20–30s video).

## Caveats
- Safe-zone pixel values are community-reported and platforms change UI 3–5×/year; treat them as conservative guidance dated to mid-2026, not exact platform specs. Named sources diverge (e.g. TikTok bottom margin is cited anywhere from 320px to 484px), so the skill should present a *range* plus the conservative ~900×1400 common area.
- Retention / kinetic-typography heuristics ("5–8 text beats", "front-load the benefit in the first 1–3 seconds") come from creator/marketing blogs, not platform documentation — useful, evidence-informed heuristics, not hard rules.
- Spring guidance: Remotion's documented default (`mass:1, damping:10, stiffness:100`) and no-bounce value (`damping:100`) are authoritative; the `{damping:200}` figure is from `@remotion/transitions` examples, and other named presets circulating online are third-party and should not be cited as official.
- The reviewer judges the *specification*, not a rendered video; it cannot guarantee the final render looks right — only that the script is complete, internally consistent, frame-accurate, and technically feasible for Remotion.