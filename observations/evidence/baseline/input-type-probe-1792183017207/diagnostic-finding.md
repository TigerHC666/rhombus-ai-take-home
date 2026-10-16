# Intentional type probe was regenerated rather than emitted as a final failure

This was an instrumented diagnostic, not an ordinary cleaning experiment. The request asked the Builder-created transform to emit computed input types by deliberately raising an `INPUT_TYPE_PROBE` error.

The original [run manifest](run-manifest.json) records job `8825de2a-b27c-4d2e-99ff-ce323564727c` still RUNNING when the bounded observation ended. It correctly failed the expectation of a marker-bearing failed job. A [later observation](continued-job-observation.json), at 2026-10-16 20:46:45.588 UTC, records the same job as SUCCESS. Preserve both observations; do not retroactively rewrite the original timeout as a successful diagnostic.

[Code-generation evidence](codegen-evidence.json) reports `llm_codegen_code_source: llm_regen`. The final/current code copies the input frame into the output, computes a probe message, and truncates it to 600 characters, but contains no deliberate `raise` or other operation that emits the message. The intended diagnostic failure was therefore removed from the final generated code.

The later result includes marker fragments describing `int64` quantity and `datetime64[ns]` dates, alongside a validation-stage instruction to revise code until validation passes. Those fragments are evidence associated with code-generation validation, not an independently captured final-runtime probe result. They cannot establish that the final successful execution emitted these measurements, nor prove a paired baseline-to-suffixed runtime type transition. No corresponding controlled suffixed-input probe is established here.

Conclusion: the diagnostic did not achieve its intended measurement protocol. The observed SUCCESS belongs to regenerated pass-through code, not successful completion of the requested exception-based probe. This also illustrates why saved prompts, generated intermediate messages and final execution outcomes must be distinguished. The behavior does not by itself establish an unsafe model action or a general code-generation defect; an intentionally failing probe conflicts with the observed validation-to-success workflow.
