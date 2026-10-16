# Additional loyalty column

Status: pre-repair and initial Builder-revised manual/scheduled runs produce correct business values for the constant-valued fixture; strict formatting fails. Reviewer found that the initial revision still lets the extra column influence deduplication. A corrected upstream-drop graph is now verified manually and on schedule; strict formatting still fails.

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

The [prepared Builder prompt](../prompts/repairs/schema-add.txt) requests ignoring the new column, including during deduplication. No repair is necessary for the observed business result; Builder review and any resulting configuration change must still be separately recorded and validated. Initial Builder and scheduled observations are documented below; no broader ignore-before-dedup compliance is implied by the constant-valued fixture.

## Second pre-repair observation and repeatability

A second real manual execution was triggered at 2026-10-16T19:57:16.412Z ([manifest](evidence/schema-add/pre-repair-1792180625965/run-manifest.json)). Job `a4a98136-34b9-4b9d-92b5-c61d609d888e` was first observed `SUCCESS` at 2026-10-16T19:57:22.031Z ([job states](evidence/schema-add/pre-repair-1792180625965/job-states.json)); these timestamps are UTC observations. The [before configuration](evidence/schema-add/pre-repair-1792180625965/configuration-before.json) and [after configuration](evidence/schema-add/pre-repair-1792180625965/configuration.json) were independently compared and exactly match the frozen baseline snapshot, including the captured source, destination, mode, sorting and node-edge fields. This closes the earlier snapshot-scope gap for this second execution, without retroactively expanding the first run's evidence.

Both downloaded S3 reads again match the same scenario fixture hash ([before](evidence/schema-add/pre-repair-1792180625965/source-provenance.json), [after](evidence/schema-add/pre-repair-1792180625965/source-after/source-provenance.json)). See the [second logs](evidence/schema-add/pre-repair-1792180625965/page-and-logs.txt) and [validation](evidence/schema-add/pre-repair-1792180625965/validation.json).

The second [raw GCS output](evidence/schema-add/pre-repair-1792180625965/gcs/orders_cleaned_1792180640505.csv) has generation `1792180641143311` and SHA-256 `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`. Independent byte comparison confirms it is identical to the first run's output. This is two-run output repeatability for the tested input and captured configuration, not proof of correctness or universal determinism. The individual validator reports still say `determinism: not_checked` because repeat files were not passed to those invocations; the comparison here was performed separately. Business values remain correct while strict monetary formatting fails.

Builder and scheduled observations are separate from these two pre-repair repetitions and documented below.


## Initial Builder revision and scheduled verification

The [Builder response](evidence/schema-add/post-repair-1792183846396/builder-response.txt) claims `loyalty_tier` is dropped before normalization and deduplication, and updates a native downstream drop stage. The [manual manifest](evidence/schema-add/post-repair-1792183846396/run-manifest.json) records both inactive checks, process job `93b26d73-de3a-4ef9-8249-c7efc48e91ed`, and terminal SUCCESS. [Validation](evidence/schema-add/post-repair-1792183846396/validation-output-1.json) confirms seven business-correct rows and nine columns; strict monetary formatting remains failed.

The subsequent [scheduled manifest](evidence/schema-add/scheduled-1792184016528/run-manifest.json) identifies scheduled execution #18506, successful from 2026-10-16 20:54:21.701 to 20:54:27.089 UTC, with verified inactive cleanup. Its [raw CSV](evidence/schema-add/scheduled-1792184016528/gcs/orders_cleaned_1792184063943.csv), generation `1792184065671358`, was created at 20:54:25.679 UTC. Independently checked SHA-256 `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83` matches the manual output. [Scheduled validation](evidence/schema-add/scheduled-1792184016528/validation-output-1.json) again reports business correctness and strict-format failure. Manual and scheduled captured configurations exactly match on independent comparison.

## Reviewer finding: successful fixture does not establish deduplication isolation

The actual job's [final generated code](evidence/schema-add/post-repair-1792183846396/executed-codegen-evidence.json) for `llm_node_9` exactly matches the saved code and contradicts the early-drop claim. It preserves `loyalty_tier`, calls `df.drop_duplicates()` across all columns, compares all row values when resolving conflicting IDs, and includes the extra field in the LLM output. A later native drop removes the field only after these decisions.

For this fixture every loyalty value is identical, so the observed outputs remain correct. If otherwise identical business records carry different loyalty values, this implementation can treat them as conflicting rather than identical canonical records. That is a code-review finding and untested counterexample, not a claimed live failure on a new dataset. Previous type-suffix and semantic adaptations are absent from this cleaning code, but the promised ignore-before-dedup contract is not satisfied by the graph ordering.

A follow-up Builder request moves a native drop stage before cleaning. That distinct revision is evaluated below; its evidence is separate from the initial successful constant-fixture observations.


## Corrected upstream-drop graph

The [follow-up manual run](evidence/schema-add/post-repair-upstream-drop-1792184091369/run-manifest.json) captures job `bffce78b-67ac-4063-a359-2a13c6c98302` with terminal SUCCESS and seven business-correct output rows. Independent [graph review](evidence/schema-add/post-repair-upstream-drop-1792184091369/configuration.json) confirms source output feeds `column_drop_node_2`, configured for `loyalty_tier`, before `llm_node_10`, then sort and export. The captured cleaning code no longer contains earlier quantity-suffix, price-alias, missing-email or semantic conversions. Consequently the extra column is removed before cleaning/dedup decisions in this graph, addressing the reviewer finding rather than relying on the constant fixture to conceal it.

The completed [scheduled follow-up](evidence/schema-add/scheduled-1792184250981/run-manifest.json) identifies scheduled execution #18508, successful from 2026-10-16 20:58:16.387 to 20:58:21.335 UTC, and verified inactive cleanup. Its saved configuration exactly matches the corrected manual graph. The [actual CSV](evidence/schema-add/scheduled-1792184250981/gcs/orders_cleaned_1792184298623.csv), generation `1792184299890826`, was created at 20:58:19.902 UTC. Independently verified SHA-256 is `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`, matching the manual business-correct export.

[Validation](evidence/schema-add/scheduled-1792184250981/validation-output-1.json) confirms seven canonical business records and nine columns; strict monetary formatting remains false. This completes observed graph correction and scheduled follow-up for the specified fixture. A separate varying-loyalty duplicate fixture was not run, and exact output-to-execution foreign-key linkage remains uncaptured.


## Unrepaired scheduled observation under recovered frozen baseline

The [later scheduled window](evidence/schema-add/scheduled-pre-repair-1792187928050/run-manifest.json) uses the [recovered baseline revision](evidence/baseline/final-working-baseline-1792186864029/configuration.json), with saved equality before and after. Observation begins at 2026-10-16 21:58:59.613 UTC and evidence collection ends at 22:01:03.889 UTC after the full 110-second output wait. Both actual source reads match added-column fixture SHA-256 `3a7e8a0b8f1fdbd74d559cb48babf7573001d50ee488896f7926d58f0f5fdc00` ([before](evidence/schema-add/scheduled-pre-repair-1792187928050/source-provenance.json), [after](evidence/schema-add/scheduled-pre-repair-1792187928050/source-after/source-provenance.json)).

No new execution or fresh CSV is recorded. The visible unchanged-data notice falls from two to one, so it does not establish a newly counted skip. The collector records `bounded_no_new_execution` with the expected failed outcome assertions. [Validation](evidence/schema-add/scheduled-pre-repair-1792187928050/validation.json) explicitly fails on missing output. UI cleanup verifies inactive, and [actual baseline restoration](evidence/schema-add/scheduled-pre-repair-1792187928050/baseline-restoration/source-provenance.json) follows collection.

This run predates the new direct backend schedule-enabled checks; no backend disabled-state proof is retroactively attributed to it. Its saved graph/source/UI safeguards remain the evidence actually collected. This bounded scheduled absence is separate from the original manual added-column continuation and successful final repaired scheduled #18508; it is not an additional executed cleaning result or determinism comparison.
