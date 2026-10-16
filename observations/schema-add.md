# Additional loyalty column

Status: real manual pre-repair execution produced correct business values; strict formatting failed as in baseline. Builder review and scheduled verification pending.

## Change and reproduction

Add `loyalty_tier` with value `standard` to all twelve rows, leaving existing fields unchanged. Run the baseline transformation. The desired result keeps the canonical nine output columns and seven records without leaking the new field.

The downloaded [S3 source](evidence/schema-add/pre-repair-1792180017720/source.csv), [before provenance](evidence/schema-add/pre-repair-1792180017720/source-provenance.json), and [after provenance](evidence/schema-add/pre-repair-1792180017720/source-after/source-provenance.json) agree on SHA-256 `3a7e8a0b8f1fdbd74d559cb48babf7573001d50ee488896f7926d58f0f5fdc00`.

## Observed result

The [manifest](evidence/schema-add/pre-repair-1792180017720/run-manifest.json) records a manual trigger at 2026-10-16 19:47:09.852 UTC. Job `dad997fa-9502-4e57-b0ad-ab13cd9e334a` was first observed `SUCCESS` at 19:47:16.432 UTC in [job states](evidence/schema-add/pre-repair-1792180017720/job-states.json). The [logs](evidence/schema-add/pre-repair-1792180017720/page-and-logs.txt) also report success; see the [screenshot](evidence/schema-add/pre-repair-1792180017720/pipeline-result.png).

GCS created [orders_cleaned_1792180033907.csv](evidence/schema-add/pre-repair-1792180017720/gcs/orders_cleaned_1792180033907.csv), generation `1792180035634652`, at 19:47:15.642 UTC. The 528-byte output has SHA-256 `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`, preserved in the [inventory](evidence/schema-add/pre-repair-1792180017720/gcs/inventory.json).

[Independent validation](evidence/schema-add/pre-repair-1792180017720/validation.json) confirms seven business-correct records, expected column order, and no `loyalty_tier` output. Strict validation remains false because monetary values lose trailing zeros, for example `12.5` instead of `12.50`. This is the existing baseline serialization defect, not new evidence that the extra column corrupts business data. The nonzero test exit reflects that strict assertion; it does not mean the backend job failed.

No additional-column-specific failure was demonstrated for this constant-valued fixture. It does not test whether varying extra values affect deduplication. Determinism was not checked in this first run; a separate two-run comparison is recorded below.

## Isolation and remaining work

The early [configuration snapshot](evidence/schema-add/pre-repair-1792180017720/configuration.json) supports unchanged code, prompts, node IDs and edges, but lacks complete source/destination fields and a full pre-run comparison. The stronger rerun is recorded below. The subsequent [baseline restoration validation](evidence/baseline/restore-after-schema-add-1792180058387/validation.json) again reports correct business values with strict-format failure.

The [prepared Builder prompt](../prompts/repairs/schema-add.txt) requests ignoring the new column, including during deduplication. No repair is necessary for the observed business result; Builder review and any resulting configuration change must still be separately recorded and validated. Scheduled verification remains pending, and no repair success is claimed.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:57:16.412Z ([manifest](evidence/schema-add/pre-repair-1792180625965/run-manifest.json)). Job `a4a98136-34b9-4b9d-92b5-c61d609d888e` was first observed `SUCCESS` at 2026-10-16T19:57:22.031Z ([job states](evidence/schema-add/pre-repair-1792180625965/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-add/pre-repair-1792180625965/configuration-before.json) and [after configuration](evidence/schema-add/pre-repair-1792180625965/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-add/pre-repair-1792180625965/source-provenance.json), [after](evidence/schema-add/pre-repair-1792180625965/source-after/source-provenance.json)). See the [second logs](evidence/schema-add/pre-repair-1792180625965/page-and-logs.txt) and [validation](evidence/schema-add/pre-repair-1792180625965/validation.json).

The second [raw GCS output](evidence/schema-add/pre-repair-1792180625965/gcs/orders_cleaned_1792180640505.csv) has generation `1792180641143311` and SHA-256 `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`. Independent byte comparison confirms it is identical to the first run's output. This is two-run output repeatability for the tested input and captured configuration, not proof of correctness or universal determinism. The individual validator reports still say `determinism: not_checked` because repeat files were not passed to those invocations; the comparison here was performed separately. Business values remain correct while strict monetary formatting fails.

Repair and post-repair scheduled verification are outside these two pre-repair observations and remain pending in this report.
