# Rhombus AI Take-Home Assessment

Real S3-to-GCS testing of an AI-built cleaning pipeline under structural and semantic drift. [Assignment mapping](REQUIREMENTS.md) · [Frozen contract](TEST_DESIGN.md) · [Design review](DESIGN_REVIEW.md) · [Implementation review](CHECKPOINT_2_REVIEW.md)

## Current status

Work remains in progress. Baseline business output and scheduled execution have been observed, and all seven drift cases have two real pre-repair observations. The rename repair now produces the correct seven records and nine columns in both manual and scheduled runs. Missing-email repair restores business values in controlled manual execution; its later bounded scheduling attempts produced unchanged-data skip notices. Quantity-suffix repair is also verified manually and on schedule; added-column upstream-drop correction is verified manually and in scheduled #18508. The combined native alias-drop correction is verified manually and in scheduled #18513. Semantic repair/follow-up work remains pending review.

**Strict monetary formatting still fails:** exports such as `12.5` do not satisfy the frozen `12.50` contract. Business correctness, backend success, and strict validation are reported separately. Nonzero integration-test exits can represent observed product defects; they must not be relabeled as passes. No simulation or expected-output fixture is presented as live execution evidence.

## Scenario results

The table summarizes reviewed evidence, not the state of an in-progress browser session. Severity describes observed impact, not a universal platform rating.

| Case and evidence | Pre-repair behavior | Business repair / subsequent scheduling | Strict contract | Severity |
| --- | --- | --- | --- | --- |
| [Drop email](observations/schema-drop.md) | FAILED; no fresh output; contradictory success log | Manual repair verified; scheduling attempts skipped, fresh follow-up export unverified | Formatting fails | Medium: reporting ambiguity |
| [Rename price](observations/schema-rename.md) | FAILED on missing `unit_price` | Final native column-drop/fresh-sort repair verified manually and in scheduled #18500; earlier repairs leaked a tenth column | Formatting fails | Medium: failed/incomplete repair |
| [Quantity suffix/type](observations/schema-type.md) | FAILED with `total_amount` assignment error; profile evidence differs between runs | Suffix repair verified manually and in scheduled #18504 | Formatting fails after repair | Medium: failure diagnosis |
| [Add column](observations/schema-add.md) | SUCCESS; seven business-correct rows, canonical schema | Reviewer found late-drop dedup risk; corrected upstream drop verified manually and in scheduled #18508 | Formatting fails | Low case-specific impact; baseline defect remains |
| [Combined changes](observations/schema-combined.md) | FAILED first on missing `email`; no fresh output | Initial alias leak corrected by native drop/fresh sort; manual and scheduled #18513 business-correct | Formatting fails after final repair | Medium: incomplete diagnosis/repair |
| [Cents semantics](observations/semantic-cents.md) | SUCCESS; six nonzero records inflated 100 times | Repair and scheduled verification pending | Business and formatting fail | High potential downstream impact |
| [Date semantics](observations/semantic-dates.md) | SUCCESS; all seven accepted dates wrong under the new producer contract | Repair and scheduled verification pending | Business and formatting fail | High potential downstream impact |

The two pre-repair outputs are byte-identical for added-column and both semantic cases. The other four cases reproduce FAILED outcomes with no observed fresh CSV; that is failure repeatability, not CSV determinism. Semantic intent was deliberately undisclosed until repair: ambiguous input cannot establish the producer's intended units/date convention by itself.

## Three provisional principal findings

1. **Operational success does not establish business correctness.** Cents output totals 7,910.00 instead of 79.10; all seven semantic-date records are misinterpreted. Independent validation detects both despite successful jobs. Conversely, structural failure logs can also contain a success message. See the scenario reports above.
2. **Builder repair confirmations require raw-output verification.** Early baseline repairs omitted valid zero-price A010. Rename repairs then leaked an extra column until Builder added a native column-drop and fresh-sort graph. Monetary trailing zeros still disappear. [Baseline evidence](observations/baseline-builder-cache.md) · [Rename progression](observations/schema-rename.md).
3. **Scheduling and code-generation evidence need precise attribution.** Unchanged-data skips persisted after verified S3 byte replacement; the fingerprint mechanism remains unknown. API history confirmed overlapping scheduled activity in an earlier manual repair window. An intentional exception-based type probe was regenerated into pass-through code, so intermediate markers cannot certify final-runtime measurements. [Scheduling](observations/scheduling.md) · [Diagnostic limits](observations/evidence/baseline/input-type-probe-1792183017207/diagnostic-finding.md).

## Setup

Use Python 3.12+, Node.js 22+, and installed Google Chrome. Commands below run from the repository root; environment examples use PowerShell.

```powershell
npm ci
python -m pip install boto3 google-auth requests
npm run test:validator
```

The validator itself uses only Python's standard library. `npm ci` installs the locked Playwright dependency; browser configuration uses the installed Chrome channel, one worker, and no retries. Local validator tests check the validator, not Rhombus correctness.

Live tests require an authorized Rhombus project with an S3 input, AI-Builder-created cleaning graph, GCS destination, and an existing inactive schedule. Cloud provisioning and identity setup are not recreated automatically. The default project is 5348, named `LLM Observability Assessment`. Set `RHOMBUS_PROJECT_ID`, `RHOMBUS_PROJECT_NAME`, and `RHOMBUS_STORAGE_STATE` when adapting the tests; the interactive capture helper still targets the original project/name and must be adjusted for a different project.

```powershell
npm run auth
npm run test:api
npx playwright test ui-tests/session.spec.cjs ui-tests/pipeline-state.spec.cjs
```

`auth` opens an isolated Chrome window for interactive sign-in and saves state in ignored `.auth/rhombus.json`. Authentication must be completed legitimately; Google initially rejected the automated browser and the user subsequently completed a supported sign-in. The API suite replays observed requests and covers public authentication, authorized project access, anonymous 401 rejection, pipeline graph bindings, and schedule-history records. It asserts status and content. The optional job observer is `scripts/observe-job.cjs`, outside the default API suite; it requires `OBSERVE_JOB_ID` and `JOB_EVIDENCE_DIRECTORY`.

For cloud helpers, provide ignored `.secrets/aws-source.json` with the dedicated identity's `aws_access_key_id` and `aws_secret_access_key`, and `.secrets/gcs-writer-key.json` with the authorized service-account JSON. Do not commit either. The automation identity requires S3 Get/Put for `orders.csv`; Rhombus's separate source grant is read-only. GCS export permissions and artifact-read permissions must be scoped to the dedicated assessment bucket. The source helper supports `ASSESSMENT_S3_BUCKET` and `ASSESSMENT_S3_REGION`; the destination reader uses `ASSESSMENT_GCS_BUCKET`. Configure the same resources in Rhombus; changing a local environment variable does not rebind the platform.

## Running live observations

These commands operate real cloud resources and can consume service credits. The manual test uploads the selected fixture to `orders.csv`; optional Builder prompts change the active graph. Do not run cases concurrently. Restore the appropriate baseline through Builder and verify configuration before testing an isolated case.

```powershell
$env:SCENARIO = 'schema-rename'
$env:RUN_PHASE = 'post-repair'
$env:BUILDER_PROMPT_FILE = 'prompts/repairs/schema-rename.txt'
npm run test:manual
Remove-Item Env:BUILDER_PROMPT_FILE

$env:SCHEDULE_CRON = '*/1 * * * *'
npm run test:scheduled
```

The prompt is an initial repair request, not a guarantee of the final successful rename graph: consult its report for additional Builder interventions. The scheduled test verifies the selected source, expects an already configured matching cron, enables the schedule, collects within 110 seconds for one-minute cron or 420 seconds for five-minute cron, then disables and verifies inactive state. It captures direct API history and validates every downloaded candidate. Supervise execution: process termination can prevent cleanup. Unchanged-data skips are recorded outcomes, not successful exports. The broad `npm run test:ui` includes mutating manual/scheduled tests; use targeted commands deliberately.

`python scripts/run-pre-repair.py <scenario ...>` orchestrates real pre-repair observations and baseline-source restoration against the frozen baseline graph. Its exit-message classifier recognizes both historical and current strict-contract assertion wording; unexpected harness errors still abort the batch. Existing recorded runs remain evidence of the versions captured in their manifests. Never use it against a repaired/diagnostic graph as though the frozen baseline were still active.

## Independent artifact validation

```powershell
python data-validation/source_s3.py --scenario baseline --destination .runtime/source-check
python data-validation/download_gcs.py --destination .runtime/gcs-check
python data-validation/validate.py --scenario baseline --source path/to/actual-s3.csv --output path/to/actual-gcs.csv --report path/to/validation.json
```

Add `--repeat path/to/another-actual-output.csv` for identical-input/configuration comparisons. Validation checks source hash, schema/order, row counts, exact expected records, monetary serialization and repeat equality. `business_values_match` alone is not a provenance or determinism pass. Missing output receives a structured failure; old output and invented empty tables are not substitutes.

Immutable inputs/oracles and hashes are in `datasets/`; `generate_variants.py` regenerates variants from the hand-authored baseline/oracle and does not clean platform output. Run manifests link source evidence, configurations, job observations, output generations/hashes and validation reports. `python scripts/summarize-evidence.py` rebuilds the manifest index; per-case reports retain the distinctions between product defects, harness failures, recovery evidence and pending work.

## Demonstration recordings

These are actual raw test-browser recordings, not a narrated final walkthrough. Private-repository access is required; download the WebM if the repository viewer does not play it.

- [Missing-email Builder repair recording](observations/demo/schema-drop-builder-repair.webm): repair interaction; individual exports from that earlier window have ambiguous manual/scheduled attribution.
- [Rename follow-up recording](observations/demo/schema-rename-followup.webm): unsuccessful intermediate repair, not the final corrected graph.

A concise final demonstration and viewer-access check remain outstanding. Recording presence is not proof that every claimed test or final state appears in the clip.

## Usability feedback

The canvas makes source, transformations and destination easy to inspect, and Builder can create substantial cleaning logic from a natural-language contract. Native deterministic stages were useful when a generated transform kept leaking an extra column. The most useful workflow was to pair the visible graph with actual downloaded outputs and explicit expected records, rather than accepting conversational repair confirmations.

Debugging was harder when an error and success message appeared together, when profile labels did not reflect the current observed input consistently, and when schedule history or unchanged-data notices did not explain exact source/execution linkage. Clear executed-code revision IDs, output-to-run identifiers, and a visible explanation of skip criteria would make failures easier to reproduce. Some UI automation issues were harness locator/timing problems and are explicitly separated from these product observations.

## Cost, security and review status

Actual-spend authorization is AUD 10, separate from the accepted temporary card hold. [Cost snapshots](observations/cost-control.md) are delayed billing evidence, not an instantaneous cap. Keep schedules disabled outside supervised windows; revoke temporary integration access after evidence collection. Authentication, keys, billing screenshots and raw sensitive metadata remain outside version control.

Design checkpoint is accepted. [Checkpoint 2](CHECKPOINT_2_REVIEW.md) remains open for remaining repairs, scheduled evidence and delivery completeness; final checkpoint 3 has not signed off. All deliverables are English. No submission email has been sent by this repository workflow.
