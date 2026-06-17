# 02 — Script (F-001 · Cleopatra vs Pyramids) — v4 (VO-driven)

> Every on-screen + spoken claim traces to `01-verified-facts.md` (claim id in brackets). No new facts. Numbers shown rounded; exact dates are the support beats. **Cleopatra's death day is NOT shown/spoken** (disputed) — only years.
>
> **v4 change:** the channel now ships a **Kokoro voiceover** that drives the timing. This script adds a **Narration block** (the spoken VO) alongside the on-screen captions (spoken ≠ caption). The frame map below is **patched by step 3.5 from the real VO timing** — not hand-pinned. Visual design carries over the v3 vertical-timeline overhaul and adds the design-§5 denser visuals (date ticks + era labels, a shared-baseline comparison, a brighter rest-state pyramid).

---

## 🎙️ Narration (spoken VO — drives the timing)
> Natural sentences the voice reads. Years bare (`2560 BC`, `1969`), magnitudes comma-grouped (`~2,500`). Facts only from `01-verified-facts.md`. Target ~30s.

<!-- NARRATION:START -->
- [hook] Cleopatra lived closer in time to you than to the Great Pyramids.
- [beat1] The Great Pyramid was finished around 2560 BC, for the pharaoh Khufu.
- [beat2] Cleopatra, Egypt's last queen, was born in 69 BC.
- [beat3] That's about 2,500 years after the pyramid.
- [beat4] The first Moon landing was in 1969.
- [beat5] Cleopatra was born only 2,000 years before that.
- [beat6] So she's roughly 450 years closer to the Moon landing than to the pyramids.
<!-- NARRATION:END -->

## 🎞️ Frame map (patched by step 3.5 from vo-timing.json — do not hand-edit)
<!-- FRAME-MAP:START -->
| Segment | start | end | frames |
|---------|-------|-----|--------|
| hook | 0 | 109 | 109 |
| beat1 | 109 | 259 | 150 |
| beat2 | 259 | 397 | 138 |
| beat3 | 397 | 493 | 96 |
| beat4 | 493 | 592 | 99 |
| beat5 | 592 | 702 | 110 |
| beat6 | 702 | 855 | 153 |
| loop | 855 | 930 | 75 |
| **Total** | **0** | **930** | **930** |
<!-- FRAME-MAP:END -->

---

## 📌 Overview
- **Working title:** Cleopatra is closer to YOU than to the Pyramids
- **Format:** Kinetic typography (vertical timeline / number reveal) + VO
- **Niche:** Facts / Kinetic Typography
- **Target runtime:** ~30s (1080×1920 @ 30fps) — `durationInFrames` set by the VO (`vo-timing.json` total)
- **Voice:** Kokoro `am_michael` (US male; candidates `bm_george` / `af_bella`)
- **One-line premise:** Egypt's queen Cleopatra lived ~2,500 years after the Great Pyramid but only ~2,000 years before the Moon landing — so she's closer in time to *us* than to the monuments she lived beside.
- **Spatial idea (the whole video):** a vertical time-axis runs top→bottom — **Pyramid pinned at the TOP (2560 BC), Moon landing at the BOTTOM (1969)**. Cleopatra's marker sits at the time-accurate position: **~55% down → visibly below center, nearer the Moon.** The geometry *is* the payoff: her gap-up (to the Pyramid) is longer than her gap-down (to the Moon).

---

## 🎨 Look & feel (carries into 03/05 — no flat black, no dead space)
- **Background:** deep vertical gradient **navy → indigo** (`#0B1430` top → `#1C2A55` bottom) with a soft **radial glow** behind the hero element and a faint large nebula wash — never flat single-hex black. Larger parallax stars (2–4px) drift slowly.
- **Frame utilization:** every beat uses the full safe area (y≈260–1660) in three bands — **context line (upper third) · hero number (center) · vertical timeline + comparison segment (runs through, anchored lower).** No beat leaves a >40% empty zone. **Era labels** ("Old Kingdom" near the pyramid, "Ptolemaic" near Cleopatra, "Space Age" near the Moon) + faint **date ticks** along the spine fill the right band (design §5).
- **Hero scale:** primary numbers are **huge (~340px)**, clearly stepping down to supporting text.
- **Scale-honest:** the timeline span is 2560 BC→1969 = **4,529 yrs over ~1,200px**; Pyramid→Cleopatra (2,491 yr) ≈ **660px**, Cleopatra→Moon (2,038 yr) ≈ **540px** (true ~1.22 ratio). Computed from the values, not eyeballed.

---

## 🎯 Hook Frame — target ~0–2.5s
> The thumbnail. Fully lit at frame 0 (no fade-in), legible in <0.5s, promises the payoff. The hook VO speaks from frame 0 (no silent lead). The complete claim — including "YOU" — is on screen at frame 0.

- **Narration (spoken):** "Cleopatra lived closer in time to you than to the Great Pyramids."
- **On-screen text:**
  - Kicker (small, gold, uppercase): **"EGYPT'S QUEEN"** [C5 — Queen of Egypt / last Ptolemaic ruler]
  - Hero line 1 (big, off-white): "Cleopatra is closer to **YOU**"
  - Hero line 2 (big, gold): "than the **Pyramids**"
- **Visual:** the vertical timeline is faintly previewed — a tall glowing rule with a **pyramid silhouette top** (already a lit warm-gold fill, not muddy) and a **moon disc bottom**; the word "Cleopatra" sits low-center (a visual hint it's nearer the Moon end). Gradient bg + glow behind the text. "YOU" punches in scaled with a quick overshoot.
- **Why it stops the swipe:** Counterintuitive bold claim + an identified subject ("Egypt's Queen") so a cold viewer instantly knows who. [C8]

---

## 🎬 Beats (one cut per beat — full-frame, never static; targets only, VO sets frames)

### Beat 1 — target ~4s
- **Narration (spoken):** "The Great Pyramid was finished around 2560 BC, for the pharaoh Khufu."
- **On-screen text:** context "THE GREAT PYRAMID" + small "Khufu · Old Kingdom" → hero year **"2560 BC"** (~340px, center, gold)
- **Visual / animation:** the **vertical timeline establishes** — draws top→bottom; a **large pyramid silhouette (~360px, lit gold fill)** anchors the TOP node; "2560 BC" stamps center with a stone-impact shake. Era label "Old Kingdom" + first date tick appear in the right band. [C1][C2][C3]

### Beat 2 — target ~3s
- **Narration (spoken):** "Cleopatra, Egypt's last queen, was born in 69 BC."
- **On-screen text:** context "EGYPT'S LAST QUEEN · CLEOPATRA" → hero year **"69 BC"** (~340px, center, gold)
- **Visual / animation:** a **Cleopatra marker node** lands on the timeline at the time-accurate **~55%-down** position (below center); label "Cleopatra" + era label "Ptolemaic" ride the node. Pyramid stays pinned top. "69 BC" stamps with the year-shake. [C4][C5][C6]

### Beat 3 — target ~4s · first gap
- **Narration (spoken):** "That's about 2,500 years after the pyramid."
- **On-screen text:** context "PYRAMID → CLEOPATRA" → hero **"~2,500"** + "YEARS" (~340px gold)
- **Visual / animation:** a **thick gold segment** grows down the timeline from Pyramid(top)→Cleopatra(~55%) — length **660px**, scale-honest. A counter **ticks 0 → 2,500 over ~30f (ease-OUT) then holds**; bar grows in sync. **Counter clamped ≥ 0.** [derived C1+C4: 2560−69 ≈ 2,491 → ~2,500]

### Beat 4 — target ~3s
- **Narration (spoken):** "The first Moon landing was in 1969."
- **On-screen text:** context "THE MOON LANDING" + small "Space Age" → hero year **"1969"** (~340px, ice-blue)
- **Visual / animation:** focus drops to the BOTTOM node — a **large moon disc (~360px)** with a small rocket + launch-flash; "1969" stamps in ice-blue. Era label "Space Age" appears bottom-right. The gold Pyramid→Cleopatra segment stays visible above. [C7]

### Beat 5 — target ~4s · second gap
- **Narration (spoken):** "Cleopatra was born only 2,000 years before that."
- **On-screen text:** context "CLEOPATRA → MOON" → hero **"~2,000"** + "YEARS" (~340px ice-blue)
- **Visual / animation:** a **thick ice-blue segment** grows down from Cleopatra(~55%)→Moon(bottom) — length **540px**, collinear below the gold one on the same spine so the two lengths compare directly and the blue is **visibly shorter**. Counter **ticks 0 → 2,000 (~30f ease-OUT, clamped ≥ 0) then holds**; bar grows in sync. [derived C4+C7: 69+1969 = 2,038 → ~2,000]

### Beat 6 — target ~5s ← PAYOFF
- **Narration (spoken):** "So she's roughly 450 years closer to the Moon landing than to the pyramids."
- **On-screen text:** "She's **~450 YEARS** closer" (~340px) → "to the **Moon landing**" → "than the **Pyramids**"
- **Visual / animation:** the comparison resolves as **two bars from a shared baseline at the Cleopatra node** — gold gap (660px) up, blue gap (540px) down — so the ~450-yr difference reads at a glance (design §5 stronger comparison); the **shorter blue segment glow-pulses**. The two numbers **2,500 vs 2,000** flash, then **"~450 YEARS CLOSER"** stamps over the Cleopatra node, which **nudges visibly downward** toward the Moon. Quiet, glowing hold to land it. [C8 + derived 2,491 − 2,038 ≈ 450]

---

## 🔁 Loop-Back — final ~1.5s (silent tail → frame 0)
> Make the auto-loop invisible so replays compound reach. The tail is **silent** (VO ended, music fades out).
- **Final frame composition:** everything cross-dissolves back to the **exact Hook Frame** — same gradient bg, faint timeline preview, "EGYPT'S QUEEN / Cleopatra is closer to YOU / than the Pyramids" in the identical position/scale/color as frame 0.
- **The loop trick:** the hook is a claim; the beats are the proof; landing back on the claim now *understood* reads as confirmation → pulls a rewatch. Final frame == frame 0 composition, so the auto-loop is seamless.

---

## 💬 Captions
- **Style:** burned-in, large, high-contrast, **word-by-word synced to the VO** (off-white body + one accent on the hero number/word per beat — gold for the ancient/Pyramid side, ice-blue for the modern/Moon side).
- **Generation:** emitted in step 5 from `vo-timing.json` integer word frames (NOT Whisper, NOT hand-typed). Each word shows its `display` string; highlight steps word-by-word as the VO speaks it.
- **Safe zone:** all text within y 154–1632 (clear of bottom ~15% UI band and top ~8%); keep long captions inside x 60–1020 and **out of the timeline-node lane** (no caption/glyph collision).

---

## 🔊 Audio (VO is the lead)
- **Voice:** Kokoro `am_michael` (set in step 3.5).
- **Track vibe:** low, suspenseful build — minimal ticking/pulsing bed that rises subtly into the Beat 6 payoff, then resolves on the loop. No lyrics (would fight the VO + captions).
- **Mix note:** **VO is the LEAD** (`vo.wav` ~0.9–1.0). The **music bed DUCKS under the voice** (base ~0.72 → ~0.22 across `speech_regions` from `vo-timing.json`), swelling on the Beat 6 payoff after the final region; soft "lock"/tick SFX on each year-stamp + bracket whooshes on the gap beats + a single low "reveal" hit on the payoff. Final render mastered to **−14 LUFS / ≤ −1 dBTP** via two-pass `loudnorm`. SFX frame cues recomputed from the VO beat frames in `04-audio.md`.

---

## 📝 Metadata (for upload)
- **Title:** Cleopatra is closer to YOU than to the Pyramids
- **Description:** Egypt's queen Cleopatra was born ~2,500 years after the Great Pyramid — but only ~2,000 years before the Moon landing. Time is bigger than you think. #Shorts #history #facts
- **Hashtags:** #Shorts #history #Cleopatra #spacefacts #mindblown
- **AI disclosure:** YES — synthetic (Kokoro) voiceover.

---

## 📈 Channel notes
- **Cadence:** aim 1×/day, never below 3–4×/week.
- **Metric to chase:** engaged views + retention, NOT loop-inflated vanity counts.
- **Post-render:** run the **render-qa** gate (frame count, loop seam, brightness, per-beat dead-space, scale-honest mechanic, −14 LUFS, **and the VO check**) before upload.
