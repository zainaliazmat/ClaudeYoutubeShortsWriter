import unittest
from scripts.kokoro_io import preflight, KNOWN_VOICES

class TestPreflight(unittest.TestCase):
    def test_unknown_voice_reported(self):
        r = preflight(voice="not_a_real_voice", need_aligner=False)
        self.assertFalse(r["ok"])
        self.assertTrue(any("voice" in m for m in r["missing"]))

    def test_known_voice_not_flagged_unknown(self):
        v = sorted(KNOWN_VOICES)[0]
        r = preflight(voice=v, need_aligner=False)
        self.assertFalse(any("unknown voice" in m for m in r["missing"]))

    def test_known_voices_include_defaults(self):
        self.assertIn("am_michael", KNOWN_VOICES)
        self.assertIn("bm_george", KNOWN_VOICES)
        self.assertIn("af_bella", KNOWN_VOICES)

if __name__ == "__main__":
    unittest.main()
