# Missing email column

Status: pre-repair failure reproduced; repair-window outputs restore business correctness but retain strict formatting failures and uncertain individual trigger attribution. Two bounded scheduling attempts produced no fresh output and displayed unchanged-data skips.

## Isolated change

The producer removed `email` from the twelve-row S3 input. All other fields and values remain the frozen baseline. The desired repaired result retains seven business records and supplies an empty canonical email field.

## Observed behavior

At 2026-10-16 19:39:51 UTC, the unchanged baseline pipeline was run against the [actual S3 input](evidence/schema-drop/pre-repair-1792179578310/source.csv). Its [provenance](evidence/schema-drop/pre-repair-1792179578310/source-provenance.json) matches the frozen scenario hash. The backend job was observed as `FAILED` at 19:39:55 UTC, recorded in [job states](evidence/schema-drop/pre-repair-1792179578310/job-states.json).

The [UI logs](evidence/schema-drop/pre-repair-1792179578310/page-and-logs.txt) identify `orders_cleaned_v3` and the missing `email` key. In the same execution they also say “Pipeline execution completed successfully.” The [screenshot](evidence/schema-drop/pre-repair-1792179578310/pipeline-result.png) preserves this contradiction. No fresh GCS object appeared during the bounded observation window; [validation](evidence/schema-drop/pre-repair-1792179578310/validation.json) fails instead of substituting an old export or an invented empty table. A subsequent S3 read verifies the source did not change during observation.

Severity: medium for contradictory execution reporting. Stopping on a missing required implementation field is understandable; reporting success beside the failure makes the operational outcome ambiguous. The error names the failing node and field, but the visible exception is truncated.

## Harness correction

An earlier real execution reached the same error badge, but its test waited for an exact `Logs` button while the accessible name had become `Logs 1`. The corrected locator accepts the count badge. The earlier [timeout evidence](evidence/schema-drop/pre-repair-1792178951065/test-timeout-context.md) is retained separately and is not classified as a product execution timeout.

## Repair

The [repair prompt](evidence/schema-drop/post-repair-1792180984019/builder-prompt.txt) was submitted through Builder. Its [response](evidence/schema-drop/post-repair-1792180984019/builder-response.txt) diagnoses direct access to the absent email column and creates a replacement node with an absent-column default. The after-Builder snapshot initially contains an ungenerated executable body, while the later [configuration](evidence/schema-drop/post-repair-1792180984019/configuration.json) contains generated code. Saved code is not independently equated with every execution's actual code.

The [repair-window manifest](evidence/schema-drop/post-repair-1792180984019/run-manifest.json) records two real GCS CSVs, created at 2026-10-16 20:04:52.244 and 20:05:04.997 UTC. Both are 441 bytes with SHA-256 `3c9fd235b4854fbf340cef70809b12c0a7523436ac8afd03ff54c4e69cae7882`. Independent validation of both raw files confirms seven business-correct rows, including A010, and blank canonical email values. Strict two-decimal formatting still fails. See [first output](evidence/schema-drop/post-repair-1792180984019/gcs/orders_cleaned_1792181090221.csv), [second output](evidence/schema-drop/post-repair-1792180984019/gcs/orders_cleaned_1792181103219.csv), and [saved validation](evidence/schema-drop/post-repair-1792180984019/validation.json), which covers the first output.

The [process response](evidence/schema-drop/post-repair-1792180984019/process-response.json) identifies manual job `4de934fe-bfb4-4298-bc11-a379d399db74`, observed successful in [job states](evidence/schema-drop/post-repair-1792180984019/job-states.json). Neither output generation is explicitly linked to that job. These are repair-window outputs, not two proven manual repetitions. The [demo recording](demo/schema-drop-builder-repair.webm) preserves the Builder repair interaction; its existence does not resolve trigger attribution.

The first [scheduled attempt](evidence/schema-drop/scheduled-1792181295949/run-manifest.json), observing schema-drop input from 20:08:25.291 UTC, found no fresh output during 110 seconds and verified inactive cleanup. Its [notice](evidence/schema-drop/scheduled-1792181295949/schedule-inactive.txt) says the run was skipped due to unchanged data. The second [attempt](evidence/baseline/scheduled-1792181440062/run-manifest.json) followed a verified replacement with baseline source bytes; it also found no fresh output and recorded an increased skip count with inactive cleanup. The second attempt is a baseline-source scheduling diagnostic, not another schema-drop execution. See [scheduling analysis](scheduling.md). A successful post-repair scheduled export remains unverified.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:53:32.470Z ([manifest](evidence/schema-drop/pre-repair-1792180402092/run-manifest.json)). Job `c8008d4f-cabf-4338-90a6-c5df79227218` was first observed `FAILED` at 2026-10-16T19:53:37.639Z ([job states](evidence/schema-drop/pre-repair-1792180402092/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-drop/pre-repair-1792180402092/configuration-before.json) and [after configuration](evidence/schema-drop/pre-repair-1792180402092/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-drop/pre-repair-1792180402092/source-provenance.json), [after](evidence/schema-drop/pre-repair-1792180402092/source-after/source-provenance.json)). See the [second logs](evidence/schema-drop/pre-repair-1792180402092/page-and-logs.txt) and [validation](evidence/schema-drop/pre-repair-1792180402092/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:53:51.087Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

Repair and scheduling evidence are separate from these two pre-repair observations and are documented above; the pre-repair repetitions do not establish repair success or scheduled correctness.
