# Renamed price column

Status: pre-repair failure reproduced. Initial repairs leaked a tenth column, including in scheduled output. The final Builder-created native column-drop and fresh-sort graph restores seven business-correct records with nine columns in both manual and scheduled observations. Strict monetary formatting still fails.

## Change and reproduction

Replace baseline `unit_price` with `price_per_unit`, keeping all twelve input rows and values unchanged. Run the existing baseline pipeline without a repair. The desired repaired result is the seven-record baseline business output with canonical `unit_price`; no currency-unit conversion is required.

The downloaded [S3 source](evidence/schema-rename/pre-repair-1792179839879/source.csv) and [before provenance](evidence/schema-rename/pre-repair-1792179839879/source-provenance.json) match SHA-256 `1ea5facc8c0ec98e0cdfdf7954d57ab312e736ac72d462276c0e317c8a8e7d2e`. The [after read](evidence/schema-rename/pre-repair-1792179839879/source-after/source-provenance.json) matches the same hash.

## Observed result

The [manifest](evidence/schema-rename/pre-repair-1792179839879/run-manifest.json) records a manual trigger at 2026-10-16 19:44:13.179 UTC. Job `ad8f756b-e3c2-4727-91d3-22d877fa9a01` was observed `FAILED` at 19:44:18.347 UTC in [job states](evidence/schema-rename/pre-repair-1792179839879/job-states.json). These are observation times, not inferred server transition times.

The [logs](evidence/schema-rename/pre-repair-1792179839879/page-and-logs.txt) identify `orders_cleaned_v3` and missing `unit_price`. At the same displayed time, they also state “Pipeline execution completed successfully.” The [screenshot](evidence/schema-rename/pre-repair-1792179839879/pipeline-result.png) preserves the UI. No fresh GCS output was observed before collection ended at 19:44:31.736 UTC. The [validation record](evidence/schema-rename/pre-repair-1792179839879/validation.json) explicitly fails with no output; an old export was not substituted.

Severity: medium for misleading operational reporting. Rejecting an unexpected column name is understandable, but the simultaneous success message contradicts the failed job. The visible error names the missing field and node; its generated-code excerpt is truncated.

## Isolation and remaining work

The captured [configuration](evidence/schema-rename/pre-repair-1792179839879/configuration.json) was checked against the frozen baseline for node IDs, code, prompts and edges. This early snapshot did not capture every source/destination setting or prove a full pre-run comparison; a stronger rerun is recorded below. The subsequent [baseline restoration validation](evidence/baseline/restore-after-schema-rename-1792179879464/validation.json) reports correct business values while retaining the known monetary-format failure.

The [Builder prompt](../prompts/repairs/schema-rename.txt) requests an explicit alias to canonical `unit_price`. Later repair and scheduled observations are evaluated below; the original pre-repair evidence remains unchanged.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:54:48.160Z ([manifest](evidence/schema-rename/pre-repair-1792180478174/run-manifest.json)). Job `7965e20a-eae6-4f9d-b0d0-4a373b4f22cf` was first observed `FAILED` at 2026-10-16T19:54:53.286Z ([job states](evidence/schema-rename/pre-repair-1792180478174/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-rename/pre-repair-1792180478174/configuration-before.json) and [after configuration](evidence/schema-rename/pre-repair-1792180478174/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-rename/pre-repair-1792180478174/source-provenance.json), [after](evidence/schema-rename/pre-repair-1792180478174/source-after/source-provenance.json)). See the [second logs](evidence/schema-rename/pre-repair-1792180478174/page-and-logs.txt) and [validation](evidence/schema-rename/pre-repair-1792180478174/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:55:06.729Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

Repair and post-repair evidence are separate from these pre-repair repetitions and documented below.

## First Builder repair and regression

The [actual repair prompt](evidence/schema-rename/post-repair-1792181708748/builder-prompt.txt) and [Builder response](evidence/schema-rename/post-repair-1792181708748/builder-response.txt) are preserved. The [manual manifest](evidence/schema-rename/post-repair-1792181708748/run-manifest.json) records positive inactive checks before source upload and immediately before the manual trigger. The captured process job `e6f11002-bd36-40af-aef4-005f0bf57c47` reached `SUCCESS`; response `execution_mode: auto` is recorded as the API's value, not reinterpreted as scheduled triggering.

The [actual export](evidence/schema-rename/post-repair-1792181708748/gcs/orders_cleaned_1792181845245.csv) contains seven records and the correct canonical numeric amounts, but leaks `price_per_unit` as a tenth column. This violates the required nine-column schema, so [validation](evidence/schema-rename/post-repair-1792181708748/validation-output-1.json) reports business-contract mismatch and strict failure; trailing-zero formatting also remains wrong. The 570-byte output SHA-256 is `cdcae50d8e2fe5c094d3e8c3357e1c66e4d0afbe89f0af5d2caa0ca1e46a6ec7`. Replacing a crash with an operationally successful export is not a complete repair.

## Subsequent scheduled behavior

[API history](evidence/schedule-history-api-20261017.json) confirms execution #18494 with `trigger: scheduled`, starting 2026-10-16 20:19:16.147 UTC and completing successfully at 20:19:21.508 UTC. The [scheduled-window export](evidence/schema-rename/scheduled-1792181888371/gcs/orders_cleaned_1792181958370.csv), generation `1792181960083707`, was created at 20:19:20.092 UTC and is byte-identical to the first repair export. The extra column and precision defects therefore persist in a window with a confirmed successful scheduled execution. Exact object-to-job foreign-key linkage is not captured.

The [original scheduled test manifest](evidence/schema-rename/scheduled-1792181888371/run-manifest.json) failed on a UI history race: the initial snapshot was empty and later old rows were incorrectly counted as new. That manifest is preserved rather than rewritten as a pass. [Recovery metadata](evidence/schema-rename/scheduled-1792181888371/evidence-recovery.json) links API history, raw data and [recovered validation](evidence/schema-rename/scheduled-1792181888371/validation-recovered.json). Schedule cleanup was verified inactive. See [scheduling analysis](scheduling.md).

## Follow-up repair and verified scheduled harness

The [follow-up repair manifest](evidence/schema-rename/post-repair-followup-1792182071393/run-manifest.json) records inactive checks before source mutation and manual execution, captured process job `f0f1388a-472f-4003-bda7-507fcd656b48`, and terminal `SUCCESS`. Its [new export](evidence/schema-rename/post-repair-followup-1792182071393/gcs/orders_cleaned_1792182296709.csv), created at 20:24:57.995 UTC, retains the same ten-column schema and identical SHA-256. [Validation](evidence/schema-rename/post-repair-followup-1792182071393/validation-output-1.json) again fails business-contract shape and strict formatting. The follow-up did not remove the leaked alias, regardless of the Builder's affirmative response.

The improved [scheduled harness run](evidence/schema-rename/scheduled-1792182340996/run-manifest.json) then used direct before/after API history rather than UI row timing. It identified new execution #18496 with verified `trigger: scheduled`, `success: true`, starting 20:26:19.353 and ending 20:26:24.813 UTC. A single [fresh export](evidence/schema-rename/scheduled-1792182340996/gcs/orders_cleaned_1792182381535.csv) was created at 20:26:23.383 UTC and again has the same ten-column output hash. [Per-object validation](evidence/schema-rename/scheduled-1792182340996/validation-output-1.json) correctly rejects it. Cleanup is recorded as verified inactive.

This run verifies the history-race correction and output-validation path under a real scheduled execution. The test fails for actual contract mismatch rather than the former UI-history race. Exact output-to-execution foreign-key linkage remains uncaptured.

## Native projection and fresh-sort repair

The first [projection attempt](evidence/schema-rename/post-repair-projection-1792182404829/run-manifest.json) reached a real execution. Its matched job `b464d4ff-b87a-4733-97e5-ca7a98ab2456` was observed `FAILED` at 2026-10-16 20:27:35.575 UTC ([job states](evidence/schema-rename/post-repair-projection-1792182404829/job-states.json)). The [logs](evidence/schema-rename/post-repair-projection-1792182404829/page-and-logs.txt) identify `DataFrameSorter.transform() got multiple values for argument 'ascending'` at `orders_sorted`. This is the observed execution error; the underlying argument-binding cause was not independently proven.

The harness then encountered a separate source/profile locator timeout, leaving the original manifest at log capture. [Recovered validation](evidence/schema-rename/post-repair-projection-1792182404829/validation-recovered.json) is supplemental evidence. The [source-recovery read](evidence/schema-rename/post-repair-projection-1792182404829/source-recovery/source-provenance.json) happened later and must not be represented as an original immediate post-run source check. Earlier `post-repair-wiring-*` attempts that aborted before Builder/manual execution due to viewport or hidden-filename locators are harness failures, not additional product executions.

Builder subsequently created a native column-drop stage and a fresh sorting node, retaining the authorized input/output. See the successful attempt's [Builder interaction](evidence/schema-rename/post-repair-wiring-1792182840923/builder-response.txt) and [captured graph](evidence/schema-rename/post-repair-wiring-1792182840923/configuration.json). The [manifest](evidence/schema-rename/post-repair-wiring-1792182840923/run-manifest.json) records inactive checks before mutation and manual triggering, job `779ab508-5b51-4858-82dc-07ebf5513756`, and terminal `SUCCESS`.

Its [raw CSV](evidence/schema-rename/post-repair-wiring-1792182840923/gcs/orders_cleaned_1792182891605.csv), created at 20:34:52.695 UTC, has seven rows and exactly the canonical nine columns. SHA-256 is `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`. [Validation](evidence/schema-rename/post-repair-wiring-1792182840923/validation-output-1.json) confirms business correctness, while strict formatting remains false. The evidence supports this revised graph resolving the observed column leak and sort failure; it does not isolate the drop and fresh-sort changes as separate causal experiments.

The first successful graph snapshot predates explicit `columns_to_drop` capture; the [subsequent scheduled configuration](evidence/schema-rename/scheduled-1792182925969/configuration.json) adds that parameter evidence. The completed [scheduled manifest](evidence/schema-rename/scheduled-1792182925969/run-manifest.json) identifies execution #18500 with `trigger: scheduled`, starting 2026-10-16 20:36:18.471 UTC and completing successfully at 20:36:24.315 UTC. Cleanup is verified inactive.

Its [fresh CSV](evidence/schema-rename/scheduled-1792182925969/gcs/orders_cleaned_1792182981004.csv), generation `1792182982749388`, was created at 20:36:22.754 UTC. Its independently verified SHA-256 matches the corrected manual output exactly. [Per-object validation](evidence/schema-rename/scheduled-1792182925969/validation-output-1.json) confirms seven business-correct rows and the canonical nine-column schema. Strict formatting still fails, so the automated test remains failed for precision despite successful scheduled business repair. This completes the observed rename repair/follow-up cycle without claiming a full strict-contract pass.
