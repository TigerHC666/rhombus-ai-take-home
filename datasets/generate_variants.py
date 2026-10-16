"""Generate deterministic input mutations; never run a cleaning transformation."""

import csv
import hashlib
import json
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def read(path):
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames, list(reader)


def write(path, fields, rows):
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def main():
    fields, baseline = read(ROOT / "baseline.csv")
    expected_fields, expected = read(ROOT / "expected/baseline.csv")
    scenarios = ["baseline", "schema-drop", "schema-rename", "schema-type",
                 "schema-add", "schema-combined", "semantic-cents", "semantic-dates"]
    manifest = {}
    for scenario in scenarios:
        rows = [dict(row) for row in baseline]
        columns = list(fields)
        if scenario in ("schema-drop", "schema-combined"):
            columns.remove("email")
            for row in rows:
                del row["email"]
        if scenario in ("schema-rename", "schema-combined"):
            columns[columns.index("unit_price")] = "price_per_unit"
            for row in rows:
                row["price_per_unit"] = row.pop("unit_price")
        if scenario in ("schema-type", "schema-combined"):
            for row in rows:
                row["quantity"] += " units"
        if scenario in ("schema-add", "schema-combined"):
            columns.append("loyalty_tier")
            for row in rows:
                row["loyalty_tier"] = "standard"
        if scenario == "semantic-cents":
            for row in rows:
                value = row["unit_price"]
                if value:
                    prefix = "$" if value.startswith("$") else ""
                    row["unit_price"] = prefix + format(Decimal(value.lstrip("$")) * 100, ".2f")
        if scenario == "semantic-dates":
            for row in rows:
                month, day, year = row["order_date"].split("/")
                row["order_date"] = f"{day}/{month}/{year}"
        path = ROOT / f"{scenario}.csv"
        if scenario != "baseline":
            write(path, columns, rows)
        expected_path = ROOT / "expected" / f"{scenario}.csv"
        if scenario != "baseline":
            target = [dict(row) for row in expected]
            if scenario in ("schema-drop", "schema-combined"):
                for row in target:
                    row["email"] = ""
            write(expected_path, expected_fields, target)
        manifest[scenario] = {
            "input": path.name,
            "input_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "input_rows": len(rows),
            "expected": f"expected/{scenario}.csv",
            "expected_sha256": hashlib.sha256(expected_path.read_bytes()).hexdigest(),
            "expected_rows": len(expected),
            "status": "not_run",
        }
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
