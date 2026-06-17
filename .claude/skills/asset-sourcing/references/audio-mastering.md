# Audio mastering & mix levels (loudness)

Sourcing/licensing lives in `audio-sources.md`. **This file governs how loud the audio is.** It exists because F-001 shipped at **-30.6 LUFS** — ~16 dB under YouTube norm, near-silent in-feed. Do not repeat that.

## The one rule that prevents it

**The VO is the LEAD; the music bed DUCKS under it.** These Shorts now carry a Kokoro voiceover (step 3.5). The voice plays at full; the **music bed ducks beneath it** (≈0.72 → ≈0.22 under speech) via the deterministic `vo-timing.json` `envelope`, then swells on the payoff. The bed is never the thing that's loud during speech — but it is never crushed to ~0.10 either; in the gaps and on the payoff it carries the energy. The thing that caused F-001 (-30.6 LUFS) was a flat ~0.11 bed with no master step — do not repeat that: master to -14 LUFS regardless.

**No-VO special case:** if a Short has no voiceover, the music bed is itself the LEAD — mix it loud (0.65–0.80), nothing to duck under. (Channel default is VO.)

## Final-master target (non-negotiable)

The **rendered file** must measure:
- **Integrated loudness: -14 LUFS** (YouTube's normalization target; quieter masters are NOT boosted by YouTube, they just play quiet)
- **True peak: ≤ -1 dBTP** (no clipping after YouTube's re-encode)
- **LRA: keep the riser's dynamics** — these videos build quietly then hit a payoff, so target `LRA=11` and use two-pass so the build→climax contrast survives (don't crush it flat).

Per-element `<Audio volume>` values set *balance*. The **master step sets loudness.** Both are required.

## Pre-master balance in Remotion (VO-lead)

Relative levels so the render is already in a sane range (keeps the master's gain small, so peaks aren't hard-limited):

| Element | `<Audio volume>` | Role |
|---|---|---|
| **Voiceover `vo.wav` (lead)** | **0.9–1.0** | the spine; always intelligible |
| Music bed (ducked) | **base ~0.72 → ~0.22 under speech** via the `vo-timing.json` `envelope` frame-callback | supports the voice; un-ducks in gaps |
| Bed swell into payoff | rises back toward base (and a touch above) after the final speech region | underscores the build |
| Accent SFX (ticks/whoosh) | 0.5–0.7 | sit *above* the ducked bed |
| Reveal hit (payoff) | **0.9–1.0** | loudest non-VO element; peak near -1 dBFS in the render |

The bed `volume` is a frame-callback reading the `envelope` keyframes (attack ~2f, release ~9f, regions merged under ~9f) — not a flat gain, not a live sidechain. The loop tail fades the bed to 0 (VO already ended). This is balance only — absolute loudness is fixed by the master step below.

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
