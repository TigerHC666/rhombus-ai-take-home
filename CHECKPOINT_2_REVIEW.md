# Checkpoint 2: implementation and evidence review

Status: **in progress; not signed off**. Checkpoint 1 design/fixture acceptance is complete. Checkpoint 3 final fix verification has not started. This review separates independently inspected artifacts from primary-agent reports and does not certify unfinished live work.

## Latest verification update

Final rename graph follow-up is now verified in `schema-rename/scheduled-1792182925969`: API execution #18500 is scheduled/successful, cleanup is inactive, and the single 528-byte output is business-correct with nine columns. Its SHA-256 was independently checked against inventory and equals the corrected manual export. Strict two-decimal formatting remains failed; only that strict precision assertion fails this scheduled test. The rename business repair and real scheduled follow-up are complete, while other cases remain unfinished.

Controlled schema-drop manual evidence `post-repair-controlled-repeat-1792181656437` verifies both positive inactive checks, captured process job `72e1c928-f486-4d59-a9cb-6b2d3b1fc344`, matching terminal SUCCESS, business-correct output and strict-format failure. The preceding `...1792181592764` attempt has no process job/terminal execution and must remain a harness-aborted attempt. Together with the subsequent rename manual/scheduled runs, these records verify the new normal-path schedule checks, process-ID capture and aggregate validation; they do not test every error/timeout branch.

The reviewer inspected `schema-rename/scheduled-1792182340996/run-manifest.json`: authoritative before/after API history identifies execution #18496 as scheduled, successful and inside the observation window. The single fresh 570-byte export retains the known ten-column defect, per-object/aggregate validation fails appropriately, and cleanup is verified inactive. Thus the API-history race fix, safe trigger evidence, fresh-output validation path, and normal inactive cleanup have now run against the real service. Timeout/cleanup-error paths and exact object-to-job foreign-key linkage are not certified by that successful operational path.

The rename follow-up manual run also records the new positive inactive checks, captured process ID and corresponding successful terminal status. Its new CSV remains identical to the first failed repair output; it is not a successful contract repair. Remaining case repairs and follow-up scheduling are still incomplete. A third rename repair remains in progress.

Diagnostic-mode review found a false-positive risk: searching the entire `page-and-logs.txt` for `INPUT_TYPE_PROBE` can match the Builder prompt or node instruction even when the actual failure is unrelated. Require the marker and measured dtype/type payload in the matched job's real failure/error evidence. Also compare generated diagnostic code after both probe executions; unchanged saved input configuration alone is insufficient. This finding was communicated to the primary agent; no reviewer code edit was made in this update.

## Evidence established so far

- Eight frozen scenarios and independent expected CSVs exist. Committed fixture hashes and counts were verified; all eight local validator tests passed at the earlier review.
- All seven drift cases have two real pre-repair observations. Second-run captured configurations match the frozen baseline before and after execution; actual source hashes match the scenario fixtures.
- Drop, rename, type/representation and combined changes reproduce failed jobs with no observed fresh output. This is repeated failure evidence, not CSV determinism.
- Added-column and both semantic scenarios produce byte-identical exports across the two observations. Added-column business values are correct; cents and date scenarios repeat semantic errors. Strict monetary formatting remains failed. The reports distinguish controlled output repeatability from correctness.
- Authentication/project API tests contain meaningful status/body assertions and an unauthenticated negative case. Full-pipeline UI helpers now perform real source upload, Builder interaction where requested, manual execution, actual downloads and independent validation. These tests rely on preconfigured cloud connections and authenticated sessions; they do not recreate the entire infrastructure from a clean account.
- Schema-drop Builder repair produced two independently checked seven-record business-correct exports, both failing strict formatting. Their exact trigger attribution is unresolved. Two later bounded scheduling attempts yielded no fresh export and explicit unchanged-data skip notices; cleanup was verified inactive.

## Blocking findings and pending verification

| Finding | Implemented mitigation or required next step | Review status |
| --- | --- | --- |
| Multiple exports assigned to one manual window | Preserve all candidates, exact job ID, execution mode and attribution limitations; validate every CSV | Harness changed; controlled runtime verification pending |
| Unrelated job states could terminate polling | Filter by the captured process-response job ID | Harness changed; runtime verification pending |
| Schedule could change during Builder repair | Require visible unchecked inactive switch before source mutation and after Builder reload; capture both states | Harness changed; runtime verification pending |
| Saved configuration is not execution-code proof | Preserve safe node/parameter key schema; inspect available executed-code evidence without exposing credentials | Not resolved by snapshot equality alone |
| No-output timeout omitted history | Disable first, then capture history and skip notice even on timeout; retain combined errors | Harness changed; runtime verification pending |
| Strict monetary-format failure could hide scenario outcomes | Preserve strict failures while reporting business values, execution state and repair result separately | Approach accepted; final summaries must remain consistent |
| Scheduler still reports unchanged after source byte replacement | Record both source hashes, skip notices, observed windows and cleanup; investigate supported refresh semantics | Actual behavior established; cause unknown |
| Remaining repair/scheduled outcomes incomplete | Complete Builder-only isolated repairs and real follow-up observations, or accurately document a reproduced blocker | Outstanding |
| Submission artifacts incomplete | Final README commands/scenario table/top findings/usability feedback; usable demo link; dependency and permission setup; repository access | Outstanding |

## Methodological constraints

Full captured-configuration equality improves isolation but cannot prove every internal execution used that saved code. Similarly, output timestamps and history rows establish temporal association rather than exact object-to-job linkage. Reports must state remaining uncertainty; do not infer scheduled success from the presence of any new CSV.

Semantic tests deliberately withhold the changed producer contract until repair. Their silent errors justify explicit contracts and independent checks, not a claim that the model should infer ambiguous undisclosed intent. The type case's first Numeric profile and later Categorical profile are separately recorded; an instrumented diagnostic, if performed, must be labeled and not presented as a naturally occurring platform failure.

The reviewer helped improve two harness files at the primary agent's explicit request. Those changes require subsequent runtime evidence and final review; this document is not an independent live certification of the reviewer's own unexecuted changes.

## Completion gate

Checkpoint 2 requires completed or explicitly blocked requirement coverage, preserved raw evidence, meaningful runnable tests, final readable reports, and verification of recent harness corrections. Checkpoint 3 must then verify fixes, remaining limitations, inactive schedules, credential exclusion, and final repository/video delivery. No all-pass claim is appropriate while strict contract failures persist.
