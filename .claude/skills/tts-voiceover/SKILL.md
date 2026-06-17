---
name: tts-voiceover
description: Generates the spoken voiceover for a Short and derives the VO-driven timing. Use as STEP 3.5 of the /short pipeline (after the writer, before asset-sourcing). Reads the Narration block in 02-script.md, runs local Kokoro TTS, derives an integer-frame timing contract (vo-timing.json), writes the VO-derived frame map back into 02-script.md, and emits a music-ducking envelope. Local + free; no API keys.
version: 1.0.0
allowed-tools: Read, Write, Edit, Bash(python3 *), Bash(ffmpeg:*), Bash(espeak-ng:*)
user-invocable: false
---

# tts-voiceover

Step 3.5 of `/short`. Turns the writer's **Narration** into `vo.wav` + `vo-timing.json`, then writes
the VO-derived frame map into `02-script.md`. All timing logic is the bundled Python in `scripts/`
(unit-tested, stdlib-only); Kokoro/aeneas/ffmpeg are invoked only by `kokoro_io.py`.

## Inputs
- Run folder `output/F-NNN-<slug>/` with `02-script.md` containing a Narration block between
  `<!-- NARRATION:START -->` / `<!-- NARRATION:END -->` (lines `- [beat_id] spoken line`) and an
  empty frame-map block between `<!-- FRAME-MAP:START -->` / `<!-- FRAME-MAP:END -->`.
- The configured Kokoro voice NAME (default candidates: `am_michael` / `bm_george` / `af_bella`).
  Voices ship with the `kokoro` package; weights auto-download from Hugging Face (Apache-2.0).

## Install (one-time, on the host where `/short` runs)
```bash
pip install kokoro misaki soundfile numpy   # Python TTS + G2P + WAV I/O (all required)
sudo apt-get install -y espeak-ng ffmpeg     # phonemizer + audio (system)
pip install aeneas                            # OPTIONAL: forced-alignment fallback (hard to build)
```
Kokoro-82M weights auto-download from Hugging Face on first run (Apache-2.0). `soundfile`/`numpy` are
NOT optional — the primary synth path writes the WAV with them.

## Run
The CLI preflights, then runs. On a missing dep / unknown voice it STOPS and prints exactly what to
install (it does not fake audio):
```bash
python3 scripts/run.py <run_dir> [voice] [--fps 30] [--speed 1.0]
# voice defaults to am_michael; candidates: am_michael / bm_george / af_bella
# speed > 1.0 = faster/shorter (Kokoro convention)
```
Pipeline: normalize numbers/abbrevs → Kokoro synth → trim silence → Kokoro-native word durations
(aeneas fallback; the §3.6 failure detector gates both) → write `vo.wav`, `vo-timing.json` (integer
frames; `total` = durationInFrames; loop tail is a real beat entry), the ducking `envelope`, and
patch the frame map into `02-script.md`.

## Output contract (`vo-timing.json`)
Integer frames only. Keys: `fps, voice, speed, total, words[], beats[], speech_regions[],
envelope[]`. Downstream (`remotion-prompt-generator`, the validator) read frames from here — never
re-round from seconds.

## Boundaries
- Generates audio (not spec-only) — but only `vo.wav` + JSON + a script patch. No video, no upload.
- On alignment failure twice, or overrun > target+~15%, STOP and route back to the writer to cut
  words (do not ship bad sync or a too-long VO).

## Tests
`cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v`
(The e2e test self-skips unless `KOKORO_VOICE` + `kokoro` are installed.)
