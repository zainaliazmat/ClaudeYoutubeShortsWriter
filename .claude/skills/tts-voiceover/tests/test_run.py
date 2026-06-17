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

    def test_falls_back_when_primary_raises(self):
        def boom():
            raise RuntimeError("primary unavailable")
        out = align_with_fallback(primary=boom, fallback=lambda: self.good,
                                  tokens=self.tokens, fps=30, wav_len_frames=18)
        self.assertEqual(out, self.good)

    def test_raises_when_both_raise(self):
        def boom():
            raise RuntimeError("x")
        with self.assertRaises(RuntimeError):
            align_with_fallback(primary=boom, fallback=boom,
                                tokens=self.tokens, fps=30, wav_len_frames=18)

if __name__ == "__main__":
    unittest.main()
