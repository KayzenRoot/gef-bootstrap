---
applyTo: ".github/workflows/**/*.yml"
---
# GitHub Actions rules

Use least-privilege permissions, deterministic locked installs, dependency caching where safe, explicit timeouts for potentially long jobs and path scoping when it cannot hide required evidence. Prefer concurrency cancellation for superseded PR heads so obsolete runs do not consume time. Do not make product runtime depend on Actions. Security and promotion workflows must fail closed. A selective/focused check may accelerate feedback but may not replace broader evidence required by the current Work Order or DoD.