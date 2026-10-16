# Scheduling: unchanged-data skip and execution attribution

## Verified bounded observation

The schema-drop schedule was observed with cron `*/1 * * * *` from 2026-10-16 20:08:25.291 UTC. During the 110-second output polling window, no fresh matching GCS object was observed. The [manifest](evidence/schema-drop/scheduled-1792181295949/run-manifest.json) records the polling failure, no observed outputs, and verified cleanup with `schedule_disabled: true`; evidence collection ended at 20:10:16.828 UTC.

The [inactive schedule capture](evidence/schema-drop/scheduled-1792181295949/schedule-inactive.txt) explicitly says **Inactive** and “Skipped 1 time(s) in a row due to unchanged data.” The [page capture](evidence/schema-drop/scheduled-1792181295949/failure-page.txt) preserves the same notice. Thus, no new output is consistent with the UI-reported skip. This is not evidence of a failed scheduled transformation, and it is not a successful post-repair scheduled export either. The earlier harness did not open history after a polling timeout; a history-capture improvement was made for subsequent runs.

The exact unchanged-data detection algorithm, comparison baseline, and whether configuration changes invalidate that comparison have not been established. The notice alone does not prove a cache defect. Tests expecting every timer activation to create an object must distinguish a documented/observed skip from execution failure and still verify cleanup.

## Ambiguous output attribution during repair

The earlier schema-drop [repair-window manifest](evidence/schema-drop/post-repair-1792180984019/run-manifest.json) contains two GCS exports, created at 20:04:52.244 and 20:05:04.997 UTC. Both raw files independently validate to seven correct business records with the same strict monetary-format failure. Their equality does not establish two controlled manual repetitions.

The [process response](evidence/schema-drop/post-repair-1792180984019/process-response.json) links the observed manual request to job `4de934fe-bfb4-4298-bc11-a379d399db74`; [job states](evidence/schema-drop/post-repair-1792180984019/job-states.json) show that job succeeded. However, no captured field directly maps either export generation to that job. Later history, retained in the scheduled manifest's `prior_executions`, includes execution #18487, #18489 and #18490 around the same repair period. The available history labels do not establish whether that list is exclusively scheduled or also includes manual/Builder activity.

Consequently, both files are described as **repair-window outputs with uncertain individual trigger attribution**. Do not assert that an unintended schedule caused them, that a single click caused two exports, or that history is schedule-exclusive without additional evidence. The older process capture retained the `execution_mode` field name but not its value; future captures preserve its safe scalar value.

## Test implications

- Positively verify an inactive schedule before source mutation and after Builder changes, immediately before a manual trigger.
- Correlate terminal status with the returned process job ID and retain actual execution-mode evidence.
- Capture history after disabling the schedule even when no output appears; preserve skip notices and failure evidence.
- Validate every candidate output and retain its immutable generation/hash, without inventing exact job linkage.
- Treat controlled source changes as experimental interventions and record their hashes; do not alter source only to manufacture an apparent scheduled pass without documenting that change.

## Second attempt after a verified source replacement

Before the next attempt, the actual S3 key was replaced with the baseline fixture and read back: [source provenance](evidence/baseline/scheduled-reset-source/source-provenance.json) records an 839-byte object with SHA-256 `5ae93188cc660b26ca260dda268fec0f9df9344fd165c8910bbbb9df8b5eb014`, `uploaded_this_call: true`, and matching fixture hash. This differs from the prior schema-drop input hash. The recorded client retrieval time is 20:10:31.745319 UTC and S3 LastModified is 20:10:32 UTC; these clocks/precisions must not be treated as a subsecond ordering guarantee.

The [second manifest](evidence/baseline/scheduled-1792181440062/run-manifest.json) records observation beginning 2026-10-16 20:10:54.085 UTC, another 110-second no-output timeout, and cleanup verified inactive by 20:12:45.925 UTC. The [schedule capture](evidence/baseline/scheduled-1792181440062/schedule-inactive.txt) says “Skipped 2 time(s) in a row due to unchanged data.” Both attempts captured the same saved configuration hash.

The skip notice therefore persisted after a verified change to the S3 object's bytes. This is a reproducible observability concern, but the scheduler's comparison source, fingerprint mechanism and refresh timing remain unknown. It is not yet established whether the scheduler compared raw S3 content, registered dataset state, or some other signal; no specific root cause is asserted. This second attempt uses baseline source data, not schema-drop, so it is not a second successful schema-drop repair test. Neither bounded attempt produced a verified scheduled export.
