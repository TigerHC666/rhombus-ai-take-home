# Rhombus AI Take-Home Assessment

Evaluation of an AI-built S3-to-GCS cleaning pipeline under schema and semantic drift.

## Status

Work in progress. Synthetic fixtures, independent expected outputs, and a local validator are implemented. Live pipeline execution, scheduled baseline, drift experiments, UI/API suites, and the demonstration recording are not yet complete. Local validator tests do not establish platform correctness.

## Contents

- [Requirements](REQUIREMENTS.md)
- [Test design and cleaning contract](TEST_DESIGN.md)
- [Independent design review](DESIGN_REVIEW.md)
- `datasets/`: baseline, seven variants, expected outputs, and checksums.
- `data-validation/`: standard-library Python validator and regression tests.
- `observations/evidence/`: recorded builder prompts and responses.

## Local validation

Requires Python 3.12 or later. Run from the repository root:

```sh
python -m unittest discover -s data-validation -p "test_*.py" -v
python datasets/generate_variants.py
python data-validation/validate.py --scenario baseline --source path/to/downloaded-s3.csv --output path/to/downloaded-gcs.csv --report path/to/report.json
```

Use actual downloaded cloud artifacts for integration validation; expected fixtures are an oracle, not evidence of a successful pipeline run. Add `--repeat path/to/repeated-output.csv` for each identical-input repeat.

## Credentials and cloud resources

Keep credentials and authentication state outside version control. `.secrets/`, `.auth/`, `.env` files, and temporary runtime artifacts are ignored. Use a dedicated read-only S3 source grant and a bucket-scoped GCS output identity. Revoke temporary integration credentials after testing. Scheduling must remain disabled outside bounded test windows.

## Findings and submission

Verified experiment results, scenario links, the top three findings, usability feedback, UI/API commands, and the demonstration link will be added after live execution. No unexecuted scenario is marked as passed.
