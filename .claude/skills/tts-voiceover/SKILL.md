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
Kokoro pulls in torch (multi-GB), and most modern distros mark system Python
"externally managed" (PEP 668), so install into a **virtualenv** at the repo root:
```bash
python3 -m venv .venv-tts                          # one-time; .venv-tts/ is gitignored
.venv-tts/bin/pip install kokoro misaki soundfile numpy   # TTS + G2P + WAV I/O
# espeak-ng (phonemizer) ships INSIDE the misaki dep `espeakng-loader` — no apt/sudo
# needed; the engine points PHONEMIZER_ESPEAK_LIBRARY at it automatically. Install
# the system pkg only if you prefer it: sudo apt-get install -y espeak-ng
# ffmpeg must be on PATH (silence-trim + envelope + master). aeneas is the OPTIONAL
# forced-alignment fallback (hard to build) — the Kokoro native path is primary.
```
Kokoro-82M weights auto-download from Hugging Face on first run (Apache-2.0); a spaCy
`en_core_web_sm` model also downloads once. `soundfile`/`numpy` are NOT optional — the
primary synth path writes the WAV with them.

## Run
The CLI preflights, then runs. On a missing dep / unknown voice it STOPS and prints exactly what to
install (it does not fake audio). Use the venv's interpreter:
```bash
.venv-tts/bin/python scripts/run.py <run_dir> [voice] [--fps 30] [--speed 1.0]
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
`cd .claude/skills/tts-voiceover && ../../../.venv-tts/bin/python -m unittest discover -s tests -v`
(Stdlib-only unit tests run under any python3; the two e2e tests run live when `kokoro` +
the voice are installed and self-skip otherwise. `test_real_audio_token_timing_alignment`
is the regression guard for Kokoro's per-word timing — token-count match + ±15% coverage
over the year/`BC` normalization hazard.)

## Verified Kokoro timing API (build: `kokoro` 0.9.4)
`KPipeline(lang_code=voice[0])(text, voice=…, speed=…)` yields `Result` objects; each
`result.tokens[i]` carries per-**word** `.start_ts`/`.end_ts` (seconds) + `.text`.
Punctuation (`.`/`,`) arrives as separate timed tokens — `kokoro_io` filters those so the
word stream aligns 1:1 with the normalized spoken tokens. If a future Kokoro build changes
this granularity, the §3.6 detector trips the aeneas fallback; fix `synth_and_durations`
to restore the per-word `(start_s, end_s)` contract.
