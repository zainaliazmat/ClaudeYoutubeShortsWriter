# Audio mastering & mix levels (loudness)

Sourcing/licensing lives in `audio-sources.md`. **This file governs how loud the audio is.** It exists because F-001 shipped at **-30.6 LUFS** — ~16 dB under YouTube norm, near-silent in-feed. Do not repeat that.

## The one rule that prevents it

**This channel has NO voiceover.** Kinetic typography = text + music + SFX only. So the **music bed is the LEAD element, not a background ducked under a voice.** The old "bed at ~0.10–0.15 under captions/dialogue" guidance is for narrated video and is WRONG here — it's what caused F-001. There is nothing to duck under. Mix the bed loud.

## Final-master target (non-negotiable)

The **rendered file** must measure:
- **Integrated loudness: -14 LUFS** (YouTube's normalization target; quieter masters are NOT boosted by YouTube, they just play quiet)
- **True peak: ≤ -1 dBTP** (no clipping after YouTube's re-encode)
- **LRA: keep the riser's dynamics** — these videos build quietly then hit a payoff, so target `LRA=11` and use two-pass so the build→climax contrast survives (don't crush it flat).

Per-element `<Audio volume>` values set *balance*. The **master step sets loudness.** Both are required.

## Pre-master balance in Remotion (no-VO)

Relative levels so the render is already in a sane range (keeps the master's gain small, so peaks aren't hard-limited):

| Element | `<Audio volume>` | Role |
|---|---|---|
| Music bed (lead) | **0.65–0.80** | the sustained main audio; rides up on the swell |
| Bed swell into payoff | bed × ~1.4 (≈ +3 dB) over the beat before the reveal | underscores the build |
| Accent SFX (ticks/whoosh) | 0.5–0.7 | sit *above* the bed, not buried |
| Reveal hit (payoff) | **0.9–1.0** | loudest element; peak near -1 dBFS in the render |

Fades stay as the spec dictates (e.g. bed fade-in 0→full over frames 0–30, fade-out over the loop-back). This is balance only — the absolute loudness is fixed by the master step below.

## Master step (run at render time, after Remotion outputs `out.mp4`)

Two-pass `loudnorm` is required for an accurate integrated target — single-pass overshoots.

**Pass 1 — measure:**
```bash
ffmpeg -hide_banner -i out.mp4 \
  -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null -
# read back: input_i, input_tp, input_lra, input_thresh, target_offset(=offset)
```

**Pass 2 — apply (video copied, zero quality loss; only audio is touched):**
```bash
ffmpeg -i out.mp4 \
  -c:v copy \
  -af loudnorm=I=-14:TP=-1:LRA=11:measured_I=<input_i>:measured_TP=<input_tp>:measured_LRA=<input_lra>:measured_thresh=<input_thresh>:offset=<offset>:linear=false \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart final.mp4
```

**Verify (gate):**
```bash
ffmpeg -hide_banner -i final.mp4 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | grep input_
# PASS if input_i ≈ -14 (±1) and input_tp ≤ -1 (a hair over, e.g. -0.7, is fine — no clip)
```

## Dark-gradient video note (10-bit)

These backgrounds are near-black gradients; YouTube's re-encode bands them on 8-bit sources. Prefer to **render 10-bit straight from Remotion** (`--codec h265 --crf 18` with a 10-bit pixel format) so the master pass can stay `-c:v copy`. If the render is 8-bit and you want 10-bit anyway, re-encode in pass 2 instead of copying (one generational loss, acceptable):
`-c:v libx264 -profile:v high10 -pix_fmt yuv420p10le -preset slow -crf 18 -x264-params aq-mode=3 -color_range pc`

## Worked example — F-001 (Cleopatra vs Pyramids)

- **Before:** integrated **-30.6 LUFS**, true peak -8.3 dBTP, bed mixed at `volume={0.11}` "under dialogue" (no dialogue existed). Inaudible next to other Shorts.
- **After two-pass loudnorm to -14:** integrated **-14.8 LUFS**, true peak **-0.65 dBTP**, **LRA held at 11.9** (the quiet-build → reveal-hit riser was preserved, not flattened). First frame's black lead-in was also trimmed (0.25s) but that's a video fix, not audio.
- See `output/F-001-cleopatra-vs-pyramids/04-audio.md` for the corrected spec.
