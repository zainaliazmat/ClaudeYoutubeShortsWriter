# Short Script Template (Remotion-ready, VO-driven)

Fill every section. Delete the parenthetical guidance. **The voiceover drives the timing:** you write the Narration + a rough per-beat target in seconds; step 3.5 (tts-voiceover) synthesizes the VO and patches the real integer frames into the frame-map block below. Do NOT hand-pin final frame ranges.

---

## 🎙️ Narration (spoken VO — drives the timing)
> Full natural sentences the voice reads aloud. **Spoken ≠ caption** (on-screen text stays fragments). Facts ONLY from `01-verified-facts.md`. Target ~28–32s total (~80–95 words). One line per spoken chunk, tagged with its beat id.

<!-- NARRATION:START -->
- [hook] (the spoken hook sentence)
- [beat1] (spoken sentence)
- [beat2] (spoken sentence)
<!-- NARRATION:END -->

## 🎞️ Frame map (filled by step 3.5 — leave empty)
<!-- FRAME-MAP:START -->
<!-- FRAME-MAP:END -->

---

## 📌 Overview
- **Working title:** (internal, not on-screen)
- **Format:** (kinetic typography / data viz / ranking / list-countdown / explainer / code / comparison)
- **Niche:** (the recurring channel niche this belongs to)
- **Target runtime:** ~XX s (~28–32s) — `durationInFrames` is set by the VO in 3.5, not declared here
- **One-line premise:** (what the viewer learns/feels in one sentence)

---

## 🎯 Hook Frame — target ~0–1.5s
> This is the thumbnail. It must be legible in <0.5s and promise the payoff. Frame 0 opens on the hook narration (no silent lead).

- **Narration (spoken):** "(matches the [hook] line above)"
- **On-screen text:** "(the exact words — bold, big, ≤6 words; a fragment, not the spoken sentence)"
- **Visual:** (the striking opening composition — what's animating, colors, layout)
- **Why it stops the swipe:** (one line — curiosity gap / bold claim / surprising visual)

---

## 🎬 Beats (~3s target each — one cut per beat)
> Give each beat a rough target in seconds. The real frame range comes from the VO (step 3.5).

### Beat 1 — target ~3s
- **Narration (spoken):** "(matches the [beat1] line)"
- **On-screen text:** "(caption-style fragment)"
- **Visual / animation:** (one line Remotion can implement — e.g. "bar grows L→R, number counts 0→47")

### Beat 2 — target ~3s
- **Narration (spoken):** "..."
- **On-screen text:** "..."
- **Visual / animation:** ...

### Beat 3 — target ~3s
- **Narration (spoken):** "..."
- **On-screen text:** "..."
- **Visual / animation:** ...

*(Add beats to fill ~28–32s of narration. Keep each ~3s. Each beat advances info or escalates curiosity — if it does neither, cut it.)*

---

## 🔁 Loop-Back — final ~1s (silent tail → frame 0)
> Make the auto-loop invisible so replays compound the view count. The tail is silent (VO ended, music fades out).

- **Final frame composition:** (describe how it visually matches the Hook Frame — same colors/layout/text position)
- **The loop trick:** (e.g. "final question is answered by the hook text → rewatch to confirm", or "camera/element lands exactly where frame 0 begins")

---

## 💬 Captions
- **Style:** burned-in, large, high-contrast, **word-by-word synced to the VO**
- **Generation:** emitted in step 5 from `vo-timing.json` integer word frames (NOT Whisper, NOT hand-typed windows) — captions show the display string per word
- **Safe zone:** keep text clear of the bottom ~15% (YouTube UI) and away from the very top

---

## 🔊 Audio (VO is the lead)
- **Voice:** Kokoro voice name (e.g. am_michael / bm_george / af_bella) — set in step 3.5
- **Track vibe:** (royalty-free bed; describe energy/tempo)
- **Mix note:** VO is the LEAD; the music bed **ducks under the voice** (~0.72 → ~0.22 during speech) and swells on the payoff; SFX punch the key cuts. Final render mastered to -14 LUFS / ≤ -1 dBTP (see asset-sourcing `audio-mastering.md`).

---

## 📝 Metadata (for upload)
- **Title:** (front-loaded, curiosity-driven, ≤ ~60 chars)
- **Description:** (1–2 lines + relevant hashtags)
- **Hashtags:** #Shorts + 2–4 niche tags

---

## 📈 Channel notes
- **Length test:** (e.g. "render 20s and 35s cuts; compare retention curves in Analytics and keep the winner")
- **Cadence:** aim 1×/day, never below 3–4×/week — consistency feeds the seed-audience test
- **Metric to chase:** engaged views + retention, NOT loop-inflated vanity view counts
