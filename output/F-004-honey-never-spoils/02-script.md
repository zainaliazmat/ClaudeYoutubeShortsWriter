# F-004 — Honey Never Spoils (script)

- **Working title:** One food never expires — honey
- **Format:** kinetic typography (`effective_style: kinetic-typography`) + ONE Lottie success-check accent on the reveal
- **Niche:** Facts
- **Target runtime:** ~28–32s — `durationInFrames` set by the VO in step 3.5
- **One-line premise:** every food in your kitchen expires except honey — because its chemistry (almost no water, acidic, bee-made hydrogen peroxide) makes it impossible for microbes to grow, which is why honey in ancient tombs survives thousands of years.

## Narration (spoken — the TTS reads ONLY this block)
<!-- NARRATION:START -->
- [hook] Everything in your kitchen has an expiration date. Except one food.
- [beat1] Honey. It's almost pure sugar with barely any water, so bacteria and microbes can't survive in it.
- [beat2] It's also acidic, and bees add an enzyme that makes hydrogen peroxide, a natural preservative.
- [beat3] So when archaeologists open ancient Egyptian tombs, they keep finding honey thousands of years old, still preserved.
- [beat4] The only catch: keep it sealed. Add water and it can spoil. But if it just crystallizes, it's still good.
<!-- NARRATION:END -->

## On-screen text (per beat — NOT the captions; captions come from vo-timing.json)
- **hook:** `ONE FOOD` / `NEVER EXPIRES`
- **beat1:** `HONEY` · `~0% water`
- **beat2:** `acidic + peroxide` · `microbes die`
- **beat3:** `1000s of years old` / `STILL PRESERVED` ✓ (success-check accent)
- **beat4:** `keep it sealed` · `crystals ≠ spoiled`

## Visual direction (kinetic typography — amber/honey palette)
- **Core motif:** a centered **honey jar** built from vector/type (no photo) on a warm dark ground; the
  big hero word lives in the upper/center band, supporting fragments lower, all clear of the caption zone.
- **hook:** open on bold hero `ONE FOOD` / `NEVER EXPIRES` in honey-gold on a deep amber-brown gradient;
  a subtle jar silhouette behind. Frame 0 = the thumbnail, legible <0.5s, hero at FULL opacity (no fade-in).
- **beat1:** `HONEY` slams in (names the subject); a stylized jar fills with gold; small `~0% water` tag.
  The fill is the cut's motion.
- **beat2:** two quick stat chips — `acidic` and `+ hydrogen peroxide` — with `microbes die` resolving;
  tight, punchy type animation.
- **beat3 — REVEAL / accent beat:** the jar/timeline reads `1000s of years old`; on the spoken word
  "preserved", the **Lottie success-check accent draws in** next to `STILL PRESERVED` as the verdict
  (✓). This is the emotional payoff — the claim is confirmed real. Accent centered/upper, clear of the
  safe area + captions.
- **beat4 / caveat:** `keep it sealed` with a lid snapping on; `crystals ≠ spoiled` reassurance; settle
  back toward the hook composition.
- **loop:** collapse to the hook's `ONE FOOD / NEVER EXPIRES` hero (same gold, same position) → silent tail → frame 0.

## Loop-back (final ~1s, silent tail → frame 0)
- **Final frame composition:** returns to the hook's `ONE FOOD / NEVER EXPIRES` hero, same honey-gold and layout.
- **The loop trick:** the hook withholds *which* food; the video answers "honey" and confirms it (✓); the
  loop drops you back on `ONE FOOD / NEVER EXPIRES` — rewatch to re-confirm the answer.

## Captions
- Burned-in, large, high-contrast, **word-by-word synced to the VO** (generated in step 5 from
  `vo-timing.json` integer word frames). Clear of the bottom ~15% and the very top. Hero type + the
  accent live in the upper/center bands so captions never collide.

## Audio (VO is the lead)
- **Voice:** Kokoro `am_michael` (set in step 3.5) — same channel voice as F-001/F-002/F-003.
- **Track vibe:** warm, light, curious royalty-free bed; a soft "draw"/chime SFX as the success-check
  accent completes on beat3, a gentle swell on "still preserved".
- **Mix:** VO LEAD; bed ducks ~0.72 → ~0.22 under speech, swells on the payoff. Master −14 LUFS / ≤ −1 dBTP.

## Metadata (for upload)
- **Title:** One food never expires. It's honey.
- **Description:** Why honey is the one food that never spoils — almost no water, acidic, and a bee-made preservative — so it survives thousands of years in ancient tombs. #Shorts #honey #science #didyouknow
- **Hashtags:** #Shorts #honey #foodscience #didyouknow

## Frame map (VO-patched — do not hand-edit; tts-voiceover writes this from vo-timing.json)
<!-- FRAME-MAP:START -->
| Segment | start | end | frames |
|---------|-------|-----|--------|
| hook | 0 | 109 | 109 |
| beat1 | 109 | 287 | 178 |
| beat2 | 287 | 452 | 165 |
| beat3 | 452 | 638 | 186 |
| beat4 | 638 | 840 | 202 |
| loop | 840 | 915 | 75 |
| **Total** | **0** | **915** | **915** |
<!-- FRAME-MAP:END -->

## Channel notes
- **Length test:** lands ~28–32s; if retention sags, try a 22s cut that merges beat2 into beat1.
- **Cadence:** aim 1×/day, never below 3–4×/week.
- **Metric to chase:** engaged views + retention, not loop-inflated view counts.
- **AI disclosure:** synthetic Kokoro voice ⇒ "Altered or synthetic content = YES" at upload.
