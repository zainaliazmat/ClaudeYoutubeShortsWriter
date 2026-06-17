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
