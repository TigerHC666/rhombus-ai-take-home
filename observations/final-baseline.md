# Final baseline journey and null-handling regression

The CLI journey selected the existing authorized S3 source, inspected the connected bucket and `orders.csv`, configured the existing GCS destination and CSV filename, and edited the inactive one-minute schedule. Authentication and cloud identity provisioning were prerequisites. AI Builder restored the baseline four-node cleaning graph.

## Recorded journey

[Run manifest](evidence/baseline/final-ui-journey-1792186089018/run-manifest.json) · [Actual recording](demo/final-ui-journey.webm) · [Saved graph](evidence/baseline/final-ui-journey-1792186089018/configuration.json) · [Executed code evidence](evidence/baseline/final-ui-journey-1792186089018/executed-codegen-evidence.json)

The captured manual job reached `SUCCESS`, but two fresh GCS candidates differed. The first contained the seven expected business records; the second contained customer `None` where the contract requires `Unknown`. Both violated two-decimal monetary serialization. Every candidate was validated, so the overall test correctly failed. Exact object-to-job linkage is not established; neither candidate is silently discarded.

- [First independent validation](evidence/baseline/final-ui-journey-1792186089018/validation-output-1.json): business values match; strict serialization fails.
- [Second independent validation](evidence/baseline/final-ui-journey-1792186089018/validation-output-2.json): missing-customer rule and strict serialization fail.

The saved/executed generated code converts object columns with `astype(str)` before testing customer nulls. This can replace a null with a nonempty literal string and prevent the subsequent fill. The output establishes the violation; code inspection supports this explanation without claiming a separately measured runtime dtype.

A targeted Builder repair requests preservation of missing values before string conversion. Its outcome must be evaluated from subsequent real artifacts, not the repair confirmation alone.
