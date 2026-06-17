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
