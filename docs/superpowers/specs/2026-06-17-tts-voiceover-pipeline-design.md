# Design — TTS Voiceover for the `/short` Pipeline (VO-driven, local Kokoro)

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

**Success = F-001 v4 renders with a clear Kokoro narration, captions popping word-by-word in sync,
music tastefully under the voice, render-qa PASS, and the pipeline docs/skills updated so the next
`/short` does this by default.**

---

## 2. Locked decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| TTS engine | **Kokoro** (local, OSS, no API key) | Free, offline, fully automatable; fits the no-paid-API ethos |
| Timing model | **VO drives the frame map** | Natural pacing; voice is the spine, visuals sync to it |
| Generation location | **Inside the `/short` run** | Pipeline now produces `vo.wav`; needs Kokoro + aligner on the host |
| Voice | **Pick from 2–3 Kokoro samples at build time** | Candidates: `am_michael` (US male), `bm_george` (UK male), `af_bella` (US female); voice is a NAME string, not a file; swappable later. NOTE: engine = Kokoro-82M via Python `kokoro` (Apache-2.0); see `2026-06-17-tts-engine-comparison-piper-vs-kokoro.md` |
| Music bed | **Ducks under VO** (~0.72 → ~0.22 during speech) | VO is now the lead, reversing the old no-VO rule |
| Captions | **Word-by-word synced to VO** via exact alignment | **Kokoro Python native token timing** (primary, exact-by-construction); `aeneas` forced-alignment fallback; whisper NOT used for timing (§3.3) |
| AI disclosure | **YES** (altered/synthetic content) | Synthetic voice is no longer script-only-AI exempt |
| Content | **Denser visuals, ~same length (~30s)** | Narration sized to ~28–32s; add date ticks/era labels/stronger comparison |

---

## 3. Architecture

### 3.1 New & changed components

- **NEW skill `tts-voiceover`** (single purpose, the heart of this change). Owns: take the narration
  script → run Kokoro (Python `kokoro`) → read its native token timing → emit `vo.wav` + `vo-timing.json`
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
  Validator still checks the VO-derived map tiles `[0, total]` — unchanged, because the loop-back tail
  is a real map entry and `total` is defined in `vo-timing.json` (§3.5), so there's no gap to special-case.
- **`asset-sourcing`** — visual-richness guidance gains the F-001 polish: timeline date ticks/era
  labels, a stronger side-by-side comparison beat, brighter rest-state motif fills.
- **`short-assembly`** — render checklist includes `vo.wav`; **AI-disclosure flips to YES**. The
  completeness gate adds a "README disclosure = YES" item — but note this is a **reminder, not
  enforcement**: it verifies the README states YES; it cannot flip the toggle on the YouTube upload
  form (outside the pipeline). Necessary, not sufficient.
- **`render-qa`** — new check **f. Voiceover**: VO track present & audible; music ducked under it
  (bed measurably quieter inside `speech_regions` than between them); captions align to the
  `vo-timing.json` integer frames within ±3 frames on a spot-check. (Because both captions and the
  envelope derive from the same integer frames in §3.5, this is a regression cross-check, not the
  primary timing source.)
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
       (OVERRUN EDGE: if measured VO > target+~15% and `speed` can't close it without
        sounding robotic, LOOP BACK to step 3 to cut words — a real cycle, not a linear hop.)
4  asset-sourcing    → 03-assets.md (denser visuals) + 04-audio.md (music DUCKED under VO + SFX)
5  prompt-generator  → 05-remotion-prompt.md (vo.wav lead + ducked music + SFX; captions from timing)
6  review loop       → 06-scorecard.md (validator on the VO-derived map; 9-cat rubric)
7  short-assembly    → README (disclosure=YES) + VIDEO_LOG + archive + lessons + completeness gate
8  render-qa (post-render) → 08-render-qa.md (adds the VO check)
```

> **`speed` direction (Kokoro):** Kokoro's `speed > 1.0` = *faster/shorter*; `< 1.0` = *slower/longer*
> (this is the OPPOSITE of Piper's `length_scale`). So an OVERRUN is closed by *raising* `speed` toward
> ~1.1 or cutting words; an UNDERRUN by lowering it. Past ~1.15 it gets unnatural → persistent overrun
> must cut words (3.5→3).

### 3.3 Data flow for VO-driven timing (the core mechanism)

1. **Writer** emits narration lines L1..Ln grouped by beat + a target seconds-per-beat. Numbers/abbrevs
   are written in a **TTS-friendly spoken form** OR flagged so step 2 can normalize them (see §3.6).
2. **Normalize (in `tts-voiceover`):** expand numbers/abbreviations to their spoken token form
   (`450`→"four hundred fifty", `1969`→"nineteen sixty-nine", `BCE`→"B C E") and keep a map from each
   spoken token back to its beat + on-screen display string. This normalized text is BOTH what Kokoro
   speaks AND the alignment target — so token counts match by construction.
3. **Synthesize:** Kokoro (Python `kokoro`, voice name + `speed`) → raw WAV. **Trim leading/trailing
   silence** (TTS emits a short lead-in) to produce `vo.wav`, so `t=0` of `vo.wav` is the first phoneme
   and audio agrees with the frame map from frame 0.
4. **Align (exact-by-construction, not ASR):**
   - **Primary — Kokoro native token timing:** the Python `kokoro` pipeline exposes per-token timing
     fields during synthesis; map tokens→words to get exact word `[start,end]`. No guessing. (Confirm
     granularity is per-word in the gated e2e test — see comparison doc §open-items.)
   - **Fallback — `aeneas` forced alignment** of the normalized text against `vo.wav` (DTW) if the
     installed `kokoro` build's token timing isn't granular enough.
   - **whisper.cpp is NOT used for timing** — only as an optional QA transcription to spot gross errors.
5. **Round to integer frames ONCE, here:** convert every word `start/end` from seconds to an integer
   frame (`round(s × fps)`) a single time, in `tts-voiceover`. **Store frames, not seconds,** in
   `vo-timing.json`. Everything downstream (frame map, captions) reads these ints — no component
   re-rounds from seconds, so seams can't disagree by a frame.
6. **Derive the frame map** from the integer word frames: `beat.start = first word frame of the beat`,
   `beat.end = next beat's start` (contiguity by construction, not by post-hoc snapping). The
   **loop-back tail is itself a frame-map entry** (`[last_beat.end, total]`), so the map tiles
   `[0, total]` honestly and `total = durationInFrames` (see §3.5 for the `total` definition the
   validator uses).
   - **Hook/VO-start convention:** after silence-trim, the first word sits at/near frame 0, so frame 0
     is the fully-lit thumbnail with the hook line already speaking (no black lead). The **loop-back
     tail is silent** (VO ended, music fades to 0) for a clean auto-loop restart.
7. **Write** the finalized frame map table back into `02-script.md` (single source of truth for the
   validator + prompt-generator).
8. **Captions** in `05` are emitted from the **integer frames** in `vo-timing.json` (word→display
   string via the §3.2 map), not re-derived from seconds.

### 3.4 Host dependencies (where `/short` runs — this machine)

- **`pip install kokoro misaki`** (the Python Kokoro package + its G2P) + **`espeak-ng`** (system pkg,
  phonemizer). The Kokoro-82M weights auto-download from Hugging Face on first run (Apache-2.0). The
  **configured voice is a NAME** (e.g. `am_michael`) bundled with the package — not a file path.
- **`aeneas`** (+ `espeak-ng`/`ffmpeg`) for the forced-alignment **fallback** path only. Primary path
  uses Kokoro's native token timing and needs no aligner.
- `whisper.cpp` is **optional** (QA-only sanity transcription), not required for timing.
- `ffmpeg` (already present) for silence-trim, the ducking envelope render, and the −14 LUFS master.
- The `tts-voiceover` **preflight** checks that the `kokoro` package imports, `espeak-ng` is present,
  AND **the voice named in config is a valid Kokoro voice**, and that the aligner is available *if* the
  native-timing path isn't. If anything is missing it **pauses with install instructions** rather than
  failing silently.

### 3.5 Timing contract — `vo-timing.json` schema (the cross-component interface)

Three components depend on this file (`tts-voiceover` writes it; the validator + `prompt-generator`
read it), so it is pinned concretely. **All times are integer FRAMES at the comp fps; no seconds
appear in this file.**

```json
{
  "fps": 30,
  "voice": "am_michael",
  "speed": 1.0,
  "total": 900,                      // = durationInFrames; the validator tiles [0, total]
  "words": [
    { "i": 0, "display": "Cleopatra", "spoken": "cleopatra",
      "start": 0, "end": 9, "beat": "hook", "region": 0 }
    // ... one entry per spoken word, monotonic non-overlapping frames
  ],
  "beats": [
    { "id": "hook", "start": 0,   "end": 42 },
    { "id": "beat1","start": 42,  "end": 150 },
    // ... contiguous: each beat.start == previous beat.end
    { "id": "loop", "start": 858, "end": 900 }   // loop-back tail IS an entry; tail words = []
  ],
  "speech_regions": [               // merged speech spans for the ducking envelope (see §4)
    { "start": 0, "end": 132 }, { "start": 150, "end": 240 }
  ]
}
```

- `total` is the canonical `durationInFrames`. `beats[]` tiles `[0, total]` exactly **including** the
  trailing `loop` entry, so the validator's existing "tiles [0, total]" invariant is satisfied with no
  special-casing — the silent tail is a real entry whose `words` are empty.
- `display` vs `spoken` resolves the normalization mismatch: captions render `display`; alignment used
  `spoken`.

### 3.6 Alignment failure detector (makes the §8 fallback first-class, not emergency-only)

After producing word frames (primary or fallback), `tts-voiceover` runs these checks; **any failure
trips the fallback aligner; a second failure aborts the run with a diagnostic** (never ships bad sync):

1. **Monotonicity:** every `word.end ≥ word.start` and `word[i].start ≥ word[i-1].end`. Violation → fail.
2. **Coverage:** the **speech span** `last_word.end − first_word.start` is within ±15% of the trimmed
   `vo.wav` length (frames). (NOT the *sum* of per-word durations — natural speech has inter-word pauses
   that belong to no word, so summed durations structurally undershoot the wav length and would
   false-abort every real run. The span detects dropped/merged words, which is the real failure mode.)
3. **Plausible word durations:** no word shorter than ~2 frames or longer than ~45 frames (≈0.07–1.5s)
   unless it's a known long token; outliers flag the line for fallback.
4. **Token-count match:** number of aligned words == number of normalized spoken tokens. Mismatch
   (the numbers/abbrev hazard) → fail, re-normalize or fall back.

This is the defined "how does a line fail?" detector the reviewer asked for — without it the fallback
never triggers and bad timing ships silently.

---

## 4. Audio model (the rule reversal, stated precisely)

- **VO = lead.** `vo.wav` plays at full (≈ 0.9–1.0 pre-master).
- **Music bed ducks:** base ~0.72, **~0.20–0.25 under active speech**, rising back in gaps and
  swelling on the payoff (after the last VO line). Implemented as a deterministic frame-keyed volume
  envelope (no live sidechain) built from `vo-timing.json` `speech_regions`. The envelope SHAPE is
  specified, because that's what separates clean ducking from audible pumping:
  - **Region-merge:** words separated by a gap **< ~300ms (~9 frames)** are merged into one speech
    region, so the bed does NOT un-duck in the micro-gaps between words. (These merged regions are the
    `speech_regions` stored in `vo-timing.json`.)
  - **Attack ~60ms (~2 frames):** fast-but-smooth ramp 0.72→0.22 entering a region (no instantaneous step).
  - **Release ~300ms (~9 frames):** slower ramp 0.22→0.72 leaving a region, so it breathes rather than chatters.
  - Ramps are linear-in-dB; the payoff swell starts after the final region's release completes.
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

- Synthetic Kokoro voice ⇒ on upload, set YouTube **"Altered or synthetic content" = YES**.
- Update `CLAUDE.md` standard + `short-assembly` README block: the script/research exemption no
  longer applies once a synthetic voice is in the render.

---

## 7. Out of scope (YAGNI)

- Paid TTS (ElevenLabs/OpenAI/Azure) — explicitly rejected; Kokoro only.
- Multi-language VO.
- Live/streaming sidechain ducking (we precompute a deterministic envelope instead).
- Auto-selecting the voice — a human picks from samples once; then it's the default.
- Changing the facts/research steps (1–2 untouched).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Word-onset accuracy (the load-bearing risk)** — bad timing on "Ptolemaic"/numbers would break the whole VO-drives-timing premise | **Don't transcribe — use Kokoro Python's native token timing (exact by construction); aeneas forced-alignment fallback; whisper NOT used for timing** (§3.3 step 4). The §3.6 failure detector (monotonicity, coverage ±5%, plausible durations, token-count match) makes the fallback first-class; two failures abort rather than ship bad sync. |
| **Kokoro determinism unverified** — no documented seed/determinism guarantee | Generate `vo.wav` + `vo-timing.json` ONCE per run and **commit them as artifacts**; never re-synthesize a shipped run. Reproducibility comes from reuse, not re-synthesis (covers the one dimension Piper won on). |
| Text normalization mismatch (numbers/abbrevs spoken ≠ written) | `tts-voiceover` normalizes to spoken tokens and aligns against THAT, keeping a `spoken→display+beat` map (§3.3 step 2, §3.5 `spoken`/`display`). |
| Kokoro leading silence offsets audio vs frame 0 | Trim Kokoro lead/tail silence before alignment so `t=0` of `vo.wav` is the first phoneme (§3.3 step 3). |
| Seam rounding (beat boundaries vs caption windows disagree by a frame) | Round to integer frames **once** in `tts-voiceover`; store frames not seconds; all consumers read the same ints (§3.3 step 5, §3.5). |
| Ducking pumps/chatters | Region-merge <300ms + attack ~60ms / release ~300ms envelope (§4). |
| Host missing kokoro/espeak-ng/aeneas or the **configured voice** | Preflight checks the `kokoro` import + `espeak-ng` + the *named* Kokoro voice (and aligner if needed); pauses with install steps (§3.4). |
| VO overruns target length | Writer targets 28–32s; **raise** Kokoro `speed` toward ~1.1 (faster) or, if that would exceed ~1.15, **loop back to the writer to cut words** (3.5→3 edge, §3.2). |
| Frame-map churn breaks audio cues | VO-derived map in `vo-timing.json` is the single source of truth; SFX cues recomputed from it, not hard-coded. |
| Disclosure missed | Completeness gate adds "README disclosure = YES" — a **reminder, not enforcement** (can't flip the YouTube toggle; §3.1 `short-assembly`). |

---

## 9. Acceptance

1. `/short` (and the F-001 v4 regen) produces `vo.wav` + `vo-timing.json`; `02-script.md` frame map
   is VO-derived and passes the validator.
2. `05` captions match `vo-timing.json`; audio = VO lead + ducked bed + SFX.
3. Reviewer ≥ 80 with Category 9 ≥ 70%; audio category reflects VO-lead/ducked-bed.
4. F-001 v4 renders; **render-qa PASS including the new VO check**; master −14 LUFS.
5. README disclosure = YES; CLAUDE.md no longer says "no TTS".
