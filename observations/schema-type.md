# Quantity values changed to unit-suffixed strings

Status: real manual pre-repair observation complete; inferred-type transition is not established for this run; Builder repair and scheduled verification pending.

## Change and reproduction

Append ` units` to every quantity, retaining the other input fields and values. The actual [S3 source](evidence/schema-type/pre-repair-1792179923802/source.csv) contains values such as `2 units` and `0 units`. A successful repair must parse the suffix, reject the zero quantity, and restore the seven-record business result.

[Before provenance](evidence/schema-type/pre-repair-1792179923802/source-provenance.json) and the [after read](evidence/schema-type/pre-repair-1792179923802/source-after/source-provenance.json) match SHA-256 `5baee38c559d8e7d64deaeb001d3aca4c47398094781946d1dd76c2295e02217`.

## Observed result

The [manifest](evidence/schema-type/pre-repair-1792179923802/run-manifest.json) records a manual trigger at 2026-10-16 19:45:37.531 UTC. Job `7ef10642-25ae-4d66-8aa1-7d6936284a2a` was observed `FAILED` at 19:45:43.479 UTC in [job states](evidence/schema-type/pre-repair-1792179923802/job-states.json).

The [logs](evidence/schema-type/pre-repair-1792179923802/page-and-logs.txt) report an assignment error in `orders_cleaned_v3`: “Cannot set a DataFrame with multiple columns to the single column total_amount”. They also report “Pipeline execution completed successfully” at the same displayed time. This error is consistent with an empty-frame calculation after quantity rejection, but this capture does not independently expose the intermediate frame. It is not a clear user-facing diagnosis of the producer change. See the [screenshot](evidence/schema-type/pre-repair-1792179923802/pipeline-result.png).

No fresh GCS output was observed before collection ended at 19:45:58.118 UTC. The [validation record](evidence/schema-type/pre-repair-1792179923802/validation.json) fails explicitly for absent output.

The captured [quantity profile](evidence/schema-type/pre-repair-1792179923802/quantity-profile.txt) still labels the column **Numeric**, despite the verified suffixed S3 values. This may reflect stale or differently scoped profiling; it does not prove that the execution engine inferred Text. This run establishes a representation/parsing mutation and execution failure, not a verified Numeric-to-Text profile transition.

Severity: medium. The error does not explain the input incompatibility, and success wording conflicts with the failed job. The profile discrepancy makes diagnosis harder, but its cause remains unverified.

## Isolation and remaining work

The early [configuration snapshot](evidence/schema-type/pre-repair-1792179923802/configuration.json) supports unchanged code, prompts, node IDs and edges, with incomplete coverage of source/destination settings and no full pre-run snapshot. The stronger rerun is recorded below. The subsequent [baseline restoration](evidence/baseline/restore-after-schema-type-1792179968712/validation.json) restored business values; strict monetary formatting still failed.

The [prepared Builder prompt](../prompts/repairs/schema-type.txt) requests exact suffix parsing and original validation. Builder diagnosis, repaired raw output, and scheduled behavior remain untested. No successful repair is claimed.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:56:06.854Z ([manifest](evidence/schema-type/pre-repair-1792180556362/run-manifest.json)). Job `60015fe7-ea7d-4582-a8ce-4e0e2438e459` was first observed `FAILED` at 2026-10-16T19:56:13.528Z ([job states](evidence/schema-type/pre-repair-1792180556362/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-type/pre-repair-1792180556362/configuration-before.json) and [after configuration](evidence/schema-type/pre-repair-1792180556362/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-type/pre-repair-1792180556362/source-provenance.json), [after](evidence/schema-type/pre-repair-1792180556362/source-after/source-provenance.json)). See the [second logs](evidence/schema-type/pre-repair-1792180556362/page-and-logs.txt) and [validation](evidence/schema-type/pre-repair-1792180556362/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:56:23.567Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

The second [quantity profile](evidence/schema-type/pre-repair-1792180556362/quantity-profile.txt) now says **Categorical** and lists `1 units`, `2 units` and other suffix values. This establishes a changed displayed profile for the repeated scenario, while preserving the first run's Numeric discrepancy. It does not reveal the runtime DataFrame dtype or retrospectively establish the first execution's inferred type.

Repair and post-repair scheduled verification are outside these two pre-repair observations and remain pending in this report.
