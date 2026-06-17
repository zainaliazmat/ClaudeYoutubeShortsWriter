# F-001 — Remotion Composition Prompt — v3

## Use the Remotion official skills to build this composition.
> `npx skills add remotion-dev/skills`. Build exactly what's specified — every frame, color, position and animation is pinned below. Do not invent facts or text; all on-screen copy is final.
>
> **v3 design (post-render review):** the v2 render was near-black and empty. v3 rebuilds the layout around a **VERTICAL timeline that fills the full 9:16 height**, **hero numbers that dominate (~340px Anton)**, a **scale-honest** two-segment gap (positions computed from the years), a **navy→indigo depth-gradient background**, fast ease-out count-ups, and a subject-identifier kicker. Frame map and audio cues are unchanged from v2.

- **Composition id:** `F-001-cleopatra-vs-pyramids`
- **Dimensions:** 1080×1920 · **fps:** 30 · **durationInFrames:** **840** (28s)
- Frames 0-indexed; scene ranges half-open & contiguous (`next.start == prev.end`); final scene loops back to the frame-0 composition.
- All motion via `interpolate()` (with `extrapolateLeft/Right:'clamp'` + `Easing.*`) or `spring()`. **No `Math.random()`** — use Remotion `random(seed)` for stars.

---

## Design tokens (from `03-assets.md`)

**Fonts** (via `@remotion/google-fonts`):
- Display/hero (hook, year stamps, hero numbers, payoff): **Anton** 400 — `@remotion/google-fonts/Anton`
- Count-up rolling digits only: **Space Mono** 700 — `@remotion/google-fonts/SpaceMono`, `letter-spacing:-0.04em` on large numbers. (The *settled* hero number sets in Anton; mono is only the live counter.)

**Colors:**
| Token | Hex | Use |
|-------|-----|-----|
| `bgTop` | `#0B1430` | gradient top (Pyramid/ancient end) |
| `bgBottom` | `#1C2A55` | gradient bottom (Moon/modern end) |
| `glow` | `#2E4A8C` @35% | ~900px radial behind center hero |
| `nebula` | `#3A2C6B` @12% | faint upper-left wash |
| `text` | `#F4F1E8` | captions / context |
| `gold` | `#F2B53C` | ancient side — Pyramid years + Pyramid→Cleopatra segment |
| `ice` | `#6FD3FF` | modern side — 1969, Cleopatra→Moon segment, payoff pulse |
| `rule` | `#5B6BA8` | timeline spine, **≥12px** thick |

**Persistent background layer (z:0, ALL 840 frames) — never flat black:**
- `<AbsoluteFill>` with a vertical linear gradient `bgTop→bgBottom` over the full 1920px.
- Radial `glow` (~900px, `#2E4A8C` @35%) centered behind the hero (≈x540,y900); softly breathes scale 1.0↔1.04 over ~120f.
- Faint `nebula` blob upper-left (`#3A2C6B` @12%, large blur).
- Star field: single `<svg>`, ~70 dots **2–4px** `#F4F1E8` @25–60%, placed with `random('stars')` (NOT `Math.random`); drift `translateY` `interpolate(frame,[0,840],[0,-56])` (~+2px/s up).

**Motion configs:** `wordSlamIn` spring t200/d22 (Y+48→0, 8f) · `heroOvershoot` spring t200/d13 (scale 0.55→1.0 overshoot ~1.10, 12f) · `yearStampShake` spring t420/d28 (±5px, 3 cycles, 12f) · `segmentGrow` spring t130/d24 (scaleY 0→1 anchored top, 28–34f) · `payoffGlow` sinusoidal shadow blur 4→18→4px (continuous, ~3 cycles/165f) · `nodeNudge` spring t110/d20 (Y +0→+28, 18f) · `crossDissolve` linear opacity 75f.

---

## The vertical timeline (the spine of every scene) — SCALE-HONEST, computed from the years

- **Spine:** a `#5B6BA8` **≥12px-wide** vertical bar at **x≈170** (left lane), running **y 300 (TOP node) → y 1500 (BOTTOM node)** = **1200px** over the full safe height. Soft glow.
- **Nodes (positions computed from `01-verified-facts.md`, NOT eyeballed):** span = 2560 BC→1969 = **4,529 yrs over 1200px ⇒ 0.2650 px/yr**.
  - **Pyramid** (2560 BC, year 0) → **y 300** (top). Large **gold pyramid silhouette ~360px** anchored here.
  - **Cleopatra** (69 BC = 2,491 yrs after pyramid) → y 300 + 2491·0.265 = **y 960** (≈55% down, just below center). Node marker + "Cleopatra" label.
  - **Moon** (1969 = 4,529 yrs) → **y 1500** (bottom). Large **ice moon disc ~360px** anchored here.
- **Segments (proportional, verifies the payoff):** Pyramid→Cleopatra = y300→960 = **660px** (2,491 yr); Cleopatra→Moon = y960→1500 = **540px** (2,038 yr). 660/540 = 1.22 = the real ratio → the gold gap is honestly longer than the ice gap. **Do NOT pin non-proportional lengths.** Both bars are **14px-wide, centered on the spine at x≈170, COLLINEAR** — gold (y300→960) directly above ice (y960→1500), meeting at the Cleopatra node — so ice *continues* gold on the same axis and reads as visibly shorter. No separate side-by-side lane; segments never cross into the content lane (x≥320).

**Lane discipline (no caption/glyph collision):** spine + node motifs + segment bars live in the **left lane x 120–300**; context kickers + hero numbers + captions live in the **content lane x 320–1020**. Never overlap them. All within safe area y 154–1632.

---

## Scenes (frame-exact) · bands = context (upper third) / hero (center) / timeline (left, full height)

### Scene 0 — Hook (frames 0–45)  — fully lit at frame 0, complete claim incl. "YOU"
- **Context kicker (upper, y≈360, content lane):** `EGYPT'S QUEEN` — Anton ~70px, `gold`, letter-spaced caps.
- **Hero (center, y≈820–1040, content lane):** `Cleopatra is closer to YOU` (Anton ~96px, `text`; **YOU** ~132px `gold`) / `than the Pyramids` (Anton ~104px, `gold`).
- **Timeline (left lane):** faint preview — spine @40% with the gold pyramid (top) + ice moon (bottom) dimly visible; "Cleopatra" hint near y960. No segments yet.
- **Animation:** kicker + lines `wordSlamIn` staggered (kicker@0, line1@6, line2@12); **YOU** `heroOvershoot` @24. Frame 0 already shows the full text (emphasis animates, word never withheld).
- **z:** bg(0) < timeline-preview(1) < text(2).
- **Frame-fill note:** left spine fills the vertical; content lane carries kicker(upper)+hero(center); glow fills center; no dead zone.

### Scene 1 — Beat 1 (frames 45–150)
- **Context (upper, y≈360):** `THE GREAT PYRAMID` — Anton ~64px `text`.
- **Hero (center, y≈900):** `2560 BC` — Anton **~340px** `gold`.
- **Timeline:** spine draws in top→bottom (45–75); **gold pyramid silhouette ~360px** pops at the TOP node (y300) with `yearStampShake`-synced glow.
- **Animation:** context `wordSlamIn`@45; `2560 BC` `yearStampShake`@~95 (stone impact). Tick SFX @150.
- **Frame-fill note:** pyramid motif + spine fill upper-left through full height; hero year dominates center. 0% dead.

### Scene 2 — Beat 2 (frames 150–255)
- **Context (upper):** `EGYPT'S QUEEN · CLEOPATRA` — Anton ~60px `text`.
- **Hero (center, y≈900):** `69 BC` — Anton **~340px** `gold`.
- **Timeline:** **Cleopatra node** marker + label lands at **y960 (55% down)** via `wordSlamIn`; pyramid stays pinned top. Tick SFX @255.
- **Animation:** `69 BC` `yearStampShake`@~200.
- **Frame-fill note:** spine now shows two nodes spanning the height; hero year center. No empty band.

### Scene 3 — Beat 3 (frames 255–375) · first gap
- **Context (upper):** `PYRAMID → CLEOPATRA` — Anton ~58px `text`.
- **Hero (center, y≈900):** rolling Space Mono counter `0→2,500` then settled `~2,500` + `YEARS` (Anton ~340px `gold`).
- **Timeline:** **gold segment grows DOWN** the spine y300→960 (**660px**, `segmentGrow` 28–34f) — synced with the counter so the screen is never just a lone digit. Whoosh SFX @255.
- **Counter:** `Math.round(interpolate(frame,[255,285],[0,2500],{easing:Easing.out(Easing.cubic),extrapolateLeft:'clamp',extrapolateRight:'clamp'}))` wrapped in `Math.max(0,…)` — **never negative**; **~30f ease-OUT then holds**. Settled `~2,500 YEARS` `heroOvershoot`@~360.
- **Frame-fill note:** growing gold bar fills left height; hero number center; context upper. 0% dead.

### Scene 4 — Beat 4 (frames 375–480)
- **Context (upper):** `THE MOON LANDING` — Anton ~64px `text`.
- **Hero (center, y≈900):** `1969` — Anton **~340px** `ice`.
- **Timeline:** focus drops to BOTTOM — **ice moon disc ~360px** at y1500 lights up; small `Rocket` (`lucide-react`, ~120px `ice`) beside it with launch-flash (opacity 0→1, 6f). Gold segment stays visible above. Tick SFX @480.
- **Animation:** `1969` `yearStampShake`@~430 (ice = modern side).
- **Frame-fill note:** moon motif anchors bottom, pyramid top, hero center — full height used.

### Scene 5 — Beat 5 (frames 480–600) · second gap
- **Context (upper):** `CLEOPATRA → MOON` — Anton ~58px `text`.
- **Hero (center, y≈900):** rolling counter `0→2,000` then settled `~2,000` + `YEARS` (Anton ~340px `ice`).
- **Timeline:** **ice segment grows DOWN** Cleopatra→Moon y960→1500 (**540px**, 14px wide, x≈170) — **collinear below the gold one on the spine**, continuing it from the Cleopatra node on the same axis so the two are directly comparable and **ice is visibly shorter**. Whoosh SFX @480.
- **Counter:** same clamp pattern, `interpolate(frame,[480,510],[0,2000],{easing:Easing.out(Easing.cubic),…})`, `Math.max(0,…)`, ~30f ease-OUT then hold. `~2,000 YEARS` `heroOvershoot`@~585.
- **Frame-fill note:** both segments now fill the spine (gold 660 + ice 540); hero center. No dead zone.

### Scene 6 — Beat 6 / Payoff (frames 600–765)
- **Hero (center, staged):** `She's ~450 YEARS closer` (`~450` Anton ~340px `ice`; rest ~76px `text`) / `to the Moon landing` / `than the Pyramids`.
- **Timeline:** both segments shown **collinear on the spine** (gold y300→960 above ice y960→1500, x≈170, 14px) so the **shorter ice gap is directly readable below the longer gold gap**; the **ice segment `payoffGlow` pulses continuously** (never static through the dwell). The two values `2,500` vs `2,000` flash, then `~450 YEARS CLOSER` stamps; **Cleopatra node `nodeNudge` eases downward (+28px) toward the Moon.** Reveal-hit SFX @600.
- **Animation:** lines staggered `wordSlamIn` (600 / 675 / 720); glowing hold 720–765.
- **z (Beat 6):** bg(0) < timeline+segments(1) < flashing 2,500/2,000 values(2) < payoff lines + "~450"(3) — the payoff text is always topmost.
- **Frame-fill note:** side-by-side bars + glow fill left+center; three payoff lines step down content lane. 0% dead.

### Scene 7 — Loop-Back (frames 765–840)
- **Action:** `crossDissolve` — Beat-6 layer opacity 1→0 (765–820); Hook layer 0→1 (790–840). Segments fade so the final frame matches the Hook (faint timeline preview only, no grown segments). Gradient + star field continuous.
- **End state @ frame 840:** pixel-matches frame 0 (`EGYPT'S QUEEN` / `Cleopatra is closer to YOU` / `than the Pyramids`, identical positions/scales/colors, faint timeline, no segments) → auto-loop invisible.

---

## Captions (burned-in, word-by-word, hand-timed — no Whisper/VO)
Accent the hero word/number per beat (gold = ancient side, ice = modern side). All within y 154–1632, content lane x 320–1020, clear of the timeline lane.

| Scene | Word group | Frame window |
|-------|-----------|--------------|
| Hook | "EGYPT'S QUEEN" | 0–10 |
| Hook | "Cleopatra" | 10–18 |
| Hook | "is closer to" | 18–24 |
| Hook | "YOU" | 24–33 |
| Hook | "than the Pyramids" | 33–45 |
| Beat 1 | "The Great Pyramid" | 45–95 |
| Beat 1 | "2560 BC" | 95–150 |
| Beat 2 | "Egypt's queen, Cleopatra" | 150–200 |
| Beat 2 | "born 69 BC" | 200–255 |
| Beat 3 | "Pyramid to Cleopatra" | 255–300 |
| Beat 3 | "~2,500 years" | 300–375 |
| Beat 4 | "The Moon landing" | 375–430 |
| Beat 4 | "1969" | 430–480 |
| Beat 5 | "Cleopatra to the Moon" | 480–540 |
| Beat 5 | "~2,000 years" | 540–600 |
| Beat 6 | "She's ~450 years closer" | 600–675 |
| Beat 6 | "to the Moon landing" | 675–720 |
| Beat 6 | "than the Pyramids" | 720–765 |

---

## Audio (`@remotion/media` `<Audio>`; reference via `staticFile()` from `public/`)
Renderer downloads files from the URLs in `04-audio.md` at render time into `public/`. (Audio spec unchanged from the fixed v2.)

- **Music bed (LEAD — no VO):** `public/music-dark-tension.mp3` — base `volume={0.72}` via frame-callback: fade in 0→0.72 over 0–30; hold to 540; swell 0.72→~1.0 over 540–600; hold to 720; fade ~1.0→0 over 765–840 (silent at 840 for a clean loop).
- **SFX** (Pixabay Content License; one tick file reused 3×; SFX above the bed):
  - `public/sfx-tick.mp3` at frames **150 / 255 / 480** — `volume={0.60}`.
  - `public/sfx-whoosh.mp3` at frames **255 / 480** — `volume={0.50}` (segment grows).
  - `public/sfx-reveal-hit.mp3` at frame **600** — `volume={0.95}` (payoff peak; loudest).
- **Master (final step, not in Remotion):** two-pass `loudnorm` on the rendered `out.mp4` → **−14 LUFS / ≤ −1 dBTP / LRA 11** → `final.mp4`, then verify. Upload `final.mp4`.

---

## Loop-back
Final frame (840) cross-dissolves to the exact frame-0 Hook layout (same text/positions/scale/colors, faint timeline, no segments, gradient + stars continuous); music fades to silence by 840 — so the YouTube auto-loop is visually and sonically seamless.

---

## Assumptions made (where the script/specs were vague)
- **Vertical-timeline geometry** (spine x≈170, y 300→1500; Cleopatra node y960 = 55%) is computed from the verified years (0.265 px/yr) so the two segments are scale-honest — adjust spine thickness/x if the left lane crowds the hero, but keep the **proportional node positions and the 660:540 ratio**.
- **Hero numbers ~340px Anton** chosen to fill the content lane within 1080px; reduce ~10% only if a line clips (use `fitText`).
- **Counters** clamp `≥ 0`, ease-OUT over 30f, then hold (fixes v2's negative-value + drag).
- **Lane separation** (timeline left, text center) reserves caption lanes so nothing collides with the node glyphs (fixes v2's text/moon overlap).
- Frame map + audio cues kept identical to v2 so the fixed −14 LUFS audio still lines up.
