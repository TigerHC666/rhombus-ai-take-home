# Quantity values changed to unit-suffixed strings

Status: pre-repair failure reproduced. Builder repair restores seven business-correct records and nine columns in manual and scheduled execution; strict monetary formatting still fails. Profile observations do not establish a paired final-runtime dtype transition.

## Change and reproduction

Append ` units` to every quantity, retaining the other input fields and values. The actual [S3 source](evidence/schema-type/pre-repair-1792179923802/source.csv) contains values such as `2 units` and `0 units`. A successful repair must parse the suffix, reject the zero quantity, and restore the seven-record business result.

[Before provenance](evidence/schema-type/pre-repair-1792179923802/source-provenance.json) and the [after read](evidence/schema-type/pre-repair-1792179923802/source-after/source-provenance.json) match SHA-256 `5baee38c559d8e7d64deaeb001d3aca4c47398094781946d1dd76c2295e02217`.

## Observed result

The [manifest](evidence/schema-type/pre-repair-1792179923802/run-manifest.json) records a manual trigger at 2026-10-16 19:45:37.531 UTC. Job `7ef10642-25ae-4d66-8aa1-7d6936284a2a` was observed `FAILED` at 19:45:43.479 UTC in [job states](evidence/schema-type/pre-repair-1792179923802/job-states.json).

The [logs](evidence/schema-type/pre-repair-1792179923802/page-and-logs.txt) report an assignment error in `orders_cleaned_v3`: “Cannot set a DataFrame with multiple columns to the single column total_amount”. They also report “Pipeline execution completed successfully” at the same displayed time. This error is consistent with an empty-frame calculation after quantity rejection, but this capture does not independently expose the intermediate frame. It is not a clear user-facing diagnosis of the producer change. See the [screenshot](evidence/schema-type/pre-repair-1792179923802/pipeline-result.png).

No fresh GCS output was observed before collection ended at 19:45:58.118 UTC. The [validation record](evidence/schema-type/pre-repair-1792179923802/validation.json) fails explicitly for absent output.

The captured [quantity profile](evidence/schema-type/pre-repair-1792179923802/quantity-profile.txt) still labels the column **Numeric**, despite the verified suffixed S3 values. This may reflect stale or differently scoped profiling; it does not prove that the execution engine inferred Text. This run establishes a representation/parsing mutation and execution failure, not a verified Numeric-to-Text profile transition.

Severity: medium. The error does not explain the input incompatibility, and success wording conflicts with the failed job. The profile discrepancy makes diagnosis harder, but its cause remains unverified.

## Isolation and evidence scope

The early [configuration snapshot](evidence/schema-type/pre-repair-1792179923802/configuration.json) supports unchanged code, prompts, node IDs and edges, with incomplete coverage of source/destination settings and no full pre-run snapshot. The stronger rerun is recorded below. The subsequent [baseline restoration](evidence/baseline/restore-after-schema-type-1792179968712/validation.json) restored business values; strict monetary formatting still failed.

The [Builder prompt](../prompts/repairs/schema-type.txt) requests exact suffix parsing and original validation. Its later manual and scheduled repair evidence is documented below, separately from the original failure observations.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:56:06.854Z ([manifest](evidence/schema-type/pre-repair-1792180556362/run-manifest.json)). Job `60015fe7-ea7d-4582-a8ce-4e0e2438e459` was first observed `FAILED` at 2026-10-16T19:56:13.528Z ([job states](evidence/schema-type/pre-repair-1792180556362/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-type/pre-repair-1792180556362/configuration-before.json) and [after configuration](evidence/schema-type/pre-repair-1792180556362/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-type/pre-repair-1792180556362/source-provenance.json), [after](evidence/schema-type/pre-repair-1792180556362/source-after/source-provenance.json)). See the [second logs](evidence/schema-type/pre-repair-1792180556362/page-and-logs.txt) and [validation](evidence/schema-type/pre-repair-1792180556362/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:56:23.567Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

The second [quantity profile](evidence/schema-type/pre-repair-1792180556362/quantity-profile.txt) now says **Categorical** and lists `1 units`, `2 units` and other suffix values. This establishes a changed displayed profile for the repeated scenario, while preserving the first run's Numeric discrepancy. It does not reveal the runtime DataFrame dtype or retrospectively establish the first execution's inferred type.

Repair and scheduled verification are separate from these pre-repair observations and are documented below.

## Builder repair and real manual verification

The [repair run](evidence/schema-type/post-repair-1792183625231/run-manifest.json) submitted the full isolated contract with unit-suffix parsing through AI Builder. The Builder replaced the temporary diagnostic node with a new cleaning node; [saved configuration](evidence/schema-type/post-repair-1792183625231/configuration.json) contains quantity-suffix parsing, canonical projection, and no missing-email, price-alias, cents, or day-first adaptations. The existing native drop stage is a no-op for this input.

Job `7261abfc-8b72-4172-9fcc-b0fbc83b300c` completed successfully. The independently downloaded [validation](evidence/schema-type/post-repair-1792183625231/validation.json) confirms seven business-correct rows and nine canonical columns, output SHA-256 `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`. Strict checks still fail because money serializes as values such as `12.5` and `25.0`, not the contracted two decimal places. Both schedule-inactive checks passed before the manual trigger.

A separate [diagnostic attempt](evidence/baseline/input-type-probe-1792183017207/diagnostic-finding.md) was not a successful runtime type probe: automatic code regeneration removed its deliberate exception. No final-runtime dtype claim is based on its validation-stage messages.

The matched repair job's [final code-generation evidence](evidence/schema-type/post-repair-1792183625231/codegen-evidence.json) identifies `llm_node_8`; its final code exactly matches the saved cleaning code on independent comparison. It includes suffix parsing and string-typed monetary serialization. This strengthens the repair implementation evidence, while the actual exported CSV remains the authority for the persistent precision failure.


## Scheduled verification and configuration review

The completed [scheduled manifest](evidence/schema-type/scheduled-1792183761670/run-manifest.json) identifies execution #18504 as `scheduled`, starting 2026-10-16 20:50:14.830 UTC and completing successfully at 20:50:20.359 UTC. Cleanup is verified inactive. Its [raw GCS output](evidence/schema-type/scheduled-1792183761670/gcs/orders_cleaned_1792183817144.csv), generation `1792183818937417`, was created at 20:50:18.945 UTC. Its independently checked SHA-256 is `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`, matching the business-correct manual output.

[Per-object validation](evidence/schema-type/scheduled-1792183761670/validation-output-1.json) confirms seven records and the canonical nine-column schema. Strict formatting remains failed, so successful operational execution is not a full contract pass. The scheduled [saved configuration](evidence/schema-type/scheduled-1792183761670/configuration.json) exactly matches the manual post-repair snapshot on independent comparison. The active cleaning code contains suffix parsing and does not retain the preceding missing-email/renamed-price/semantic conversions; the native drop stage has no matching alias in this fixture. This supports isolation of the tested repair, while saved-code equality is not absolute proof of every internal execution-code path. Exact output-to-execution foreign-key linkage remains uncaptured.
