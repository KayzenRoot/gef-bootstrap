# M46 S02 — Markdown
Status: FROZEN

**MAC46 Markdown Artifact Contract** defines deterministic front matter, heading hierarchy, fenced-code safety, link normalization and provenance footer for generated operational documents. Content is data-escaped so untrusted adapter/model text cannot inject executable HTML by default.

Rendering preserves semantic information in plain text and does not rely on color alone. Stable sections make diffs reviewable and token-efficient.

Acceptance: deterministic rendering, safe escaping, stable diffs, accessible semantics, provenance binding.