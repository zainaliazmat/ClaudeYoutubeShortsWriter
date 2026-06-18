<!-- /autoplan restore point: /home/zain-ali/.gstack/projects/zainaliazmat-ClaudeYoutubeShortsWriter/main-autoplan-restore-20260618-163946.md -->
> **STATUS: BUILT (2026-06-18).** Shelved at the CEO gate, then revived by explicit owner
> request ("repaint the whole body and generate a new video"). Implemented as NEW v2
> compositions so the originals are preserved for A/B:
> - Code: shared `render/src/v2kit/` (brand spine: warm background, glyph silhouettes, scene
>   parts, scale-honest payoff timeline) + `render/src/F-001-v2/` + `render/src/F-002-v2/`.
>   Frozen contracts (`vo-timing.json`, `scenes.json`, audio spec, captions) reused unchanged.
> - Renders: `output/F-001-cleopatra-vs-pyramids/final-v2.mp4` (930f, -14.52 LUFS / -1.03 dBTP)
>   and `output/F-002-trex-closer-than-stegosaurus/final-v2.mp4` (720f, -14.53 / -1.28).
> - QA: no flat frames (luma 40-63 ≥ 35 floor), loop seam RMSE 0.027, durations exact, gate green.
> - The original `final.mp4` files are untouched — compare them against `final-v2.mp4` to finalize.

# F-001 / F-002 Visual Redesign — "less boring" v2 renders

**Date:** 2026-06-18
**Branch:** main
**Status:** plan (for /autoplan review)

## Problem

The two shipped Shorts (F-001 Cleopatra-vs-Pyramids, F-002 T-Rex-closer-than-Stegosaurus)
are visually monotonous and nearly identical to each other. Frame sampling of both
`final.mp4` files shows the same template: a flat cold-navy gradient, ONE skinny vertical
"timeline spine" pinned to the far left (x≈170), and big center numbers that swap out beat
to beat. Same palette (`#0B1430`/`#1C2A55` + gold `#F2B53C` + ice `#6FD3FF`) on both
videos. The result: low contrast, a >40% empty content lane, no hero shapes, no per-video
identity. The user looked at reference infographics (rich hero imagery, bold color-accented
typography, side-by-side stat comparisons, horizontal labeled timelines, warm palettes) and
called the current output "very boring."

## Premises

1. **The timing, VO, audio, and captions are correct and should NOT change.** Only the
   visuals are boring. (`vo-timing.json`, `scenes.json`, the audio spec, and caption word
   frames stay byte-identical.)
2. **The channel niche is "text + motion only — no footage," but the user approved a
   HYBRID:** primarily kinetic typography, allowed simple in-code vector silhouettes/icons
   as accents (pyramid, Cleopatra bust glyph, moon, rocket, iPhone outline, Stegosaurus /
   T-Rex / human silhouettes). No photos, no sourced/illustrated raster assets, no footage.
3. **The current renders must be preserved.** The user wants to see BOTH old and new and
   finalize one. So the redesign must not overwrite the existing `final.mp4` or the existing
   `F-001`/`F-002` composition code.
4. **The visual archetype (vertical scale-honest timeline) is sound and the geometry IS the
   payoff** — it should be kept and made richer, not discarded.

## Approach

Repaint the visuals only. Keep every timing-critical contract frozen.

### Coexistence strategy (preserve current renders)

Add NEW sibling composition directories `render/src/F-001-v2/` and `render/src/F-002-v2/`
with their own `Short.tsx` + scenes, importing the EXISTING `vo-timing.json`, `scenes.json`,
and audio spec from the current `F-001`/`F-002` dirs (single source of truth — no timing
drift). Register two new compositions (`F-001-v2`, `F-002-v2`) in `Root.tsx`. The current
`F-001`/`F-002` components and their `output/F-00X/final.mp4` are never touched. New renders
write to `output/F-00X/final-v2.mp4`. Both old and new render independently and on demand.

### Visual changes (the learnings from the references)

1. **Distinct, warm per-video palette** (kills the "they look identical" problem):
   - F-001 Cleopatra: warm desert — sand/charcoal ground, **gold** + **lapis-blue** accents,
     ivory text. Golden-hour infographic feel.
   - F-002 T-Rex: museum infographic — deep slate/bone ground, **amber/rust** (deep-time) +
     **teal** (modern) accents.
2. **Color-accented keyword captions** — key words punch in the accent color (like the
   reference "MOON LANDING" / "Pyramids" / "JUSTIN BIEBER" highlights), not flat single-color.
3. **Hybrid type + vector silhouettes as scene heroes** (drawn in-code, SVG): pyramid trio,
   stylized Cleopatra bust glyph, moon+rocket, iPhone outline; Stegosaurus / T-Rex / human
   silhouettes.
4. **Varied full-bleed layouts per beat** instead of one static spine + center number:
   - Hook: full-frame stacked claim, giant accent "YOU", silhouette motif behind.
   - Number-reveal beats: big count-up paired with its silhouette + a context chip
     ("2560 BC · Old Kingdom").
   - Comparison beat (esp. F-002): side-by-side silhouettes (Stego / T-Rex / Human) scaled
     and labeled with the MYA gaps — straight from the "two predators / Stego-Trex-Humans" ref.
   - Payoff: a horizontal timeline with three labeled nodes + silhouette markers and the
     proportional "closer to YOU" gap bar (the timeline ref) — scale-honest.
5. **Motion variety:** slam-ins, scale punches, count-ups, a left→right timeline draw, gentle
   parallax/drift on silhouettes, a payoff glow.
6. **Render + master** each v2 composition to `output/F-00X/final-v2.mp4` at -14 LUFS /
   ≤-1 dBTP (reuse the limiter chain in `scripts/master.mjs`).

### Frozen content (per video)

- F-001: 930 frames / 31s, 8 scenes. Pyramid 2560 BC (top) · Cleopatra 69 BC (~55% down) ·
  Moon 1969 (bottom). Gaps ~2,500 / ~2,000 / payoff ~450 closer to the Moon.
- F-002: 720 frames / 24s, 8 scenes. Stegosaurus 150 Mya (top) · T-Rex 66 Mya (~56% down) ·
  Today (bottom). Gaps 84M / 66M / payoff ~18M closer to you.

## Architecture

- New: `render/src/F-001-v2/{Short.tsx, data.ts, scenes/*.tsx, Glyphs.tsx, Timeline.tsx}`
  and `render/src/F-002-v2/{...}`.
- `data.ts` in each v2 dir imports `../F-00X/vo-timing.json`, `../F-00X/scenes.json`, and the
  audio spec values; defines only NEW color tokens + layout geometry.
- Reuse the shared `render/src/lib/` primitives (`Background`, `Captions`, `AudioBed`,
  `motion`, `safeArea`, `tiling`) unchanged. If a primitive needs an accent-keyword caption
  feature it doesn't have, extend `lib/Captions` + `captions-core` additively (no behavior
  change for existing videos) — in blast radius.
- `Root.tsx`: add two `<Composition>` entries (`F-001-v2`, `F-002-v2`) with the existing
  `calculateMetadata` pattern (duration from `vo-timing.json` total — never a const).

## Verification / test plan

1. Gate: `cd render && npm run gate && npm run test:lib` — tsc + eslint + lib unit tests green.
2. Tiling: `node --experimental-strip-types scripts/check-tiling.mjs F-001-v2` and `F-002-v2`
   (or validate the v2 dirs reuse the same scenes.json, so existing tiling still holds).
3. Render: `cd render && npx remotion render F-001-v2 out/F-001-v2.mp4 --public-dir <seeded>`
   then master to `output/F-001-cleopatra-vs-pyramids/final-v2.mp4`; same for F-002.
4. Loudness: ffmpeg measure final-v2.mp4 → -14 LUFS / ≤-1 dBTP.
5. Visual QA: extract frames across each v2 render; confirm no flat/near-black frame, no
   >40% dead zone, distinct palettes, silhouettes legible, captions clear of bottom ~15% and
   top, loop seam (frame total-1 ≈ frame 0).
6. Side-by-side: present old `final.mp4` + new `final-v2.mp4` for the finalize decision.

## NOT in scope

- No re-research, no re-script, no new VO, no audio/SFX changes.
- No new music binaries (the reused audio spec points at already-downloaded assets).
- No change to the existing `F-001`/`F-002` components or their `final.mp4`.
- No build of the backlogged parametric `compose.json` engine.
- No photo/illustration/footage assets (hybrid = in-code vector only).
- No upload (human action).

## Risks

- Accent-keyword caption change to shared `lib/Captions` could regress existing videos →
  mitigate by making it additive/opt-in via the `CaptionStyle` config.
- New composition IDs must match the render-run id regex if rendered via the loop; here they
  are rendered manually with `npx remotion render`, so the `output` folder basename
  constraint does not bind.
- Silhouette glyphs must stay legible at 1080×1920 and not collide with captions in the
  bottom safe area.

---

# /autoplan Review

## Phase 1 — CEO (Strategy & Scope)

### Dual voices

**CODEX SAYS (CEO — strategy challenge):** [single-model note: codex sandbox blocked
file reads (`bwrap` namespace denied); reviewed from the brief.] Critical: optimizing
"less boring" without proving visuals are the bottleneck — diagnose the retention curve
first (1s/3s swipe, completion, rewatch). Critical: freezing timing/VO may preserve the
broken thing (late hook, slow sentence, obvious payoff). High: aesthetics ≠ retention
mechanics — map each visual change to a retention job or cut it. High: A/B on two shipped
videos is too slow for an early channel; ship 10-20 new hook/format tests instead. High:
the two topics may not generalize; the angle may be the problem, not the art. High:
packaging (title/first-frame/thumbnail) is the real lever and is untouched. Medium:
in-code vectors become a production tax; build a reusable visual grammar (5-8 scene types,
slots). Medium: per-video warm palettes weaken brand memory — keep a consistent brand
spine, vary only accents. Medium: "better" vs "more" — more detail competes with captions
on a small screen.

**CLAUDE SUBAGENT (CEO — strategic independence):** Critical: polishing an unvalidated
product — both F-001/F-002 are rendered but never published; "boring" is the owner's
opinion with zero audience data; the 10x lever is publish volume → read retention.
Critical: the plan keeps the archetype it admits is the boredom source (same vertical
timeline on both) and blames the palette — that's treating a structural problem as
cosmetic. High: hook/first-frame (the real retention driver) is frozen and only restyled.
High: premises 2 (vectors won't look like clip-art) and 4 (timeline is sound) are asserted,
not tested. High: 6-month regret = a more complex renderer + two extra code trees for two
videos nobody watched. Medium: alternatives (publish-first, in-place flag vs parallel -v2
dirs, typography-only) not weighed. Medium: per-video palette divergence weakens channel
identity. Keep: freeze audio (Premise 1), the engineering hygiene, and color-accent
captions (the single best, lowest-risk idea).

### CEO dual-voices consensus table

```
  Dimension                              Claude  Codex  Consensus
  ────────────────────────────────────── ─────── ────── ──────────
  1. Premises valid?                      No      No     CONFIRMED (P2/P4 are hypotheses, not facts)
  2. Right problem to solve?              No      No     CONFIRMED (visuals not the highest lever)
  3. Scope calibration correct?           Partly  Partly CONFIRMED (cap effort / scope to 1 video)
  4. Alternatives sufficiently explored?  No      No     CONFIRMED (publish-first/format/packaging unweighed)
  5. Competitive/market risks covered?    No      No     CONFIRMED (pacing/SFX/identity gaps remain)
  6. 6-month trajectory sound?            No      No     CONFIRMED (complexity + art-tax + unwatched)
  CONFIRMED 6/6. Both voices independently challenge the plan's core premise.
```

### USER CHALLENGE (both models want to change the stated direction)

**What you said:** redesign both F-001 and F-002 visuals now; distinct warm palette per
video; keep the timeline; compare v1 vs v2 and finalize one.

**What both models recommend:** treat the repaint as a small diagnostic, not the main work
— publish to get retention data first; if redoing visuals, scope to ONE video, make the
real experiment *format-divergence + hook/first-frame variants* (not palette), keep a
SHARED brand palette/spine (vary only accents), and gate further work on a watch-time delta.

**What we might be missing:** the owner may already plan to publish; may value a polished
back-catalog before posting; may want the visual system fixed once so all future videos
inherit it; "compare and finalize" may be exactly the cheap diagnostic the models ask for.

**If we're wrong, the cost is:** a spent eng cycle + two extra code trees repainting videos
whose underperformance (if any) was caused by hook/format/packaging, not color — and a
weaker channel identity from per-video palettes.

### Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|----------------|-----------|-----------|
| 1 | CEO | Freeze timing/VO/audio (Premise 1) | Mechanical | P1 | Both voices endorse; protects mastered audio + caption sync |
| 2 | CEO | Keep color-accent captions | Mechanical | P3 | Both voices call it the best, lowest-risk idea |
| 3 | CEO | Per-video distinct palette vs shared brand spine | USER CHALLENGE | — | Both models say distinct palettes weaken channel identity; user's call |
| 4 | CEO | Scope: both videos now vs one + reframe to format/hook | USER CHALLENGE | — | Both models say scope down + reframe; user's direction is default |
| 5 | CEO | Vector silhouettes (Premise 2) | TASTE | P5 | Clip-art risk; mitigate with a 10-min silhouette-vs-type spike before committing |

