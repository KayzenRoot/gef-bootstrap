# V1.1 benchmark recipes

## CLI ROI: greenfield `init` plan

`cli-roi.mjs` compares the real `gef init --target … --json` process entry with the
source-workspace/manual path in `source-workspace-manual.mjs`. The manual path calls the public
`runCli` application API directly with the same arguments and injected process capabilities that
the CLI's `main()` supplies. This isolates the operator entry boundary while keeping the command,
engines, target fixture, runtime, policy, and JSON result identical.

The procedure builds seven fresh child-process samples per path, alternates which path runs first,
checks both paths produce the same plan digest, and records the complete cold-process-to-envelope
latency distribution. Each child receives a small environment allowlist. The empty target is
temporary and is removed after measurement. The report contains only P1-P8 identity, metric
summaries, truth labels, digests, and the comparison result; it never stores paths or command
payloads. Token counts stay `UNAVAILABLE` because this runtime does not expose ChatGPT Work token
usage.

Run after building, from a clean checkout:

```sh
npm run build -- --force
node .engineering/benchmarks/v1.1/cli-roi.mjs > /tmp/gef-v11-cli-roi.json
```

The default quality gate is `UNKNOWN`, which makes the report ineligible for an optimization
claim. Set `GEF_BENCHMARK_QUALITY_GATE_STATUS=PASS` only after the exact measured commit has passed
its build, focused regressions, dependency audit, cross-platform telemetry suite, and repository
regressions. The benchmark script itself never infers a pass from latency or from its own
successful command execution.

This result measures process-entry ROI for one representative deterministic CLI operation. It
does not claim end-to-end ChatGPT/Codex productivity, prompt-token savings, or savings from
WO-005/006/007 acceleration.
