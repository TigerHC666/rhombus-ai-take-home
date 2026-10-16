# Demonstration walkthrough

[Play or download the 2 minute 47 second MP4](walkthrough.mp4).

- 00:00–02:03: actual CLI-driven Chrome recording at 2x speed. It inspects/selects the existing authorized S3 connection, configures GCS CSV export and the inactive schedule, and uses AI Builder. This recorded run exposed a missing-customer regression; it is not presented as the final recovered run.
- 02:03–02:25: recorded API regression results: seven passed, zero failed/skipped/flaky; meaningful status/body and negative authorization assertions. The independent validator regression also passed nine tests.
- 02:25–02:47: independent validation of a real artifact from the subsequent recovered baseline. Seven business-correct records; strict monetary serialization remains failed.

The result cards summarize recorded execution evidence; they are not simulated terminal typing or claimed simultaneous live execution. No synthetic expected-output file is presented as a platform export. The full command, timestamps and named API tests are in [final-regression.json](../final-regression.json); validator test output is in [validator-regression.txt](../validator-regression.txt).

Recorded UI evidence: [manifest](../evidence/baseline/final-ui-journey-1792186089018/run-manifest.json). Recovered artifact: [validation](../evidence/baseline/final-working-baseline-1792186864029/validation.json), [aggregate manifest](../evidence/baseline/final-working-baseline-1792186864029/run-manifest.json). The latter preserves and validates all three observed candidates. Exact object-to-job attribution is not established. See [baseline progression](../final-baseline.md).

The MP4 was fully decoded without errors and frames at 00:20, 02:10 and 02:35 were visually checked for readable captions and uncropped result cards. SHA-256: `7598ceec4ae8fbd88c8c08b3683a71e9036d978a53eb8a000f307fb3f0bc2e36`.

Raw WebM recordings remain as supplementary evidence. Repository access is required while the repository is private. Download the MP4 if the GitHub file viewer does not offer playback.
