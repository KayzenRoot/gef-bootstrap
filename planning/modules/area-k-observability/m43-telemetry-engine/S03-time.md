# M43 S03 — Time
Status: FROZEN

**TST43 Timing Span Tree** models queued, planning, execution, validation, correction and external-wait spans using monotonic durations plus optional wall-clock annotations. Parent/child spans cannot overlap illegally under the same serial lane.

**CPH43 Critical Path Hint** derives advisory bottleneck candidates from completed spans; M63 remains scheduling authority. Injected monotonic clocks make tests deterministic and protect duration math from wall-clock jumps.

Acceptance: monotonic duration, nested-span validation, cancellation closure, UNKNOWN for missing timing, no scheduler authority.