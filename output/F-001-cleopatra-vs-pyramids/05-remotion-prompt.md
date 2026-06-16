# F-001 — Remotion Composition Prompt

## Use the Remotion official skills to build this composition.
> `npx skills add remotion-dev/skills`. Build exactly what's specified — every frame, color, and animation is pinned below. Do not invent facts or text; all on-screen copy is final.

- **Composition id:** `F-001-cleopatra-vs-pyramids`
- **Dimensions:** 1080×1920 · **fps:** 30 · **durationInFrames:** **840** (28s)
- Frames 0-indexed; scene ranges are half-open & contiguous (`next.start == prev.end`); the final scene loops back to the frame-0 composition.
- All motion via `interpolate()` (with `extrapolateLeft/Right: 'clamp'` + `Easing.bezier`) or `spring()`. **No `Math.random()`** — use Remotion `random(seed)` for the star field.

---

## Design tokens

**Fonts** (via `@remotion/google-fonts`):
- Display/headings/captions: **Space Grotesk** 700/800 — `@remotion/google-fonts/SpaceGrotesk`
- Numbers/year stamps/counters: **Space Mono** 400/700 — `@remotion/google-fonts/SpaceMono` (monospace → no digit-width jitter during count-up)

**Colors:**
| Token | Hex |
|-------|-----|
| `bg` (night sky) | `#07090F` |
| `text` (captions) | `#F0EDE6` |
| `accent` (hero numbers, pyramid/left bracket) | `#C8A84B` |
| `glow` (payoff pulse, Moon/right bracket) | `#7EC8E3` |
| `rule` (timeline + bracket strokes) | `#3A3D4A` |

**Motion signature (reusable configs):**
- `wordSlamIn`: `spring({ frame, fps, config:{ tension:180, damping:20 } })` → translateY +40px→0, opacity 0→1, ~8f.
- `heroOvershoot`: `spring({ frame, fps, config:{ tension:200, damping:14 } })` → scale 0.6→1.0 (overshoot ~1.08), opacity 0→1, ~10f.
- `yearStampShake`: `spring({ frame, fps, config:{ tension:400, damping:30 } })` → translateX micro-oscillation (±4px, 3 cycles) then lock, ~12f.
- `countUp`: `interpolate(frame,[start,end],[0,target],{ easing: Easing.bezier(0.65,0,0.35,1), extrapolateLeft:'clamp', extrapolateRight:'clamp' })`.
- `bracketStretch`: `spring({ frame, fps, config:{ tension:120, damping:22 } })` → scaleX 0→1 on a left-anchored line, ~30f.
- `payoffGlow`: `interpolate(Math.sin(frame/…), …)` sinusoidal text-shadow blur 0→12px→0, opacity 0.6→1.0→0.6, 3 cycles over 165f.
- `crossDissolve`: `interpolate` opacity, linear.

**Persistent background layer (z:0, all 840 frames):**
- `<AbsoluteFill style={{ backgroundColor:'#07090F' }}>`.
- Star field: single `<svg>`, ~80 white dots (1–2px) placed with `random('stars')`-seeded coords (NOT `Math.random`). Drift `translateY` by `interpolate(frame,[0,840],[0,~56])` (≈ +2px/s) — barely perceptible.
- Timeline rule: 2px-tall `<div>`, full width, `#3A3D4A`, vertical center (y≈960). Present from Beat 1 onward (fade in frames 45–60); hidden on Hook & re-hidden on loop-back to match frame 0.

---

## Scenes (frame-exact)

> Layout convention: vertical center band only. Hero text centered horizontally. Timeline at y≈960; glyphs sit ON it. Keep ALL text within y: 154–1632 (clear of top ~8% and bottom ~15%).

### Scene 0 — Hook (frames 0–45)
- **Text (2 lines, centered, y≈760):** `Cleopatra is closer to YOU` / `than to the Pyramids`
- **Font/size/color:** Space Grotesk 800; "Cleopatra/than to the" 92px `#F0EDE6`; **"YOU"** 132px `#C8A84B`; **"Pyramids"** 100px `#C8A84B`.
- **Animation:** lines enter with `wordSlamIn` staggered (line1 @0, line2 @6f); "YOU" enters with `heroOvershoot` @ frame 24.
- **Glyphs (preview of layout):** faint `Triangle` (pyramid, `#C8A84B`, 36px) hard-left ~x:120; faint `Moon` (`#7EC8E3`, 36px) hard-right ~x:960, both at y≈960 at 40% opacity. Word "Cleopatra" conceptually sits right-of-center (visual hint of the payoff).
- **z:** bg(0) < glyphs(1) < text(2).
- **On screen simultaneously:** both text lines + faint glyphs. No timeline rule yet.

### Scene 1 — Beat 1 (frames 45–150)
- **Text:** `The Great Pyramid —` (Space Grotesk 700, 84px, `#F0EDE6`, y≈560) then year stamp **`~2560 BC`** (Space Mono 700, 120px, `#C8A84B`, y≈760).
- **Animation:** title `wordSlamIn` @45; timeline rule fades in 45–60; `Triangle` glyph (`#C8A84B`, 48px) draws/fades in at far LEFT of rule (x≈120, y≈960) by frame 75; `~2560 BC` enters with `yearStampShake` @ ~frame 95 (stone-impact).
- **Layout/z:** bg < rule/glyph < text. Title top, year stamp below.
- **Simultaneous:** title + year stamp + pyramid glyph on left end of timeline.

### Scene 2 — Beat 2 (frames 150–255)
- **Text:** `Cleopatra —` (Space Grotesk 700, 84px, `#F0EDE6`, y≈560) + **`born 69 BC`** (Space Mono 700, 120px, `#C8A84B`, y≈760).
- **Animation:** `Cleopatra` label slides in (`wordSlamIn`) and lands as a marker on the timeline to the RIGHT of the pyramid (marker dot at x≈760, y≈960); `69 BC` `yearStampShake` @ ~frame 200. Left bracket (`#C8A84B`, border-bottom) BEGINS `bracketStretch` from pyramid(x≈120) toward Cleopatra(x≈760), starting ~frame 225 (carries into Scene 3).
- **z:** bg < rule/glyph/bracket < text.
- **Simultaneous:** pyramid glyph (left), Cleopatra marker (right-of-center), year stamp, bracket starting to grow.

### Scene 3 — Beat 3 (frames 255–375)  · gap reveal
- **Text:** `That's` (Space Grotesk 700, 72px, `#F0EDE6`, y≈520) + hero **`~2,500`** + `YEARS apart` (Space Mono 700 for number 150px `#C8A84B`, Space Grotesk 700 for "YEARS apart" 64px `#F0EDE6`, centered y≈760).
- **Animation:** left bracket finishes `bracketStretch` (pyramid→Cleopatra). `countUp` drives a counter **0→2500** over frames 255–360 along/above the bracket (Space Mono, `#C8A84B`); on land (~360) the hero `~2,500` stamps center with `heroOvershoot`.
- **z:** bg < rule/bracket < counter/text.
- **Simultaneous:** full pyramid→Cleopatra bracket + ticking counter resolving into the big "~2,500 YEARS apart".

### Scene 4 — Beat 4 (frames 375–480)
- **Text:** `The Moon landing?` (Space Grotesk 700, 84px, `#F0EDE6`, y≈560) + **`1969`** (Space Mono 700, 130px, `#7EC8E3`, y≈760).
- **Animation:** timeline conceptually pans RIGHT (shift existing glyph/marker x-positions left by ~120px via `interpolate` 375–410, OR reveal Moon at far right x≈960). `Moon` glyph (`#7EC8E3`,48px) + `Rocket` (`#7EC8E3`,32px, stacked above) appear far right; small launch-flash (Rocket opacity 0→1 over 6f). `1969` `yearStampShake` @ ~frame 430 (note color is `glow`, not accent — it's the modern/Moon side).
- **z:** bg < rule/glyphs < text.
- **Simultaneous:** Cleopatra marker still visible mid-frame for reference + Moon/Rocket right + `1969`.

### Scene 5 — Beat 5 (frames 480–600)  · second gap
- **Text:** `Only` (Space Grotesk 700, 72px, `#F0EDE6`, y≈520) + hero **`~2,000`** + `years after her` (Space Mono 700 number 150px `#7EC8E3`; Space Grotesk 700 "years after her" 60px `#F0EDE6`, y≈760).
- **Animation:** SECOND bracket (`#7EC8E3`) `bracketStretch` Cleopatra(x≈760)→Moon(x≈960)… render it **directly beneath the first bracket** (offset y≈+70px) so the two lengths are visually comparable and the new one is clearly SHORTER. `countUp` **0→2000** frames 480–585; hero `~2,000` `heroOvershoot` on land.
- **z:** bg < rule/brackets < counter/text.
- **Simultaneous:** BOTH brackets stacked (long gold = 2,500, short blue = 2,000) + ticking counter + big "~2,000".

### Scene 6 — Beat 6 / Payoff (frames 600–765)
- **Text (3 staged lines, centered):** `She's ~450 years closer` (≈600) / `to the Moon landing` (≈675) / `than to the Pyramids` (≈720). Space Grotesk 800; **"~450"** as Space Mono 700 160px `#7EC8E3`; rest 76px `#F0EDE6`.
- **Animation:** both stacked brackets remain; the SHORTER (blue, Moon-side) `payoffGlow` pulses (3 cycles). `~450` enters `heroOvershoot` @600 then holds with glow. Cleopatra marker nudges visibly toward Moon side (`interpolate` x +60px over 600–660). Lines reveal staggered via `wordSlamIn`. Hold still ~720–765 to let it land.
- **z:** bg < rule/brackets < text(top).
- **Simultaneous:** the two brackets (comparison), glowing "~450 YEARS CLOSER", payoff lines.

### Scene 7 — Loop-Back (frames 765–840)
- **Action:** `crossDissolve` — all Beat 6 elements opacity 1→0 (765–820); Hook composition elements opacity 0→1 (790–840). Timeline rule + brackets fade out so the final frame matches the Hook (no rule visible at frame 0). Star field continues uninterrupted.
- **End state @ frame 840:** pixel-matches frame 0 (same `Cleopatra is closer to YOU / than to the Pyramids`, same positions/scales/colors, faint glyphs, no timeline rule) → auto-loop is invisible.

---

## Captions (burned-in, word-by-word, hand-timed — no Whisper/voiceover)
Render each word group as it pops; accent color on the hero word/number per beat. Safe zone: all within y 154–1632 (top ~8% & bottom ~15% clear).

| Scene | Word group | Frame window |
|-------|-----------|--------------|
| Hook | "Cleopatra" | 0–12 |
| Hook | "is closer to" | 12–24 |
| Hook | "YOU" | 24–33 |
| Hook | "than to the Pyramids" | 33–45 |
| Beat 1 | "The Great Pyramid" | 45–95 |
| Beat 1 | "built ~2560 BC" | 95–150 |
| Beat 2 | "Cleopatra" | 150–195 |
| Beat 2 | "born 69 BC" | 195–255 |
| Beat 3 | "That's" | 255–290 |
| Beat 3 | "~2,500 years" | 290–340 |
| Beat 3 | "apart" | 340–375 |
| Beat 4 | "The Moon landing?" | 375–430 |
| Beat 4 | "1969" | 430–480 |
| Beat 5 | "Only ~2,000 years" | 480–550 |
| Beat 5 | "after her" | 550–600 |
| Beat 6 | "She's ~450 years closer" | 600–675 |
| Beat 6 | "to the Moon landing" | 675–720 |
| Beat 6 | "than to the Pyramids" | 720–765 |

---

## Audio (`@remotion/media` `<Audio>`; reference via `staticFile()` from `public/`)
Renderer downloads files from the URLs in `04-audio.md` at render time and places them in `public/`. Expected filenames below.

- **Music bed (LEAD — no VO):** `public/music-dark-tension.mp3` — base `volume={0.72}` via frame-callback:
  - fade in 0→0.72 over frames 0–30; hold 0.72 to frame 540; swell 0.72→~1.0 over 540–600; hold through 720; fade ~1.0→0 over 765–840 (silent at 840 for clean loop).
- **SFX** (all Pixabay Content License; one tick file reused 3×; SFX sit above the bed):
  - `public/sfx-tick.mp3` at **frame 150**, **255**, **480** — `volume={0.60}` each (sequence 3 `<Audio>` instances with matching `startFrom`/offset).
  - `public/sfx-whoosh.mp3` at **frame 255** and **480** — `volume={0.50}` (bracket stretches).
  - `public/sfx-reveal-hit.mp3` at **frame 600** — `volume={0.95}` (payoff peak; loudest element).
- **Master (final step, not in Remotion):** run two-pass `loudnorm` on the rendered `out.mp4` → **-14 LUFS / ≤ -1 dBTP / LRA 11**, then verify. See `04-audio.md` master target. Upload the mastered file.

---

## Loop-back
Final frame (840) cross-dissolves back to the exact frame-0 Hook layout (same text/positions/scale/colors, faint glyphs, no timeline rule, star field continuous), and the music bed fades to silence by 840 — so the YouTube auto-loop is visually and sonically seamless. The hook is a claim; beats 1–6 are the proof; landing back on the claim invites a confirming rewatch.

---

## Assumptions made (where the script/specs were vague)
- **Exact pixel x-positions** (pyramid x≈120, Cleopatra marker x≈760, Moon x≈960) and **y-bands** (titles y≈560, hero numbers y≈760, timeline y≈960) are pinned here for unambiguous layout — adjust proportionally if a 1080-wide measure overflows, but keep the left→right *ordering* (pyramid ‹ Cleopatra ‹ Moon) and the "Cleopatra visually closer to Moon" relationship.
- **Font sizes** chosen to keep the longest line ("Cleopatra is closer to YOU") within 1080px with side margins; reduce by ~10% if it clips.
- **Beat-4 "pan"** implemented as a small x-shift of existing markers rather than a true camera move (simpler, deterministic).
- **Counter end frames** (360 for 2,500; 585 for 2,000) leave a short hold before the next cut so the landed number is readable.
- SFX/music exact files are selected from the Pixabay search pages in `04-audio.md` at render time; filenames above are the expected `public/` names.
