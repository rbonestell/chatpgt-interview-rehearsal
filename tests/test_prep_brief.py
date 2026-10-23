"""Run with: <PDF runtime>/bin/python -m unittest discover -s tests -v."""

import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills/mock-interview/scripts/generate_prep_brief.py"
NOTES = {
    "role": "Operations coordinator",
    "company": "Fictional Harbor Works",
    "evidence_note": "One partial answer; insufficient evidence for an overall assessment.",
    "sections": [{"heading": "Next practice step", "bullets": [
        'Explain your own decision & confirm the result. <img src="https://invalid.example/a.png"/>',
        "Keep [confirm outcome] unfinished until verified.",
    ]}],
    "sources": [{"title": "Reference example", "url": "https://example.com/role?a=1&b=2"}],
}


class PrepBriefTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="prep-brief-test-")
        self.addCleanup(self.directory.cleanup)
        self.output = Path(self.directory.name) / "brief.pdf"

    def run_generator(self, notes=NOTES, *options):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--output", str(self.output), *options],
            input=json.dumps(notes), text=True, cwd=self.directory.name,
            capture_output=True, timeout=30,
        )

    def test_pdf_contains_icon_fonts_links_and_literal_notes(self):
        result = self.run_generator()
        self.assertEqual(result.returncode, 0, result.stderr)
        pdf = self.output.read_bytes()
        self.assertTrue(pdf.startswith(b"%PDF-"))
        self.assertIn(b"/Subtype /Image", pdf)
        self.assertIn(b"/FontFile2", pdf)
        self.assertIn(b"/URI", pdf)
        if shutil.which("pdftotext"):
            text = subprocess.check_output(["pdftotext", str(self.output), "-"], text=True)
            self.assertIn("insufficient evidence", text)
            self.assertIn("[confirm outcome]", text)
            self.assertIn('<img src="https://invalid.example/a.png"/>', text)
            self.assertIn("not an employer assessment", text)

    def test_existing_output_is_untouched(self):
        self.output.write_bytes(b"keep this document")
        result = self.run_generator()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.output.read_bytes(), b"keep this document")

    def test_missing_icon_uses_text_header(self):
        installed = Path(self.directory.name) / "plugin/skills/mock-interview/scripts/generate_prep_brief.py"
        installed.parent.mkdir(parents=True)
        shutil.copyfile(SCRIPT, installed)
        result = subprocess.run(
            [sys.executable, str(installed), "--output", str(self.output)],
            input=json.dumps(NOTES), text=True, capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("icon unavailable", result.stderr)
        self.assertTrue(self.output.read_bytes().startswith(b"%PDF-"))

    def test_invalid_data_and_unsafe_urls_create_no_file(self):
        for changes in [{"evidence_note": ""}, {"sections": []}, {"unexpected": "value"},
                        {"sources": [{"title": "Local", "url": "file:///etc/passwd"}]}]:
            with self.subTest(changes=changes):
                notes = {**copy.deepcopy(NOTES), **changes}
                result = self.run_generator(notes)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(self.output.exists())

    def test_unicode_font_failure_preserves_original_language(self):
        result = self.run_generator({**NOTES, "role": "研究員"})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--font", result.stderr)
        self.assertFalse(self.output.exists())

    def test_missing_dependency_has_actionable_error(self):
        result = subprocess.run(
            [sys.executable, "-S", str(SCRIPT), "--output", str(self.output)],
            input=json.dumps(NOTES), text=True, capture_output=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("dependency unavailable", result.stderr)
        self.assertFalse(self.output.exists())

    def test_long_brief_paginates(self):
        notes = copy.deepcopy(NOTES)
        notes["sections"] = [
            {"heading": f"Practice area {i + 1}", "bullets": [
                "Name the tradeoff, describe your personal action, and identify the outcome "
                "that can be supported by the example you gave."
            ] * 7} for i in range(6)
        ]
        result = self.run_generator(notes)
        self.assertEqual(result.returncode, 0, result.stderr)
        if shutil.which("pdfinfo"):
            info = subprocess.check_output(["pdfinfo", str(self.output)], text=True)
            pages = int(next(line.split(":")[1] for line in info.splitlines() if line.startswith("Pages:")))
            self.assertGreater(pages, 1)


if __name__ == "__main__":
    unittest.main()
