# Final baseline journey and null-handling regression

The CLI journey selected the existing authorized S3 source, inspected the connected bucket and `orders.csv`, configured the existing GCS destination and CSV filename, and edited the inactive one-minute schedule. Authentication and cloud identity provisioning were prerequisites. AI Builder restored the baseline four-node cleaning graph.

## Recorded journey

[Run manifest](evidence/baseline/final-ui-journey-1792186089018/run-manifest.json) · [Actual recording](demo/final-ui-journey.webm) · [Saved graph](evidence/baseline/final-ui-journey-1792186089018/configuration.json) · [Executed code evidence](evidence/baseline/final-ui-journey-1792186089018/executed-codegen-evidence.json)

The captured manual job reached `SUCCESS`, but two fresh GCS candidates differed. The first contained the seven expected business records; the second contained customer `None` where the contract requires `Unknown`. Both violated two-decimal monetary serialization. Every candidate was validated, so the overall test correctly failed. Exact object-to-job linkage is not established; neither candidate is silently discarded.

- [First independent validation](evidence/baseline/final-ui-journey-1792186089018/validation-output-1.json): business values match; strict serialization fails.
- [Second independent validation](evidence/baseline/final-ui-journey-1792186089018/validation-output-2.json): missing-customer rule and strict serialization fail.

The saved/executed generated code converts object columns with `astype(str)` before testing customer nulls. This can replace a null with a nonempty literal string and prevent the subsequent fill. The output establishes the violation; code inspection supports this explanation without claiming a separately measured runtime dtype.

A targeted Builder repair requests preservation of missing values before string conversion. Its outcome must be evaluated from subsequent real artifacts, not the repair confirmation alone.


## Null-preservation repair exposes an empty-result failure

The [null-repair manifest](evidence/baseline/final-null-repair-1792186369775/run-manifest.json) records manual job `2bccf573-bafb-4d72-a7d9-0253517e8f33`, triggered at 2026-10-16 21:33:56.359 UTC and ultimately `FAILED`. Inactive schedule checks were verified before source mutation and before the trigger. No fresh output was collected before evidence completion at 21:36:42.413 UTC. The [visible logs](evidence/baseline/final-null-repair-1792186369775/page-and-logs.txt) identify `orders_sorted_v4` with `DataFrame should not be empty`, alongside the contradictory message `Pipeline execution completed successfully`. The LLM preview reports no results after transformation. This is an actual failed repair, not a validator-only formatting failure.

The [final generated code](evidence/baseline/final-null-repair-1792186369775/executed-codegen-evidence.json) introduces null-preserving string helpers and assigns `Unknown` to missing customer values. However, two representation-sensitive filters remain:

- Quantity is universally converted with `str(val)` and tested against a positive-integer text regex. A native integral float such as `2.0` would be rejected even though the contract accepts its numeric value. The prior [successful drop code](evidence/schema-drop/post-repair-1792185641023/executed-codegen-evidence.json) branches between strict raw-string validation and finite integral numeric validation.
- Date strings are accepted only as exact YYYY-MM-DD or MM/DD/YYYY. A reader-normalized ISO datetime string containing a time would be rejected; native Timestamp objects have a separate accepted branch. The earlier successful code uses a date parser rather than only this exact ISO-date regex. Additionally, the new exact ISO-date regex returns its input without calendar validation, so syntactically shaped invalid ISO dates could escape that branch on other inputs.

These are code-supported candidate causes for filtering away valid rows, not measured proof of the values/types received by this failed execution. The sort failure locates where emptiness was rejected, not which upstream filter removed the final record. No local simulation is presented as platform execution evidence. Null handling itself cannot be declared repaired end to end when the pipeline produces no output.

A further Builder request addresses reader-normalized date/time representations and native integral numeric values while preserving strict producer-string rules. Its real manual/scheduled outcome remains pending in this report; neither prompt submission nor code inspection establishes recovery.


## Reader-representation repair also fails

The [next manifest](evidence/baseline/final-reader-repair-1792186651190/run-manifest.json) records job `c9787972-266d-411e-bd07-5e990ff06ea2`, triggered at 2026-10-16 21:38:38.790 UTC, terminal `FAILED`, and no fresh output through evidence completion at 21:40:18.500 UTC. Both inactive checks passed. This repair also produced an empty-frame failure, so the initial hypothesis did not establish a complete solution.

Its [final generated code](evidence/baseline/final-reader-repair-1792186651190/executed-codegen-evidence.json) accepts prices as native `int`/`float`, scalar objects exposing `item()`, or strings matching the raw-price regex. It has no `Decimal` branch: an ordinary native `Decimal` would reach `return None`. This is a concrete coverage gap in the code and another possible route to an empty result. The earlier successful drop algorithm accepts more general native numerics through finite numeric conversion. No captured runtime value proves that `Decimal` was the actual input type here, so this remains a qualified hypothesis rather than a measured root cause.

A subsequent Builder request seeks to recover the previously successful baseline cleaning behavior. That restoration's actual outcome is pending; neither failed attempt qualifies as the frozen baseline for scheduled drift testing.


## Recovered business baseline

The [recovery manifest](evidence/baseline/final-working-baseline-1792186864029/run-manifest.json) records manual job `b8319d7e-d55e-4e27-bca7-83a17ab2497f`, triggered at 2026-10-16 21:42:17.127 UTC and terminal `SUCCESS`. Both inactive-schedule checks passed. Three candidate exports were collected at 21:43:02.095, 21:43:07.155 and 21:43:19.446 UTC. All three are 528 bytes and independently hash to `c1b839d03b50347885b57e0d6f97588ad7026e40809f7e1dd7786c268d22de83`.

All three [per-object reports](evidence/baseline/final-working-baseline-1792186864029/run-manifest.json) confirm seven expected business records, including `Unknown` for the missing customer and valid zero-price A010. Every candidate still fails strict monetary serialization. These are three equal candidates in one observation window, not three independently triggered deterministic repetitions. Exact object-to-job linkage remains unestablished.

The [final generated algorithm](evidence/baseline/final-working-baseline-1792186864029/executed-codegen-evidence.json) preserves nulls before case/whitespace operations, handles native finite integral quantities separately from raw text, and accepts general finite numeric prices. It has baseline email access rather than the drop-case absent-column default, and no rename, suffix, extra-column or semantic repair adaptation. The source fixture and independent oracle establish the tested business recovery. They do not prove all possible input combinations.

One static limitation remains outside this fixture: the ISO datetime fallback extracts a date-shaped prefix using a regex without calendar-validating that fallback. Its native numeric price branch also converts through floating point before Decimal arithmetic. These are generalization limits, not newly observed failures on this small assessment dataset. The recovery does not prove which representation caused the prior empty results.

The controlled frozen scheduled observation below produced an unchanged-data skip. The baseline remains strictly failing on output format; business recovery must not be relabeled as full contract success.


## Recovered baseline: historical scheduled activity and controlled skip

The [controlled frozen-baseline manifest](evidence/baseline/scheduled-1792187050139/run-manifest.json) observes from 2026-10-16 21:44:21.909 through evidence completion at 21:46:33.482 UTC. No fresh export or new execution was recorded. The [inactive capture](evidence/baseline/scheduled-1792187050139/schedule-inactive.txt) reports one unchanged-data skip. Saved configuration matches the frozen recovery snapshot before and after observation, and cleanup is verified inactive. The [missing-output validation](evidence/baseline/scheduled-1792187050139/validation.json) explicitly fails with `output_present: false`. This verifies the new no-output reporting and frozen-comparison branches against the actual service; it is not a fresh controlled scheduled success.

The same manifest's prior API history identifies successful scheduled #18541 (21:42:22.347-21:43:08.678 UTC) and #18542 (21:43:15.296-21:43:20.889 UTC). These intervals overlap the recovered manual observation's three equal business-correct exports. The manual run had recorded inactive UI checks, so those checks did not establish absence of subsequent scheduled activity. Exact per-object linkage and the reason for this state discrepancy remain unknown. The historical scheduled successes and controlled skip are separate facts; neither is substituted for the other.
