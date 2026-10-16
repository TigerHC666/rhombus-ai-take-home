# Independent Design Review

## Interim source-helper and scheduled-test review

Read-only review of `source_s3.py`, `scheduled-output.spec.cjs`, `download_gcs.py`, the updated validator, and workflow/settings helpers. No cloud requests, uploads, or schedule changes were performed by the reviewer.

Positive controls: S3 mutations require an explicit `--upload`, target one hardcoded assessment key, verify the frozen fixture hash, reread actual S3 bytes, and preserve hash/ETag/last-modified evidence. GCS downloads pin the listed object generation and preserve checksums. Scheduled-test validation uses a downloaded source instead of substituting the fixture. The test disables scheduling before strict output assertions, and expected decimal-format failures remain failures. Source-role permissions are reported by the primary, not independently inspected here.

### Corrections before unattended or repeated scheduled execution

1. **Cleanup activation race:** `activated` becomes true only after the switch `.check()` resolves. If the server enables the schedule but the UI check times out, `finally` skips cleanup. Set cleanup responsibility before attempting activation and inspect/disable scheduling even when activation throws. Preserve cleanup errors and never declare disabled state unless verified. A process crash or lost browser also defeats `finally`; retain supervised operation and a bounded server-side end/run limit where supported.
2. **Scheduled provenance is not proven:** the poll accepts any matching-prefix GCS object created after `start`, then hardcodes `trigger: 'scheduled'`. A pending/manual run can satisfy this. Parse and assert a matching successful schedule-history execution with timestamps/run ID and the active configuration; correlate its output generation. If linkage is unavailable, label trigger attribution provisional rather than scheduled. The saved history text alone is not an assertion.
3. **Disable controls and bounds:** assert the schedule is initially inactive, inspect/save its configured cadence, and do not silently take over an already-active schedule. The seven-minute timeout alone does not enforce the design's maximum three executions if the configured cadence is fast or exports fail. Enforce run count or explicitly revise the supervised bound using observed controls. Record queued/in-flight work after disable.
4. **Failure manifests:** poll timeouts and cleanup/history errors currently escape before `run-manifest.json` is written. Always emit a failure manifest describing attempted activation, source evidence, observed runs/objects, and independently verified cleanup status, even when no object appears. This complements the validator's improved structured missing-artifact report.
5. **Exact artifact linkage:** the manifest's `output` comes from the earlier list poll, while a second listing supplies the actual downloads. Select/pin the same object generation and include its final downloaded SHA-256 in the run manifest. Recheck the S3 hash after the window to detect accidental source replacement while testing; unchanged before/after hashes support, but do not alone prove, the engine read that version.
6. **Helper limits and portability:** reject oversize source fixtures before PUT, not only after downloading; close the S3 response stream. Document boto3 installation rather than relying solely on an ignored vendor directory. Python helpers hardcode bucket/region while JS exposes output-bucket configuration; reconcile these so a customized test cannot silently validate the original author's bucket.

### Proceeding with a known precision defect

It is appropriate to stop repeated AI repair attempts once seven business records are independently correct and the remaining two-decimal serialization defect is reproducible. Execute the required scenario matrix against that frozen baseline revision, explicitly recording **business baseline correct; strict serialization contract failed**. Do not relabel the strict baseline as fully passed or weaken the oracle.

Use separate fields for run success, business-value correctness, strict formatting, drift detection, and repair outcome. Preserve the strict failing test/report; orchestrate subsequent independent cases despite this known failure. Compare new scenario-specific defects against the known baseline formatting defect so it does not conceal data loss or silent semantic corruption. The validator's `business_values_match` is an output-value comparison only: it may be true even when source provenance or determinism fails, so it must not become a standalone overall-pass flag.

The primary reports v2/v3 exports retain A010 with seven business-correct rows but still lose monetary trailing zeros. This review did not independently reopen those new outputs; retain their raw-object validation as the evidence supporting that state. Formal implementation checkpoint 2 remains pending.

## Interim authenticated-test coverage review

Reviewed `api-tests/project-access.spec.cjs`, `api-tests/authentication.spec.cjs`, `ui-tests/pipeline-state.spec.cjs`, and `ui-tests/session.spec.cjs`. The primary reports passing authenticated/anonymous project API checks and pipeline-state UI execution; this review inspected their code without independently replaying cloud requests.

The project API pair now provides relevant direct backend coverage: the positive test replays an actually observed request and asserts status plus the intended restricted project ID/name; the negative test uses a fresh unauthenticated context and asserts 401, an authentication-related error body, and absence of project items. These are meaningful access-control checks, rather than guessed endpoints or status-only assertions. Keep their scope as project access: they do not test pipeline execution, schedule behavior, or data correctness. The existing authentication suite remains supplementary.

**UI coverage remains materially incomplete.** Current tests establish authenticated inventory and visible S3 source selection only. They do not automate builder creation/repair, prove the selected source's binding (a visible filename may merely be an available option), select the real GCS output, configure/disable scheduling, await a correlated fresh run, or assert downloaded output validity. Passing these tests cannot be presented as full-pipeline UI coverage. No fixed sleeps were found; outcome-based waiting is appropriate.

Concrete test improvements before final implementation review:

- Parameterize project ID/name and authentication-state location for reproducibility instead of requiring the author's exact project. Document setup for existing-project checks separately from full journey tests.
- Create `.runtime` and evidence output directories before writing. A clean clone must not depend on ignored directories already existing locally.
- Preserve distinct evidence per execution rather than overwriting one network inventory; connect it to the run/scenario manifest.
- Assert actual source/output binding and a new run identity, not only visible controls or generic success text. Follow through to raw GCS content validation and finally disable scheduling even if assertions fail.
- Avoid treating broad page-body dumps as publication-ready evidence: keep them local and redact/review any excerpts before committing. The source comment promising metadata-only evidence does not itself enforce that the full page contains only metadata.
- The authenticated API test's request discovery is acceptable for an observed-interface test, but requires browser/session setup. Document that dependency rather than describing it as an independently credentialless API suite.

### AI-builder-only baseline recovery proposal

Preserve current failed output and configuration evidence. Ask the builder to inspect the executable transformation actually connected between S3 and the selected GCS output, including all upstream filters and downstream casts. Require it to identify the active node IDs/edges and verify whether the output still follows an old node after replacement. Do not accept a changed instruction or response as proof of executable repair.

Through the builder, change zero handling explicitly: missing/null and negative prices are rejected; numeric/string zero must survive every filter and required-field check. Avoid truthiness tests that interpret zero as missing. Ask it to regenerate the active executable transformation through supported tooling and reconnect the actual export path, without inserting expected rows or hardcoded outputs.

For monetary formatting, ask the builder to keep both money columns as two-decimal strings through the final transformation and inspect whether downstream export/type inference converts them back to numeric values. A UI preview can hide formatting; acceptance must use raw CSV bytes. If the exporter inherently strips trailing zeros despite correct string output, document the platform limitation separately instead of weakening the frozen oracle silently.

Execute a fresh bounded baseline only after those corrections, capture its new run/object identities, and validate all seven records including A010 and exact money serialization. If still incorrect, compare intermediate node row counts and A010 presence to localize the first loss; ask the builder to repair that stage. Only after a verified baseline should the scheduled baseline and isolated drift matrix proceed. No simulator or locally cleaned substitute satisfies this gate.

## Interim live-evidence audit (not checkpoint 2 sign-off)

Independently read the baseline finding, builder/repair evidence, execution logs, GCS inventory, all four downloaded CSVs, authentication test source, and recorded authentication test results. No cloud actions or secret access were performed; authentication tests were inspected rather than independently rerun.

**Raw output now confirms a baseline failure.** Each inventory-listed local CSV is 477 bytes and matches its recorded SHA-256 `1b0583dad21a144c63e4d5562cb5320db42ad2ff8e5468ed4817f2fb934efbe7`. Each contains six records and omits valid zero-price A010. Eleven of twelve monetary cells violate the exactly-two-decimal serialization contract. Independently invoking the local validator on all four files rejects each. This invocation used the frozen baseline source fixture, not an independently downloaded S3 source; source/run provenance still relies on the primary's captured evidence and inventory.

The four artifacts have distinct GCS object names/generations and creation timestamps, but identical contents. This verifies output agreement across those objects; it does not establish controlled fixed-configuration determinism, since repairs/configuration changes and trigger attribution have not been independently reconciled. No scheduled execution is established.

### Report corrections required

- `observations/baseline-builder-cache.md` still says raw download and validation are pending. Replace those stale statements with the actual file links, generation/timestamps, matching hashes, six-record result, missing A010, and formatting failures.
- Prefer a finding title such as **Builder repair confirmation did not restore baseline correctness**. The current title asserts failure to regenerate executable code more strongly than the independently available evidence supports. Cache/stale-code causality remains the builder's diagnosis until an actual before/after executable-code comparison verifies it.
- Preserve the distinction between the original instruction defect, the prompt-repair run, and the replacement-node attempt. Map every output object to its supported configuration/repair stage and trigger evidence; mark unknown attribution as unknown. Four objects alone cannot establish that a replacement node was executed or that output selection used it.
- Describe missing A010 as substantive data loss and reduced decimal places as a separate serialization failure. Do not call the latter wrong monetary arithmetic: the six retained records have the expected numeric amounts, despite formatting differences.
- Avoid implying that the intentionally defective original configuration was explicitly run after the rejected action. The primary reports an automatic approval rejection before repair; subsequent output evidence must retain its actual sequence.

### Authentication API evidence

The saved result records three expected/passing tests, zero skipped/unexpected/flaky cases. Test source asserts response status and content for observed provider discovery, CSRF token presence, and a fresh-context sign-in rejected for missing CSRF. The negative test checks the 302 destination and `MissingCSRF`, rather than treating any redirect as success. Token assertions avoid printing its value.

These are useful live authentication API checks, accurately labeled as authentication-only. They do not establish pipeline endpoint behavior, authenticated project access, scheduling, or export correctness. Maintain that scope label; add relevant pipeline backend coverage when authorized login is restored. Google's automated-browser restriction should remain a documented access limitation, without bypass claims.

Baseline is not accepted yet. Repair correctness, fresh source/output provenance, successful scheduled baseline, scenario isolation, drift/repair evidence, full UI/backend coverage, and final deliverables remain outstanding. The primary reports no active schedules and that the original account is currently signed out; these are reported operational facts, not reviewer-verified cloud state.

## Current checkpoint 1 status (supersedes historical blockers below)

Design and frozen fixtures are accepted for implementation. Checkpoints 2 (completed implementation/live evidence review) and 3 (fix verification) have not occurred. No live pipeline, schedule, drift, determinism, UI, or API result is approved by this review.

The primary reports restored browser access; user authorization for implementation and staged private-repository pushes; authenticated GitHub CLI; S3 `orders.csv` connected; and GCS destination created/bound with the approved dedicated bucket-level create/delete identity. These replace historical statements about missing approvals, absent integrations, and unavailable repository delivery. No schedule has been activated. Cloud state was not independently inspected by this reviewer.

Independent local verification at commit `fcf2e0e`:

- Read the committed manifest and all sixteen fixture/oracle blobs directly from Git, rather than relying only on working-tree files. Every SHA-256 and CSV row count matches: twelve input rows and seven expected rows for each of eight cases.
- Executed `python -B -m unittest discover -s data-validation -p 'test_*.py' -v` with Python 3.12.4: all eight local validator tests passed. These demonstrate rejection of selected corrupt artifacts and correct local oracle comparison; they do not verify cloud execution.
- Reviewed `validate.py`: exact expected-row comparisons preserve ordering and detect semantic discrepancies; source hashes prevent accepting a different fixture; repeat comparison does not silently sort away differences. Output explicitly declares that provenance requires a live manifest and determinism is unchecked without repeats.
- The local Git ownership safeguard required a command-scoped `safe.directory` override for this known workspace. No global Git configuration, secrets, or cloud state were changed.

### Concrete findings and remaining gates

1. **Baseline blocker: zero-price rejection.** The saved builder response explicitly says "zero/negative dropped", conflicting with the frozen nonnegative-price contract and valid A010 (0.00). This is verified instruction/response-level evidence, not yet a demonstrated runtime defect. Preserve that evidence, use the AI builder to correct the rule, and verify the actual output retains A010 before claiming baseline correctness. Do not hand-edit cleaning code.
2. **Expected absence needs structured evidence.** The current validator raises an exception for an absent output or empty file before it writes a JSON report. It cannot by itself fulfill the requirement to record every stopped/failed run. Before drift execution, provide a run/report layer that records verified output absence and failure metadata, or explicitly handles these cases as structured failures. Never substitute an invented empty CSV. This is a reporting/readiness gap, not a false-pass defect in the existing comparison.
3. **Source freshness and integration:** demonstrate an actual S3 read and fresh GCS write, with fixture hash, output object identity/generation, run identifier, and timestamps. A configured connection is insufficient. Ensure subsequent input replacement is read rather than cached.
4. **Scheduling:** inspect supported interval and disable controls; maintain the three-run/30-minute supervised bounds; obtain a successful scheduled baseline; verify disabled state after each window. Apply bounds to repair/repeat runs too.
5. **Scenario evidence:** preserve baseline configuration for isolation, capture pre-repair failure, apply chatbot-only fixes, validate actual downloaded outputs, and record post-repair scheduled behavior. Capture inferred quantity types before labeling the suffix case a verified type change.
6. **Automation and delivery:** implement full-journey UI tests and at least two observed-backend tests including a meaningful negative case. Complete scenario reports, actual repeated-run comparisons, README findings/usability feedback, and an accessible video. GitHub transport is reported resolved; final repository contents/accessibility still require verification.
7. **Budget and cleanup:** continue checking AUD 10 actual-spend headroom, bounded schedules, private bucket scope, and credential exclusion. Preserve reproducibility instructions when revoking temporary integration access after experiments.

The source brief was read in full by the primary agent and mapped in `REQUIREMENTS.md`; the reviewer still distinguishes reviewing that mapping from personally viewing the original source. Historical sections below record earlier states and are not current blockers unless repeated in this section.

## Checkpoint 1 fixture acceptance

Independently inspected the revised contract, baseline input, hand-authored baseline oracle, both semantic variants, generator source, and manifest. A read-only CSV/hash check confirmed all eight input files have 12 rows, all eight expected files have seven rows, and all 16 SHA-256 values match the manifest. This is local fixture verification, not a live platform result.

**The fixtures and expected results are accepted for the planned live experiments.** The four previous contract clarifications are adequately addressed for these fixtures. The rounding-boundary request is superseded by the explicitly limited domain: cent-precise prices multiplied by integer quantities cannot produce fractional cents. Do not claim that these data test rounding behavior beyond that domain.

Independent arithmetic and row review:

- Twelve raw rows minus one exact A001 duplicate and four invalid records yields seven records. A004 has zero quantity; A005 has an invalid calendar date; A006 has a negative price; A007 has no price.
- Accepted IDs are A001, A002, A003, A008, A009, A010, A011, in the required order. Their totals are respectively 25.00, 12.60, 20.00, 1.00, 15.00, 0.00, 5.50. Text normalization, missing-customer sentinel, and email replacement agree with the contract.
- Dropping email creates no additional duplicate collisions. Blank-email expected outputs for drop and combined cases are therefore appropriate.
- Cents mutation scales nonempty prices by 100, preserves missing/negative invalid cases, and leaves the schema unchanged. Six accepted rows expose monetary corruption under unchanged baseline interpretation; the zero-price row is a useful unchanged control. Explain that currency labels remain AUD while the producer contract changes the numeric unit, including values with the retained dollar prefix.
- Date mutation swaps month and day text while preserving the schema. All seven accepted records have unequal month/day components at most 12, so baseline interpretation can silently produce valid but incorrect dates. The invalid February 30 row remains invalid after the intended format change. The expected calendar dates correctly remain the original dates.
- Generator inspection confirms that it mutates inputs and copies the explicit baseline oracle, with only the prescribed email blanking for two scenarios. It does not derive expected values from the platform or run a cleaning transformation. No nondeterministic inputs appear in generation. The reviewer did not rerun this writing script, so byte-for-byte regeneration is statically supported rather than independently execution-tested.

Remaining limits: these twelve rows do not exercise every declared rejection rule, conflicting IDs, or deduplication of differently formatted but normalization-equivalent records. This does not block the requested scenario matrix; avoid reporting those unexercised rules as separately tested. Inferred-type evidence is still required before calling the suffix mutation a verified type change. Live scheduling still depends on completed GCS binding/key delivery, successful integration, and verified disable controls.

The primary reports that cloud integration approval was received, the S3 read policy was saved with public access blocked, and baseline `orders.csv` was uploaded. These are primary-agent reports, not independent reviewer observations. The GCS service account/custom create-delete role reportedly exist; binding/key delivery remain pending. Those updates supersede the earlier approval-pending wording below.

## Checkpoint 1 follow-up: requirements and concrete design

Reviewed `REQUIREMENTS.md`, `TEST_DESIGN.md`, and `s3-read-policy.json` on October 17, 2026. The primary agent reports that browser access is restored and that it read the complete rendered original brief. The reviewer independently reviewed that mapping, but did not personally read the original page; the original-source distinction below remains accurate. Earlier browser-access and unspecified-contract blockers are superseded by this follow-up.

**Disposition: accept the overall design for preparation and implementation, with the following concrete revisions and activation gates. No live-run or implementation sign-off is implied.**

### Required clarifications before freezing expected outputs

1. **Decimal behavior:** Specify the rounding mode and whether `unit_price` itself is rounded or only `total_amount`. Define accepted decimal syntax and prohibit non-finite values. Specify how prices serialize in expected CSVs. Include a rounding-boundary row so two implementations cannot appear compliant while disagreeing.
2. **Required fields and normalization:** Enumerate required values; the current phrase "invalid required values" is underspecified. State case sensitivity of the `Unknown` sentinel, accepted status values if restricted, whitespace handling for numeric/date fields, and the exact email validity rule. Assertions should implement this frozen contract rather than changing it to match platform output.
3. **Duplicate collisions:** Dropping email can make previously distinct records identical after normalization. Ensure fixtures avoid this collision or explicitly update expected row counts. The claim that the drop-case target is the same table with blank email is valid only under that condition. Also decide the treatment of duplicate order IDs with differing values.
4. **CSV type evidence:** CSV has textual fields rather than declared scalar types. Verify that the suffix mutation actually changes Rhombus's inferred quantity type, or document it precisely as a representation/type-parsing drift. Record inferred schema before and after when exposed by the platform.

### Accepted design choices

- Independent frozen output tables; unchanged baseline pipeline for the initial semantic runs; explicit producer-contract disclosure only for repair.
- Separate baseline-derived pipelines, or a demonstrably restored baseline before each isolated case.
- Downloaded real S3/GCS data, source/output hashes and object metadata, pre-repair evidence, and explicit handling of absent/stale output.
- One active schedule with a supervised maximum of three executions or 30 minutes, subject to inspecting supported schedule controls first. The same bounds must apply to repair and determinism repetitions, not only baseline.
- English-only deliverables, no paid Rhombus subscription, AUD 10 actual-spend constraint, and honest partial-coverage reporting.
- Mandatory determinism validation is distinct from the optional dashboard's three-repeat presentation; insufficient repeat evidence must remain an explicit limitation.

### S3 policy review

The provided JSON grants only `s3:GetBucketLocation`, `s3:ListBucket`, and `s3:GetObject` to two specific AWS role principals. It grants no writes/deletes and has no wildcard principal. Resource ARNs are confined to the dedicated assessment bucket and its objects.

Despite statement names containing `ConfiguredPrefix`, the policy has **no prefix condition** and allows listing/reading every object in this bucket. This is acceptable only while the bucket remains dedicated to synthetic assessment data; describe it as bucket-wide read access, not prefix-restricted access. The primary agent attributes the role ARNs to live Rhombus-generated policy; this reviewer has not independently verified ownership of those roles. Confirm the policy still matches the live integration before applying the pending approved action.

### GCS access review and remaining gates

- Dedicated service account and bucket-level create/delete rights are an appropriate proposed scope for output plus verification cleanup. Delete rights permit deletion of any objects covered by that grant; keep the bucket assessment-only. Do not grant project-wide Storage Admin.
- The exact GCS role/custom permission binding and key-handling procedure have not been supplied for review. Verify effective scope and required permissions against the connector's actual behavior before activation. Keep keys out of source, traces, screenshots, and reports; transfer only to the authorized integration and remove temporary local copies.
- Cloud policy/credential actions remain pending their action-time approval and verification, according to the primary agent. Do not treat this design review as that approval.
- Freeze and review concrete fixtures/expected outputs after the four clarifications above. The reviewer has not inspected any data or implementation yet.
- Verify Rhombus project 5348's integration, output selection, credits, schedule disable operation, and a successful real baseline before relying on scheduled experiments.
- Observe backend requests and establish legitimate reproducible test authentication; guessed endpoints cannot satisfy API coverage.
- A GitHub delivery route and accessible demonstration video remain delivery gates, even though they need not block local implementation. The primary reports that local GitHub CLI is unauthenticated and the connector currently exposes an unrelated existing repository; do not upload into that repository merely because it is accessible.

The historical initial review below is retained as a dated evidence trail; use this follow-up for current design disposition.

Review checkpoint: 1 of 3 (design, implementation, fixes).

## Evidence and authority

The reviewer attempted to open the [original assignment](https://ripe-lemur-572.notion.site/Software-Engineer-in-Test-Intern-Rhombus-AI-33dcfd62d0a28093bb96cf7df72a2de7?source=copy_link), but the web tool returned an inaccessible-page error. Therefore, the requirements below are derived from the primary agent's conversation summary, not independently verified original-source text. Obtain and preserve the complete brief before claiming full requirement compliance. No shared browser tabs or cloud accounts were operated by this reviewer.

The latest delegated authorization permits sustained implementation after readiness checks. The actual-spending limit is AUD 10 across the assessment, with a separately accepted AUD 40 temporary card authorization hold. The hold is not an additional operating budget. All deliverables must be in English. SETUP_STATUS.md still says preparation only; that scope statement is stale relative to the latest authorization and needs correction by its owner.

## Reported environment

These facts come from SETUP_STATUS.md and the primary agent, not an independent live inspection:

- S3: `rhombus-assessment-source-20261017-hc666`, `ap-southeast-2`, private and empty.
- GCS: `rhombus-assessment-output-20261017-hc6`, `us-central1`, private and empty; project `centering-line-511818-s7`, trial account `tigerhc6@gmail.com`.
- Rhombus uses the designated primary Google account; the GCP trial account is separate. Confirm this cross-account arrangement through a successful authorized integration, not an assumption about Google login.
- No integration credentials or scheduled pipeline exist yet.
- A small GCP billing alert exists. Alerts and trial credits do not constitute a hard cross-cloud spending cap.

## Acceptance checklist

| ID | Requirement from conversation summary | Acceptance evidence |
| --- | --- | --- |
| R01 | Real S3 to AI-builder transformation to GCS | Saved AI-builder prompts and resulting configuration; real input/output object identifiers; one successful scheduled baseline run |
| R02 | Five structural drift cases | Separate deleted-column, renamed-column, changed-type, added-column, and combined fixtures; each tied to its own observed run |
| R03 | At least two semantic drift cases | Same schema as baseline; explicit changes in business meaning; an independent rule capable of detecting incorrect output |
| R04 | Failure behavior and repair | Per-case stop/warning status, actual output or verified absence, logs, chatbot diagnosis and repair outcome, then subsequent scheduled-run evidence where executable |
| R05 | CLI-runnable UI automation | Playwright or Cypress covering the required flow; meaningful assertions and bounded state-based waits, without fixed sleeps as readiness checks |
| R06 | At least two backend tests | Direct calls to observed relevant endpoints; at least one controlled negative case; status and response-body assertions |
| R07 | Independent data validation | Baseline and every variant checked for schema, rows, cleaning rules, deterministic results, and semantic correctness |
| R08 | Repository deliverables | `/ui-tests/`, `/api-tests/`, `/data-validation/`, `/datasets/`, `/observations/`; per-drift reports and redacted evidence |
| R09 | README and demonstration | Reproducible setup/run instructions, scenario results table, three principal findings, user experience, usable video link |
| R10 | Optional dashboard | Treat as optional until the original brief confirms otherwise; prioritize mandatory evidence |

Completion means faithfully evaluating and documenting platform behavior. A reproducible platform defect is a valid finding, but a blocked or unexecuted test must never be reported as passed.

## Experimental design gates

- [ ] Preserve the exact original brief and reconcile it against R01-R10, including any additional constraints.
- [ ] Define a tiny synthetic baseline with stable row identifiers and manually checkable expected output.
- [ ] Specify nulls, duplicate handling, invalid rows, date interpretation, decimal precision, rounding, column order, and row-order policy before inspecting actual output.
- [ ] Freeze expected results independently of the Rhombus transformation. Never generate the oracle by copying current platform output or executing its generated transformation code.
- [ ] For semantic drift, document the producer contract and expected interpretation. Ambiguous data cannot establish what the platform should infer without context. Separate silent corruption detection from supported automatic repair.
- [ ] Reset to a known baseline transformation and input before every isolated case. Record configuration revisions and fixture hashes. Run combined drift as its own case.
- [ ] Ensure stale output cannot pass a test: correlate source version/hash, scheduled run identifier, timestamps, and destination object generation/hash.
- [ ] Repeat identical inputs against a fixed transformation to evaluate deterministic data output. Canonicalize only fields and order explicitly excluded by the contract; do not normalize away defects.
- [ ] Define negative API behavior using the actual interface contract or observed supported behavior. A guessed endpoint returning 404 is insufficient coverage.

## Evidence integrity gates

- [ ] Store a run manifest with scenario, source hash, transformation revision, trigger type, UTC timestamps, run ID, output reference, validator result, and evidence paths.
- [ ] Distinguish automated live checks, manual observations, local fixture tests, simulated tests, and blocked checks in both reports and README.
- [ ] Capture the pre-repair failure before changing prompts or configuration; retain the chatbot exchange and post-repair validation separately.
- [ ] Preserve failed runs and unexpected outputs. Do not turn eventual success into a claim that the original run passed.
- [ ] Capture schedule configuration and execution metadata proving scheduled execution; a manual successful run is not equivalent.
- [ ] Redact passwords, keys, tokens, signed URLs, cookies, and personal/payment information from commits, traces, screenshots, and video. Use masked payment details only when reporting privately to the user.
- [ ] Keep an artifact inventory so reviewers can map each reported claim to a concrete file or reproducible check.

## Bounded scheduling and cost gates

- [ ] Use small fixtures, initially no more than 1 MB per case; do not provision unrelated compute or upgrade the GCP trial.
- [ ] Inspect available schedule controls before enabling a schedule. Set the supported end time or maximum runs; if unavailable, supervise a bounded collection window and disable immediately afterward.
- [ ] Record the planned run count, interval, maximum collection window, owner, and exact disable procedure before activation. Avoid overlapping scenarios and uncontrolled retries.
- [ ] Stop schedules after evidence collection and on unattended interruption where feasible. Verify disabled state and check for queued runs before declaring cleanup complete.
- [ ] Check actual and pending usage across AWS, GCP, and Rhombus. Include any platform purchases in the AUD 10 authorization unless separately authorized. Do not treat delayed billing as proof of zero cost.
- [ ] Maintain conservative headroom below AUD 10 for reporting delays, exchange rates, and taxes; stop before uncertain liabilities could consume the remaining allowance.
- [ ] Account for cross-cloud/cross-region transfer and GCS soft-deleted object retention when estimating usage and cleanup. No deletion of unrelated resources.

## Current blockers to live execution

1. The primary agent reports a Chrome connection timeout. Live UI work cannot be claimed verified until browser access is restored.
2. S3/GCS integration identities, minimum necessary permissions, and Rhombus connection configuration have not been established or tested. Keep both buckets private; do not solve integration failures through public access or broad administrator grants.
3. No baseline fixture, independent expected output, AI-builder transformation, validated destination write, or bounded schedule is ready yet.
4. Backend endpoints and a legitimate authentication method for reproducible tests have not been verified.
5. The reviewer has not independently obtained the original brief. This blocks final compliance sign-off, though it need not prevent safe local preparation based on the known requirements.

## Disposition and subsequent checkpoints

Conditional approval of the two-agent workflow and proposed testing approach. Cloud resource existence alone does not establish execution readiness. Clear the operational gates before starting a live schedule and preserve unresolved gates explicitly.

At checkpoint 2, the reviewer will inspect the implementation and original brief, run safe reproducible local checks, challenge the oracle and assertions, and trace claims to evidence. At checkpoint 3, the reviewer will verify corrections and unresolved limitations. The primary agent owns implementation and cloud mutations; the reviewer owns independent findings and this review file.
