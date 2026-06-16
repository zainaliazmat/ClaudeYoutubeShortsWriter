# 07 — Rendered Video Review (F-001 · Cleopatra vs Pyramids)

> Reviewed file: `/home/zain-ali/Documents/CaludeRemotionShorts/out.mp4`
> 1080×1920 · 30fps · 840 frames · 28.05s · h264 + aac · 3.27 MB
> Method: ffprobe metadata, `blackdetect`, per-0.5s luma sampling (`signalstats`), 28-frame contact sheet, and 5 full-res frame extractions.

## Verdict

The user's complaints are **correct and measurable**, not subjective. The video reads as "tiny text floating in a black void." The biggest problems are **baked into the spec** (`03-assets.md` palette + `05-remotion-prompt.md` layout/timing), so re-rendering the same package will reproduce them. This needs a spec revision, then a re-render — plus two genuine render bugs to fix.

---

## Quantified evidence

**1. The whole video is near-black.**
Average luma (`YAVG`, 0–255 scale) never leaves the **9–14** band across all 28 seconds — i.e. **~4–5% brightness for the entire runtime**. A healthy in-feed Short averages ~80–150. YouTube's in-feed thumbnail/preview will look like a black rectangle, which kills swipe-stop rate.

**2. `blackdetect` literally classifies large stretches as black.**
With `pix_th=0.10`, ffmpeg flags as fully black:
- `0.0–0.27s` (opening fade-in — **violates the CLAUDE.md "no black fade-in lead" rule**)
- `1.5–3.2s` (1.7s)
- **`5.0–10.77s` (5.8s)** ← Beat 2
- **`12.5–18.2s` (5.7s)** ← Beats 3→5 region
- several 0.1–0.3s flickers around 11s, 18–20s

Two ~6-second stretches register as *black* because the only lit pixels are a thin line of small text. That is the "lots of black screen" the user saw.

**3. Visual density is ~10%.**
Every extracted frame is small centered type occupying a thin band (roughly y 520–760 of 1920). The top third and bottom half are empty black. The "timeline rule," "brackets," and Lucide glyphs (`Triangle`/`Moon`/`Rocket`) render as faint 1–2px hairlines and tiny 36–48px line-icons — invisible at a glance on a phone. There is no fill, no color field, no shape, no imagery anywhere.

**4. The count-up animations are slow *and* land on empty frames.**
- Beat 3 counter `0→2,500`: frames 255–360 (**~3.5s**)
- Beat 5 counter `0→2,000`: frames 480–585 (**~3.5s**)

During each count the rest of the frame is empty black, so 3.5s reads as "a number slowly changing on a black screen." This is the "number increasing animation is taking too long" complaint — it's both literally long and unsupported by any other on-screen motion.

---

## Findings (severity-ranked)

### 🔴 BLOCKER 1 — Background is effectively black (`#07090F`)
- **Where:** `03-assets.md` palette (Background `#07090F`), `05-remotion-prompt.md` token `bg`.
- **Why it's wrong:** `#07090F` is luma ≈ 9. The "night sky" + "80 faint stars" concept produces a flat black field. The spec's WCAG contrast table is technically true but irrelevant — high text contrast on a black void still looks empty.
- **Fix:** Replace the flat near-black with a **rich, non-black background**: a deep vertical gradient (e.g. `#10182E → #1E2A4A` navy→indigo, or a warm "ancient" `#1A1206 → #2A1E0A`), plus a subtle large-scale glow/vignette behind the hero number, and **bigger, parallaxing stars + 1–2 soft nebula blobs**. Target an average luma of **40–70**, not 9.

### 🔴 BLOCKER 2 — Visual density far too low (text in a void)
- **Where:** `05-remotion-prompt.md` layout (everything in a thin center band; hairline rule; 36–48px icons).
- **Fix:**
  - Make the **hero number fill the frame** — 320–420px, not 150px. Let it dominate.
  - Add **full-bleed supporting graphics per beat**: a large semi-transparent pyramid silhouette behind Beat 1, a moon/earth disc behind Beat 4, an actual thick **comparison bar chart** (two stacked bars, gold vs ice-blue, clearly different lengths) instead of two 2px hairline "brackets."
  - Replace tiny Lucide line-icons with **large filled shapes** (a solid pyramid, a solid moon) at 200–400px, used as background elements, not 48px markers on a hairline.
  - Add a persistent, readable timeline as a **thick bar (12–20px) with a moving playhead**, not a 2px grey line.

### 🔴 BLOCKER 3 — Count-up too long and on empty frames
- **Where:** `03-assets.md` motion table (`countUp` = "Full beat duration 120f"), `05-remotion-prompt.md` Scenes 3 & 5.
- **Fix:**
  - Shorten each count to **~0.8–1.2s (24–36 frames)**, then hold the landed number.
  - Drive it with an **ease-out** (fast start, decelerate to land) instead of `easeInOutCubic` (slow start) — slow-start count-ups feel sluggish.
  - **Animate the comparison bar simultaneously** with the count so the screen isn't just a lone digit — the bar growing gives the eye something to track and makes the number meaningful.

### 🟠 BUG 1 — Counter renders **negative numbers** mid-animation
- **Observed:** in the 16–19s window (Beat 5) the contact sheet shows `Only -33 years closer`, `-581`, `-1,784`, `-2,000`. Showing a negative "years closer" is **factually wrong and confusing**.
- **Likely cause:** the count-up interpolates from a negative start, or the value is computed as a decreasing/reversed delta, or a spring overshoots below 0 before settling.
- **Fix:** clamp the displayed integer to `≥ 0` (`Math.max(0, Math.round(value))`), drive the count strictly `0 → target`, and verify both counters never print a `-`.

### 🟠 BUG 2 — Text clips the right safe-zone edge
- **Observed:** at 17s `…years after her🚀` and at 22s `…years closer` run into the right edge / overlap the moon glyph; the rocket emoji collides with "her."
- **Where:** `05-remotion-prompt.md` Scenes 5 & 6 place long captions + a right-edge glyph on the same line.
- **Fix:** reduce caption font ~10–15% or wrap to two lines; keep all text inside x: 60–1020; don't place a glyph in the same horizontal lane as a long caption.

### 🟠 BUG 3 — Opens on black + thumbnail missing the payoff word
- **Observed:** frame 0 is near-black (fade-in 0–0.27s) and at 0.3s the hook reads `Cleopatra is closer to` / `than to the Pyramids` — **"YOU" hasn't popped in yet** (scheduled frame 24). Frame 1 is the thumbnail per CLAUDE.md and it's neither bright nor showing the full claim.
- **Fix:** kill the fade-in; render frame 0 fully lit with the **complete** hook including "YOU" already on screen at full scale (animate emphasis *after*, don't withhold the word).

### 🟡 POLISH
- Star drift (+2px/s) and the "barely perceptible" motion mean long stretches have **almost no movement** — add continuous secondary motion (parallax, slow zoom/Ken-Burns on the bg graphic, pulsing glow) so no beat sits static.
- Accent gold `#C8A84B` on near-black is low-energy; on a richer bg you can push to a brighter gold/amber for "pop."
- Beat 6 holds nearly static from ~21–25s (contact sheet shows the same "~450 years closer" frame for ~4–5s) — tighten the hold or add motion.

---

## Recommended fix plan

This is a **spec problem first**. Order of operations:

1. **Revise `03-assets.md`** — new background (gradient + glow + larger stars/nebula), brighter accents, larger type scale, replace hairline rule/brackets with a thick bar-chart comparison + filled silhouettes. Target avg luma 40–70.
2. **Revise `05-remotion-prompt.md`** — hero numbers 320–420px; full-bleed per-beat background graphic; count-up shortened to 24–36f with ease-out + simultaneous bar growth; fix safe-zone math; frame-0 = fully-lit complete hook; clamp counters ≥ 0.
3. **Re-render** in `CaludeRemotionShorts`, then **re-run this same review** (`blackdetect` + luma sample) as the acceptance gate: avg luma > 40, **zero** multi-second black stretches, no negative counter values, no edge clipping.
4. Keep the **two-pass `loudnorm` -14 LUFS master** step (audio target is fine; this review is visual-only).

### Fastest high-impact wins (if doing a minimal patch first)
1. Swap `bg` to a navy/indigo gradient + glow (Blocker 1) — single biggest visual lift.
2. Triple the hero-number size (Blocker 2).
3. Cut count-up to ~1s with ease-out (Blocker 3).
4. Clamp counter ≥ 0 (Bug 1).

Doing just these four would address every complaint the user raised.
