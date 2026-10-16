# Checkpoint 2: implementation and evidence review

Status: **in progress; not signed off**. Checkpoint 1 design/fixture acceptance is complete. Checkpoint 3 final fix verification has not started. This review separates independently inspected artifacts from primary-agent reports and does not certify unfinished live work.

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
