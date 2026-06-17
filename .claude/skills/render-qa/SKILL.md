---
name: render-qa
description: Post-render pixel QA for a rendered Short. Use as STEP 8 of the /short pipeline — AFTER the Remotion project produces out.mp4/final.mp4, not part of the spec package. Inspects the actual rendered file against 05-remotion-prompt.md — duration vs durationInFrames, loop seam, caption/glyph collisions, per-beat dead-space + brightness, core-mechanic legibility, and integrated loudness — and emits a pass/fail report that routes failures back to the responsible spec file. Triggers on "QA the render", "check the rendered video", "review out.mp4", "did the render come out right", or right after a Short is rendered.
version: 1.0.0
allowed-tools: Read, Write, Bash(ffprobe:*), Bash(ffmpeg:*), Bash(mkdir:*), Bash(ls:*), Bash(rm:*)
user-invocable: true
---

# render-qa

Step 8 (post-render) of the `/short` pipeline. The earlier steps grade a *spec*; nobody looks at
pixels. This skill is the gate that catches what only shows up in the rendered file: flat/empty
frames, black-screen stretches, text/glyph collisions, a frame-count shortfall that breaks the
loop seam, an invisible core mechanic, and a quiet master. It runs **after** the Remotion project
renders `out.mp4`/`final.mp4` — it does **not** render anything itself.

> Why it exists: F-001 scored 92/100 and still shipped flat — near-black for all 28s, two ~6-second
> stretches that register as fully black, invisible hairline brackets, text colliding with a glyph,
> and 833 vs 840 frames. None of that was catchable from the script. This gate makes it catchable.

## Inputs (pass explicitly)
- The rendered file: `out.mp4` (pre-master) and/or `final.mp4` (mastered, post-loudnorm).
- The run folder `output/F-NNN-<slug>/` — read `05-remotion-prompt.md` for the expected
  `durationInFrames`, fps, per-beat frame ranges, hero sizes, layout bands, and the data-viz
  proportions; read `vo-timing.json` for the authoritative `total`/`fps`/word frames/`speech_regions`
  (check f); read `04-audio.md` for the loudness target.

Run loudness on `final.mp4` (mastered); run the visual checks on whichever file you're verifying
(usually `final.mp4` if it exists, else `out.mp4`).

## Setup
```bash
VID=final.mp4            # or out.mp4
QA=/tmp/render-qa && mkdir -p "$QA" && rm -f "$QA"/*.png 2>/dev/null
FPS=30                   # from vo-timing.json / 05-remotion-prompt.md
EXPECTED_FRAMES=$(python3 -c "import json;print(json.load(open('vo-timing.json'))['total'])")  # durationInFrames
```

## Checks (run all; report each ✅/❌ with the measured number)

### a. Duration / frame count
```bash
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$VID"
```
Must equal `EXPECTED_FRAMES`. **FAIL if off by >1** (F-001 shipped 833 vs 840 → loop-seam risk).
Also confirm width=1080, height=1920, r_frame_rate=30/1.

### b. Loop seam
Extract frame 0 and the final frame; they must match the spec's loop endpoints.
```bash
ffmpeg -loglevel error -i "$VID" -vf "select=eq(n\,0)" -frames:v 1 "$QA/seam_first.png"
ffmpeg -loglevel error -i "$VID" -vf "select=eq(n\,$((EXPECTED_FRAMES-1)))" -frames:v 1 "$QA/seam_last.png"
```
Read both images. FAIL on visible mismatch (different text/positions/colors) — the auto-loop will jump.

### c. Brightness / black-screen detection  ← F-001's headline failure
```bash
# Whole-file near-black segments (the only lit pixels are small text → reads as black in-feed):
ffmpeg -i "$VID" -vf "blackdetect=d=0.4:pix_th=0.10" -an -f null - 2>&1 | grep blackdetect
# Average luma sampled every ~0.5s (0–255 scale):
ffmpeg -i "$VID" -vf "select='not(mod(n,15))',signalstats,metadata=print:file=-" -an -f null - 2>&1 | grep YAVG
```
**FAIL if** any `blackdetect` segment ≥ ~1.5s, OR mean `YAVG` stays below ~30 for most of the
runtime (target a lit average of ~40–70). A flat near-black background with sparse small text is
the #1 "empty / unappealing" failure — route back to `03-assets.md` (add background depth) and
`05-remotion-prompt.md` (frame utilization + hero scale).

### d. Per-beat frame inspection (dead space, collisions, core mechanic, hero scale)
Extract one representative frame per beat (use the beat START frames from `05-remotion-prompt.md`)
plus a couple mid-beat frames:
```bash
for f in 0 90 200 320 430 540 680 $((EXPECTED_FRAMES-1)); do
  ffmpeg -loglevel error -i "$VID" -vf "select=eq(n\,$f),scale=540:960" -frames:v 1 "$QA/beat_$f.png"
done
```
Read each PNG and judge:
- **Dead-space ratio** — estimate the background-only fraction of the safe area. **FAIL any beat
  >~60% empty** (route → `05` frame-fill, `03` motif/background).
- **Caption/glyph collision** — any text touching a glyph/marker or clipping the safe area (x:60–1020,
  y:154–1632)? **FAIL** (route → `05` overflow guard / lane reservation).
- **Hero scale** — does the beat's hero number/word dominate (≥ ~280px)? Timid uniform sizing → flag.
- **Decorative-layer visibility** — are timelines/bars/glyphs actually visible (not 1–2px hairlines
  or tiny icons lost on the background)? Invisible → flag (route → `03`/`05`).
- **Core-mechanic legibility** — for comparison/data-viz, is the central idea (e.g. two bar lengths)
  the most prominent thing on screen, and **proportional to the values**? A scale-dishonest or buried
  mechanic → **FAIL** (route → `05` scale-honest data viz).
- **Counter sanity** — no negative interim values in any count-up (clamp ≥ 0).

### e. Loudness (on the mastered file)
```bash
ffmpeg -i final.mp4 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | grep -A12 "input_i\|output_i" || \
ffmpeg -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -20
```
**FAIL if** integrated loudness isn't ≈ -14 LUFS (within ~1) or true peak > -1 dBTP (F-001 shipped
-30.6 LUFS → silent in-feed). Route → re-run the two-pass `loudnorm` master step in `04-audio.md`.

### f. Voiceover (VO present & audible · music ducked · captions aligned)  ← VO-default channel
Read `vo-timing.json` for `fps`, `total`, `speech_regions`, and word frames. The mp4 audio is the
mixed VO+bed (stems aren't separable post-render), so verify what the mix exposes:
```bash
# VO present & audible: mean volume across the whole track should be well above silence.
ffmpeg -i "$VID" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
# Speech-vs-gap energy: a speech region should be louder than a between-words gap and than
# the silent loop tail. Sample one speech region and one tail second (frames→seconds = f/FPS):
ffmpeg -i "$VID" -ss <speech_region_start/FPS> -t 1 -af volumedetect -f null - 2>&1 | grep mean_volume
ffmpeg -i "$VID" -ss <loop_tail_start/FPS>    -t 1 -af volumedetect -f null - 2>&1 | grep mean_volume
```
- **VO present & audible:** track is not silent; speech-region mean volume is clearly above the
  loop-tail/gap mean. **FAIL** if the track is silent or speech regions aren't louder than the tail
  (route → `05` audio layer / `04-audio.md`; check `vo.wav` was copied into `public/`).
- **Music ducked under VO:** the bed must be measurably quieter *inside* speech than between words
  (the envelope from `vo-timing.json`). Post-mix you can't isolate the bed, so judge by ear/level:
  the **voice stays intelligible over the bed** the whole time. **FAIL** if the bed buries the voice
  (route → `05` envelope wiring / `04-audio.md` duck levels).
- **Captions aligned to the VO:** spot-check 2–3 words — extract the frame at a word's `start` frame
  and confirm that word's caption is on screen. **FAIL if any spot-checked word is off by >±3 frames**
  (route → `05` caption generation from `vo-timing.json`).
```bash
for f in <word1.start> <word2.start> <word3.start>; do
  ffmpeg -loglevel error -i "$VID" -vf "select=eq(n\,$f),scale=540:960" -frames:v 1 "$QA/cap_$f.png"
done   # read each PNG; the spoken word at that frame must be the highlighted caption
```

## Output — write `08-render-qa.md` into the run folder
```markdown
# 08 — Render QA (F-NNN) · file: <final.mp4>
| Check | Result | Measured | Route-back if ❌ |
|-------|--------|----------|-----------------|
| a. Frame count | ✅/❌ | <n>/<expected> | 02-script / 05 |
| b. Loop seam | ✅/❌ | <match?> | 05 / 02 loop-back |
| c. Brightness / black | ✅/❌ | mean YAVG <n>; black segs <list> | 03 bg depth, 05 frame-fill |
| d. Per-beat (dead space / collision / hero / mechanic) | ✅/❌ | <per-beat notes> | 05 / 03 |
| e. Loudness | ✅/❌ | <I> LUFS / <TP> dBTP | 04-audio master step |
| f. Voiceover (present / ducked / caption-aligned) | ✅/❌ | speech vs tail mean vol; word-frame spot-checks | 05 audio+captions / 04-audio |
**Verdict:** PASS / FAIL — <one line>. On FAIL: fix the routed spec file, regenerate downstream, re-render, re-run render-qa.
```

## Boundaries
- Inspect pixels only — never edit the Remotion code or re-render here. On FAIL, name the
  responsible **spec file** to fix (so the fix flows through the pipeline next render), not a manual
  one-off patch to the video. Do not pass a render that fails any of a–e.
