"""Local validator checks. These are not live Rhombus execution evidence."""

import csv
import uuid
import unittest
from pathlib import Path

from validate import ROOT, read_csv, validate


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        self.temp = ROOT / '.runtime' / ('validator-' + uuid.uuid4().hex)
        self.temp.mkdir(parents=True)
        self.addCleanup(self.cleanup)
        self.source = ROOT / "datasets/baseline.csv"
        self.expected = ROOT / "datasets/expected/baseline.csv"

    def mutate(self, change, name="mutated.csv"):
        header, rows = read_csv(self.expected)
        change(header, rows)
        path = self.temp / name
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(header)
            writer.writerows(rows)
        return path

    def cleanup(self):
        for path in self.temp.iterdir():
            path.unlink()
        self.temp.rmdir()

    def test_hand_authored_baseline_and_unchecked_determinism(self):
        result = validate("baseline", self.source, self.expected)
        self.assertTrue(result["passed"])
        self.assertEqual(result["source_rows"], 12)
        self.assertEqual(result["output_rows"], 7)
        self.assertEqual(result["determinism"], "not_checked")

    def test_detects_silent_cents_corruption(self):
        output = self.mutate(lambda _, rows: rows[0].__setitem__(5, "1250.00"))
        self.assertFalse(validate("semantic-cents", ROOT / "datasets/semantic-cents.csv", output)["passed"])

    def test_detects_silent_date_corruption(self):
        output = self.mutate(lambda _, rows: rows[0].__setitem__(3, "2026-04-03"))
        self.assertFalse(validate("semantic-dates", ROOT / "datasets/semantic-dates.csv", output)["passed"])

    def test_wrong_source_cannot_pass_with_correct_output(self):
        self.assertFalse(validate("baseline", ROOT / "datasets/schema-add.csv", self.expected)["passed"])

    def test_reordered_rows_remain_a_defect(self):
        output = self.mutate(lambda _, rows: rows.reverse())
        self.assertFalse(validate("baseline", self.source, output)["passed"])

    def test_missing_row_and_extra_column_fail(self):
        output = self.mutate(lambda header, rows: (header.append("unexpected"), rows.pop()))
        self.assertFalse(validate("baseline", self.source, output)["passed"])

    def test_nonfinite_amount_fails(self):
        output = self.mutate(lambda _, rows: rows[0].__setitem__(8, "NaN"))
        self.assertFalse(validate("baseline", self.source, output)["passed"])

    def test_determinism_difference_fails(self):
        output = self.mutate(lambda _, rows: rows[0].__setitem__(8, "25.01"))
        result = validate("baseline", self.source, self.expected, [output])
        self.assertFalse(result["passed"])
        self.assertEqual(result["determinism"], "checked")


if __name__ == "__main__":
    unittest.main()
