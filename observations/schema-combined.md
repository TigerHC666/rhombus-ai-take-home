# Four simultaneous structural changes

Status: real manual pre-repair observation complete; Builder repair and scheduled verification pending.

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

The [prepared Builder prompt](../prompts/repairs/schema-combined.txt) discloses all four structural changes and requests only those adaptations. Builder diagnosis, real repaired output, and scheduled behavior remain pending. No successful repair or scheduled result is claimed.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:58:28.788Z ([manifest](evidence/schema-combined/pre-repair-1792180698212/run-manifest.json)). Job `607183d4-e6ce-4273-96b8-635d5910a37f` was first observed `FAILED` at 2026-10-16T19:58:34.026Z ([job states](evidence/schema-combined/pre-repair-1792180698212/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-combined/pre-repair-1792180698212/configuration-before.json) and [after configuration](evidence/schema-combined/pre-repair-1792180698212/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-combined/pre-repair-1792180698212/source-provenance.json), [after](evidence/schema-combined/pre-repair-1792180698212/source-after/source-provenance.json)). See the [second logs](evidence/schema-combined/pre-repair-1792180698212/page-and-logs.txt) and [validation](evidence/schema-combined/pre-repair-1792180698212/validation.json).

No fresh output was observed in the second collection window, ending 2026-10-16T19:58:46.351Z. The repeated terminal `FAILED` outcome supports failure reproducibility. There are no CSVs to compare: this is not an output-determinism pass. The second logs retain the failure alongside success wording.

Repair and post-repair scheduled verification are outside these two pre-repair observations and remain pending in this report.
