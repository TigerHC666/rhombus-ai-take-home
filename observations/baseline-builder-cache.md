# Baseline repair confirmations disagree with exported results

Status: initial data-loss defect reproduced; the third repair restored all business records. Strict CSV monetary formatting still fails after an additional repair.

## Setup

Project 5348 reads the synthetic baseline from S3 `orders.csv`. The frozen contract accepts nonnegative prices, including A010 at 0.00. The independent oracle contains seven records.

## Reproduction

1. Submit the [original builder prompt](evidence/baseline-builder-prompt.txt).
2. Observe that the [builder response](evidence/baseline-builder-response.txt) adds a zero-price rejection not requested by the contract.
3. Submit the [first repair](evidence/baseline-repair-prompt.txt), explicitly accepting zero and supporting the input's inferred datetime/numeric types.
4. The [repair response](evidence/baseline-repair-response.txt) says zero is now accepted.
5. Bind the existing GCS destination and run the pipeline.
6. The run completed at 05:50:11 Australia/Sydney on October 17, 2026 with success logs, but its [preview](evidence/baseline-after-prompt-repair-preview.txt) contains six records and omits A010.

GCS lists `orders_cleaned_1792176606648.csv`, 477 bytes, created at 05:50:08 Australia/Sydney. The user downloaded this object and it was independently retrieved again through the approved bucket-scoped GCS identity. Both copies have SHA-256 `1b0583dad21a144c63e4d5562cb5320db42ad2ff8e5468ed4817f2fb934efbe7`. The [actual CSV](evidence/baseline/prompt-repair-output.csv) has six records, omits A010, and serializes prices/totals without the required two decimal places. The [validation report](evidence/baseline/prompt-repair-validation.json) correctly fails. That first report used the uploaded fixture. The later [S3 download and provenance](evidence/baseline/source/source-provenance.json) independently verified the same immutable baseline hash and an object last-modified time preceding these runs; all six early output objects were subsequently revalidated against the actual downloaded source.

The [GCS inventory](evidence/gcs/inventory.json) preserves four distinct output generations written at 05:35:45, 05:49:45, 05:50:08 and 05:54:10 Australia/Sydney. All four contain identical bytes. Configuration changed between these attempts, so this alone is not a controlled fixed-configuration determinism test.

## Diagnosis and impact

The subsequent [diagnostic request](evidence/baseline-code-repair-prompt.txt) asks the builder to inspect executable code rather than its prompt. The [builder response](evidence/baseline-code-repair-response.txt) reports a stale `price_decimal > 0` condition in `last_executed_code` and claims replacing the node forces regeneration. This is the builder's diagnosis, not independent source-code inspection. The subsequent 05:54:10 output still contains identical incorrect bytes; the attempted replacement has not demonstrated a successful repair.

Severity: high for data correctness. A successful execution indicator and an affirmative repair response did not establish contract compliance. The independent row-count and zero-price control expose the discrepancy.

Applying output configuration also appears to have initiated early runs before the explicit toolbar execution; log timestamps are retained rather than attributed to invented triggers. The later scheduled baseline is documented below.

## Verified recovery and remaining serialization defect

The [third repair](evidence/baseline-third-repair-response.txt) introduced a new connected cleaning node. The actual 06:12:20 export contains all seven expected business records, including A010. A subsequent [precision repair](evidence/baseline/precision-repair-response.txt) casts the monetary columns to pandas StringDtype, visible in the [saved executed configuration](evidence/baseline/configuration-v3.json). Its raw CSV still serializes values as 12.5 and 25.0. The exact downstream coercion mechanism is not independently established; the Builder's explanation must not be treated as verified platform internals.

The baseline scheduled execution [18453](evidence/baseline/scheduled-first/run-manifest.json) started at 06:25:25 Australia/Sydney and completed with platform status Success in 5.6 seconds. The [history screenshot](evidence/baseline/scheduled-first/history.png) also shows the schedule inactive after collection. Its GCS object was created within that execution window. [Strict validation](evidence/baseline/scheduled-first/validation.json) fails formatting while all business values match.

[Three same-configuration outputs](evidence/baseline/determinism.json), including the scheduled run, contain identical business rows and identical bytes. This establishes the recorded baseline repeat result, not determinism for later repaired configurations. Monetary formatting remains a separate, lower-severity serialization defect; it is not silently waived.
