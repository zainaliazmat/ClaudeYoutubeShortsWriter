# F-002 — Script (VO-driven)

**Hook:** "T. rex lived closer to you than to Stegosaurus."
**Archetype:** vertical deep-time timeline (top = oldest, bottom = today), 3 nodes, 2 unequal gaps,
"closer to you" payoff. Scale-honest: segment lengths proportional to 84 My : 66 My.

## Narration (spoken — the TTS reads ONLY this block)
<!-- NARRATION:START -->
- [hook] T. rex lived closer to you than to Stegosaurus.
- [beat1] Stegosaurus roamed about 150 million years ago.
- [beat2] T. rex came around 66 million years ago.
- [beat3] That's roughly 84 million years apart.
- [beat4] But from T. rex to today?
- [beat5] Only 66 million years.
- [beat6] So the king of dinosaurs is closer to you than to Stegosaurus.
<!-- NARRATION:END -->

## On-screen text (per beat — NOT the captions; captions come from vo-timing.json)
- **hook:** kicker "DEEP TIME" · hero "closer to **YOU**" · "than to Stegosaurus"
- **beat1:** kicker "STEGOSAURUS · LATE JURASSIC" · hero "150 MYA" (gold, top node)
- **beat2:** kicker "TYRANNOSAURUS REX" · hero "66 MYA" (gold, mid node)
- **beat3:** kicker "STEGOSAURUS → T. REX" · hero "~84 MILLION YEARS" + count-up 0→84
- **beat4:** kicker "AND TO TODAY" · hero "1969→NOW" → "HUMANS" (ice, bottom node)
- **beat5:** kicker "T. REX → TODAY" · hero "~66 MILLION YEARS" + count-up 0→66 (ice)
- **beat6:** payoff "T. REX is ~18M years CLOSER to YOU" — two bars (84 up, 66 down) from the T. rex node

## Visual direction
Vertical spine: Stegosaurus pinned TOP (150 Mya), T. rex node at ~56% down (66/150 = 44% up from
bottom), "TODAY/HUMANS" pinned BOTTOM (0). Gold = ancient (Stego→T.rex), ice = modern (T.rex→now).
Gap1 segment (Stego→T.rex) = 84M; Gap2 (T.rex→now) = 66M → 84:66 = 1.27 (compute from the px/My scale).

## Frame map (VO-patched — do not hand-edit; tts-voiceover writes this from vo-timing.json)
<!-- FRAME-MAP:START -->
| Segment | start | end | frames |
|---------|-------|-----|--------|
| hook | 0 | 95 | 95 |
| beat1 | 95 | 206 | 111 |
| beat2 | 206 | 306 | 100 |
| beat3 | 306 | 395 | 89 |
| beat4 | 395 | 447 | 52 |
| beat5 | 447 | 518 | 71 |
| beat6 | 518 | 645 | 127 |
| loop | 645 | 720 | 75 |
| **Total** | **0** | **720** | **720** |
<!-- FRAME-MAP:END -->
