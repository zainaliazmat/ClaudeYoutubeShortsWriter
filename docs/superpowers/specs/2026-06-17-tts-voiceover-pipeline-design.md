# Design — TTS Voiceover for the `/short` Pipeline (VO-driven, local Piper)

**Date:** 2026-06-17 · **Status:** approved (design), pending spec review
**Driver:** F-001 v3 rendered well visually but feels empty/silent without narration. Decision: adopt TTS as the **channel default**, and add denser per-beat visuals at the same length.

---

## 1. Goal & success criteria

Add a spoken voiceover to every Fathom Short, generated locally and free, with on-screen
kinetic typography synced to the voice. After this change:

- Every `/short` run produces a `vo.wav` and a Remotion composition whose **frame map, captions,
  and audio are driven by the actual voiceover timing**.
- The music bed **ducks under the VO** (VO is the lead); final master stays **−14 LUFS / ≤ −1 dBTP**.
- The reviewer/validator still guarantee a contiguous, tiling frame map — now derived from the VO.
- `render-qa` verifies the VO is present, audible, ducked correctly, and caption-synced.
- AI-disclosure is set to **YES** (synthetic voice) on every upload.
- F-001 is regenerated as **v4** through the new flow, with denser visuals (~30s).

**Success = F-001 v4 renders with a clear Piper narration, captions popping word-by-word in sync,
music tastefully under the voice, render-qa PASS, and the pipeline docs/skills updated so the next
`/short` does this by default.**

---

## 2. Locked decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| TTS engine | **Piper** (local, OSS, no API key) | Free, offline, fully automatable; fits the no-paid-API ethos |
| Timing model | **VO drives the frame map** | Natural pacing; voice is the spine, visuals sync to it |
| Generation location | **Inside the `/short` run** | Pipeline now produces `vo.wav`; needs Piper + aligner on the host |
| Voice | **Pick from 2–3 Piper samples at build time** | Candidates: `en_US-ryan-high`, `en_GB-alan-medium`, `en_US-amy-medium`; swappable later |
| Music bed | **Ducks under VO** (~0.72 → ~0.22 during speech) | VO is now the lead, reversing the old no-VO rule |
| Captions | **Word-by-word synced to VO** via forced alignment | `whisper.cpp` on `vo.wav` → word timestamps |
| AI disclosure | **YES** (altered/synthetic content) | Synthetic voice is no longer script-only-AI exempt |
| Content | **Denser visuals, ~same length (~30s)** | Narration sized to ~28–32s; add date ticks/era labels/stronger comparison |

---

## 3. Architecture

### 3.1 New & changed components

- **NEW skill `tts-voiceover`** (single purpose, the heart of this change). Owns: take the narration
  script → run Piper → run `whisper.cpp` forced alignment → emit `vo.wav` + `vo-timing.json`
  (word + line timestamps) → **derive the frame map** and write it back into `02-script.md`. Inputs:
  run folder, `02-script.md` (narration section), chosen voice + speaking rate. Outputs: `vo.wav`,
  `vo-timing.json`, updated `02-script.md` frame map.
- **`youtube-shorts-writer`** — gains a **Narration** output: spoken lines per beat (full sentences,
  natural speech) alongside the existing on-screen caption text + visual direction. Spoken ≠ caption.
  Writer targets ~28–32s of spoken content; it no longer hand-pins final frame ranges (those now come
  from the VO) but still proposes beat ORDER and rough per-beat duration as a target for the narration.
- **`remotion-prompt-generator`** — audio layer becomes `vo.wav` (lead) + **ducked** music + SFX;
  captions are generated from `vo-timing.json` word timestamps (not hand-typed windows).
- **`remotion-script-reviewer`** (rubric + validator) — Audio category reworded: **VO is the lead,
  music ducks under it** (the old "bed is the lead, never ducked" becomes the no-VO special case).
  Validator still checks the (now VO-derived) frame map tiles [0, total] exactly.
- **`asset-sourcing`** — visual-richness guidance gains the F-001 polish: timeline date ticks/era
  labels, a stronger side-by-side comparison beat, brighter rest-state motif fills.
- **`short-assembly`** — render checklist includes `vo.wav`; **AI-disclosure flips to YES**.
- **`render-qa`** — new check **f. Voiceover**: VO track present & audible; music ducked under it
  (VO segments louder than bed); captions align to word onsets within ~±3 frames (spot-check).
- **`CLAUDE.md`** — remove "does NOT … use TTS"; rewrite the Audio standard (VO lead / ducked bed);
  AI-disclosure standard → disclose synthetic voice; reorder the pipeline steps for VO-driven timing.

### 3.2 New pipeline flow (step order)

```
0  start (read lessons + CLAUDE.md)
1  niche-memory      → 00-topic.md
2  research+verify   → 01-verified-facts.md
3  writer            → 02-script.md  (NOW includes a Narration script + on-screen text + visual dir;
                                       frame map left as a TARGET, finalized in 3.5)
3.5 tts-voiceover    → vo.wav + vo-timing.json; writes the FINAL frame map into 02-script.md
4  asset-sourcing    → 03-assets.md (denser visuals) + 04-audio.md (music DUCKED under VO + SFX)
5  prompt-generator  → 05-remotion-prompt.md (vo.wav lead + ducked music + SFX; captions from timing)
6  review loop       → 06-scorecard.md (validator on the VO-derived map; 9-cat rubric)
7  short-assembly    → README (disclosure=YES) + VIDEO_LOG + archive + lessons + completeness gate
8  render-qa (post-render) → 08-render-qa.md (adds the VO check)
```

### 3.3 Data flow for VO-driven timing (the core mechanism)

1. Writer writes narration lines L1..Ln grouped by beat, with a target seconds-per-beat.
2. `tts-voiceover` synthesizes the full narration to `vo.wav` with Piper (voice + `--length-scale`
   for rate).
3. `whisper.cpp` transcribes `vo.wav` with word timestamps → align to the known narration text →
   `vo-timing.json` = `[{word, start_s, end_s, beat}]`.
4. Derive frames: `beat.start_frame = round(first_word.start_s × 30)`, `beat.end_frame =
   round(last_word.end_s × 30)`; ensure contiguity (snap `next.start = prev.end`);
   `durationInFrames = last beat end + loop-back tail`.
   - **Hook/VO-start convention:** frame 0 stays the fully-lit thumbnail (no black lead). The VO's
     first line IS the hook, so narration begins at frame 0 (or within a few frames). The **loop-back
     tail is silent** (VO has ended, music fades to 0) so the auto-loop restart is clean — same as the
     no-VO model.
5. Write the finalized frame map table back into `02-script.md` (so the validator + prompt-generator
   consume one source of truth).
6. Captions in `05` are emitted directly from `vo-timing.json` word windows.

### 3.4 Host dependencies (where `/short` runs — this machine)

- `piper` (piper-tts) + at least the 2–3 candidate voice `.onnx` models.
- `whisper.cpp` (or `@remotion/install-whisper-cpp`) + a small/medium English model for alignment.
- `ffmpeg` (already present) for WAV→levels and the −14 LUFS master.
- A `tts-voiceover` setup/preflight step checks these exist; if missing, the run **pauses with
  install instructions** rather than failing silently.

---

## 4. Audio model (the rule reversal, stated precisely)

- **VO = lead.** `vo.wav` plays at full (≈ 0.9–1.0 pre-master).
- **Music bed ducks:** base ~0.72 between/under nothing, but **~0.20–0.25 under active speech**;
  rises back up in gaps and swells on the payoff (after the last VO line). Implement as a
  frame-keyed volume envelope derived from `vo-timing.json` speech regions (sidechain-style, but
  precomputed, deterministic — no live sidechain).
- **SFX** unchanged (ticks/whoosh/reveal-hit at their visual events).
- **Master** unchanged: two-pass `loudnorm` → −14 LUFS / ≤ −1 dBTP / LRA 11, verify.

---

## 5. Denser visuals (rides along in F-001 v4)

From the v3 render-qa polish list, encode in `03`/`05`:
- Timeline **date ticks + era labels** (e.g. "Old Kingdom", "Ptolemaic", "Space Age") along the spine
  to fill the right/empty bands.
- **Stronger comparison beat:** briefly show the gold and blue gaps as two bars from a shared baseline
  (not only collinear) so the ~450-yr difference reads at a glance.
- **Brighter rest-state pyramid** fill (v3 looked muddy brown until the payoff).
- Keep ~30s; narration paces the beats.

---

## 6. AI disclosure change

- Synthetic Piper voice ⇒ on upload, set YouTube **"Altered or synthetic content" = YES**.
- Update `CLAUDE.md` standard + `short-assembly` README block: the script/research exemption no
  longer applies once a synthetic voice is in the render.

---

## 7. Out of scope (YAGNI)

- Paid TTS (ElevenLabs/OpenAI/Azure) — explicitly rejected; Piper only.
- Multi-language VO.
- Live/streaming sidechain ducking (we precompute a deterministic envelope instead).
- Auto-selecting the voice — a human picks from samples once; then it's the default.
- Changing the facts/research steps (1–2 untouched).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Whisper word-onsets drift vs Piper audio | Piper speech is clean → alignment is accurate; spot-check in render-qa (±3 frames); fall back to Piper sentence timing + even word distribution if a line fails |
| Host missing piper/whisper | `tts-voiceover` preflight pauses with install steps |
| VO runs longer than ~30s | Writer targets 28–32s; `tts-voiceover` reports overruns; tighten narration or raise `--length-scale` |
| Frame map churn breaks fixed audio cues | VO-derived map is the single source of truth now; SFX cues recomputed from it, not hard-coded |
| Disclosure missed | `short-assembly` completeness gate adds "disclosure=YES present" as a checklist item |

---

## 9. Acceptance

1. `/short` (and the F-001 v4 regen) produces `vo.wav` + `vo-timing.json`; `02-script.md` frame map
   is VO-derived and passes the validator.
2. `05` captions match `vo-timing.json`; audio = VO lead + ducked bed + SFX.
3. Reviewer ≥ 80 with Category 9 ≥ 70%; audio category reflects VO-lead/ducked-bed.
4. F-001 v4 renders; **render-qa PASS including the new VO check**; master −14 LUFS.
5. README disclosure = YES; CLAUDE.md no longer says "no TTS".
