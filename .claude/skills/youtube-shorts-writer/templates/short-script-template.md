# Short Script Template (Remotion-ready)

Fill every section. Delete the parenthetical guidance. Times assume 30fps — give frame counts so it drops straight into a Remotion `<Composition>`.

---

## 📌 Overview
- **Working title:** (internal, not on-screen)
- **Format:** (kinetic typography / data viz / ranking / list-countdown / explainer / code / comparison)
- **Niche:** (the recurring channel niche this belongs to)
- **Total runtime:** XX s  (= XXX frames @ 30fps)
- **One-line premise:** (what the viewer learns/feels in one sentence)

---

## 🎯 Hook Frame — 0.0s to 1.5s (frames 0–45)
> This is the thumbnail. It must be legible in <0.5s and promise the payoff.

- **On-screen text:** "(the exact words — bold, big, ≤6 words)"
- **Visual:** (the striking opening composition — what's animating, colors, layout)
- **Why it stops the swipe:** (one line — curiosity gap / bold claim / surprising visual)

---

## 🎬 Beats (~3s each — one cut per beat, new beat every 5–7s of narrative)

### Beat 1 — 1.5s–4.5s (frames 45–135)
- **On-screen text:** "(caption-style fragment)"
- **Visual / animation:** (one line Remotion can implement — e.g. "bar grows L→R, number counts 0→47")
- **Voiceover/narration (optional):** "(if using TTS — else leave blank)"

### Beat 2 — 4.5s–7.5s (frames 135–225)
- **On-screen text:** "..."
- **Visual / animation:** ...
- **Voiceover (optional):** "..."

### Beat 3 — 7.5s–10.5s (frames 225–315)
- **On-screen text:** "..."
- **Visual / animation:** ...

*(Add beats to fill the runtime. Keep each ~3s. Each beat advances info or escalates curiosity — if it does neither, cut it.)*

---

## 🔁 Loop-Back — final ~1s (last frames → frame 0)
> Make the auto-loop invisible so replays compound the view count.

- **Final frame composition:** (describe how it visually matches the Hook Frame — same colors/layout/text position)
- **The loop trick:** (e.g. "final question is answered by the hook text → rewatch to confirm", or "camera/element lands exactly where frame 0 begins")

---

## 💬 Captions
- **Style:** burned-in, large, high-contrast, word-by-word (faceless content lives on on-screen text)
- **Generation:** Remotion `@remotion/captions` / Whisper if narrated; otherwise hand-timed to beats
- **Safe zone:** keep text clear of the bottom ~15% (YouTube UI) and away from the very top

---

## 🔊 Audio
- **Track vibe:** (trending sound or royalty-free; describe energy/tempo)
- **Mix note:** keep music under captions; punch-in SFX on key cuts if it suits the format

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
