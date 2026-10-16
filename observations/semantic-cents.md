# Price units changed from dollars to cents

Status: original manual runs succeeded operationally with 100-times monetary inflation. After explicit producer-contract disclosure, Builder repair and scheduled follow-up restore business amounts; strict monetary formatting still fails.

## Producer change and expected behavior

The producer multiplies nonempty `unit_price` values by 100 and changes their meaning to cents. Column names, price representation style, and other fields remain unchanged. The initial pipeline deliberately retains its original major-AUD-unit interpretation; the new contract is disclosed only for the planned repair. Correct repaired output divides prices by 100 and reproduces the original seven business records.

The [actual S3 input](evidence/semantic-cents/pre-repair-1792180192902/source.csv) matches SHA-256 `ae8fd14bcd3c82cc2801a224880ea8f90e8b01637f153040ba0cc480e7d46d9f` in both [before](evidence/semantic-cents/pre-repair-1792180192902/source-provenance.json) and [after](evidence/semantic-cents/pre-repair-1792180192902/source-after/source-provenance.json) provenance.

## Execution and actual output

The [manifest](evidence/semantic-cents/pre-repair-1792180192902/run-manifest.json) records a manual trigger at 2026-10-16 19:50:04.594 UTC and pre-run configuration verification. Job `1a0f9597-2d08-40d3-b457-79203c2fe369` was first observed `SUCCESS` at 19:50:10.804 UTC in [job states](evidence/semantic-cents/pre-repair-1792180192902/job-states.json). The [logs](evidence/semantic-cents/pre-repair-1792180192902/page-and-logs.txt) report success and seven output rows; no semantic-unit warning appears in the captured logs. See the [screenshot](evidence/semantic-cents/pre-repair-1792180192902/pipeline-result.png).

The [actual GCS CSV](evidence/semantic-cents/pre-repair-1792180192902/gcs/orders_cleaned_1792180208985.csv) was created at 19:50:10.024 UTC, generation `1792180210018098`, 550 bytes, SHA-256 `36d148c5a55353811edfb503c6aa8dcdf486bf1cadd731ef57916a8be40ddecb`. Its [inventory](evidence/semantic-cents/pre-repair-1792180192902/gcs/inventory.json) preserves object provenance.

| Record | Expected unit price / total (AUD) | Actual numeric unit price / total |
| --- | --- | --- |
| A001 | 12.50 / 25.00 | 1250 / 2500 |
| A002 | 4.20 / 12.60 | 420 / 1260 |
| A008 | 0.25 / 1.00 | 25 / 100 |
| A010 | 0.00 / 0.00 | 0 / 0 |

Six of seven records have both nonzero monetary values inflated by exactly 100 times; the zero-price control remains numerically zero. Summed `total_amount` is 7,910.00 rather than 79.10, a difference of 7,830.90. Schema and seven-row count alone would not catch this. [Independent validation](evidence/semantic-cents/pre-repair-1792180192902/validation.json) sets both `business_values_match` and strict `passed` to false. The separate baseline trailing-zero formatting defect also remains.

## Interpretation and repair boundary

Severity: high business impact if the output is consumed under the new producer contract. This is silent semantic incompatibility under an unchanged configuration, not evidence that the model should infer undisclosed units. The numeric values remain plausible and even retain the original currency notation; without an explicit unit contract or monitoring rule, conversion intent is ambiguous. The captured run demonstrates no built-in alert for this scenario, not that all platform monitoring capabilities are absent.

The frozen [configuration](evidence/semantic-cents/pre-repair-1792180192902/configuration.json) and downloaded input/output support independent detection. The [prepared repair prompt](../prompts/repairs/semantic-cents.txt) explicitly discloses cents and requests Decimal conversion before totals. Subsequent explicit-contract repair and scheduled results are recorded below. This first run alone does not establish determinism; the separate comparison below records the second observation.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:59:42.245Z ([manifest](evidence/semantic-cents/pre-repair-1792180768338/run-manifest.json)). Job `64be0d2d-913d-4b44-858a-8a814e5c82e3` was first observed `SUCCESS` at 2026-10-16T19:59:48.683Z ([job states](evidence/semantic-cents/pre-repair-1792180768338/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/semantic-cents/pre-repair-1792180768338/configuration-before.json) and [after configuration](evidence/semantic-cents/pre-repair-1792180768338/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/semantic-cents/pre-repair-1792180768338/source-provenance.json), [after](evidence/semantic-cents/pre-repair-1792180768338/source-after/source-provenance.json)). See the [second logs](evidence/semantic-cents/pre-repair-1792180768338/page-and-logs.txt) and [validation](evidence/semantic-cents/pre-repair-1792180768338/validation.json).

The second [raw GCS output](evidence/semantic-cents/pre-repair-1792180768338/gcs/orders_cleaned_1792180786266.csv) has generation `1792180788010218` and SHA-256 `36d148c5a55353811edfb503c6aa8dcdf486bf1cadd731ef57916a8be40ddecb`. Independent byte comparison confirms it is identical to the first run's output. This is two-run output repeatability for the tested input and captured configuration, not proof of correctness or universal determinism. The individual validator reports still say `determinism: not_checked` because repeat files were not passed to those invocations; the comparison here was performed separately. The semantic error and strict monetary-format failure repeat unchanged.

Repair and post-repair scheduled verification are separate from the pre-repair observations and documented below.


## Explicit-contract repair and scheduled verification

After disclosure of the cents contract, the [Builder interaction](evidence/semantic-cents/post-repair-1792184745756/builder-response.txt) created a fresh cleaning graph. Its [final generated code](evidence/semantic-cents/post-repair-1792184745756/executed-codegen-evidence.json) for `llm_node_12` divides parsed prices by `Decimal('100')` in both string and numeric paths before totals. The captured graph is source → cleaning → sort → output, with earlier native drop stages removed and no quantity-suffix, price-alias or day-first adaptation retained in the final cleaning code.

The [manual manifest](evidence/semantic-cents/post-repair-1792184745756/run-manifest.json) records process job `fd0f73fe-c592-416f-bcd8-cfbfbe0a8f97`, terminal SUCCESS, and [business-correct validation](evidence/semantic-cents/post-repair-1792184745756/validation-output-1.json). The seven-row result restores A001 unit price/total to 12.50/25.00 numerically and aggregate total to 79.10, rather than 7,910.00. Serialized trailing zeros still fail the frozen contract.

The [scheduled follow-up](evidence/semantic-cents/scheduled-1792184869120/run-manifest.json) identifies successful scheduled #18515 from 2026-10-16 21:09:13.038 to 21:09:17.735 UTC, with verified inactive cleanup. Its saved configuration exactly matches the manual repair snapshot. The [fresh 528-byte CSV](evidence/semantic-cents/scheduled-1792184869120/gcs/orders_cleaned_1792184954959.csv), generation `1792184956662625`, was created at 21:09:16.669 UTC. Independently verified SHA-256 `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83` matches the repaired manual output; an independent Decimal sum confirms total 79.10.

[Scheduled validation](evidence/semantic-cents/scheduled-1792184869120/validation-output-1.json) confirms business correctness while strict formatting remains failed. This demonstrates successful repair after the new unit meaning was explicitly supplied, not autonomous discovery of hidden producer intent. Exact output-to-execution foreign-key linkage remains uncaptured.


## Unrepaired scheduled observation under recovered frozen baseline

The [scheduled cents window](evidence/semantic-cents/scheduled-pre-repair-1792188224203/run-manifest.json) uses the recovered baseline without cents conversion. It observes from 2026-10-16 22:03:54.843 through evidence completion at 22:05:58.552 UTC and includes the complete 110-second output wait. Actual source reads before and after match SHA-256 `ae8fd14bcd3c82cc2801a224880ea8f90e8b01637f153040ba0cc480e7d46d9f`; saved configuration matches the frozen baseline on both sides.

No new execution or fresh CSV is recorded. Both UI and direct backend checks verify disabled state before source mutation and after cleanup ([before](evidence/semantic-cents/scheduled-pre-repair-1792188224203/schedule-state-before-source.json), [after](evidence/semantic-cents/scheduled-pre-repair-1792188224203/schedule-state-after.json)). The skip count changes from two to one; it does not prove a new skip. The collector labels this `bounded_no_new_execution`, with expected failed assertions and [explicit missing-output validation](evidence/semantic-cents/scheduled-pre-repair-1792188224203/validation.json). [Actual baseline restoration](evidence/semantic-cents/scheduled-pre-repair-1792188224203/baseline-restoration/source-provenance.json) follows collection.

This bounded scheduled absence is not another measured 100-times monetary error, because no output exists to compare. The original manual semantic errors and successful repaired scheduled #18515 establish those separate outcomes; no automatic discovery of undisclosed producer units is inferred from this later no-execution window.
