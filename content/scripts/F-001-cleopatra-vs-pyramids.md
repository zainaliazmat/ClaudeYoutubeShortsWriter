# 02 — Script (F-001 · Cleopatra vs Pyramids) — v3

> Every on-screen claim traces to `01-verified-facts.md` (claim id in brackets). No new facts. Numbers shown rounded; exact dates are the support beats. **Cleopatra's death day is NOT shown** (disputed) — only years.
>
> **v3 visual overhaul (post-render review):** the v2 render was near-black and empty — a *horizontal* center timeline wasted the tall frame, hero numbers were tiny, the comparison was drawn out of proportion, count-ups dragged, and a counter showed negative values. v3 fixes the **design**, not the facts: a **VERTICAL timeline that fills the full 9:16 height**, hero numbers that dominate, a **scale-honest** two-segment gap, fast ease-out count-ups, a depth-gradient background, and a subject-identifier kicker. **Frame map is unchanged from v2** so the fixed −14 LUFS audio cues still line up.

---

## 📌 Overview
- **Working title:** Cleopatra is closer to YOU than to the Pyramids
- **Format:** Kinetic typography (vertical timeline / number reveal)
- **Niche:** Facts / Kinetic Typography
- **Total runtime:** 28 s  (= **840 frames** @ 30fps · 1080×1920)
- **One-line premise:** Egypt's queen Cleopatra lived ~2,500 years after the Great Pyramid but only ~2,000 years before the Moon landing — so she's closer in time to *us* than to the monuments she lived beside.
- **Spatial idea (the whole video):** a vertical time-axis runs top→bottom — **Pyramid pinned at the TOP (2560 BC), Moon landing at the BOTTOM (1969)**. Cleopatra's marker sits at the time-accurate position: **55% down → visibly below center, nearer the Moon.** The geometry *is* the payoff: her gap-up (to the Pyramid) is longer than her gap-down (to the Moon).

---

## 🎨 Look & feel (carries into 03/05 — no flat black, no dead space)
- **Background:** deep vertical gradient **navy → indigo** (`#0B1430` top → `#1C2A55` bottom) with a soft **radial glow** behind the hero element and a faint large nebula wash — never flat single-hex black. Larger parallax stars (2–4px) drift slowly.
- **Frame utilization:** every beat uses the full safe area (y≈260–1660) in three bands — **context line (upper third) · hero number (center) · vertical timeline + comparison segment (runs through, anchored lower).** No beat leaves a >40% empty zone.
- **Hero scale:** primary numbers are **huge (~340px)**, clearly stepping down to supporting text.
- **Scale-honest:** the timeline span is 2560 BC→1969 = **4,529 yrs over ~1,200px**; Pyramid→Cleopatra (2,491 yr) ≈ **660px**, Cleopatra→Moon (2,038 yr) ≈ **540px** (true ~1.22 ratio). Computed from the values, not eyeballed.

---

## 🎯 Hook Frame — 0.0s to 1.5s (frames 0–45)
> This is the thumbnail. Fully lit at frame 0 (no fade-in), legible in <0.5s, promises the payoff. **The complete claim — including "YOU" — is on screen at frame 0** (emphasis animates after, the word is never withheld).

- **On-screen text:**
  - Kicker (small, gold, uppercase): **"EGYPT'S QUEEN"** [C5 — Queen of Egypt / last Ptolemaic ruler]
  - Hero line 1 (big, off-white): "Cleopatra is closer to **YOU**"
  - Hero line 2 (big, gold): "than the **Pyramids**"
- **Visual:** the vertical timeline is faintly previewed — a tall glowing rule with a **pyramid silhouette top** and a **moon disc bottom**; the word "Cleopatra" sits low-center (a visual hint it's nearer the Moon end). Gradient bg + glow behind the text. "YOU" punches in scaled with a quick overshoot at frame 24.
- **Why it stops the swipe:** Counterintuitive bold claim + an identified subject ("Egypt's Queen") so a cold viewer instantly knows who. Two "ancient Egypt" icons most assume are neighbors in time, collapsed by a "wait, what?" gap. [C8]

---

## 🎬 Beats (one cut per beat — full-frame, never static)

### Beat 1 — 1.5s–5.0s (frames 45–150)
- **On-screen text:** context "THE GREAT PYRAMID" (upper) → hero year **"2560 BC"** (~340px, center, gold)
- **Visual / animation:** the **vertical timeline establishes** — draws top→bottom; a **large pyramid silhouette (~360px)** anchors the TOP node with a soft gold glow; "2560 BC" stamps center with a stone-impact shake. Background gradient + drifting stars fill the rest. [C1][C2][C3]

### Beat 2 — 5.0s–8.5s (frames 150–255)
- **On-screen text:** context "EGYPT'S QUEEN · CLEOPATRA" (upper) → hero year **"69 BC"** (~340px, center, gold)
- **Visual / animation:** a **Cleopatra marker node** lands on the timeline at the time-accurate **55%-down** position (below center). The label "Cleopatra" rides the node. The pyramid stays pinned top. "69 BC" stamps with the same year-shake. The empty lower frame is filled by the continuing timeline + glow. [C4][C5][C6]

### Beat 3 — 8.5s–12.5s (frames 255–375) · first gap
- **On-screen text:** context "PYRAMID → CLEOPATRA" → hero **"~2,500"** + "YEARS" (~340px gold)
- **Visual / animation:** a **thick gold segment** grows down the timeline from Pyramid(top)→Cleopatra(55%) — length **660px**, scale-honest. A counter **ticks 0 → 2,500 over ~30f (ease-OUT) then holds** while the bar finishes growing simultaneously (no lone digit on black). Hero "~2,500 YEARS" stamps center with overshoot. **Counter clamped ≥ 0.** [derived C1+C4: 2560−69 ≈ 2,491 → ~2,500]

### Beat 4 — 12.5s–16.0s (frames 375–480)
- **On-screen text:** context "THE MOON LANDING" → hero year **"1969"** (~340px, ice-blue)
- **Visual / animation:** focus drops to the BOTTOM node — a **large moon disc (~360px)** with a small rocket + launch-flash anchors the bottom of the timeline; "1969" stamps in ice-blue (modern/cold side). The gold Pyramid→Cleopatra segment stays visible above for reference. [C7]

### Beat 5 — 16.0s–20.0s (frames 480–600) · second gap
- **On-screen text:** context "CLEOPATRA → MOON" → hero **"~2,000"** + "YEARS" (~340px ice-blue)
- **Visual / animation:** a **thick ice-blue segment** grows down from Cleopatra(55%)→Moon(bottom) — length **540px**, rendered **collinear below the gold one on the same vertical spine** (it continues gold from the Cleopatra node) so the two lengths are directly comparable and the blue is **visibly shorter**. Counter **ticks 0 → 2,000 (~30f ease-OUT, clamped ≥ 0) then holds**; bar grows in sync. Hero "~2,000 YEARS" overshoots in. [derived C4+C7: 69+1969 = 2,038 → ~2,000]

### Beat 6 — 20.0s–25.5s (frames 600–765) ← PAYOFF
- **On-screen text:** "She's **~450 YEARS** closer" (~340px) → "to the **Moon landing**" → "than the **Pyramids**"
- **Visual / animation:** both segments shown **collinear on the spine** (gold 660px above blue 540px, meeting at the Cleopatra node) so the shorter blue gap reads directly below the longer gold gap; the **shorter blue segment glow-pulses** (continuous motion through the dwell — not static). The two numbers **2,500 vs 2,000** flash, then **"~450 YEARS CLOSER"** stamps over the Cleopatra node, which **nudges visibly downward** toward the Moon. Quiet, glowing hold to land it. [C8 + derived 2,491 − 2,038 ≈ 450]

---

## 🔁 Loop-Back — final ~1.5s (frames 765–840)
> Make the auto-loop invisible so replays compound reach.
- **Final frame composition:** everything cross-dissolves back to the **exact Hook Frame** — same gradient bg, faint timeline preview, "EGYPT'S QUEEN / Cleopatra is closer to YOU / than the Pyramids" in the identical position/scale/color as frame 0.
- **The loop trick:** the hook is a claim; Beats 1–6 are the proof; landing back on the claim now *understood* reads as confirmation → pulls a rewatch. Final frame (840) == frame 0 composition, so the auto-loop is seamless.

---

## 💬 Captions
- **Style:** burned-in, large, high-contrast, **word-by-word** (off-white body + one accent on the hero number/word per beat — gold for the ancient/Pyramid side, ice-blue for the modern/Moon side). Faceless content lives on on-screen text.
- **Generation:** hand-timed to the beats (no narration track). Word-pop cadence per beat:
  - Hook (0–45): "EGYPT'S QUEEN"(0–10) "Cleopatra"(10–18) "is closer to"(18–24) "YOU"(24–33) "than the Pyramids"(33–45)
  - Beat1 (45–150): "The Great Pyramid"(45–95) "2560 BC"(95–150)
  - Beat2 (150–255): "Egypt's queen, Cleopatra"(150–200) "born 69 BC"(200–255)
  - Beat3 (255–375): "Pyramid to Cleopatra"(255–300) "~2,500 years"(300–375)
  - Beat4 (375–480): "The Moon landing"(375–430) "1969"(430–480)
  - Beat5 (480–600): "Cleopatra to the Moon"(480–540) "~2,000 years"(540–600)
  - Beat6 (600–765): "She's ~450 years closer"(600–675) "to the Moon landing"(675–720) "than the Pyramids"(720–765)
- **Safe zone:** all text within y 154–1632 (clear of bottom ~15% UI band and top ~8%); keep long captions inside x 60–1020 and **out of the timeline-node lane** (no caption/glyph collision).

---

## 🔊 Audio
- **Track vibe:** low, suspenseful build — minimal ticking/pulsing bed that rises subtly into the Beat 6 payoff, then resolves on the loop. No lyrics (would fight the captions).
- **Mix note (unchanged from the fixed v2 spec):** no VO → the music bed is the **LEAD** (mix it loud, not "under" anything); soft "lock"/tick SFX on each year-stamp (Beats 1, 2, 4) + bracket whooshes (Beats 3, 5) and a single low "reveal" hit on the Beat 6 payoff; final render mastered to **−14 LUFS / ≤ −1 dBTP** via two-pass `loudnorm`. SFX timing in `04-audio.md` (frame cues unchanged: 150, 255, 480 ticks; 255, 480 whoosh; 600 reveal hit).

---

## 📝 Metadata (for upload)
- **Title:** Cleopatra is closer to YOU than to the Pyramids
- **Description:** Egypt's queen Cleopatra was born ~2,500 years after the Great Pyramid — but only ~2,000 years before the Moon landing. Time is bigger than you think. #Shorts #history #facts
- **Hashtags:** #Shorts #history #Cleopatra #spacefacts #mindblown

---

## 📈 Channel notes
- **Length test:** render this 28s cut plus a tighter 22s cut (trim Beat 1 + Beat 4 transitions); compare retention curves and keep the winner.
- **Cadence:** aim 1×/day, never below 3–4×/week.
- **Metric to chase:** engaged views + retention, NOT loop-inflated vanity counts.
- **Post-render:** run the **render-qa** gate (frame count, loop seam, brightness/black-screen, per-beat dead-space, scale-honest mechanic, −14 LUFS) before upload.

---

### Frame map (for the validator — contiguous, half-open, 0-indexed · unchanged from v2)
| Segment | start | end | frames |
|---------|-------|-----|--------|
| Hook | 0 | 45 | 45 |
| Beat 1 | 45 | 150 | 105 |
| Beat 2 | 150 | 255 | 105 |
| Beat 3 | 255 | 375 | 120 |
| Beat 4 | 375 | 480 | 105 |
| Beat 5 | 480 | 600 | 120 |
| Beat 6 (payoff) | 600 | 765 | 165 |
| Loop-back | 765 | 840 | 75 |
| **Total** | **0** | **840** | **840 = durationInFrames (28s @ 30fps)** |
