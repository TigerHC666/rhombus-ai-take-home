"""Validate downloaded S3/GCS artifacts against a frozen, independent oracle."""

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_csv(path):
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.reader(handle))
    if not rows:
        raise ValueError(f"Empty CSV: {path.name}")
    return rows[0], rows[1:]


def validate(scenario, source, output, repeats=()):
    manifest = json.loads((ROOT / "datasets/manifest.json").read_text(encoding="utf-8"))
    contract = manifest[scenario]
    expected_path = ROOT / "datasets" / contract["expected"]
    errors = []
    if digest(expected_path) != contract["expected_sha256"]:
        raise ValueError("Frozen expected-output hash mismatch")
    if digest(source) != contract["input_sha256"]:
        errors.append("Downloaded S3 input does not match the scenario fixture hash")
    source_header, source_rows = read_csv(source)
    if len(source_rows) != contract["input_rows"]:
        errors.append("S3 input row count differs from the manifest")
    if any(len(row) != len(source_header) for row in source_rows):
        errors.append("Malformed S3 CSV row width")
    expected_header, expected_rows = read_csv(expected_path)
    header, rows = read_csv(output)
    if header != expected_header:
        errors.append(f"Schema/order mismatch: {header!r}")
    if len(rows) != contract["expected_rows"]:
        errors.append(f"Output count: expected {contract['expected_rows']}, got {len(rows)}")
    for index, row in enumerate(rows):
        if len(row) != len(expected_header):
            errors.append(f"Output row {index + 1} has wrong field count")
            continue
        if not re.fullmatch(r"[1-9][0-9]*", row[4]):
            errors.append(f"Output row {index + 1}: quantity is not a positive integer")
        for col in (5, 8):
            if not re.fullmatch(r"(?:0|[1-9][0-9]*)\.[0-9]{2}", row[col]):
                errors.append(f"Output row {index + 1}: {expected_header[col]} must have two decimals")
        if index < len(expected_rows) and row != expected_rows[index]:
            differences = {expected_header[col]: {"expected": expected_rows[index][col], "actual": value}
                           for col, value in enumerate(row) if value != expected_rows[index][col]}
            errors.append({"row": index + 1, "differences": differences})
    repeat_results = []
    for path in repeats:
        repeated_header, repeated_rows = read_csv(path)
        matches = repeated_header == header and repeated_rows == rows
        repeat_results.append({"file": path.name, "sha256": digest(path), "matches": matches})
        if not matches:
            errors.append(f"Determinism mismatch: {path.name}")
    return {
        "scenario": scenario,
        "passed": not errors,
        "evidence_level": "local_artifact_validation; provenance requires a live run manifest",
        "source_sha256": digest(source),
        "output_sha256": digest(output),
        "source_rows": len(source_rows),
        "output_rows": len(rows),
        "determinism": "checked" if repeats else "not_checked",
        "repeats": repeat_results,
        "errors": errors,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", required=True)
    parser.add_argument("--source", required=True, type=Path, help="Actual downloaded S3 input")
    parser.add_argument("--output", required=True, type=Path, help="Actual downloaded GCS output")
    parser.add_argument("--repeat", action="append", default=[], type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    result = validate(args.scenario, args.source, args.output, args.repeat)
    rendered = json.dumps(result, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    raise SystemExit(0 if result["passed"] else 1)


if __name__ == "__main__":
    main()
