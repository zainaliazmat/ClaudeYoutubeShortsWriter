import unittest

class TestSmoke(unittest.TestCase):
    def test_scripts_package_importable(self):
        import scripts  # noqa: F401
        self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
