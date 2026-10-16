# Ambiguous dates changed from MM/DD to DD/MM

Status: conditional reader-format repair restores all seven expected dates in manual execution and scheduled #18520. Strict monetary formatting remains failed; the initial unsuccessful repair is preserved below.

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

The unchanged [configuration](evidence/semantic-dates/pre-repair-1792180290165/configuration.json) supplies the baseline interpretation. The [prepared repair prompt](../prompts/repairs/semantic-dates.txt) discloses DD/MM/YYYY and requires checking the input reader's actual interpretation before adapting already-parsed timestamps. Blindly swapping month/day could corrupt dates that the reader already interpreted correctly. Initial and corrective repair evidence are recorded below. The reader-format assumption is limited to this tested integration and producer contract.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T20:01:00.792Z ([manifest](evidence/semantic-dates/pre-repair-1792180850550/run-manifest.json)). Job `7bd769c5-1889-430a-bbc5-2e370a45811c` was first observed `SUCCESS` at 2026-10-16T20:01:07.734Z ([job states](evidence/semantic-dates/pre-repair-1792180850550/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/semantic-dates/pre-repair-1792180850550/configuration-before.json) and [after configuration](evidence/semantic-dates/pre-repair-1792180850550/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/semantic-dates/pre-repair-1792180850550/source-provenance.json), [after](evidence/semantic-dates/pre-repair-1792180850550/source-after/source-provenance.json)). See the [second logs](evidence/semantic-dates/pre-repair-1792180850550/page-and-logs.txt) and [validation](evidence/semantic-dates/pre-repair-1792180850550/validation.json).

The second [raw GCS output](evidence/semantic-dates/pre-repair-1792180850550/gcs/orders_cleaned_1792180865177.csv) has generation `1792180866884738` and SHA-256 `9e6ca069e9930e97f555b28c8c04e0178a6cbff518b69ae99327ead1d9cb3059`. Independent byte comparison confirms it is identical to the first run's output. This is two-run output repeatability for the tested input and captured configuration, not proof of correctness or universal determinism. The individual validator reports still say `determinism: not_checked` because repeat files were not passed to those invocations; the comparison here was performed separately. The semantic error and strict monetary-format failure repeat unchanged.

The first repair and scheduled observations are separate from the pre-repair repetitions and documented below.


## First repair preserves the incorrect date interpretation

The [initial repair manifest](evidence/semantic-dates/post-repair-1792184990172/run-manifest.json) records successful manual job `e136fd54-78b5-41e8-b184-c03ed80b6dd5`. The job's [final generated code](evidence/semantic-dates/post-repair-1792184990172/executed-codegen-evidence.json) parses raw strings with DD/MM/YYYY, but its non-string branch formats a Timestamp as DD/MM/YYYY and immediately parses it with that same format. This is an identity for the calendar fields; it cannot correct an earlier month/day misinterpretation.

The [actual export](evidence/semantic-dates/post-repair-1792184990172/gcs/orders_cleaned_1792185097317.csv) has the unchanged pre-repair hash `9e6ca069e9930e97f555b28c8c04e0178a6cbff518b69ae99327ead1d9cb3059`. [Validation](evidence/semantic-dates/post-repair-1792184990172/validation-output-1.json) still rejects all seven dates and monetary formatting. This is consistent with upstream month-first parsing, but runtime dtype was not directly measured by a successful paired probe.

The [scheduled follow-up](evidence/semantic-dates/scheduled-1792185124059/run-manifest.json) identifies successful scheduled #18517 from 2026-10-16 21:13:09.944 to 21:13:14.947 UTC and verified inactive cleanup. The [CSV](evidence/semantic-dates/scheduled-1792185124059/gcs/orders_cleaned_1792185191923.csv), generation `1792185193840852`, was created at 21:13:13.848 UTC with the same erroneous-output hash. [Scheduled validation](evidence/semantic-dates/scheduled-1792185124059/validation-output-1.json) confirms business and strict-contract failure.

The [follow-up prompt](../prompts/repairs/semantic-dates-followup.txt) first requests preserving raw strings or explicitly setting the reader format. If unavailable, it requests a conditional reconstruction using the observed month-first reader interpretation, followed by producer day-first parsing. That fallback is an explicit assessment assumption, not a universal rule to swap arbitrary dates. Mixed-format, differently inferred, or unambiguous day-above-12 inputs require separate verification. The successful follow-up below verifies this conditional repair for the fixed assessment input; it does not establish universal date-format detection.


## Conditional reader correction and successful business output

The [follow-up manual manifest](evidence/semantic-dates/post-repair-reader-correction-1792185217533/run-manifest.json) records job `76bd3730-bd52-474e-9395-e33dbbdbacf1`, triggered at 2026-10-16 21:14:41.138 UTC, with terminal `SUCCESS` and positive inactive-schedule checks before source mutation and before execution. Its [final generated code](evidence/semantic-dates/post-repair-reader-correction-1792185217533/executed-codegen-evidence.json) for `llm_node_14` parses raw strings as DD/MM/YYYY. For already-parsed values, it reconstructs the slash string with MM/DD/YYYY before parsing DD/MM/YYYY. This corrects the observed month-first interpretation under the disclosed producer contract. The final code does not dynamically prove that reader assumption; applying it to already-correct timestamps would be unsafe without separate verification.

The [manual CSV](evidence/semantic-dates/post-repair-reader-correction-1792185217533/gcs/orders_cleaned_1792185324207.csv), generation `1792185324874705`, was created at 21:15:24.882 UTC. All seven dates now match the independent oracle, including A001 `2026-03-04` and A011 `2026-12-01`; [validation](evidence/semantic-dates/post-repair-reader-correction-1792185217533/validation-output-1.json) confirms business correctness and rejects only the established monetary serialization differences.

The [final scheduled manifest](evidence/semantic-dates/scheduled-1792185555712/run-manifest.json) identifies successful scheduled #18520 from 21:20:04.681 to 21:20:09.675 UTC. The [scheduled CSV](evidence/semantic-dates/scheduled-1792185555712/gcs/orders_cleaned_1792185606631.csv), generation `1792185608595132`, was created at 21:20:08.603 UTC. Both 528-byte exports independently hash to `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`; their captured configurations also match. This establishes repeatability across these manual/scheduled observations, with temporal object attribution rather than an exact object-to-job foreign key.

[Scheduled validation](evidence/semantic-dates/scheduled-1792185555712/validation-output-1.json) is business-correct and strictly failed. Cleanup verifies the schedule inactive. The new [visible log capture](evidence/semantic-dates/scheduled-1792185555712/scheduled-visible-logs.txt) is supplementary UI evidence and may include older events. No runtime dtype measurement or automatic detection of an undisclosed semantic change is claimed.
