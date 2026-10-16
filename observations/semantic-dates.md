# Ambiguous dates changed from MM/DD to DD/MM

Status: real manual pre-repair execution succeeded operationally but produced seven incorrect business dates. Builder repair and scheduled verification pending.

## Producer change and expected behavior

The producer switches date encoding from MM/DD/YYYY to DD/MM/YYYY without changing the column or slash-separated representation. All seven accepted dates have unequal month/day values at most 12, so both interpretations remain valid calendar dates. The unchanged pipeline is intentionally tested before disclosing this producer change to the chatbot. Correct repaired output preserves the original calendar dates.

The [actual S3 input](evidence/semantic-dates/pre-repair-1792180290165/source.csv) matches SHA-256 `4521b9c7cb2fc62b789199a6573fb09eca5afba48c83f27939c14cf4c4423b5c` in [before](evidence/semantic-dates/pre-repair-1792180290165/source-provenance.json) and [after](evidence/semantic-dates/pre-repair-1792180290165/source-after/source-provenance.json) provenance. The invalid February 30 control remains invalid under the intended new format.

## Execution and actual output

The [manifest](evidence/semantic-dates/pre-repair-1792180290165/run-manifest.json) records pre-run configuration verification and a manual trigger at 2026-10-16 19:51:42.284 UTC. Job `2274d77b-2da2-4e0c-8f25-bd9473d06244` was first observed `SUCCESS` at 19:51:48.979 UTC in [job states](evidence/semantic-dates/pre-repair-1792180290165/job-states.json). The [logs](evidence/semantic-dates/pre-repair-1792180290165/page-and-logs.txt) report success and seven output rows without a captured date-contract warning. See the [screenshot](evidence/semantic-dates/pre-repair-1792180290165/pipeline-result.png).

The [actual GCS CSV](evidence/semantic-dates/pre-repair-1792180290165/gcs/orders_cleaned_1792180306135.csv) was created at 19:51:48.057 UTC, generation `1792180308050506`, 528 bytes, SHA-256 `9e6ca069e9930e97f555b28c8c04e0178a6cbff518b69ae99327ead1d9cb3059`. See its [inventory](evidence/semantic-dates/pre-repair-1792180290165/gcs/inventory.json).

| Record | Producer input (DD/MM/YYYY) | Expected ISO date | Actual ISO date |
| --- | --- | --- | --- |
| A001 | 04/03/2026 | 2026-03-04 | 2026-04-03 |
| A002 | 05/04/2026 | 2026-04-05 | 2026-05-04 |
| A003 | 06/05/2026 | 2026-05-06 | 2026-06-05 |
| A008 | 10/09/2026 | 2026-09-10 | 2026-10-09 |
| A009 | 11/10/2026 | 2026-10-11 | 2026-11-10 |
| A010 | 12/11/2026 | 2026-11-12 | 2026-12-11 |
| A011 | 01/12/2026 | 2026-12-01 | 2026-01-12 |

All seven dates are wrong relative to the producer contract, despite valid ISO formatting, correct column structure and unchanged row count. Monetary business values remain numerically correct; the known trailing-zero serialization failure persists independently. [Validation](evidence/semantic-dates/pre-repair-1792180290165/validation.json) reports business mismatch and strict failure.

## Interpretation and repair boundary

Severity: high business impact for date-dependent reporting or processing. Ambiguous values cannot reveal an undisclosed producer convention reliably. This result demonstrates why a declared date contract and independent expected values are needed; it does not establish that the model could or should infer the change unaided. No semantic warning appears in this run's captured logs, but broader platform detection capabilities were not exhaustively tested.

The unchanged [configuration](evidence/semantic-dates/pre-repair-1792180290165/configuration.json) supplies the baseline interpretation. The [prepared repair prompt](../prompts/repairs/semantic-dates.txt) discloses DD/MM/YYYY and requires checking the input reader's actual interpretation before adapting already-parsed timestamps. Blindly swapping month/day could corrupt dates that the reader already interpreted correctly. Diagnosis quality, real repaired output and scheduled verification remain pending. Determinism is not claimed from this single observation.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T20:01:00.792Z ([manifest](evidence/semantic-dates/pre-repair-1792180850550/run-manifest.json)). Job `7bd769c5-1889-430a-bbc5-2e370a45811c` was first observed `SUCCESS` at 2026-10-16T20:01:07.734Z ([job states](evidence/semantic-dates/pre-repair-1792180850550/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/semantic-dates/pre-repair-1792180850550/configuration-before.json) and [after configuration](evidence/semantic-dates/pre-repair-1792180850550/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/semantic-dates/pre-repair-1792180850550/source-provenance.json), [after](evidence/semantic-dates/pre-repair-1792180850550/source-after/source-provenance.json)). See the [second logs](evidence/semantic-dates/pre-repair-1792180850550/page-and-logs.txt) and [validation](evidence/semantic-dates/pre-repair-1792180850550/validation.json).

The second [raw GCS output](evidence/semantic-dates/pre-repair-1792180850550/gcs/orders_cleaned_1792180865177.csv) has generation `1792180866884738` and SHA-256 `9e6ca069e9930e97f555b28c8c04e0178a6cbff518b69ae99327ead1d9cb3059`. Independent byte comparison confirms it is identical to the first run's output. This is two-run output repeatability for the tested input and captured configuration, not proof of correctness or universal determinism. The individual validator reports still say `determinism: not_checked` because repeat files were not passed to those invocations; the comparison here was performed separately. The semantic error and strict monetary-format failure repeat unchanged.

Repair and post-repair scheduled verification are outside these two pre-repair observations and remain pending in this report.
