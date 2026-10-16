# Renamed price column

Status: real manual pre-repair observation complete; Builder repair and scheduled verification pending.

## Change and reproduction

Replace baseline `unit_price` with `price_per_unit`, keeping all twelve input rows and values unchanged. Run the existing baseline pipeline without a repair. The desired repaired result is the seven-record baseline business output with canonical `unit_price`; no currency-unit conversion is required.

The downloaded [S3 source](evidence/schema-rename/pre-repair-1792179839879/source.csv) and [before provenance](evidence/schema-rename/pre-repair-1792179839879/source-provenance.json) match SHA-256 `1ea5facc8c0ec98e0cdfdf7954d57ab312e736ac72d462276c0e317c8a8e7d2e`. The [after read](evidence/schema-rename/pre-repair-1792179839879/source-after/source-provenance.json) matches the same hash.

## Observed result

The [manifest](evidence/schema-rename/pre-repair-1792179839879/run-manifest.json) records a manual trigger at 2026-10-16 19:44:13.179 UTC. Job `ad8f756b-e3c2-4727-91d3-22d877fa9a01` was observed `FAILED` at 19:44:18.347 UTC in [job states](evidence/schema-rename/pre-repair-1792179839879/job-states.json). These are observation times, not inferred server transition times.

The [logs](evidence/schema-rename/pre-repair-1792179839879/page-and-logs.txt) identify `orders_cleaned_v3` and missing `unit_price`. At the same displayed time, they also state “Pipeline execution completed successfully.” The [screenshot](evidence/schema-rename/pre-repair-1792179839879/pipeline-result.png) preserves the UI. No fresh GCS output was observed before collection ended at 19:44:31.736 UTC. The [validation record](evidence/schema-rename/pre-repair-1792179839879/validation.json) explicitly fails with no output; an old export was not substituted.

Severity: medium for misleading operational reporting. Rejecting an unexpected column name is understandable, but the simultaneous success message contradicts the failed job. The visible error names the missing field and node; its generated-code excerpt is truncated.

## Isolation and remaining work

The captured [configuration](evidence/schema-rename/pre-repair-1792179839879/configuration.json) was checked against the frozen baseline for node IDs, code, prompts and edges. This early snapshot did not capture every source/destination setting or prove a full pre-run comparison; a stronger rerun is recorded below. The subsequent [baseline restoration validation](evidence/baseline/restore-after-schema-rename-1792179879464/validation.json) reports correct business values while retaining the known monetary-format failure.

The [prepared Builder prompt](../prompts/repairs/schema-rename.txt) requests an explicit alias to canonical `unit_price`. Diagnosis quality, repair effectiveness, and subsequent scheduled execution have not yet been evaluated. No scheduled result or successful repair is claimed.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:54:48.160Z ([manifest](evidence/schema-rename/pre-repair-1792180478174/run-manifest.json)). Job `7965e20a-eae6-4f9d-b0d0-4a373b4f22cf` was first observed `FAILED` at 2026-10-16T19:54:53.286Z ([job states](evidence/schema-rename/pre-repair-1792180478174/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-rename/pre-repair-1792180478174/configuration-before.json) and [after configuration](evidence/schema-rename/pre-repair-1792180478174/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-rename/pre-repair-1792180478174/source-provenance.json), [after](evidence/schema-rename/pre-repair-1792180478174/source-after/source-provenance.json)). See the [second logs](evidence/schema-rename/pre-repair-1792180478174/page-and-logs.txt) and [validation](evidence/schema-rename/pre-repair-1792180478174/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:55:06.729Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

Repair and post-repair scheduled verification are outside these two pre-repair observations and remain pending in this report.
