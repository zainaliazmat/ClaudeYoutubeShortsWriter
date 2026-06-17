import unittest
from scripts.normalize import int_to_words, normalize_token, normalize_narration

class TestIntToWords(unittest.TestCase):
    def test_units_and_teens(self):
        self.assertEqual(int_to_words(0), "zero")
        self.assertEqual(int_to_words(7), "seven")
        self.assertEqual(int_to_words(13), "thirteen")
    def test_tens_and_hundreds(self):
        self.assertEqual(int_to_words(69), "sixty-nine")
        self.assertEqual(int_to_words(450), "four hundred fifty")
    def test_year_style_thousands(self):
        self.assertEqual(int_to_words(2500), "two thousand five hundred")
        self.assertEqual(int_to_words(1969), "one thousand nine hundred sixty-nine")

class TestNormalizeToken(unittest.TestCase):
    def test_strips_tilde_and_commas(self):
        self.assertEqual(normalize_token("~2,500"), "two thousand five hundred")
    def test_abbreviations(self):
        self.assertEqual(normalize_token("BC"), "B C")
        self.assertEqual(normalize_token("BCE"), "B C E")
    def test_plain_word_passthrough(self):
        self.assertEqual(normalize_token("Cleopatra"), "Cleopatra")

class TestNormalizeNarration(unittest.TestCase):
    def test_expands_and_maps_tokens_to_beats(self):
        beats = [
            {"id": "hook", "lines": ["Cleopatra"]},
            {"id": "beat1", "lines": ["born 69 BC"]},
        ]
        out = normalize_narration(beats)
        self.assertEqual(out["spoken_text"], "Cleopatra born sixty-nine B C")
        # token list: Cleopatra | born | sixty-nine | B | C
        self.assertEqual([t["spoken"] for t in out["tokens"]],
                         ["Cleopatra", "born", "sixty-nine", "B", "C"])
        self.assertEqual([t["beat"] for t in out["tokens"]],
                         ["hook", "beat1", "beat1", "beat1", "beat1"])
        # display preserves the original token the number came from
        self.assertEqual(out["tokens"][2]["display"], "69")

if __name__ == "__main__":
    unittest.main()
