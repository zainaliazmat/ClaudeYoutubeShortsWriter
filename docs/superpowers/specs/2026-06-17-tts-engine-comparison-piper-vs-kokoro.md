# TTS Engine Comparison — Piper vs Kokoro (for the Fathom `/short` pipeline)

**Date:** 2026-06-17 · **Purpose:** decide the channel-default TTS engine before building the I/O shell in Plan 1. Weighted to *our* constraints, not a generic listicle.

## Our decision criteria (in priority order, from the channel goals)
1. **Sounds good / retention** — the user's whole reason for adding VO ("without TTS doesn't look nice"). The voice IS the personality on a faceless channel.
2. **Monetization-safe licensing** — channel is monetized; CLAUDE.md already mandates "monetization-safe only, license recorded."
3. **Runtime fit** — the pipeline is Python; the renderer is Remotion (Node/TS).
4. **Word-level timestamps** — VO drives the frame map; captions sync to word onsets. This is the load-bearing risk in the spec.
5. **Determinism** — reproducible renders (the pipeline bans `Math.random()`; we commit-and-reproduce).
6. Speed / language breadth — minor for batch-rendered ~30s English shorts.

---

## TL;DR — recommendation: **switch to Kokoro**

Kokoro wins the four criteria that matter most to us (quality, licensing, Node fit, and — surprisingly — native timing), and loses only on *verified* determinism and low-end speed, neither of which is load-bearing for batch-rendered shorts. **Specifically: use the Python `kokoro` package in the pipeline** (it exposes native word timing — see §4/§5), not `kokoro-js` (whose Node path does *not*). This flips our earlier Piper choice.

| Criterion (weight) | Piper | Kokoro | Winner |
|---|---|---|---|
| 1. Voice quality / retention | Fast VITS, widely felt "robotic" (not a benchmarked fact) | Near-SOTA for size; **#1 on TTS Arena pre-release**, ~44% win-rate v2 | **Kokoro** (decisive) |
| 2. Monetization licensing | **Per-voice minefield**; engine relicensed MIT→**GPL-3.0**; some voices restrictive (Blizzard) | **Apache-2.0 weights**, clean for commercial/monetized | **Kokoro** (decisive) |
| 3. Runtime fit | CLI/Python/C++ binary + espeak-ng | Python pkg (native timing) **or** `kokoro-js` native in Node/Transformers.js | **Kokoro** |
| 4. Word timestamps | **No** native word-timestamp output → external aligner required | **Python `kokoro` exposes native timing**; timestamped-ONNX variant exists | **Kokoro** |
| 5. Determinism | **Verified deterministic** (commit-and-reproduce) | **Unverified** (likely stable; not documented) | **Piper** |
| 6. Speed / languages | Faster on Pi-class HW; 43 languages | Real-time+ on CPU, fast on GPU; 8 langs / 54 voices (excellent EN) | Piper (but irrelevant here) |

---

## Dimension-by-dimension (sourced)

### 1. Voice quality
- **Kokoro:** "Kokoro v0.19 ranked first on the TTS leaderboard in the weeks leading up to its release" (aibase, ~Jan 2025); 82M params reaching "results comparable to models like XTTS v2 (467M) and MetaVoice (1.2B)"; ~44% win-rate on TTS Arena V2 (search synthesis — *the live leaderboard table wasn't quotable, treat the exact % as partially unverified*).
- **Piper:** no citable benchmark calling it "robotic" — that's community sentiment, not a sourced fact. Piper isn't positioned on the quality leaderboards Kokoro tops; CPU comparisons of Piper focus on *speed*, not MOS.
- **Verdict:** Kokoro is clearly the higher-quality voice; this is the single biggest factor for a faceless channel and maps directly to the user's goal.

### 2. Licensing (the sharp edge for a monetized channel)
- **Piper engine:** original `rhasspy/piper` was MIT but **archived Oct 6, 2025**; development moved to `OHF-Voice/piper1-gpl` — **GPL-3.0**, and it "embeds espeak-ng for phonemization" (GPL). GPL governs *distributing the software*, not the audio, but it's a real compliance consideration.
- **Piper voices:** NOT uniformly licensed. Maintainer (Discussion #271): *"The Piper project is intended for text to speech research… does not impose any additional licenses on the checkpoints… it is the responsibility of the end user to make the ultimate judgement."* VOICES.md: *"Some voices may have restrictive licenses, however, so please review them carefully!"* → **commercial-OK depends on the exact voice's MODEL_CARD**; some derive from restrictive (e.g. Blizzard) data.
- **Kokoro:** weights are **Apache-2.0** (`hexgrad/Kokoro-82M` model card: `license: apache-2.0`); the ONNX/`kokoro-js` distribution is Apache-2.0 too (npm "License" field itself was unquotable — 403 — but confirmed via parent repo + ONNX card).
- **Verdict:** Kokoro is unambiguously clean for monetized YouTube. Piper requires per-voice legal diligence and the engine just moved to GPL — a poor fit for our "monetization-safe, license recorded" standard.

### 3. Runtime / integration
- **Piper:** CLI binary + Python + C/C++ APIs; `pip install piper-tts`; ONNX models; embeds espeak-ng.
- **Kokoro:** Python `kokoro` (uses **misaki** G2P + espeak-ng) **or** `kokoro-js` — native Node via 🤗 Transformers.js/ONNX (`npm i kokoro-js`, devices `cpu`/`wasm`/`webgpu`, no Python).
- **Verdict:** Kokoro is more flexible for us. Two clean placements: **Python `kokoro` in the pipeline** (matches our Python engine + gives native timing), or `kokoro-js` in the Remotion repo (if we ever move generation to render-time). Piper is just a binary shell-out.

### 4. Word-level timestamps (the load-bearing risk — and a Plan-1 correction)
- **Piper:** **no documented native word-timestamp/JSON alignment output** — WAV only. You need an external aligner (aeneas / WhisperX / MFA). ⚠️ **This contradicts Plan 1's assumption** that "Piper-native phoneme durations" would be the *exact-by-construction primary* path. With Piper, aeneas would have to be the primary, not the fallback — weakening the very premise that made VO-drives-timing safe.
- **Kokoro (Python):** *"In Python, Kokoro exposes timing-related data directly"* — tokens carry timing fields during synthesis. There's also a community `Kokoro-82M-v1.0-ONNX-timestamped` export (HeadTTS) providing phoneme-level timestamps.
- **Kokoro (`kokoro-js`):** does **NOT** expose native alignment — only `{text, phonemes, audio}` per streamed chunk; word timing must be approximated by chunk-duration distribution or done with a forced aligner.
- **Verdict:** **Python `kokoro` is the best native-timing story of all options** — better than Piper, which has none. This is the key insight: choosing Kokoro *and the Python package* actually de-risks our load-bearing concern instead of relying on aeneas. (kokoro-js would *not* — so if we go Kokoro, go Python-kokoro for the pipeline.)

### 5. Determinism
- **Piper:** **verified deterministic** — "the output is fully deterministic, so you can commit the generated WAV files to git and reproduce them later" (tqdev, 2026). (General VITS is stochastic, but Piper's default inference is reported deterministic.)
- **Kokoro:** **unverified** — no determinism/seed guarantee found. It uses a fixed voice-style vector per voice (suggesting stable output for fixed input), but there's no citable guarantee.
- **Verdict:** Piper's only clearly-relevant win. **Mitigation if we pick Kokoro:** we already generate `vo.wav` once in the pipeline and treat it as an artifact — generate once, **commit `vo.wav` + `vo-timing.json`**, and reproducibility is achieved by reuse, not re-synthesis. So determinism is mitigatable to a non-issue for our flow.

### 6. Speed / voices
- **Speed:** Piper ~RTF 0.2, great on Raspberry-Pi-class HW; Kokoro ~RTF 0.03 on GPU, ~2× real-time on CPU. Both are faster-than-real-time; for a batch-rendered ~30s short, neither is a constraint.
- **Voices/languages:** Piper 43 languages (broad); Kokoro 8 languages / 54 voices but **excellent English** (US: `af_bella` top-graded female, `am_*` males; UK: `bf_emma`, `bm_george`/`bm_fable`). For an English facts channel, Kokoro's English set is more than enough and higher quality.

---

## What switching to Kokoro changes in our plan

- **Spec:** update the "TTS engine = Piper" decision to **Kokoro (Python `kokoro` package)**; note Apache-2.0 (cleaner for the monetization standard); keep VO-drives-timing, in-pipeline generation, ducking, disclosure=YES.
- **Plan 1 (engine):** the **pure logic is unchanged** — `normalize.py`, `timing.py`, `failure_detector.py`, `envelope.py`, `framemap.py` are engine-agnostic (this is exactly why they were isolated). Only **Task 7** changes: replace `piper_io.py` with `kokoro_io.py` that calls Python `kokoro`, pulls its **native token timing** (primary, now genuinely exact), trims silence, and keeps **aeneas as the fallback**. Tasks 8–9 swap the module name + preflight (check `kokoro` importable + espeak-ng + the configured voice). ~1 task's worth of change, not a rewrite.
- **Determinism:** add "commit `vo.wav` + `vo-timing.json` as artifacts; never re-synthesize a shipped run" to the spec (covers Kokoro's unverified determinism).
- **Host deps:** `pip install kokoro misaki` + `espeak-ng` + the voice (downloaded from HF) instead of the `piper` binary.

## Open items before locking
1. **Confirm Python `kokoro` native token timing** is granular enough (per-word, not just per-sentence) on a real sample — verify in the gated e2e test, same as we'd planned for Piper.
2. **Determinism spot-check** — synthesize the same line twice; confirm byte-identical (or commit-the-artifact policy makes it moot).
3. Voice pick from samples (af_bella / am_michael / bm_george etc.) — unchanged plan.

## Sources
Piper: github.com/OHF-Voice/piper1-gpl (+ VOICES.md), github.com/rhasspy/piper (archived), rhasspy/piper Discussion #271 (voice licensing), tqdev.com/2026-piper-voices-tts-telephony (determinism). Kokoro: huggingface.co/hexgrad/Kokoro-82M (license + VOICES.md), github.com/hexgrad/kokoro (+ kokoro.js), huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX, ryanwelch.co.uk/blog/kokoro-word-timestamps (JS timing limits), github.com/met4citizen/HeadTTS (timestamped variant), aibase.com/news/14720 (leaderboard). Caveats: TTS Arena V2 live table + npm license field were not directly quotable (403/UI-only); Kokoro determinism unverified.
