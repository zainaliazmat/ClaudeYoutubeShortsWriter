import os
import tempfile
import unittest
from scripts.kokoro_io import preflight

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

if __name__ == "__main__":
    unittest.main()
