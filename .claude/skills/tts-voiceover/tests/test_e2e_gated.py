import os
import tempfile
import unittest
import wave
from scripts.kokoro_io import preflight, synth_and_durations
from scripts.normalize import normalize_narration

VOICE = os.environ.get("KOKORO_VOICE", "am_michael")

@unittest.skipUnless(preflight(VOICE, need_aligner=False)["ok"],
                     "kokoro/espeak-ng/voice not installed; skipping e2e")
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
        out = run(d, voice=VOICE)
        self.assertGreater(out["total"], 0)
        self.assertTrue(os.path.isfile(os.path.join(d, "vo.wav")))
        self.assertIn("**Total**", open(os.path.join(d, "02-script.md")).read())

    def test_real_audio_token_timing_alignment(self):
        """Regression guard for the load-bearing risk (spec §8): real Kokoro
        word timing must align 1:1 with the normalized spoken tokens even with
        the number/abbreviation hazards (years, BC), and the trimmed wav length
        must agree with the speech span (no interior-silence collapse)."""
        beats = [
            {"id": "hook", "lines": ["Cleopatra lived closer to you than the pyramids."]},
            {"id": "b1", "lines": ["The Great Pyramid rose around 2560 BC."]},
            {"id": "b2", "lines": ["Cleopatra was born in 69 BC; the Moon landing was 1969."]},
        ]
        norm = normalize_narration(beats)
        # number/abbrev normalization is exact-by-construction
        self.assertIn("twenty-five sixty", norm["spoken_text"])
        self.assertIn("nineteen sixty-nine", norm["spoken_text"])
        self.assertIn("B C", norm["spoken_text"])

        out_wav = os.path.join(tempfile.mkdtemp(), "vo.wav")
        times = synth_and_durations(norm["spoken_text"], VOICE, 1.0, out_wav)
        # 1:1 with the spoken tokens (punctuation tokens filtered)
        self.assertEqual(len(times), len(norm["tokens"]))
        # coverage: speech span within ±15% of the trimmed wav (spec §3.6.2)
        with wave.open(out_wav) as w:
            wav_s = w.getnframes() / w.getframerate()
        span = times[-1][1] - times[0][0]
        self.assertLess(abs(1.0 - span / wav_s), 0.15,
                        "speech span %.2fs vs wav %.2fs" % (span, wav_s))
        # monotonic non-decreasing onsets
        for a, b in zip(times, times[1:]):
            self.assertLessEqual(a[0], b[0])

if __name__ == "__main__":
    unittest.main()
