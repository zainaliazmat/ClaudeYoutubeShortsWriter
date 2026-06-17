# TTS Voiceover Engine Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `tts-voiceover` engine that turns a beat-grouped narration script into `vo.wav`, a `vo-timing.json` timing contract (integer frames only), a VO-derived frame map, and a deterministic music-ducking envelope.

**Architecture:** A new project skill `.claude/skills/tts-voiceover/` bundling small, single-responsibility Python modules. ALL timing/normalization/envelope logic is **pure functions** (stdlib only) unit-tested without any TTS binary. Piper/aeneas/ffmpeg are isolated in one thin I/O shell (`piper_io.py`) and one orchestrator (`run.py`), smoke-tested separately. Alignment is exact-by-construction from Piper's phoneme durations, with aeneas forced-alignment as the fallback; whisper is never used for timing.

**Tech Stack:** Python 3 (stdlib only for pure logic — no pip deps), `unittest` for tests (zero install). External binaries used ONLY in the I/O shell: `piper` (TTS), `aeneas` (fallback aligner), `ffmpeg` (silence-trim).

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-06-17-tts-voiceover-pipeline-design.md` — implement §3.3–3.6 and §4 here.
- **Frames are the only currency** in `vo-timing.json`: every time value is an **integer frame** at the comp fps. No seconds in the file. Round seconds→frames **exactly once**, in `build_timing`.
- **fps = 30** (default; passed explicitly, never hard-coded inside logic).
- **Pure logic = stdlib only.** `normalize.py`, `timing.py`, `failure_detector.py`, `envelope.py`, `framemap.py` import nothing outside the standard library, so their tests run with no install.
- **Loop-back tail is a real frame-map entry** `[last_word_end, total]` with no words, so the map tiles `[0, total]` exactly; `total == durationInFrames`.
- **Ducking shape:** region-merge gap `< 300ms`, attack `~60ms`, release `~300ms`, base `0.72`, duck `0.22` (all frame-converted at the comp fps).
- **Run tests from the skill root:** `cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v`.

---

### Task 1: Skill scaffold + package layout

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/__init__.py` (empty)
- Create: `.claude/skills/tts-voiceover/tests/__init__.py` (empty)
- Create: `.claude/skills/tts-voiceover/tests/test_smoke.py`

**Interfaces:**
- Consumes: nothing.
- Produces: the importable package root `scripts/` so later tasks can `from scripts.X import Y` when cwd is the skill root.

- [ ] **Step 1: Create the two empty `__init__.py` files** (so `scripts` and `tests` are packages).

```bash
mkdir -p .claude/skills/tts-voiceover/scripts .claude/skills/tts-voiceover/tests
: > .claude/skills/tts-voiceover/scripts/__init__.py
: > .claude/skills/tts-voiceover/tests/__init__.py
```

- [ ] **Step 2: Write a smoke test that proves discovery + import path work**

`.claude/skills/tts-voiceover/tests/test_smoke.py`:
```python
import unittest

class TestSmoke(unittest.TestCase):
    def test_scripts_package_importable(self):
        import scripts  # noqa: F401
        self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run it — verify it passes**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v`
Expected: `test_scripts_package_importable ... ok` — `OK`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/tts-voiceover/
git commit -m "feat(tts): scaffold tts-voiceover skill package + test discovery"
```

---

### Task 2: Text normalization (`normalize.py`)

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/normalize.py`
- Test: `.claude/skills/tts-voiceover/tests/test_normalize.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `int_to_words(n: int) -> str` — 0..9999 (covers years + small counts).
  - `normalize_token(raw: str) -> str` — expand one display token to its spoken form.
  - `normalize_narration(beats: list[dict]) -> dict` where each input beat is
    `{"id": str, "lines": list[str]}`. Returns
    `{"spoken_text": str, "tokens": [{"i": int, "spoken": str, "display": str, "beat": str}]}`.
    `spoken_text` is the full string Piper speaks (normalized, space-joined). `tokens` is the
    per-spoken-word list with each word's original display string and beat id.

- [ ] **Step 1: Write the failing tests**

`.claude/skills/tts-voiceover/tests/test_normalize.py`:
```python
import unittest
from scripts.normalize import int_to_words, normalize_token, normalize_narration

class TestIntToWords(unittest.TestCase):
    def test_units_and_teens(self):
        self.assertEqual(int_to_words(0), "zero")
        self.assertEqual(int_to_words(7), "seven")
        self.assertEqual(int_to_words(13), "thirteen")
    def test_tens_and_hundreds(self):
        self.assertEqual(int_to_words(69), "sixty-nine")
        self.assertEqual(int_to_words(450), "four hundred fifty")
    def test_year_style_thousands(self):
        self.assertEqual(int_to_words(2500), "two thousand five hundred")
        self.assertEqual(int_to_words(1969), "one thousand nine hundred sixty-nine")

class TestNormalizeToken(unittest.TestCase):
    def test_strips_tilde_and_commas(self):
        self.assertEqual(normalize_token("~2,500"), "two thousand five hundred")
    def test_abbreviations(self):
        self.assertEqual(normalize_token("BC"), "B C")
        self.assertEqual(normalize_token("BCE"), "B C E")
    def test_plain_word_passthrough(self):
        self.assertEqual(normalize_token("Cleopatra"), "Cleopatra")

class TestNormalizeNarration(unittest.TestCase):
    def test_expands_and_maps_tokens_to_beats(self):
        beats = [
            {"id": "hook", "lines": ["Cleopatra"]},
            {"id": "beat1", "lines": ["born 69 BC"]},
        ]
        out = normalize_narration(beats)
        self.assertEqual(out["spoken_text"], "Cleopatra born sixty-nine B C")
        # token list: Cleopatra | born | sixty-nine | B | C
        self.assertEqual([t["spoken"] for t in out["tokens"]],
                         ["Cleopatra", "born", "sixty-nine", "B", "C"])
        self.assertEqual([t["beat"] for t in out["tokens"]],
                         ["hook", "beat1", "beat1", "beat1", "beat1"])
        # display preserves the original token the number came from
        self.assertEqual(out["tokens"][2]["display"], "69")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_normalize -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.normalize'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/normalize.py`:
```python
"""Text normalization: display tokens -> spoken tokens, with beat mapping.
Stdlib only. Covers integers 0..9999 (years + small counts) and BC/BCE/AD."""
import re

_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
         "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
         "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
         "eighty", "ninety"]
_ABBR = {"BC": "B C", "BCE": "B C E", "AD": "A D", "CE": "C E"}


def _two(n):
    if n < 20:
        return _ONES[n]
    t, o = divmod(n, 10)
    return _TENS[t] + ("-" + _ONES[o] if o else "")


def int_to_words(n):
    if n < 0 or n > 9999:
        raise ValueError("int_to_words supports 0..9999, got %d" % n)
    if n < 100:
        return _two(n)
    if n < 1000:
        h, r = divmod(n, 100)
        return _ONES[h] + " hundred" + (" " + _two(r) if r else "")
    th, r = divmod(n, 1000)
    out = _ONES[th] + " thousand"
    if r:
        out += " " + (int_to_words(r) if r >= 100 else _two(r))
    return out


def normalize_token(raw):
    """Expand ONE display token to its spoken form (may be multiple words)."""
    if raw in _ABBR:
        return _ABBR[raw]
    stripped = raw.replace("~", "").replace(",", "")
    if re.fullmatch(r"\d+", stripped):
        return int_to_words(int(stripped))
    return raw


def normalize_narration(beats):
    """beats: [{'id': str, 'lines': [str]}] -> {'spoken_text', 'tokens'}."""
    tokens = []
    i = 0
    for beat in beats:
        for line in beat["lines"]:
            for disp in line.split():
                spoken = normalize_token(disp)
                for word in spoken.split():
                    tokens.append({"i": i, "spoken": word,
                                   "display": disp, "beat": beat["id"]})
                    i += 1
    spoken_text = " ".join(t["spoken"] for t in tokens)
    return {"spoken_text": spoken_text, "tokens": tokens}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_normalize -v`
Expected: all tests PASS — `OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/normalize.py .claude/skills/tts-voiceover/tests/test_normalize.py
git commit -m "feat(tts): text normalization (numbers/abbrevs -> spoken, beat mapping)"
```

---

### Task 3: VO-driven timing (`timing.py`) — the core mechanism

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/timing.py`
- Test: `.claude/skills/tts-voiceover/tests/test_timing.py`

**Interfaces:**
- Consumes: `tokens` from `normalize_narration` (each `{"i","spoken","display","beat"}`).
- Produces:
  `build_timing(word_times_s, tokens, fps=30, loop_tail_frames=75, region_gap_ms=300, voice="", length_scale=1.0) -> dict`
  - `word_times_s`: list of `(start_s, end_s)` floats, parallel to `tokens` (from Piper durations or aeneas).
  - Returns the `vo-timing.json` dict: keys `fps, voice, length_scale, total, words, beats, speech_regions`.
  - `words[i]` = `{"i","display","spoken","start","end","beat","region"}` (frames, ints).
  - `beats[]` contiguous `{"id","start","end"}`, first `start==0`, each `start==prev.end`, last entry is the loop tail with no words.
  - `speech_regions[]` = merged spans `{"start","end"}` (gap < region_gap merged).

- [ ] **Step 1: Write the failing tests**

`.claude/skills/tts-voiceover/tests/test_timing.py`:
```python
import unittest
from scripts.timing import build_timing

def _tokens(spec):
    # spec: list of (spoken, display, beat)
    return [{"i": i, "spoken": s, "display": d, "beat": b}
            for i, (s, d, b) in enumerate(spec)]

class TestBuildTiming(unittest.TestCase):
    def setUp(self):
        # 3 words across 2 beats; gap between word2 and word3 is 0.5s (15f > merge)
        self.tokens = _tokens([("Cleopatra", "Cleopatra", "hook"),
                               ("born", "born", "beat1"),
                               ("sixty-nine", "69", "beat1")])
        self.times = [(0.00, 0.40), (0.40, 0.70), (1.20, 1.60)]

    def test_rounds_to_integer_frames_once(self):
        t = build_timing(self.times, self.tokens, fps=30, loop_tail_frames=75)
        self.assertEqual(t["words"][0]["start"], 0)
        self.assertEqual(t["words"][0]["end"], 12)   # 0.40*30
        self.assertEqual(t["words"][2]["start"], 36)  # 1.20*30
        self.assertEqual(t["words"][2]["end"], 48)    # 1.60*30
        for w in t["words"]:
            self.assertIsInstance(w["start"], int)
            self.assertIsInstance(w["end"], int)

    def test_beats_tile_zero_to_total_with_loop_tail(self):
        t = build_timing(self.times, self.tokens, fps=30, loop_tail_frames=75)
        # last word ends at 48 -> total = 48 + 75 = 123
        self.assertEqual(t["total"], 123)
        # contiguity
        self.assertEqual(t["beats"][0]["start"], 0)
        for prev, nxt in zip(t["beats"], t["beats"][1:]):
            self.assertEqual(nxt["start"], prev["end"])
        self.assertEqual(t["beats"][-1]["end"], t["total"])
        # last entry is the loop tail (no words assigned to it)
        self.assertEqual(t["beats"][-1]["id"], "loop")
        self.assertEqual(t["beats"][-1]["start"], 48)

    def test_speech_region_merge(self):
        # word0 0-12, word1 12-21 (gap 0 -> merge), word2 36-48 (gap 15f > 9 -> separate)
        t = build_timing(self.times, self.tokens, fps=30, region_gap_ms=300)
        self.assertEqual(t["speech_regions"], [{"start": 0, "end": 21},
                                               {"start": 36, "end": 48}])
        # each word carries its region index
        self.assertEqual([w["region"] for w in t["words"]], [0, 0, 1])

    def test_metadata_passthrough(self):
        t = build_timing(self.times, self.tokens, fps=30, voice="en_US-ryan-high",
                         length_scale=0.97)
        self.assertEqual(t["fps"], 30)
        self.assertEqual(t["voice"], "en_US-ryan-high")
        self.assertEqual(t["length_scale"], 0.97)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_timing -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.timing'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/timing.py`:
```python
"""VO-driven timing: word times (s) -> integer-frame timing contract.
Rounds seconds->frames exactly ONCE here. Stdlib only."""


def _f(seconds, fps):
    return int(round(seconds * fps))


def build_timing(word_times_s, tokens, fps=30, loop_tail_frames=75,
                 region_gap_ms=300, voice="", length_scale=1.0):
    if len(word_times_s) != len(tokens):
        raise ValueError("word_times_s (%d) and tokens (%d) must align"
                         % (len(word_times_s), len(tokens)))

    gap_frames = _f(region_gap_ms / 1000.0, fps)

    # 1) words: round once to integer frames, force first word start to 0.
    words = []
    for (s, e), tok in zip(word_times_s, tokens):
        words.append({"i": tok["i"], "display": tok["display"],
                      "spoken": tok["spoken"], "start": _f(s, fps),
                      "end": _f(e, fps), "beat": tok["beat"], "region": None})
    if words:
        words[0]["start"] = 0

    # 2) speech regions: merge words whose inter-word gap < gap_frames.
    regions = []
    for w in words:
        if regions and w["start"] - regions[-1]["end"] < gap_frames:
            regions[-1]["end"] = max(regions[-1]["end"], w["end"])
        else:
            regions.append({"start": w["start"], "end": w["end"]})
        w["region"] = len(regions) - 1

    # 3) beats: contiguous partition. beat[k].start = first word of beat k;
    #    beat[k].end = beat[k+1].start; first start forced to 0.
    beats = []
    for w in words:
        if not beats or beats[-1]["id"] != w["beat"]:
            beats.append({"id": w["beat"], "start": w["start"], "end": w["end"]})
        else:
            beats[-1]["end"] = w["end"]
    if beats:
        beats[0]["start"] = 0
        for prev, nxt in zip(beats, beats[1:]):
            nxt["start"] = prev["end"]

    last_word_end = words[-1]["end"] if words else 0
    total = last_word_end + loop_tail_frames
    beats.append({"id": "loop", "start": last_word_end, "end": total})

    return {"fps": fps, "voice": voice, "length_scale": length_scale,
            "total": total, "words": words, "beats": beats,
            "speech_regions": regions}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_timing -v`
Expected: all PASS — `OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/timing.py .claude/skills/tts-voiceover/tests/test_timing.py
git commit -m "feat(tts): VO-driven integer-frame timing (words/beats/regions, loop tail)"
```

---

### Task 4: Alignment failure detector (`failure_detector.py`)

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/failure_detector.py`
- Test: `.claude/skills/tts-voiceover/tests/test_failure_detector.py`

**Interfaces:**
- Consumes: `words` (from `build_timing`), `wav_len_frames: int`, `n_tokens: int`.
- Produces: `check_alignment(words, wav_len_frames, n_tokens, min_w=2, max_w=45, cov_tol=0.05) -> dict`
  returning `{"ok": bool, "reasons": [str]}`. Implements spec §3.6 checks
  (monotonicity, ±cov_tol coverage, plausible word durations, token-count match).

- [ ] **Step 1: Write the failing tests**

`.claude/skills/tts-voiceover/tests/test_failure_detector.py`:
```python
import unittest
from scripts.failure_detector import check_alignment

def _w(i, s, e):
    return {"i": i, "start": s, "end": e, "spoken": "x", "display": "x",
            "beat": "b", "region": 0}

class TestCheckAlignment(unittest.TestCase):
    def test_clean_alignment_passes(self):
        words = [_w(0, 0, 10), _w(1, 10, 20), _w(2, 20, 30)]
        r = check_alignment(words, wav_len_frames=30, n_tokens=3)
        self.assertTrue(r["ok"], r["reasons"])

    def test_non_monotonic_fails(self):
        words = [_w(0, 0, 10), _w(1, 8, 18)]  # 8 < prev end 10
        r = check_alignment(words, wav_len_frames=18, n_tokens=2)
        self.assertFalse(r["ok"])
        self.assertTrue(any("monoton" in x for x in r["reasons"]))

    def test_coverage_gap_fails(self):
        words = [_w(0, 0, 5), _w(1, 5, 10)]  # covers 10f of a 30f wav
        r = check_alignment(words, wav_len_frames=30, n_tokens=2)
        self.assertFalse(r["ok"])
        self.assertTrue(any("coverage" in x for x in r["reasons"]))

    def test_implausible_duration_fails(self):
        words = [_w(0, 0, 1), _w(1, 1, 60)]  # 1f too short, 59f too long
        r = check_alignment(words, wav_len_frames=60, n_tokens=2)
        self.assertFalse(r["ok"])
        self.assertTrue(any("duration" in x for x in r["reasons"]))

    def test_token_count_mismatch_fails(self):
        words = [_w(0, 0, 10), _w(1, 10, 20)]
        r = check_alignment(words, wav_len_frames=20, n_tokens=3)
        self.assertFalse(r["ok"])
        self.assertTrue(any("token" in x for x in r["reasons"]))

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_failure_detector -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.failure_detector'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/failure_detector.py`:
```python
"""Alignment failure detector (spec §3.6). Any failure -> trip the fallback;
a second failure aborts the run. Stdlib only."""


def check_alignment(words, wav_len_frames, n_tokens, min_w=2, max_w=45,
                    cov_tol=0.05):
    reasons = []

    if len(words) != n_tokens:
        reasons.append("token count mismatch: %d aligned vs %d spoken"
                       % (len(words), n_tokens))

    prev_end = None
    for w in words:
        if w["end"] < w["start"]:
            reasons.append("monotonicity: word %d end<start" % w["i"])
        if prev_end is not None and w["start"] < prev_end:
            reasons.append("monotonicity: word %d starts before prev end" % w["i"])
        prev_end = w["end"]
        dur = w["end"] - w["start"]
        if dur < min_w or dur > max_w:
            reasons.append("implausible duration: word %d = %df" % (w["i"], dur))

    covered = sum(w["end"] - w["start"] for w in words)
    if wav_len_frames > 0:
        ratio = covered / float(wav_len_frames)
        if abs(1.0 - ratio) > cov_tol:
            reasons.append("coverage off: %.1f%% of wav covered"
                           % (ratio * 100))

    return {"ok": len(reasons) == 0, "reasons": reasons}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_failure_detector -v`
Expected: all PASS — `OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/failure_detector.py .claude/skills/tts-voiceover/tests/test_failure_detector.py
git commit -m "feat(tts): alignment failure detector (monotonicity/coverage/duration/count)"
```

---

### Task 5: Ducking envelope (`envelope.py`)

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/envelope.py`
- Test: `.claude/skills/tts-voiceover/tests/test_envelope.py`

**Interfaces:**
- Consumes: `speech_regions` + `total` (from `build_timing`).
- Produces: `build_duck_envelope(speech_regions, total, base=0.72, duck=0.22, attack_frames=2, release_frames=9) -> list[dict]`
  returning frame-keyed keyframes `[{"frame": int, "vol": float}]`, monotonic in frame, starting at
  frame 0 and ending at `total`. Bed sits at `base`, ramps down to `duck` over `attack_frames`
  entering a region, holds `duck` through the region, ramps back to `base` over `release_frames`.

- [ ] **Step 1: Write the failing tests**

`.claude/skills/tts-voiceover/tests/test_envelope.py`:
```python
import unittest
from scripts.envelope import build_duck_envelope

class TestEnvelope(unittest.TestCase):
    def test_no_speech_is_flat_base(self):
        env = build_duck_envelope([], total=100, base=0.72)
        self.assertEqual(env[0], {"frame": 0, "vol": 0.72})
        self.assertEqual(env[-1], {"frame": 100, "vol": 0.72})

    def test_single_region_ramps_down_and_up(self):
        env = build_duck_envelope([{"start": 30, "end": 60}], total=100,
                                  base=0.72, duck=0.22,
                                  attack_frames=2, release_frames=9)
        d = {k["frame"]: round(k["vol"], 3) for k in env}
        self.assertEqual(d[28], 0.72)   # base just before attack
        self.assertEqual(d[30], 0.22)   # ducked at region start
        self.assertEqual(d[60], 0.22)   # still ducked at region end
        self.assertEqual(d[69], 0.72)   # back to base after release
        # frames are monotonic increasing
        frames = [k["frame"] for k in env]
        self.assertEqual(frames, sorted(frames))

    def test_attack_starts_before_region_start(self):
        env = build_duck_envelope([{"start": 30, "end": 60}], total=100,
                                  attack_frames=2)
        frames = [k["frame"] for k in env]
        self.assertIn(28, frames)  # attack begins attack_frames before start

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_envelope -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.envelope'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/envelope.py`:
```python
"""Deterministic music-ducking envelope from merged speech regions (spec §4).
Attack begins before region start; release after region end. Stdlib only."""


def build_duck_envelope(speech_regions, total, base=0.72, duck=0.22,
                        attack_frames=2, release_frames=9):
    kf = {0: base}
    for r in speech_regions:
        a0 = max(0, r["start"] - attack_frames)
        kf[a0] = base
        kf[r["start"]] = duck
        kf[r["end"]] = duck
        rel = min(total, r["end"] + release_frames)
        kf[rel] = base
    kf.setdefault(total, base)
    return [{"frame": f, "vol": kf[f]} for f in sorted(kf)]
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_envelope -v`
Expected: all PASS — `OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/envelope.py .claude/skills/tts-voiceover/tests/test_envelope.py
git commit -m "feat(tts): deterministic ducking envelope (region-merge + attack/release)"
```

---

### Task 6: Frame-map render + script patch (`framemap.py`)

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/framemap.py`
- Test: `.claude/skills/tts-voiceover/tests/test_framemap.py`

**Interfaces:**
- Consumes: `beats` (from `build_timing`).
- Produces:
  - `render_frame_map_table(beats) -> str` — the markdown table the validator reads (columns
    `Segment | start | end | frames`, plus a Total row where `start=0`, `end=total`,
    `frames=total`).
  - `patch_script_frame_map(script_text, table_md) -> str` — replace the content between the
    `<!-- FRAME-MAP:START -->` and `<!-- FRAME-MAP:END -->` markers with `table_md`, returning the
    new text. Raises `ValueError` if markers are absent.

- [ ] **Step 1: Write the failing tests**

`.claude/skills/tts-voiceover/tests/test_framemap.py`:
```python
import unittest
from scripts.framemap import render_frame_map_table, patch_script_frame_map

class TestFrameMap(unittest.TestCase):
    def setUp(self):
        self.beats = [{"id": "hook", "start": 0, "end": 42},
                      {"id": "beat1", "start": 42, "end": 150},
                      {"id": "loop", "start": 150, "end": 225}]

    def test_render_table_has_rows_and_total(self):
        md = render_frame_map_table(self.beats)
        self.assertIn("| hook | 0 | 42 | 42 |", md)
        self.assertIn("| beat1 | 42 | 150 | 108 |", md)
        self.assertIn("| loop | 150 | 225 | 75 |", md)
        self.assertIn("| **Total** | **0** | **225** | **225** |", md)

    def test_patch_replaces_between_markers(self):
        script = ("intro\n<!-- FRAME-MAP:START -->\nOLD\n"
                  "<!-- FRAME-MAP:END -->\noutro\n")
        out = patch_script_frame_map(script, "NEWTABLE")
        self.assertIn("<!-- FRAME-MAP:START -->\nNEWTABLE\n<!-- FRAME-MAP:END -->", out)
        self.assertNotIn("OLD", out)
        self.assertTrue(out.startswith("intro"))
        self.assertTrue(out.rstrip().endswith("outro"))

    def test_patch_without_markers_raises(self):
        with self.assertRaises(ValueError):
            patch_script_frame_map("no markers here", "X")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_framemap -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.framemap'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/framemap.py`:
```python
"""Render the VO-derived frame-map table and patch it into 02-script.md
between explicit markers. Stdlib only."""
import re

START = "<!-- FRAME-MAP:START -->"
END = "<!-- FRAME-MAP:END -->"


def render_frame_map_table(beats):
    lines = ["| Segment | start | end | frames |",
             "|---------|-------|-----|--------|"]
    for b in beats:
        lines.append("| %s | %d | %d | %d |"
                     % (b["id"], b["start"], b["end"], b["end"] - b["start"]))
    total = beats[-1]["end"] if beats else 0
    lines.append("| **Total** | **0** | **%d** | **%d** |" % (total, total))
    return "\n".join(lines)


def patch_script_frame_map(script_text, table_md):
    if START not in script_text or END not in script_text:
        raise ValueError("frame-map markers not found in script")
    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
    return pattern.sub(START + "\n" + table_md + "\n" + END, script_text)
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_framemap -v`
Expected: all PASS — `OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/framemap.py .claude/skills/tts-voiceover/tests/test_framemap.py
git commit -m "feat(tts): frame-map table render + marker-based script patch"
```

---

### Task 7: I/O shell (`piper_io.py`) — Piper synth, silence-trim, durations, aeneas fallback

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/piper_io.py`
- Test: `.claude/skills/tts-voiceover/tests/test_piper_io.py`

**Interfaces:**
- Consumes: normalized `spoken_text`, `voice`, `length_scale`, output paths.
- Produces:
  - `preflight(voice_path, need_aligner) -> dict` → `{"ok": bool, "missing": [str]}`. Checks `piper`
    on PATH, the **named** voice file exists, `ffmpeg` present, and (if `need_aligner`) `aeneas`
    importable.
  - `synth_and_durations(spoken_text, voice_path, length_scale, out_wav) -> list[tuple]` → writes
    silence-trimmed `out_wav` and returns per-word `(start_s, end_s)` from Piper phoneme durations;
    raises `PiperUnavailable` if Piper can't run (caller falls back to `aeneas_align`).
  - `aeneas_align(spoken_text, wav_path) -> list[tuple]` → per-word `(start_s, end_s)` via aeneas.
- Note: this module shells out to binaries, so only `preflight`'s pure branches are unit-tested here;
  `synth_and_durations`/`aeneas_align` are exercised by the Task 9 gated smoke test.

- [ ] **Step 1: Write the failing test (preflight detection is unit-testable via PATH)**

`.claude/skills/tts-voiceover/tests/test_piper_io.py`:
```python
import os
import tempfile
import unittest
from scripts.piper_io import preflight

class TestPreflight(unittest.TestCase):
    def test_missing_voice_file_reported(self):
        r = preflight(voice_path="/no/such/voice.onnx", need_aligner=False)
        self.assertFalse(r["ok"])
        self.assertTrue(any("voice" in m for m in r["missing"]))

    def test_existing_voice_file_not_in_missing(self):
        with tempfile.NamedTemporaryFile(suffix=".onnx") as f:
            r = preflight(voice_path=f.name, need_aligner=False)
            self.assertFalse(any("voice file" in m for m in r["missing"]))

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_piper_io -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.piper_io'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/piper_io.py`:
```python
"""Thin I/O shell around piper / ffmpeg / aeneas. The pure timing logic lives
elsewhere; this file is the only place that touches external binaries."""
import json
import os
import shutil
import subprocess
import tempfile


class PiperUnavailable(Exception):
    pass


def preflight(voice_path, need_aligner):
    missing = []
    if shutil.which("piper") is None:
        missing.append("piper not on PATH (install piper-tts)")
    if not os.path.isfile(voice_path):
        missing.append("voice file not found: %s" % voice_path)
    if shutil.which("ffmpeg") is None:
        missing.append("ffmpeg not on PATH")
    if need_aligner:
        try:
            import aeneas  # noqa: F401
        except Exception:
            missing.append("aeneas not importable (fallback aligner)")
    return {"ok": len(missing) == 0, "missing": missing}


def synth_and_durations(spoken_text, voice_path, length_scale, out_wav):
    """Synthesize with Piper (JSON output incl. phoneme alignments), trim
    leading/trailing silence, return per-word (start_s, end_s)."""
    if shutil.which("piper") is None:
        raise PiperUnavailable("piper not on PATH")
    raw = out_wav + ".raw.wav"
    align_json = out_wav + ".align.json"
    # Piper writes alignment when --output_file + --json-input style is used;
    # builds expose phoneme/word durations in a sidecar JSON. If absent, raise.
    proc = subprocess.run(
        ["piper", "--model", voice_path, "--length_scale", str(length_scale),
         "--output_file", raw, "--json-output", align_json],
        input=spoken_text.encode("utf-8"),
        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0 or not os.path.isfile(align_json):
        raise PiperUnavailable("piper did not emit word alignments")
    with open(align_json) as f:
        data = json.load(f)
    # Trim silence to file out_wav; offset all times by the trimmed lead.
    lead = _trim_silence(raw, out_wav)
    return [(w["start"] - lead, w["end"] - lead) for w in data["words"]]


def _trim_silence(in_wav, out_wav):
    """Trim leading/trailing silence with ffmpeg silenceremove; return the
    seconds of leading silence removed (so timestamps can be offset)."""
    # Measure leading silence first.
    probe = subprocess.run(
        ["ffmpeg", "-i", in_wav, "-af",
         "silencedetect=noise=-50dB:d=0.05", "-f", "null", "-"],
        stderr=subprocess.PIPE)
    lead = 0.0
    for line in probe.stderr.decode("utf-8", "ignore").splitlines():
        if "silence_end" in line:
            lead = float(line.split("silence_end:")[1].split("|")[0].strip())
            break
    subprocess.run(
        ["ffmpeg", "-y", "-i", in_wav, "-af",
         "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB:"
         "stop_periods=1:stop_silence=0.1:stop_threshold=-50dB", out_wav],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return lead


def aeneas_align(spoken_text, wav_path):
    """Fallback: aeneas forced alignment of known text -> per-word (start,end)."""
    from aeneas.executetask import ExecuteTask
    from aeneas.task import Task
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tf:
        tf.write("\n".join(spoken_text.split()))
        txt = tf.name
    cfg = "task_language=eng|is_text_type=plain|os_task_file_format=json"
    task = Task(config_string=cfg)
    task.audio_file_path_absolute = wav_path
    task.text_file_path_absolute = txt
    ExecuteTask(task).execute()
    out = []
    for frag in task.sync_map_leaves():
        if frag.is_regular:
            out.append((float(frag.begin), float(frag.end)))
    os.unlink(txt)
    return out
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_piper_io -v`
Expected: both tests PASS — `OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/piper_io.py .claude/skills/tts-voiceover/tests/test_piper_io.py
git commit -m "feat(tts): piper/ffmpeg/aeneas I/O shell + preflight"
```

---

### Task 8: Orchestrator + CLI (`run.py`)

**Files:**
- Create: `.claude/skills/tts-voiceover/scripts/run.py`
- Test: `.claude/skills/tts-voiceover/tests/test_run.py`

**Interfaces:**
- Consumes: all prior modules.
- Produces:
  - `align_with_fallback(spoken_text, tokens, voice_path, length_scale, out_wav, wav_len_frames_fn) -> list[tuple]`
    — try Piper-native durations; run `check_alignment`; on failure run `aeneas_align` and re-check;
    raise `RuntimeError` if both fail. (Pure-ish: takes the two aligner callables + the detector via
    injection so it is unit-testable WITHOUT binaries.)
  - `run(run_dir, fps=30, voice_path=..., length_scale=1.0) -> dict` — full pipeline writing
    `vo.wav` + `vo-timing.json`, patching `02-script.md`. CLI: `python3 run.py <run_dir> [voice_path]`.

- [ ] **Step 1: Write the failing test (inject fake aligners to test the fallback decision without binaries)**

`.claude/skills/tts-voiceover/tests/test_run.py`:
```python
import unittest
from scripts.run import align_with_fallback

class TestAlignFallback(unittest.TestCase):
    def setUp(self):
        self.tokens = [{"i": 0, "spoken": "a", "display": "a", "beat": "h"},
                       {"i": 1, "spoken": "b", "display": "b", "beat": "h"}]
        self.good = [(0.0, 0.30), (0.30, 0.60)]   # 0-9, 9-18 frames @30
        self.bad = [(0.0, 0.30), (0.20, 0.60)]    # non-monotonic

    def test_uses_primary_when_clean(self):
        out = align_with_fallback(
            primary=lambda: self.good, fallback=lambda: self.bad,
            tokens=self.tokens, fps=30, wav_len_frames=18)
        self.assertEqual(out, self.good)

    def test_falls_back_when_primary_fails(self):
        out = align_with_fallback(
            primary=lambda: self.bad, fallback=lambda: self.good,
            tokens=self.tokens, fps=30, wav_len_frames=18)
        self.assertEqual(out, self.good)

    def test_raises_when_both_fail(self):
        with self.assertRaises(RuntimeError):
            align_with_fallback(primary=lambda: self.bad,
                                fallback=lambda: self.bad,
                                tokens=self.tokens, fps=30, wav_len_frames=18)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_run -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.run'`.

- [ ] **Step 3: Write the implementation**

`.claude/skills/tts-voiceover/scripts/run.py`:
```python
"""Orchestrator: normalize -> synth/align (+fallback) -> timing -> envelope ->
write vo.wav + vo-timing.json -> patch 02-script.md. Stdlib + sibling modules."""
import json
import os
import sys

from scripts.normalize import normalize_narration
from scripts.timing import build_timing
from scripts.failure_detector import check_alignment
from scripts.envelope import build_duck_envelope
from scripts.framemap import render_frame_map_table, patch_script_frame_map


def align_with_fallback(primary, fallback, tokens, fps, wav_len_frames):
    """primary/fallback are zero-arg callables returning [(start_s,end_s)].
    Returns the first whose alignment passes check_alignment; else RuntimeError."""
    for getter in (primary, fallback):
        times = getter()
        words = build_timing(times, tokens, fps=fps)["words"]
        if check_alignment(words, wav_len_frames, len(tokens))["ok"]:
            return times
    raise RuntimeError("alignment failed on both primary and fallback")


def _parse_narration(script_path):
    """Read the 'Narration' beats from 02-script.md between markers.
    Expects lines like '- [beat_id] spoken line text' under NARRATION:START."""
    import re
    text = open(script_path).read()
    m = re.search(r"<!-- NARRATION:START -->(.*?)<!-- NARRATION:END -->",
                  text, re.DOTALL)
    if not m:
        raise ValueError("narration markers not found in script")
    beats, cur = [], None
    for line in m.group(1).splitlines():
        bm = re.match(r"\s*-\s*\[([^\]]+)\]\s*(.+)", line)
        if bm:
            bid, content = bm.group(1), bm.group(2).strip()
            if cur is None or cur["id"] != bid:
                cur = {"id": bid, "lines": []}
                beats.append(cur)
            cur["lines"].append(content)
    return beats


def run(run_dir, fps=30, voice_path=None, length_scale=1.0):
    from scripts.piper_io import (synth_and_durations, aeneas_align,
                                  PiperUnavailable)
    script_path = os.path.join(run_dir, "02-script.md")
    out_wav = os.path.join(run_dir, "vo.wav")

    beats = _parse_narration(script_path)
    norm = normalize_narration(beats)
    spoken, tokens = norm["spoken_text"], norm["tokens"]

    def _wav_len_frames():
        import wave
        with wave.open(out_wav) as w:
            return int(round(w.getnframes() / w.getframerate() * fps))

    def primary():
        return synth_and_durations(spoken, voice_path, length_scale, out_wav)

    def fallback():
        if not os.path.isfile(out_wav):
            raise RuntimeError("no vo.wav for aeneas fallback (piper failed)")
        return aeneas_align(spoken, out_wav)

    try:
        prim = primary
    except PiperUnavailable:
        prim = lambda: (_ for _ in ()).throw(RuntimeError("piper unavailable"))

    times = align_with_fallback(prim, fallback, tokens, fps, _wav_len_frames())

    timing = build_timing(times, tokens, fps=fps, voice=voice_path or "",
                          length_scale=length_scale)
    timing["envelope"] = build_duck_envelope(timing["speech_regions"],
                                             timing["total"])
    with open(os.path.join(run_dir, "vo-timing.json"), "w") as f:
        json.dump(timing, f, indent=2)

    table = render_frame_map_table(timing["beats"])
    patched = patch_script_frame_map(open(script_path).read(), table)
    open(script_path, "w").write(patched)
    return timing


if __name__ == "__main__":
    rd = sys.argv[1]
    vp = sys.argv[2] if len(sys.argv) > 2 else None
    out = run(rd, voice_path=vp)
    print("vo-timing.json total=%d frames, %d beats"
          % (out["total"], len(out["beats"])))
```

- [ ] **Step 4: Run to verify pass**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_run -v`
Expected: all 3 PASS — `OK`.

- [ ] **Step 5: Run the FULL suite — everything green**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v`
Expected: all tests across all modules PASS — `OK`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/tts-voiceover/scripts/run.py .claude/skills/tts-voiceover/tests/test_run.py
git commit -m "feat(tts): orchestrator + CLI (align-with-fallback, write timing, patch script)"
```

---

### Task 9: SKILL.md + gated end-to-end smoke test

**Files:**
- Create: `.claude/skills/tts-voiceover/SKILL.md`
- Create: `.claude/skills/tts-voiceover/tests/test_e2e_gated.py`

**Interfaces:**
- Consumes: the CLI `run()`.
- Produces: the skill's markdown I/O contract (for pipeline step 3.5) and a real-binary smoke test
  that **skips** when Piper/voice aren't installed (so CI/dev without binaries stays green).

- [ ] **Step 1: Write the gated smoke test**

`.claude/skills/tts-voiceover/tests/test_e2e_gated.py`:
```python
import os
import shutil
import tempfile
import unittest
from scripts.piper_io import preflight

VOICE = os.environ.get("PIPER_VOICE", "")

@unittest.skipUnless(VOICE and shutil.which("piper")
                     and preflight(VOICE, need_aligner=False)["ok"],
                     "piper + PIPER_VOICE not installed; skipping e2e")
class TestE2E(unittest.TestCase):
    def test_run_produces_timing_and_patches_script(self):
        from scripts.run import run
        d = tempfile.mkdtemp()
        with open(os.path.join(d, "02-script.md"), "w") as f:
            f.write("# s\n<!-- NARRATION:START -->\n"
                    "- [hook] Cleopatra is closer to you\n"
                    "- [beat1] than the pyramids\n"
                    "<!-- NARRATION:END -->\n"
                    "<!-- FRAME-MAP:START -->\nOLD\n<!-- FRAME-MAP:END -->\n")
        out = run(d, voice_path=VOICE)
        self.assertGreater(out["total"], 0)
        self.assertTrue(os.path.isfile(os.path.join(d, "vo.wav")))
        self.assertIn("**Total**", open(os.path.join(d, "02-script.md")).read())

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it — verify it SKIPS cleanly without Piper**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest tests.test_e2e_gated -v`
Expected: `skipped 'piper + PIPER_VOICE not installed; skipping e2e'` — `OK (skipped=1)`.

- [ ] **Step 3: Write `SKILL.md` (the pipeline step-3.5 contract)**

`.claude/skills/tts-voiceover/SKILL.md`:
```markdown
---
name: tts-voiceover
description: Generates the spoken voiceover for a Short and derives the VO-driven timing. Use as STEP 3.5 of the /short pipeline (after the writer, before asset-sourcing). Reads the Narration block in 02-script.md, runs local Piper TTS, derives an integer-frame timing contract (vo-timing.json), writes the VO-derived frame map back into 02-script.md, and emits a music-ducking envelope. Local + free; no API keys.
version: 1.0.0
allowed-tools: Read, Write, Edit, Bash(python3 *), Bash(piper:*), Bash(ffmpeg:*)
user-invocable: false
---

# tts-voiceover

Step 3.5 of `/short`. Turns the writer's **Narration** into `vo.wav` + `vo-timing.json`, then writes
the VO-derived frame map into `02-script.md`. All timing logic is the bundled Python in `scripts/`
(unit-tested, stdlib-only); Piper/aeneas/ffmpeg are invoked only by `piper_io.py`.

## Inputs
- Run folder `output/F-NNN-<slug>/` with `02-script.md` containing a Narration block between
  `<!-- NARRATION:START -->` / `<!-- NARRATION:END -->` (lines `- [beat_id] spoken line`) and an
  empty frame-map block between `<!-- FRAME-MAP:START -->` / `<!-- FRAME-MAP:END -->`.
- The configured Piper voice `.onnx` (default candidates: en_US-ryan-high / en_GB-alan-medium /
  en_US-amy-medium).

## Run
1. Preflight: `python3 scripts/run.py` calls `preflight`; if Piper or the named voice is missing,
   STOP and print the install steps (do not fake audio).
2. `python3 scripts/run.py <run_dir> <voice_path>` →
   normalizes numbers/abbrevs → Piper synth → trims silence → Piper-native word durations
   (aeneas fallback; failure detector gates both) → writes `vo.wav`, `vo-timing.json` (integer
   frames; `total` = durationInFrames; loop tail is a real beat entry), the ducking `envelope`, and
   patches the frame map into `02-script.md`.

## Output contract (`vo-timing.json`)
Integer frames only. Keys: `fps, voice, length_scale, total, words[], beats[], speech_regions[],
envelope[]`. Downstream (`remotion-prompt-generator`, the validator) read frames from here — never
re-round from seconds.

## Boundaries
- Generates audio (not spec-only) — but only `vo.wav` + JSON + a script patch. No video, no upload.
- On alignment failure twice, or overrun > target+~15%, STOP and route back to the writer to cut
  words (do not ship bad sync or a too-long VO).

## Tests
`cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v`
(The e2e test self-skips unless `PIPER_VOICE` + `piper` are installed.)
```

- [ ] **Step 4: Run the full suite once more**

Run: `cd .claude/skills/tts-voiceover && python3 -m unittest discover -s tests -v`
Expected: all unit tests PASS; the e2e test SKIPS — `OK (skipped=1)`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tts-voiceover/SKILL.md .claude/skills/tts-voiceover/tests/test_e2e_gated.py
git commit -m "feat(tts): SKILL.md step-3.5 contract + gated end-to-end smoke test"
```

---

## Self-Review

**1. Spec coverage**

| Spec section | Task |
|---|---|
| §3.3 step 1–2 normalization | Task 2 |
| §3.3 step 3 silence-trim | Task 7 (`_trim_silence`) |
| §3.3 step 4 exact alignment (Piper-native primary, aeneas fallback, no whisper) | Task 7 + Task 8 (`align_with_fallback`) |
| §3.3 step 5 round-to-frames-once | Task 3 (`build_timing`) |
| §3.3 step 6 derive frame map + loop tail entry | Task 3 + Task 6 |
| §3.3 step 7 patch 02-script.md | Task 6 + Task 8 |
| §3.5 `vo-timing.json` schema (integer frames, words/beats/regions) | Task 3 (+ envelope key Task 8) |
| §3.6 failure detector (4 checks, first-class fallback) | Task 4 + Task 8 |
| §3.4 preflight checks configured voice | Task 7 |
| §4 ducking envelope (region-merge + attack/release) | Task 5 |
| step-3.5 skill contract | Task 9 |

Out-of-scope-for-this-plan (Plans 2–3): pipeline wiring of other skills, CLAUDE.md/disclosure edits,
denser visuals, F-001 v4 regen+render. Noted, not gaps.

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows real
assertions and the exact run command + expected output.

**3. Type consistency:** `tokens` dicts use the same keys (`i/spoken/display/beat`) in Tasks 2,3,4,8.
`words` dicts use `i/display/spoken/start/end/beat/region` consistently (Tasks 3,4,5,6). `build_timing`
signature matches its callers in Task 8. `check_alignment(words, wav_len_frames, n_tokens)` matches
Task 4 def and Task 8 call. `render_frame_map_table(beats)` / `patch_script_frame_map(text, table)`
match Tasks 6 and 8. Envelope keyframe shape `{"frame","vol"}` consistent (Task 5, consumed Task 8).

**Risk note for the implementer:** Task 7's exact Piper CLI flags (`--json-output`/`--length_scale`)
vary by Piper build. The unit tests don't depend on them; the **gated e2e test (Task 9) is where you
verify the real flags** — adjust `synth_and_durations` to your installed Piper's alignment-output
flag, keeping the returned `(start_s, end_s)` contract. If your build can't emit word alignments,
the aeneas fallback path carries it.
```
