# M41 S02 — UGAS Capabilities
Status: FROZEN

M41 projects UGAS capabilities into a narrow least-authority vocabulary: `MEDIA_IMAGE`, `MEDIA_VIDEO`, `MEDIA_AUDIO`, `STORY`, `ASSET_PIPELINE`, `WORKFLOW`. It never grants a capability that M38 did not attest.

Mechanisms: **UCP41** capability projector; **ULB41** least-authority boundary; **UCB41** capability-budget gate. Every invocation declares capability, input schema, output schema, resource budget, cancellation token and provenance context. Unsupported or over-budget work returns a structured denial rather than fallback execution.

Optimization: capability summaries are digest-addressed and cacheable; unchanged receipts can be reused without re-probing UGAS. Schema/version drift invalidates the projection.

Acceptance: subset property, deterministic projection, budget enforcement, cancellation propagation, drift invalidation.