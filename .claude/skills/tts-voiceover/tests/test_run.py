import os
import json
import tempfile
import unittest
import wave

from scripts.run import align_with_fallback
import scripts.kokoro_io as kio
from scripts.run import run


class TestAlignFallback(unittest.TestCase):
    def setUp(self):
        self.tokens = [{"i": 0, "spoken": "a", "display": "a", "beat": "h"},
                       {"i": 1, "spoken": "b", "display": "b", "beat": "h"}]
        self.good = [(0.0, 0.30), (0.30, 0.60)]   # 0-9, 9-18 frames @30
        self.bad = [(0.0, 0.30), (0.20, 0.60)]    # non-monotonic

    def test_uses_primary_when_clean(self):
        out = align_with_fallback(
            primary=lambda: self.good, fallback=lambda: self.bad,
            tokens=self.tokens, fps=30, wav_len_frames=lambda: 18)
        self.assertEqual(out, self.good)

    def test_falls_back_when_primary_fails(self):
        out = align_with_fallback(
            primary=lambda: self.bad, fallback=lambda: self.good,
            tokens=self.tokens, fps=30, wav_len_frames=lambda: 18)
        self.assertEqual(out, self.good)

    def test_raises_when_both_fail(self):
        with self.assertRaises(RuntimeError):
            align_with_fallback(primary=lambda: self.bad,
                                fallback=lambda: self.bad,
                                tokens=self.tokens, fps=30, wav_len_frames=lambda: 18)

    def test_falls_back_when_primary_raises(self):
        def boom():
            raise RuntimeError("primary unavailable")
        out = align_with_fallback(primary=boom, fallback=lambda: self.good,
                                  tokens=self.tokens, fps=30, wav_len_frames=lambda: 18)
        self.assertEqual(out, self.good)

    def test_raises_when_both_raise(self):
        def boom():
            raise RuntimeError("x")
        with self.assertRaises(RuntimeError):
            align_with_fallback(primary=boom, fallback=boom,
                                tokens=self.tokens, fps=30, wav_len_frames=lambda: 18)


def _write_silent_wav(path, seconds, sr=24000):
    n = int(seconds * sr)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(b"\x00\x00" * n)


class TestRunIntegration(unittest.TestCase):
    def test_run_orchestration_with_fake_aligner(self):
        d = tempfile.mkdtemp()
        script = os.path.join(d, "02-script.md")
        with open(script, "w") as f:
            f.write("# s\n<!-- NARRATION:START -->\n"
                    "- [hook] Cleopatra is closer\n"
                    "- [beat1] than the pyramids\n"
                    "<!-- NARRATION:END -->\n"
                    "<!-- FRAME-MAP:START -->\nOLD\n<!-- FRAME-MAP:END -->\n")
        def fake_synth(spoken_text, voice, speed, out_wav):
            n = len(spoken_text.split())
            _write_silent_wav(out_wav, seconds=n * 0.30)   # contiguous 0.30s words
            return [(i * 0.30, (i + 1) * 0.30) for i in range(n)]
        orig = kio.synth_and_durations
        kio.synth_and_durations = fake_synth
        try:
            out = run(d, fps=30, voice="am_michael", speed=1.0)
        finally:
            kio.synth_and_durations = orig
        self.assertGreater(out["total"], 0)
        self.assertTrue(os.path.isfile(os.path.join(d, "vo.wav")))
        timing = json.load(open(os.path.join(d, "vo-timing.json")))
        self.assertIn("envelope", timing)
        self.assertIn("**Total**", open(script).read())

    def test_run_rejects_empty_narration(self):
        d = tempfile.mkdtemp()
        with open(os.path.join(d, "02-script.md"), "w") as f:
            f.write("# s\n<!-- NARRATION:START -->\n<!-- NARRATION:END -->\n"
                    "<!-- FRAME-MAP:START -->\nOLD\n<!-- FRAME-MAP:END -->\n")
        with self.assertRaises(ValueError):
            run(d, fps=30, voice="am_michael")


if __name__ == "__main__":
    unittest.main()
