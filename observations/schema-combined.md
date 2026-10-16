# Four simultaneous structural changes

Status: pre-repair failure reproduced. Initial Builder repair leaked a tenth column. A subsequent native alias-drop/fresh-sort graph restores seven business-correct rows and nine columns in manual and scheduled execution; strict monetary formatting still fails.

## Change and reproduction

Remove `email`, rename `unit_price` to `price_per_unit`, append ` units` to quantity values, and add `loyalty_tier=standard`. Keep the original date and price-unit semantics. The repaired target is seven business records with canonical columns and empty email values.

The [actual S3 input](evidence/schema-combined/pre-repair-1792180103200/source.csv), [before provenance](evidence/schema-combined/pre-repair-1792180103200/source-provenance.json), and [after provenance](evidence/schema-combined/pre-repair-1792180103200/source-after/source-provenance.json) match SHA-256 `cb41de7b30ea253ecd880bd9e90691a8e6f8c6a2dbcb16c6439589b8486bd13b`.

## Observed result

The [manifest](evidence/schema-combined/pre-repair-1792180103200/run-manifest.json) records a manual trigger at 2026-10-16 19:48:37.596 UTC. Job `3f9a0d10-0358-4838-aab0-a8d7ff27915b` was observed `FAILED` at 19:48:42.813 UTC in [job states](evidence/schema-combined/pre-repair-1792180103200/job-states.json).

The [logs](evidence/schema-combined/pre-repair-1792180103200/page-and-logs.txt) identify missing `email` in `orders_cleaned_v3` and also say “Pipeline execution completed successfully” at the same displayed time. The [screenshot](evidence/schema-combined/pre-repair-1792180103200/pipeline-result.png) preserves this contradiction. No fresh GCS output was observed before collection ended at 19:48:58.596 UTC; [validation](evidence/schema-combined/pre-repair-1792180103200/validation.json) records absent output and failure.

This is a first-failing-field observation. It does not prove that the unchanged pipeline diagnosed or reached the renamed price, quantity suffix, or added-column behavior. The [quantity profile](evidence/schema-combined/pre-repair-1792180103200/quantity-profile.txt) labels quantity **Categorical** and lists suffixed values; do not transfer this observation to the separate schema-type run, whose profile still said Numeric.

Severity: medium for contradictory success reporting and incomplete diagnosis of the simultaneous changes. The initial missing-field exception is identifiable, but it is not a comprehensive drift report.

## Isolation and remaining work

The manifest records pre-run configuration verification, and the [captured configuration](evidence/schema-combined/pre-repair-1792180103200/configuration.json) is retained for review. The subsequent [baseline restoration validation](evidence/baseline/restore-after-schema-combined-1792180148493/validation.json) restores correct business values while retaining the known formatting defect. No baseline restoration is presented as a strict-contract pass.

The [prepared Builder prompt](../prompts/repairs/schema-combined.txt) discloses all four structural changes and requests only those adaptations. Initial Builder and scheduled outcomes are recorded below; they do not establish a successful contract repair.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:58:28.788Z ([manifest](evidence/schema-combined/pre-repair-1792180698212/run-manifest.json)). Job `607183d4-e6ce-4273-96b8-635d5910a37f` was first observed `FAILED` at 2026-10-16T19:58:34.026Z ([job states](evidence/schema-combined/pre-repair-1792180698212/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-combined/pre-repair-1792180698212/configuration-before.json) and [after configuration](evidence/schema-combined/pre-repair-1792180698212/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-combined/pre-repair-1792180698212/source-provenance.json), [after](evidence/schema-combined/pre-repair-1792180698212/source-after/source-provenance.json)). See the [second logs](evidence/schema-combined/pre-repair-1792180698212/page-and-logs.txt) and [validation](evidence/schema-combined/pre-repair-1792180698212/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:58:46.351Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

The initial repair and scheduled evidence are separate from these pre-repair repetitions and documented below.


## Initial four-change repair and alias regression

The [Builder repair](evidence/schema-combined/post-repair-1792184344149/builder-response.txt) generated the combined adaptations. The [manual manifest](evidence/schema-combined/post-repair-1792184344149/run-manifest.json) records process job `e79cd041-dc09-4b6f-a49c-24fac12fd03b` reaching SUCCESS. The job's [final generated code](evidence/schema-combined/post-repair-1792184344149/executed-codegen-evidence.json) defaults absent email, maps `price_per_unit` to canonical price and parses suffixed quantities; the graph retains upstream native removal of `loyalty_tier`.

However, final generated code explicitly adds `price_per_unit` back for "backward compatibility" and includes it in the output selection. This contradicts the nine-column contract. The [actual 487-byte output](evidence/schema-combined/post-repair-1792184344149/gcs/orders_cleaned_1792184463604.csv) has seven records with correct canonical amounts and blank email, but ten columns. [Validation](evidence/schema-combined/post-repair-1792184344149/validation-output-1.json) fails business-contract shape and strict monetary serialization. A successful job is not a successful combined repair.

The [scheduled follow-up](evidence/schema-combined/scheduled-1792184489005/run-manifest.json) identifies scheduled #18511, successful from 2026-10-16 21:02:19.443 to 21:02:25.055 UTC, with verified inactive cleanup. Its [CSV](evidence/schema-combined/scheduled-1792184489005/gcs/orders_cleaned_1792184541783.csv), generation `1792184543532697`, was created at 21:02:23.541 UTC. Independently verified SHA-256 `339f3d637883e55715779848c2691dbf524ece8ba1022dc24485cfd86837498c` matches the manual export. [Scheduled validation](evidence/schema-combined/scheduled-1792184489005/validation-output-1.json) therefore repeats the schema and formatting failures. Exact output-to-execution foreign-key linkage remains uncaptured.

A follow-up Builder request adds a native downstream alias-drop stage and fresh sort wiring. That separate revision is verified below; no successful fix is attributed to the first revision. The observed regression is supported by final generated code and raw exports, without assuming why the model introduced compatibility behavior.


## Corrected native projection and scheduled follow-up

The [projection repair manifest](evidence/schema-combined/post-repair-projection-1792184568046/run-manifest.json) records matched manual job `f048b7bc-2842-4b25-bac8-a64e410655f8`, terminal SUCCESS and business-correct output. The [captured graph](evidence/schema-combined/post-repair-projection-1792184568046/configuration.json) confirms source → native `loyalty_tier` drop → combined cleaning → native `price_per_unit` drop → fresh `sort_node_3` → GCS. Thus the compatibility alias remains an internal cleaning-node output but is explicitly removed before final export. This is a graph-level repair, not proof that the generated cleaning code itself stopped adding the alias.

The final [scheduled manifest](evidence/schema-combined/scheduled-1792184653885/run-manifest.json) identifies successful scheduled #18513 from 2026-10-16 21:05:19.496 to 21:05:25.574 UTC, with verified inactive cleanup. The scheduled captured configuration exactly matches the corrected manual graph. Its [441-byte CSV](evidence/schema-combined/scheduled-1792184653885/gcs/orders_cleaned_1792184722050.csv), generation `1792184724005669`, was created at 21:05:24.013 UTC and has independently checked SHA-256 `3c9fd235b4854fbf340cef70809b12c0a7523436ac8afd03ff54c4e69cae7882`, matching the corrected manual output.

Both saved [per-object validation](evidence/schema-combined/scheduled-1792184653885/validation-output-1.json) and independent reviewer invocation confirm seven business-correct records, blank email and nine canonical columns. Strict formatting remains failed. The combined business repair and real scheduled follow-up are complete for this fixture; the test remains failed for precision, and exact output-to-execution foreign-key linkage remains uncaptured.
