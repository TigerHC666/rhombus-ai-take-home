# Rhombus AI Take-Home Assessment

Evaluation of an AI-built S3-to-GCS cleaning pipeline under schema and semantic drift.

## Status

Live baseline execution and a real scheduled run now retain all seven expected business records, with three identical exported results. Strict monetary serialization still violates the frozen two-decimal contract. All seven structural/semantic drift scenarios have been executed against the unchanged baseline pipeline; a second isolated repetition is in progress. Builder repairs and their scheduled verification are the next milestone. Authentication, project access, pipeline binding, and independent artifact validation are exercised against the real services. See the linked evidence rather than treating local validator tests as platform passes.

## Contents

- [Requirements](REQUIREMENTS.md)
- [Test design and cleaning contract](TEST_DESIGN.md)
- [Independent design review](DESIGN_REVIEW.md)
- `datasets/`: baseline, seven variants, expected outputs, and checksums.
- `data-validation/`: standard-library Python validator and regression tests.
- `observations/evidence/`: recorded builder prompts and responses.
- [Baseline repair-verification finding](observations/baseline-builder-cache.md): the builder's repair claim differs from observed output.

## Local validation

Requires Python 3.12 or later. Run from the repository root:

```sh
python -m unittest discover -s data-validation -p "test_*.py" -v
python datasets/generate_variants.py
python data-validation/validate.py --scenario baseline --source path/to/downloaded-s3.csv --output path/to/downloaded-gcs.csv --report path/to/report.json
```

Use actual downloaded cloud artifacts for integration validation; expected fixtures are an oracle, not evidence of a successful pipeline run. Add `--repeat path/to/repeated-output.csv` for each identical-input repeat.

## API tests and authentication

Requires Node.js 22 or later:

```sh
npm ci
node scripts/capture-session.cjs
npm run test:api
```

The API suite uses routes observed in a dedicated Chrome test browser and covers provider discovery, the CSRF endpoint, and rejection of sign-in without CSRF. [Results](observations/evidence/api-authentication-results.json) are authentication coverage only; they do not replace pipeline API tests. The negative case asserts the observed 302 response, empty body, and `MissingCSRF` redirect without following it into a misleading 200 page.

The session helper opens an isolated Chrome window for interactive sign-in, stores authentication only in ignored `.auth/`, and records route/method/status metadata without tokens or request/response bodies. Google refused sign-in in the automated browser; the user subsequently completed sign-in and the saved session was verified against the original project. Do not disable browser security or copy an unrelated browser profile to circumvent this restriction.

For approved GCS artifact downloads, install `google-auth` and `requests`, provide the bucket-scoped key under `.secrets/`, and run `python data-validation/download_gcs.py`. [Object inventory](observations/evidence/gcs/inventory.json) records immutable generations, timestamps, and hashes. Credentials are never included in that inventory.

## Credentials and cloud resources

Keep credentials and authentication state outside version control. `.secrets/`, `.auth/`, `.env` files, and temporary runtime artifacts are ignored. Use a dedicated read-only S3 source grant and a bucket-scoped GCS output identity. Revoke temporary integration credentials after testing. Scheduling must remain disabled outside bounded test windows.

## Findings and submission

Verified experiment results, scenario links, the top three findings, usability feedback, UI/API commands, and the demonstration link will be added after live execution. No unexecuted scenario is marked as passed.
