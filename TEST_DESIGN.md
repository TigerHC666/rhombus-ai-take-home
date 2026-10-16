# Test design

## Execution and review

The primary agent implements and records live experiments. The independent reviewer reviews design, implementation, and fixes in three checkpoints. The user authorized sustained implementation on October 17, 2026. Cloud authorization remains an explicit readiness gate.

Mandatory requirements take precedence over the optional hosted dashboard. A local report can be developed without claiming the bonus is complete.

## Data contract

Use a tiny synthetic order feed with no real people. Input columns: `order_id,customer,email,order_date,quantity,unit_price,currency,status`. Dates initially use MM/DD/YYYY; prices initially use major currency units. All orders use AUD. Keep original case fixtures immutable; upload only the selected scenario to one stable source key `orders.csv`.

Output columns, in order: `order_id,customer,email,order_date,quantity,unit_price,currency,status,total_amount`. Trim text; uppercase order IDs/currency; lowercase email/status; fill missing customer with `Unknown`; replace invalid/missing email with an empty string. Parse dates strictly and output YYYY-MM-DD. Quantity must be a positive integer; price must be a nonnegative decimal. Drop invalid required values or invalid dates. Remove exact duplicate records after normalization. Sort by order_id. Compute total_amount = quantity * unit_price with decimal arithmetic, two decimal places. No runtime timestamps in business output.

Expected output is an independently authored CSV table, never copied from Rhombus output or calculated using its generated transformation. Schema-drift remediation targets preserve the original business records: missing email becomes empty; renamed price column maps back; quantity strings with a ` units` suffix map to integers; extra columns do not leak to the output.

Contract details frozen before live output inspection: required fields are order_id, order_date, quantity, unit_price, currency and status. After whitespace trimming, missing required fields cause rejection. Customer names retain internal spacing and case. Valid emails match `^[^\s@]+@[^\s@]+\.[^\s@]+$`; this is a deliberately simple test contract, not full RFC validation. Only `paid` and `pending` statuses and AUD currency are accepted. Baseline quantity syntax is digits only. Prices allow an optional leading dollar sign and ordinary decimal notation with at most two fractional digits; reject commas, scientific notation, NaN, Infinity and negative values. Serialize quantity as integer digits and price/total with exactly two decimals using ROUND_HALF_UP. Fixtures contain only cent-precise values, so rounding does not alter their targets.

Deduplicate identical normalized business rows, then reject conflicting records sharing an order_id rather than choosing arbitrarily. Fixtures contain no conflicting IDs or distinct records that collapse when email is removed. The quantity mutation changes all nonempty integer strings to nonnumeric strings with a suffix; preserve platform profile evidence proving inferred type changed before labeling it type drift. If inference does not change, report it accurately and choose an additional explicit type mutation.

For semantic cases, the producer contract changes: cents must be divided by 100; DD/MM/YYYY dates must be interpreted accordingly. The initial run deliberately uses the unchanged baseline pipeline to detect silent corruption. The changed producer contract is disclosed to the chatbot only after pre-repair evidence is saved. Report detection and repair separately; do not claim that ambiguous dates can be inferred from values alone.

## Scenarios

| ID | Input change | Independent target |
| --- | --- | --- |
| baseline | Messy feed | Frozen clean table |
| schema-drop | Remove email | Same table with empty email |
| schema-rename | unit_price to price_per_unit | Same clean table |
| schema-type | quantity strings gain ` units` | Same clean table |
| schema-add | Add loyalty_tier | Same clean table; no additional columns |
| schema-combined | All four structural changes | Drop-case clean table |
| semantic-cents | Price values multiplied by 100, unchanged column names | Same monetary values after unit conversion |
| semantic-dates | Swap month/day encoding, unchanged column names/types | Same calendar dates after format correction |

## Isolation and run evidence

Prefer a separate baseline-derived pipeline for each scenario if copying is supported. Otherwise restore the original AI-built configuration and prove a fresh successful baseline before the next case. Record how restoration was performed and a configuration identifier/hash. Never let a previous repair silently affect the next isolated test.

Before enabling scheduling, inspect the minimum interval and disable procedure. Activate only one schedule at a time. Initial collection window: at most three scheduled executions or 30 minutes, whichever is reached first; do not enable an interval longer than the supervised window without revising this plan. Disable immediately after evidence is collected and verify state. Never use fixed sleep calls as readiness assertions in UI tests.

Each run manifest records scenario, immutable fixture SHA-256, source object identity, configuration revision, scheduled/manual trigger, UTC timestamps, run ID, fresh output generation/filename/hash, log path, validation path, and repair state. Download actual input/output for validation; the fixture alone does not prove what the pipeline read. A missing output is a recorded result, not an invented empty CSV. Reject stale output by comparing run boundaries and object metadata.

For determinism, compare canonical business data across repeated fresh runs of the same configuration and same input; preserve ordering defects separately instead of sorting them away. Run three repeats if affordable; report any incomplete determinism coverage explicitly.

## Cost and access

Actual out-of-pocket authorization: AUD10 total. The accepted AUD40 temporary hold is separate. GCP remains on free trial. Use small CSVs below 1MB, bounded schedules, no customer-funded compute instances, no paid Rhombus subscription. Stop live work if uncertain costs threaten headroom. Review bills before/after; billing lag is explicitly acknowledged.

S3 source access uses the exact read-only bucket policy generated by this Rhombus environment. GCS destination uses a dedicated service account with object creation and verification cleanup rights on the output bucket only. No public bucket access. Never commit credentials, browser authentication, raw sensitive traces, or billing screenshots. Revoke integration access after completing evidence collection, with reproducible reauthorization instructions retained.

## Remaining readiness gates

- Explicit approval and verification of cloud integration access.
- Freeze fixtures and expected outputs; reviewer checks them before live schedule activation.
- Verify actual supported schedule controls and output selection.
- Observe real backend requests and establish test authentication without exposing tokens.
- Establish a GitHub repository upload route: connector is accessible but local GitHub CLI is not signed in.
- Verify video capture/export method and final artifact accessibility.
