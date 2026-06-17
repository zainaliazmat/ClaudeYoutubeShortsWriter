import unittest
from scripts.kokoro_io import preflight, KNOWN_VOICES, _parse_lead_silence

class TestParseLeadSilence(unittest.TestCase):
    def test_leading_silence_at_head_is_returned(self):
        err = ("[silencedetect] silence_start: 0\n"
               "[silencedetect] silence_end: 0.42 | silence_duration: 0.42\n")
        self.assertAlmostEqual(_parse_lead_silence(err), 0.42)

    def test_audio_opens_on_speech_returns_zero(self):
        # First silence is an INTERIOR pause (starts at 1.30, not the head):
        # must NOT be treated as leading silence.
        err = ("[silencedetect] silence_start: 1.30\n"
               "[silencedetect] silence_end: 1.55 | silence_duration: 0.25\n")
        self.assertEqual(_parse_lead_silence(err), 0.0)

    def test_no_silence_detected_returns_zero(self):
        self.assertEqual(_parse_lead_silence("nothing here\n"), 0.0)

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
