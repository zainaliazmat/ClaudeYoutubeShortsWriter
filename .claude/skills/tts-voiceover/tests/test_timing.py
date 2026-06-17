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
        t = build_timing(self.times, self.tokens, fps=30, voice="am_michael",
                         speed=1.05)
        self.assertEqual(t["fps"], 30)
        self.assertEqual(t["voice"], "am_michael")
        self.assertEqual(t["speed"], 1.05)

    def test_subframe_word_clamped_to_one_frame(self):
        # "of" spans <1 frame: rounds to start==end (0f). Must clamp to 1f and
        # stay monotonic so the detector doesn't reject it.
        toks = _tokens([("a", "a", "h"), ("of", "of", "h"), ("them", "them", "h")])
        t = build_timing([(0.0, 0.40), (0.40, 0.41), (0.50, 0.90)], toks, fps=30)
        w = t["words"]
        self.assertEqual(w[1]["start"], 12)
        self.assertEqual(w[1]["end"], 13)            # 0-frame clamped to 1
        self.assertGreaterEqual(w[2]["start"], w[1]["end"])  # still monotonic

    def test_empty_and_single_word(self):
        empty = build_timing([], [], fps=30, loop_tail_frames=75)
        self.assertEqual(empty["total"], 75)
        self.assertEqual(empty["words"], [])
        self.assertEqual(empty["beats"][-1]["id"], "loop")
        single = build_timing([(0.0, 0.40)],
                              _tokens([("hi", "hi", "h")]), fps=30)
        self.assertEqual(single["words"][0]["start"], 0)
        self.assertEqual(single["beats"][-1]["end"], single["total"])

if __name__ == "__main__":
    unittest.main()
