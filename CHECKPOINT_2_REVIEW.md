# Checkpoint 2: implementation and evidence review

Status: **implementation and evidence coverage accepted with recorded failures**. This is not an all-pass product certification or final account-cleanup/delivery sign-off. Checkpoint 3 retains the remaining external gates.

## Latest verification update

Business-correct Builder repairs and real scheduled follow-ups are now documented for rename (#18500), type (#18504), added column (#18508), combined (#18513), cents (#18515), and dates (#18520). Each final scheduled report retains strict monetary-format failure and verified inactive cleanup. The date follow-up's raw manual/scheduled outputs were independently hashed and match; its saved configurations also match. Its Timestamp reconstruction depends on the observed reader interpretation, not dynamically measured dtype or universal semantic inference.

Controlled drop manual evidence `post-repair-controlled-repeat-1792181656437` verifies both positive inactive checks, process job `72e1c928-f486-4d59-a9cb-6b2d3b1fc344`, matching terminal SUCCESS, business-correct output and strict-format failure. Its earlier ambiguous repair and unchanged-data scheduling attempts remain historical evidence. The fresh isolated drop manual `post-repair-1792185641023` and scheduled `scheduled-1792185777857` are now reviewed: scheduled #18522 succeeds, manual/scheduled hashes and saved configurations match, business values are correct, strict formatting fails and cleanup is inactive.

Normal-path process-ID filtering, inactive checks, every-candidate validation, authoritative API schedule history and shutdown are exercised by subsequent real runs. Date scheduled `1792185555712` also exercises explicit execution outcome fields and post-shutdown visible-log capture. It does not exercise the newly added no-output validator report or frozen pre/post scheduled configuration comparison. Those branches require forthcoming runtime evidence.

The diagnostic marker finding was mitigated by matched-job payload checks, but the actual probe's final generated code removed the deliberate exception and the job succeeded as pass-through. Code-generation-stage markers cannot certify final runtime measurements; see the diagnostic finding retained with the probe evidence.

## Latest regression and remaining baseline gate

[Recorded regression](observations/final-regression.json), 2026-10-16 21:41:18.760 to 21:42:02.192 UTC: seven direct API tests passed, with zero failed/skipped/flaky and exit code zero. Test names cover provider discovery, CSRF handling, negative sign-in, connected pipeline graph, authorized project access, anonymous rejection and schedule history. [Local validator regression](observations/validator-regression.txt) records nine passing tests and exit code zero. These verify the API assertions and local checker, not pipeline business correctness.

The actual final UI journey reached existing S3/GCS/schedule configuration and Builder interaction, but a fresh export regressed missing-customer handling. Two subsequent repairs failed with empty results. See [final baseline progression](observations/final-baseline.md). A newly restored baseline must be validated before its graph can be frozen for the seven scheduled unrepaired cases. Historical successful case repairs remain valid historical observations; they do not certify the current graph.

All seven frozen scheduled unrepaired observations are now complete and documented in the central scheduling table. None yielded a fresh execution/output; these are failed bounded observations, not simulated success. Restored baseline business recovery, historical scheduled successes and a separate controlled skip are distinguished. The final demo and regression evidence are delivered. IAM cleanup, latest billing and recipient access remain checkpoint 3 gates.

## Evidence established so far

- Eight frozen scenarios and independent expected CSVs exist. Committed fixture hashes and counts were verified; all eight local validator tests passed at the earlier review.
- All seven drift cases have two real manual pre-repair observations. Second-run captured configurations match the frozen baseline before and after execution; actual source hashes match the scenario fixtures.
- Drop, rename, type/representation and combined changes reproduce failed jobs with no observed fresh output. This is repeated failure evidence, not CSV determinism.
- Added-column and both semantic scenarios produce byte-identical exports across the two observations. Added-column business values are correct; cents and date scenarios repeat semantic errors. Strict monetary formatting remains failed. The reports distinguish controlled output repeatability from correctness.
- Authentication/project API tests contain meaningful status/body assertions and an unauthenticated negative case. Full-pipeline UI helpers now perform real source upload, Builder interaction where requested, manual execution, actual downloads and independent validation. These tests rely on preconfigured cloud connections and authenticated sessions; they do not recreate the entire infrastructure from a clean account.
- Schema-drop Builder repair produced two independently checked seven-record business-correct exports, both failing strict formatting. Their exact trigger attribution is unresolved. Two later bounded scheduling attempts yielded no fresh export and explicit unchanged-data skip notices; cleanup was verified inactive.

## Blocking findings and pending verification

| Finding | Implemented mitigation or required next step | Review status |
| --- | --- | --- |
| Multiple exports assigned to one manual window | Preserve all candidates, exact job ID, execution mode and attribution limitations; validate every CSV | Verified on controlled manual and scheduled normal paths; timeout/error branches separately assessed |
| Unrelated job states could terminate polling | Filter by the captured process-response job ID | Normal-path runtime verified; error branches not universally certified |
| Schedule could change during Builder repair | Require visible unchecked inactive switch before source mutation and after Builder reload; capture both states | Normal-path runtime verified; error branches not universally certified |
| Saved configuration is not execution-code proof | Preserve safe node/parameter key schema; inspect available executed-code evidence without exposing credentials | Not resolved by snapshot equality alone |
| No-output timeout omitted history/report | Disable first, capture authoritative history and UI logs, write explicit missing-artifact report; retain combined errors | Runtime verified by frozen baseline and all seven scheduled drift windows |
| Strict monetary-format failure could hide scenario outcomes | Preserve strict failures while reporting business values, execution state and repair result separately | Approach accepted; final summaries must remain consistent |
| Scheduler still reports unchanged after source byte replacement | Record both source hashes, skip notices, observed windows and cleanup; investigate supported refresh semantics | Actual behavior established; cause unknown |
| Scheduled unrepaired drift coverage | All seven original frozen pre-repair observations are manual; mutate S3 before bounded scheduled runs under a restored frozen baseline | Complete as bounded failed observations; original manual evidence remains separate |
| Isolated drop scheduled recovery | Fresh controlled repair and scheduled follow-up | Reviewed; scheduled #18522 business-correct, strict formatting failed |
| UI pipeline journey | Automate existing authorized S3/GCS connection selection/configuration and schedule setup; cloud account signup is outside this pre-provisioned boundary | Actual existing-connection UI journey recorded; subsequent business recovery and demo reviewed |
| Submission delivery | Final README commands/scenario table/top findings/usability feedback; usable demo link; dependency and permission setup; repository access | Artifacts present; recipient access and account cleanup remain external gates |

## Methodological constraints

Full captured-configuration equality improves isolation but cannot prove every internal execution used that saved code. Similarly, output timestamps and history rows establish temporal association rather than exact object-to-job linkage. Reports must state remaining uncertainty; do not infer scheduled success from the presence of any new CSV.

Semantic tests deliberately withhold the changed producer contract until repair. Their silent errors justify explicit contracts and independent checks, not a claim that the model should infer ambiguous undisclosed intent. The type case's first Numeric profile and later Categorical profile are separately recorded; an instrumented diagnostic, if performed, must be labeled and not presented as a naturally occurring platform failure.

The reviewer helped improve two harness files at the primary agent's explicit request. Those changes require subsequent runtime evidence and final review; this document is not an independent live certification of the reviewer's own unexecuted changes.

## Completion gate

Checkpoint 2 requires completed or explicitly blocked requirement coverage, preserved raw evidence, meaningful runnable tests, final readable reports, and verification of recent harness corrections. Checkpoint 3 must then verify fixes, remaining limitations, inactive schedules, credential exclusion, and final repository/video delivery. No all-pass claim is appropriate while strict contract failures persist.


## Coverage acceptance

The required source/Builder/destination journey, real schedule observations, four independent schema mutations plus combined mutation, two semantic changes, direct API negative cases, independent actual-artifact validation, case reports, README and short demonstration are represented by runnable code and preserved real evidence. Failed scheduling windows and monetary-format violations remain explicit findings. The reviewer independently viewed the three decoded demo sample frames; captions/cards are readable and distinguish historical footage from later recorded results. Whole-video decoding was verified by the primary agent.

This acceptance is bounded to the documented dataset/configurations and observed windows. The later scheduled drift series uses a recovered baseline revision, not an identical replay of the original pre-repair node graph. Historical scheduled success satisfies the observed scheduling behavior, but a fresh controlled export from the final recovered baseline is not claimed. Optional dashboard and three separately triggered repeats were not required or claimed.


## Final observed operational state

The reviewer inspected [final state evidence](observations/evidence/final-state/README.md): schedule-list HTTP 200 at 2026-10-16 22:09:03.782 UTC reports schedule 282/project 5348 `enabled: false`. A separate actual S3 read at 22:08:52.927 UTC matches baseline SHA-256 `5ae93188cc660b26ca260dda268fec0f9df9344fd165c8910bbbb9df8b5eb014` and records no upload in that read. The retained final history page contains completed returned rows; this is not proof of globally idle backend work. These close the final observed schedule/source gate, not credential revocation or billing verification. The primary regenerated the evidence index with 82 manifests before delivery.
