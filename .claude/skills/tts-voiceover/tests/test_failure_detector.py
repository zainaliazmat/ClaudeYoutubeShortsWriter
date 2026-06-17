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

    def test_gapped_real_speech_passes(self):
        # Realistic speech: words have inter-word pauses that belong to no word.
        # Old summed-duration coverage false-aborted this; span coverage passes.
        words, t = [], 0
        for i in range(20):
            words.append(_w(i, t, t + 7))   # ~0.23s word @30fps
            t += 7 + 4                       # + ~0.13s gap
        wav = words[-1]["end"]               # trimmed wav ends at last word
        r = check_alignment(words, wav_len_frames=wav, n_tokens=20)
        self.assertTrue(r["ok"], r["reasons"])

    def test_one_frame_word_is_plausible(self):
        # A short function word that rounds to a single frame must NOT be
        # rejected (min_w lowered to 1; build_timing clamps a 0-frame -> 1).
        words = [_w(0, 0, 10), _w(1, 10, 11), _w(2, 11, 21)]
        r = check_alignment(words, wav_len_frames=21, n_tokens=3)
        self.assertTrue(r["ok"], r["reasons"])

if __name__ == "__main__":
    unittest.main()
