import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts" / "tsv_audit.py"
SPEC = importlib.util.spec_from_file_location("tsv_audit", MODULE_PATH)
tsv_audit = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(tsv_audit)


class AuditFileTests(unittest.TestCase):
    def test_empty_and_valid_files(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "cards.tsv"
            path.write_text("", encoding="utf-8")
            self.assertEqual(tsv_audit.audit_file(path), [])
            path.write_text("a\tb\n1\t2\n", encoding="utf-8")
            self.assertEqual(tsv_audit.audit_file(path), [])

    def test_reports_short_and_long_rows_with_line_numbers(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "cards.tsv"
            path.write_text("a\tb\n1\n1\t2\t3\n", encoding="utf-8")
            self.assertEqual(tsv_audit.audit_file(path), [(2, 2, 1), (3, 2, 3)])

    def test_collects_recursively_in_deterministic_order(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "nested").mkdir()
            (root / "z.tsv").touch()
            (root / "a.tsv").touch()
            (root / "nested" / "m.tsv").touch()
            relative = [path.relative_to(root).as_posix() for path in tsv_audit.collect_tsv_files(root)]
            self.assertEqual(relative, ["a.tsv", "nested/m.tsv", "z.tsv"])


class CommandTests(unittest.TestCase):
    def run_audit(self, base_dir):
        return subprocess.run(
            [sys.executable, str(MODULE_PATH), "--base-dir", str(base_dir)],
            cwd=ROOT, capture_output=True, text=True, check=False,
        )

    def test_missing_directory_exits_two(self):
        result = self.run_audit(ROOT / "does-not-exist")
        self.assertEqual(result.returncode, 2)
        self.assertIn("base directory not found", result.stderr)

    def test_violations_exit_one_and_include_details(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.tsv"
            path.write_text("a\tb\nonly-one\n", encoding="utf-8")
            result = self.run_audit(directory)
            self.assertEqual(result.returncode, 1)
            self.assertIn("bad.tsv: row 2 header=2 row=1", result.stdout)

    def test_repository_gallery_is_valid(self):
        result = self.run_audit(ROOT / "card-gallery")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("TSV audit passed", result.stdout)


if __name__ == "__main__":
    unittest.main()
