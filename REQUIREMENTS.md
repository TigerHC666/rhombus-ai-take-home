# Assessment requirements

Source: https://ripe-lemur-572.notion.site/Software-Engineer-Intern-LLM-Observability-Quality-Assurance-Rhombus-AI-33dcfd62d0a28093bb96cf7df72a2de7

The primary agent read the complete rendered assignment on October 17, 2026. This is a requirement mapping, not a verbatim copy. The reviewer's initial web fetch failed; the primary agent subsequently verified the page through Chrome.

1. Connect a messy synthetic CSV in Amazon S3, build all cleaning transformations with the AI builder, and export to Google Cloud Storage.
2. Configure regular scheduling and wait for a successful scheduled baseline.
3. Independently drop a column, rename a column, change a type, add a column, then combine all four. Observe stop/warning/continuation, actual GCS output, log quality, chatbot diagnosis/repair, and subsequent scheduling.
4. Test at least two changes in meaning without changing schema, including independent detection by data validation.
5. Deliver CLI-runnable Playwright or Cypress tests under `ui-tests/`, covering the entire pipeline journey with outcome assertions and no fixed sleeps.
6. Deliver at least two direct backend tests under `api-tests/`, based on requests observed in browser networking. Include a negative case and assert both status and body.
7. Deliver `data-validation/` comparing actual GCS output and S3 input: schema, counts, cleaning, determinism, and semantic cases. Execute it for baseline and every drifted run.
8. Deliver baseline and every variant under `datasets/`; one reproducible Markdown report per drift case under `observations/`, linking screenshots/logs in `observations/evidence/`.
9. README: suite setup/run commands; linked scenario table (change, stopped, fix worked, severity); top three findings; one or two paragraphs of usability feedback; a short demonstration video link.
10. Optional hosted interactive dashboard: health by scenario, three identical-input repeats per configuration, consistency diffs, capability heat map, and execution timing.

The exercise values accurate findings and trade-offs. A platform defect is an acceptable finding; unexecuted checks are never passes. All deliverable text is English.

Deadline: one week from the invitation received October 12, 2026 at approximately 08:00 Australia/Sydney, so target submission before October 19 at 08:00. Submission is a new email to careers@rhombusai.com with subject `Rhombus AI – Take-Home Exercise` and a repository link. Sending that email is a separate user action/authorization.
